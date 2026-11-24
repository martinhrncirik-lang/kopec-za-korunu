import { monthLabel } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { fmtKm } from '@/lib/stats';
import { vocative } from '@/lib/vocative';
import { avatarUrl } from '@/lib/avatar';
import { getRecipient } from '@/lib/recipients';
import PushButton from './PushButton';
import ShareButton from './ShareButton';
import MoreList from './MoreList';

export const INVITE_TEXT = 'Jezdím, dělám radost sobě a občas i ostatním. Přidej se!';

// Hlavní stránka po přihlášení (jen zobrazení, data dodá app/page.js).
// Pozvánka je hned pod „Darovat už teď", aby byla vidět bez scrolování.
export default function HomeView({ athlete, month, km, count, czk, recent, months, last, lastMonth, verdict }) {
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

      <section className="card invite-card">
        <div className="invite-text">
          <h2>Přizvi kámoše</h2>
          <p className="small">Nejde o počet. Pozvi toho, kdo to má stejně jako ty, jezdí rád a občas pomůže.</p>
        </div>
        <ShareButton label="Poslat pozvánku" className="btn ghost invite-btn" text={INVITE_TEXT} />
      </section>

      {recent.length > 0 && (
        <section className="card">
          <h2>Poslední aktivity</h2>
          <MoreList>
            {recent.map((r) => (
              <li key={r.strava_id}>
                <a href={`/svih/${r.strava_id}?intro=1`}>
                  {new Date(r.start_local + 'Z').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })}
                  {' · '}{fmtKm(r.distance_m / 1000)} km{r.praise ? (r.praise_strong === false ? ' · 👍' : ' · ⭐ švih') : ''}
                </a>
              </li>
            ))}
          </MoreList>
        </section>
      )}

      <PushButton compact />

      {months.length > 0 && (
        <section className="card">
          <h2>Výpisy</h2>
          <MoreList>
            {months.map((m) => <li key={m}><a href={`/vypis/${m}`}>{monthLabel(m)}</a></li>)}
          </MoreList>
        </section>
      )}
    </>
  );
}
