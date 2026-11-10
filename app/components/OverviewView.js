import { monthLabel } from '@/lib/months';
import { getRecipient } from '@/lib/recipients';

const fmtKm = (n) => n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 });
const fmtDate = (d, utc) => d ? new Date(utc ? d + 'Z' : d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: utc ? 'UTC' : 'Europe/Prague' }) : '–';

export default function OverviewView({ data, limit = 10 }) {
  const { month, prev, rows, lastCron } = data;
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  const welcomed = rows.filter((r) => r.welcomed).length;
  const withPush = rows.filter((r) => r.push > 0).length;
  return (
    <>
      <h1>Přehled</h1>
      <section className="ov-tiles">
        <div className="card"><span className="ov-big">{rows.length}/{limit}</span><span className="muted small">sportovců</span></div>
        <div className="card"><span className="ov-big">{welcomed}</span><span className="muted small">klepli „Jdu do toho“</span></div>
        <div className="card"><span className="ov-big">{fmtKm(sum('kmNow'))}</span><span className="muted small">km {monthLabel(month).toLowerCase()}</span></div>
        <div className="card"><span className="ov-big">{fmtKm(sum('kmPrev'))}</span><span className="muted small">km {monthLabel(prev).toLowerCase()}</span></div>
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
              {fmtKm(r.kmNow)} km teď · {fmtKm(r.kmPrev)} km minule · poslední jízda {fmtDate(r.lastRide, true)}
              <br />
              🔔 {r.push > 0 ? r.notify : 'notifikace vypnuté'} · ★ {getRecipient(r.recipient).short}
            </div>
          </div>
        ))}
      </section>

      <p className="muted small">
        Notifikace zapnuté: {withPush}/{rows.length}.
        {' '}Poslední měsíční výpis: {lastCron ? `${fmtDate(lastCron.received_at)} – ${lastCron.result || 'bez výsledku'}` : 'zatím žádný'}.
      </p>
      <p className="muted small">Přehled vidíš jen ty. Peníze tu nejsou – appka neví, kdo co poslal.</p>
      <p><a className="link" href="/">← Zpět</a></p>
    </>
  );
}
