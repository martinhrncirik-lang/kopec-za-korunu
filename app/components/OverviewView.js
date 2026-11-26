import { getRecipient } from '@/lib/recipients';

const fmtDate = (d, utc) => d ? new Date(utc ? d + 'Z' : d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: utc ? 'UTC' : 'Europe/Prague' }) : '–';

export default function OverviewView({ data, limit = 10 }) {
  const { rows, lastCron } = data;
  const welcomed = rows.filter((r) => r.welcomed).length;
  const withPush = rows.filter((r) => r.push > 0).length;
  return (
    <>
      <h1>Přehled</h1>
      <section className="ov-tiles">
        <div className="card"><span className="ov-big">{rows.length}/{limit}</span><span className="muted small">sportovců</span></div>
        <div className="card"><span className="ov-big">{welcomed}</span><span className="muted small">klepli „Jdu do toho“</span></div>
      </section>

      <section className="card ov-list">
        <h2>Sportovci</h2>
        {rows.map((r) => (
          <div key={r.name + r.joined} className="ov-row">
            <div className="ov-name">
              <strong>{r.name}</strong>
              <span className="muted small"> od {fmtDate(r.joined)}{r.welcomed ? '' : ' · ⏳ uvítání zatím ne'}</span>
            </div>
            <div className="ov-meta muted small">
              🔔 {r.push > 0 ? r.notify : 'notifikace vypnuté'} · ★ {getRecipient(r.recipient).short}
            </div>
          </div>
        ))}
      </section>

      <p className="muted small">
        Notifikace zapnuté: {withPush}/{rows.length}.
        {' '}Poslední měsíční výpis: {lastCron ? `${fmtDate(lastCron.received_at)} – ${lastCron.result || 'bez výsledku'}` : 'za posledních 7 dní žádný'}.
      </p>
      <p className="muted small">Přehled vidíš jen ty. Kilometry ostatních tu nejsou (podmínky Stravy: data sportovce smí vidět jen on) a peníze taky ne – appka neví, kdo co poslal.</p>
      <p><a className="link" href="/">← Zpět</a></p>
    </>
  );
}
