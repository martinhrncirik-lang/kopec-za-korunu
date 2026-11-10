import { db } from './db.js';
import { currentMonth, previousMonth } from './months.js';
import { ensureLastname } from './strava.js';

// Přehled je jen pro autora: Strava ID z proměnné ADMIN_STRAVA_ID (ve Vercelu).
export function isAdmin(athlete) {
  const id = String(process.env.ADMIN_STRAVA_ID || '').trim();
  return !!id && !!athlete && String(athlete.strava_id) === id;
}

const NOTIFY = { svih: 'jen švihy', all: 'každá jízda', monthly: 'jen výpis' };

export async function overviewData() {
  const month = currentMonth();
  const prev = previousMonth(month);
  // Kdo ještě nemá příjmení (přihlášení před 10. 11.), tomu ho rovnou doplníme ze Stravy.
  const { data: missing } = await db().from('athletes').select('*').is('lastname', null);
  await Promise.all((missing || []).map(ensureLastname));

  const [{ data: athletes }, { data: acts }, { data: subs }, { data: crons }] = await Promise.all([
    db().from('athletes').select('id, firstname, lastname, created_at, welcomed_at, notify_mode, default_recipient').order('id'),
    db().from('activities').select('athlete_id, month, distance_m, start_local').in('month', [month, prev]),
    db().from('push_subscriptions').select('athlete_id'),
    db().from('webhook_events').select('received_at, result, payload').eq('payload->>type', 'cron').order('received_at', { ascending: false }).limit(1),
  ]);
  // poslední aktivita kohokoli (i starší než minulý měsíc)
  const { data: lastActs } = await db().from('activities').select('athlete_id, start_local').order('start_local', { ascending: false }).limit(500);

  const rows = (athletes || []).map((a) => {
    const mine = (acts || []).filter((x) => x.athlete_id === a.id);
    const km = (m) => mine.filter((x) => x.month === m).reduce((s, x) => s + Number(x.distance_m), 0) / 1000;
    const last = (lastActs || []).find((x) => x.athlete_id === a.id);
    return {
      name: [a.firstname, a.lastname].filter(Boolean).join(' ') || `#${a.id}`,
      joined: a.created_at,
      welcomed: !!a.welcomed_at,
      notify: NOTIFY[a.notify_mode] || a.notify_mode,
      push: (subs || []).filter((s) => s.athlete_id === a.id).length,
      recipient: a.default_recipient,
      kmNow: km(month),
      kmPrev: km(prev),
      lastRide: last?.start_local || null,
    };
  });
  return { month, prev, rows, lastCron: crons?.[0] || null };
}
