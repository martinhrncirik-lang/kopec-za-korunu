import { db } from './db.js';
import { validToken, listActivities, toRow } from './strava.js';
import { evaluateActivity } from './stats.js';

// Pojistka pro případ, že webhook od Stravy nedorazí:
// při otevření aplikace stáhne aktivity za posledních 14 dní a doplní chybějící.
// Jeden dotaz na Stravu na jedno otevření stránky.
export async function syncRecent(athlete) {
  const token = await validToken(athlete);
  const after = Math.floor(Date.now() / 1000) - 14 * 86400;
  const batch = await listActivities(token, after, 1);
  const rows = batch.map((a) => toRow(athlete.id, a)).filter(Boolean);
  if (!rows.length) return 0;

  const { data: existing, error: e1 } = await db()
    .from('activities')
    .select('strava_id')
    .in('strava_id', rows.map((r) => r.strava_id));
  if (e1) throw e1;
  const known = new Set(existing.map((r) => Number(r.strava_id)));
  const fresh = rows.filter((r) => !known.has(Number(r.strava_id)));
  if (!fresh.length) return 0;

  // Od nejstarší, aby se pochvaly počítaly ve správném pořadí
  fresh.sort((a, b) => a.start_local.localeCompare(b.start_local));
  for (const row of fresh) {
    const { error } = await db().from('activities').upsert(row, { onConflict: 'strava_id' });
    if (error) throw error;
    const p = await evaluateActivity(row);
    if (p) await db().from('activities').update({ praise: p.text, praise_strong: p.strong }).eq('strava_id', row.strava_id);
  }
  console.log('sync: doplněno aktivit', fresh.length, 'sportovec', athlete.id);
  return fresh.length;
}

export async function recentActivities(athleteId, limit = 5) {
  const { data, error } = await db()
    .from('activities')
    .select('strava_id, start_local, distance_m, elevation_m, praise, praise_strong')
    .eq('athlete_id', athleteId)
    .order('start_local', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
