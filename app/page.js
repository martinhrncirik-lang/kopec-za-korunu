import { getAthlete, monthSummary, monthsWithData } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { currentMonth, monthLabel } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { fmtKm } from '@/lib/stats';
import PushButton from './components/PushButton';
import ShareButton from './components/ShareButton';
import { syncRecent, recentActivities } from '@/lib/sync';
import { backfill } from '@/lib/strava';
import { after } from 'next/server';
import { vocative } from '@/lib/vocative';
import { avatarUrl, ensureStravaAvatar } from '@/lib/avatar';
import { getRecipient } from '@/lib/recipients';

export const dynamic = 'force-dynamic';

const ERRORS = {
  zamitnuto: 'Přihlášení přes Stravu bylo zrušeno.',
  state: 'Přihlášení vypršelo, zkuste to znovu.',
  opravneni: 'Bez přístupu k aktivitám to nepůjde. Při přihlášení nechte zaškrtnuté zobrazení aktivit.',
};

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const athleteId = await currentAthleteId();
  let athlete = athleteId ? await getAthlete(athleteId) : null;
  if (athlete) athlete = await ensureStravaAvatar(athlete);

  if (!athlete) {
    return (
      <>
        <section className="photo-hero tall">
          <div className="photo-top">
            <h1>Jeden kilometr,<br />jedna koruna.</h1>
          </div>
        </section>
        <section className="intro">
          <p>Jezdíte jako obvykle. Kilometry ze Stravy se sečtou a jednou za měsíc dostanete výpis s QR kódem na dar. Vyberete si, komu: Nadaci rodiny Vlčkových, Člověku v tísni, nebo Paměti národa.</p>
          {sp?.chyba && <p className="error">{ERRORS[sp.chyba] || 'Něco se pokazilo.'}</p>}
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

      <a className="btn block" href={`/vypis/${month}`}>Darovat už teď</a>

      {recent.length > 0 && (
        <section className="card">
          <h2>Poslední aktivity</h2>
          <ul className="months">
            {recent.map((r) => (
              <li key={r.strava_id}>
                <a href={`/svih/${r.strava_id}`}>
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
        <h2>Přizvěte kámoše</h2>
        <p className="muted small">Čím víc kol, tím víc korun.</p>
        <ShareButton label="Poslat pozvánku" text="Jezdím pro dobrou věc: každý můj kilometr = koruna. Přidej se, jezdit stejně budeš." />
      </section>
    </>
  );
}
