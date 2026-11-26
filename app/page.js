import { getAthlete, monthSummary, monthsWithData } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { currentMonth, previousMonth } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { syncRecent, recentActivities } from '@/lib/sync';
import { ensureLastname } from '@/lib/strava';
import { backfill } from '@/lib/strava';
import { after } from 'next/server';
import { vocative } from '@/lib/vocative';
import Welcome from './components/Welcome';
import HomeView from './components/HomeView';
import { ensureStravaAvatar } from '@/lib/avatar';
import { monthVerdictFor } from '@/lib/monthly';

export const dynamic = 'force-dynamic';

const ERRORS = {
  zamitnuto: 'Přihlášení přes Stravu bylo zrušeno.',
  state: 'Přihlášení vypršelo, zkus to znovu.',
  opravneni: 'Bez přístupu k aktivitám to nepůjde. Při přihlášení nech zaškrtnuté zobrazení aktivit.',
  plno: 'Kopec je teď plný: Strava zatím povoluje jen omezený počet sportovců. Pracuju na tom, aby se míst uvolnilo víc. Napiš mi na martin.hrncirik@gmail.com a ozvu se, až to půjde.',
  strava: 'Strava teď přihlášení nedokončila. Zkus to prosím za chvíli znovu.',
};

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const athleteId = await currentAthleteId();
  let athlete = athleteId ? await getAthlete(athleteId) : null;
  if (athlete) athlete = await ensureStravaAvatar(athlete);
  if (athlete) athlete = await ensureLastname(athlete);

  // První přihlášení: nejdřív uvítání s filozofií Kopce.
  if (athlete && !athlete.welcomed_at) {
    return <Welcome name={athlete.firstname ? vocative(athlete.firstname) : ''} />;
  }

  if (!athlete) {
    return (
      <>
        <section className="photo-hero tall">
          <div className="photo-top">
            <h1>Jeden kilometr,<br />jedna koruna.</h1>
          </div>
        </section>
        <section className="intro">
          <p>Jezdíme, protože nás to baví. Tak proč se o tu radost po jízdě nepodělit s někým, komu se zrovna nedaří? Každý tvůj kilometr ze Stravy je koruna. Jednou za měsíc přijde výpis s QR kódem a ty rozhodneš, komu dar pošleš.</p>
          <p>A když zrovna nepošleš nic, je to taky v pořádku. Třeba pošleš někdy jindy.</p>
          {sp?.chyba && <p className="error">{ERRORS[sp.chyba] || 'Něco se pokazilo.'}</p>}
          {sp?.odpojeno && <p className="muted">Odpojeno, tvoje data jsou smazaná. Dveře zůstávají otevřené.</p>}
          <a className="strava-connect" href="/api/auth/login">
            <img src="/strava/btn_strava_connectwith_orange.svg" alt="Connect with Strava" />
          </a>
          <p className="muted small">Připojením souhlasíš s <a href="/podminky">podmínkami</a> a bereš na vědomí <a href="/soukromi">zásady ochrany osobních údajů</a>.</p>
        </section>
      </>
    );
  }

  // Jednorázově: historie od začátku roku pro uživatele z doby před v0.4 (na pozadí).
  if (!athlete.history_since) after(() => backfill(athlete).catch((e) => console.error('backfill', e)));

  // Pojistka: doplní jízdy, které nedorazily přes webhook.
  try { await syncRecent(athlete); } catch (e) { console.error('sync', e); }

  const month = currentMonth();
  const { km, count } = await monthSummary(athlete.id, month);
  const recent = await recentActivities(athlete.id, 5);
  const czk = Math.round(km * RATE_CZK_PER_KM);
  const months = (await monthsWithData(athlete.id)).filter((m) => m !== month).slice(0, 6);
  // Prvních 5 dní v měsíci: karta s výpisem za minulý měsíc (pojistka, kdyby notifikace nedorazila).
  const dayOfMonth = Number(new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric' }).format(new Date()));
  const lastMonth = previousMonth(month);
  const last = dayOfMonth <= 5 ? await monthSummary(athlete.id, lastMonth) : null;
  let verdict = null;
  if (last?.count) { try { verdict = await monthVerdictFor(athlete.id, lastMonth); } catch (e) { console.error('verdict', e); } }

  return (
    <HomeView
      athlete={athlete} month={month} km={km} count={count} czk={czk}
      recent={recent} months={months} last={last} lastMonth={lastMonth} verdict={verdict}
    />
  );
}
