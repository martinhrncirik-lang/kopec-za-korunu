import Link from 'next/link';
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
// Pořadí (Martin 24. 11.): fotka, dar, Poslední aktivity, Přizvi kámoše, Výpisy.
export default function HomeView({ athlete, month, km, count, czk, recent, months, last, lastMonth, verdict }) {
  return (
    <>
      <section className="photo-hero home">
        <div className="photo-top with-avatar">
          {avatarUrl(athlete) && <img className="avatar" src={avatarUrl(athlete)} alt="" />}
          <h1>Ahoj{athlete.firstname ? ` ${vocative(athlete.firstname)}` : ''}</h1>
          <Link className="gear" href="/nastaveni" aria-label="Nastavení">⚙</Link>
        </div>
        <div className="photo-bottom">
          <p className="photo-label">{monthLabel(month)} zatím</p>
          <p className="photo-km">{fmtKm(km)} km</p>
          <p className="photo-sub">{count} {count === 1 ? 'aktivita' : count >= 2 && count <= 4 ? 'aktivity' : 'aktivit'} · {czk.toLocaleString('cs-CZ')} Kč pro {getRecipient(athlete.default_recipient).forWhom}</p>
        </div>
      </section>

      {last && last.count > 0 && (
        <Link className="card statement-ready" href={`/vypis/${lastMonth}`}>
          <span className="statement-title">Výpis za {monthLabel(lastMonth).toLowerCase()} je připravený</span>
          <span>{fmtKm(last.km)} km = {Math.round(last.km * RATE_CZK_PER_KM).toLocaleString('cs-CZ')} Kč · otevřít QR kód</span>
          {verdict && <span className="statement-verdict">{verdict}</span>}
        </Link>
      )}

      <Link className="btn block" href={`/vypis/${month}`}>Darovat už teď</Link>

      {recent.length > 0 && (
        <section className="card">
          <h2>Poslední aktivity</h2>
          <MoreList>
            {recent.map((r) => (
              <li key={r.strava_id}>
                <Link href={`/svih/${r.strava_id}?intro=1`}>
                  {new Date(r.start_local + 'Z').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })}
                  {' · '}{fmtKm(r.distance_m / 1000)} km{r.praise ? (r.praise_strong === false ? ' · 👍' : ' · ⭐ švih') : ''}
                </Link>
              </li>
            ))}
          </MoreList>
        </section>
      )}

      <section className="card invite-card">
        <div className="invite-text">
          <h2>Přizvi kámoše</h2>
          <p className="small">Nejde o počet. Pozvi toho, kdo to má stejně jako ty, jezdí rád a občas pomůže.</p>
        </div>
        <ShareButton label="Poslat pozvánku" className="btn ghost invite-btn" text={INVITE_TEXT} />
      </section>

      <PushButton compact />

      {months.length > 0 && (
        <section className="card">
          <h2>Výpisy</h2>
          <MoreList>
            {months.map((m) => <li key={m}><Link href={`/vypis/${m}`}>{monthLabel(m)}</Link></li>)}
          </MoreList>
        </section>
      )}
    </>
  );
}
