import { getAthlete, monthSummary, monthsWithData } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { currentMonth, previousMonth, monthLabel } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { fmtKm } from '@/lib/stats';
import PushButton from './components/PushButton';
import ShareButton from './components/ShareButton';
import { syncRecent, recentActivities } from '@/lib/sync';
import { backfill } from '@/lib/strava';
import { after } from 'next/server';
import { vocative } from '@/lib/vocative';
import Welcome from './components/Welcome';
import { avatarUrl, ensureStravaAvatar } from '@/lib/avatar';
import { getRecipient } from '@/lib/recipients';
import { monthVerdictFor } from '@/lib/monthly';

export const dynamic = 'force-dynamic';

const ERRORS = {
  zamitnuto: 'Přihlášení přes Stravu bylo zrušeno.',
  state: 'Přihlášení vypršelo, zkus to znovu.',
  opravneni: 'Bez přístupu k aktivitám to nepůjde. Při přihlášení nech zaškrtnuté zobrazení aktivit.',
};

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const athleteId = await currentAthleteId();
  let athlete = athleteId ? await getAthlete(athleteId) : null;
  if (athlete) athlete = await ensureStravaAvatar(athlete);

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
          <a className="btn strava" href="/api/auth/login">Připojit přes Stravu</a>
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
  // Prvních 10 dní v měsíci: karta s výpisem za minulý měsíc (pojistka, kdyby notifikace nedorazila).
  const dayOfMonth = Number(new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric' }).format(new Date()));
  const lastMonth = previousMonth(month);
  const last = dayOfMonth <= 10 ? await monthSummary(athlete.id, lastMonth) : null;
  let verdict = null;
  if (last?.count) { try { verdict = await monthVerdictFor(athlete.id, lastMonth); } catch (e) { console.error('verdict', e); } }

  return (
    <>
      <section className="photo-hero">
        <div className="photo-top with-avatar">
          {avatarUrl(athlete) && <img className="avatar" src={avatarUrl(athlete)} alt="" />}
          <h1>Ahoj{athlete.firstname ? ` ${vocative(athlete.firstname)}` : ''}</h1>
          <a className="gear" href="/nastaveni" aria-label="Nastavení">⚙</a>
        </div>
        <div className="photo-bottom">
          <p className="photo-label">{monthLabel(month)} zatím</p>
          <p className="photo-km">{fmtKm(km)} km</p>
          <p className="photo-sub">{count} {count === 1 ? 'aktivita' : count >= 2 && count <= 4 ? 'aktivity' : 'aktivit'} · {czk.toLocaleString('cs-CZ')} Kč pro {getRecipient(athlete.default_recipient).forWhom}</p>
        </div>
      </section>

      {last && last.count > 0 && (
        <a className="card statement-ready" href={`/vypis/${lastMonth}`}>
          <span className="statement-title">Výpis za {monthLabel(lastMonth).toLowerCase()} je připravený</span>
          <span>{fmtKm(last.km)} km = {Math.round(last.km * RATE_CZK_PER_KM).toLocaleString('cs-CZ')} Kč · otevřít QR kód</span>
          {verdict && <span className="statement-verdict">{verdict}</span>}
        </a>
      )}

      <a className="btn block" href={`/vypis/${month}`}>Darovat už teď</a>

      {recent.length > 0 && (
        <section className="card">
          <h2>Poslední aktivity</h2>
          <ul className="months">
            {recent.map((r) => (
              <li key={r.strava_id}>
                <a href={`/svih/${r.strava_id}?intro=1`}>
                  {new Date(r.start_local + 'Z').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })}
                  {' · '}{fmtKm(r.distance_m / 1000)} km{r.praise ? (r.praise_strong === false ? ' · 👍' : ' · ⭐ švih') : ''}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PushButton compact />

      {months.length > 0 && (
        <section className="card">
          <h2>Výpisy</h2>
          <ul className="months">
            {months.map((m) => <li key={m}><a href={`/vypis/${m}`}>{monthLabel(m)}</a></li>)}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Přizvi kámoše</h2>
        <p className="muted small">Nejde o počet. Pozvi toho, kdo to má stejně jako ty: jezdí rád a občas pomůže.</p>
        <ShareButton label="Poslat pozvánku" text="Jezdím, dělám radost sobě a občas i ostatním. Přidej se!" />
      </section>
    </>
  );
}
