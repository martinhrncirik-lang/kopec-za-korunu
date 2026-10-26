import { getAthlete, monthSummary, monthsWithData } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { currentMonth, monthLabel } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { fmtKm } from '@/lib/stats';
import PushButton from './components/PushButton';
import ShareButton from './components/ShareButton';
import { syncRecent, recentActivities } from '@/lib/sync';

export const dynamic = 'force-dynamic';

const ERRORS = {
  zamitnuto: 'Přihlášení přes Stravu bylo zrušeno.',
  state: 'Přihlášení vypršelo, zkuste to znovu.',
  opravneni: 'Bez přístupu k aktivitám to nepůjde. Při přihlášení nechte zaškrtnuté zobrazení aktivit.',
};

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const athleteId = await currentAthleteId();
  const athlete = athleteId ? await getAthlete(athleteId) : null;

  if (!athlete) {
    return (
      <>
        <section className="hero">
          <h1>Jeden kilometr, jedna koruna.</h1>
          <p>Jezdíte jako obvykle. Kilometry ze Stravy se sečtou a jednou za měsíc dostanete výpis s QR kódem na dar pro Nadaci rodiny Vlčkových.</p>
          {sp?.chyba && <p className="error">{ERRORS[sp.chyba] || 'Něco se pokazilo.'}</p>}
          <a className="btn strava" href="/api/auth/login">Připojit přes Stravu</a>
        </section>
      </>
    );
  }

  // Pojistka: doplní jízdy, které nedorazily přes webhook.
  try { await syncRecent(athlete); } catch (e) { console.error('sync', e); }

  const month = currentMonth();
  const { km, count } = await monthSummary(athlete.id, month);
  const recent = await recentActivities(athlete.id, 5);
  const czk = Math.round(km * RATE_CZK_PER_KM);
  const months = (await monthsWithData(athlete.id)).filter((m) => m !== month).slice(0, 6);

  return (
    <>
      <h1>Ahoj{athlete.firstname ? `, ${athlete.firstname}` : ''}</h1>

      <section className="card stat">
        <p className="muted">{monthLabel(month)} zatím</p>
        <p className="big">{fmtKm(km)} km</p>
        <p>{count} {count === 1 ? 'aktivita' : count >= 2 && count <= 4 ? 'aktivity' : 'aktivit'} · {czk.toLocaleString('cs-CZ')} Kč pro NRV</p>
        <a className="btn ghost" href={`/vypis/${month}`}>Darovat už teď</a>
      </section>

      {recent.length > 0 && (
        <section className="card">
          <h2>Poslední aktivity</h2>
          <ul className="months">
            {recent.map((r) => (
              <li key={r.strava_id}>
                <a href={`/svih/${r.strava_id}`}>
                  {new Date(r.start_local + 'Z').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })}
                  {' · '}{fmtKm(r.distance_m / 1000)} km{r.praise ? ' · ⭐ švih' : ''}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Notifikace</h2>
        <PushButton />
      </section>

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
        <ShareButton label="Poslat pozvánku" text="Jezdím pro Nadaci rodiny Vlčkových: každý můj kilometr = koruna. Přidej se, jezdit stejně budeš." />
      </section>

      <form action="/api/auth/logout" method="post"><button className="link">Odhlásit</button></form>
    </>
  );
}
