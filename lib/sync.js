import { db } from './db.js';
import { validToken, listActivities, toRow } from './strava.js';
import { evaluateActivity } from './stats.js';
import { withWeather } from './weather.js';
import { fetchPraiseHistory } from './history.js';

// Okno pojistné synchronizace. Musí být kratší než mezipaměť (7 dní, maže /api/cron/cleanup),
// jinak by se starší jízdy, které už z mezipaměti zmizely, pořád dokola „objevovaly“ jako nové.
export const SYNC_DAYS = 5;

// Pojistka pro případ, že webhook od Stravy nedorazí: při otevření aplikace (a po přihlášení)
// načte aktivity za posledních pár dní a doplní do mezipaměti chybějící, včetně pochvaly (bez notifikace).
export async function syncRecent(athlete) {
  const token = await validToken(athlete);
  const after = Math.floor(Date.now() / 1000) - SYNC_DAYS * 86400;
  const batch = await listActivities(token, after, 1);
  const byId = new Map(batch.map((a) => [Number(a.id), a]));
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

  // Od nejstarší; historie pro pochvaly se načte jednou pro všechny.
  fresh.sort((a, b) => a.start_local.localeCompare(b.start_local));
  const history = await fetchPraiseHistory(athlete, fresh[0].start_local); // od nejstarší nové jízdy
  for (const row of fresh) {
    await withWeather(row, byId.get(Number(row.strava_id)));
    const p = await evaluateActivity(row, { history, athlete });
    const { error } = await db().from('activities').upsert(
      { ...row, praise: p?.text ?? null, praise_strong: p?.strong ?? false },
      { onConflict: 'strava_id' },
    );
    if (error) throw error;
  }
  console.log('sync: doplněno aktivit', fresh.length, 'sportovec', athlete.id);
  return fresh.length;
}

// Pochvaly z mezipaměti k daným jízdám (starší než ~7 dní už pochvalu nemají).
export async function praiseFor(stravaIds) {
  if (!stravaIds.length) return new Map();
  const { data, error } = await db().from('activities').select('strava_id, praise, praise_strong').in('strava_id', stravaIds);
  if (error) throw error;
  return new Map(data.map((r) => [String(r.strava_id), r]));
}
