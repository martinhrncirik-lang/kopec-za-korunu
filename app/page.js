import Link from 'next/link';
import { after } from 'next/server';
import { getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { currentMonth, previousMonth } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { syncRecent, praiseFor } from '@/lib/sync';
import { fetchMonths, summarize, monthMinus } from '@/lib/history';
import { ensureLastname } from '@/lib/strava';
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
            <img src="/strava/btn_strava_connect_with_orange.svg" alt="Connect with Strava" />
          </a>
          <p className="muted small">Připojením souhlasíš s <Link href="/podminky">podmínkami</Link> a bereš na vědomí <Link href="/soukromi">zásady ochrany osobních údajů</Link>.</p>
        </section>
      </>
    );
  }

  // Pojistka: doplní jízdy, které nedorazily přes webhook. Běží až po odeslání stránky, ať se nečeká.
  after(() => syncRecent(athlete).catch((e) => console.error('sync', e)));

  // Posledních ~6 měsíců živě ze Stravy (nic se neukládá): tento měsíc, poslední jízdy, seznam výpisů.
  const month = currentMonth();
  let rows = [];
  try { rows = await fetchMonths(athlete, monthMinus(month, 6), month); } catch (e) { console.error('history', e); }
  const { km, count } = summarize(rows, month);
  const latest = rows.slice(-5).reverse();
  const praise = await praiseFor(latest.map((r) => r.strava_id));
  const recent = latest.map((r) => ({ ...r, ...(praise.get(String(r.strava_id)) || { praise: null, praise_strong: false }) }));
  const czk = Math.round(km * RATE_CZK_PER_KM);
  const months = [...new Set(rows.map((r) => r.month))].filter((m) => m !== month).reverse().slice(0, 6);
  // Prvních 5 dní v měsíci: karta s výpisem za minulý měsíc (pojistka, kdyby notifikace nedorazila).
  const dayOfMonth = Number(new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric' }).format(new Date()));
  const lastMonth = previousMonth(month);
  const last = dayOfMonth <= 5 ? summarize(rows, lastMonth) : null;
  let verdict = null;
  if (last?.count) { try { verdict = await monthVerdictFor(athlete, lastMonth); } catch (e) { console.error('verdict', e); } }

  return (
    <HomeView
      athlete={athlete} month={month} km={km} count={count} czk={czk}
      recent={recent} months={months} last={last} lastMonth={lastMonth} verdict={verdict}
    />
  );
}
