import { db } from './db.js';
import { validToken, listActivities, toRow } from './strava.js';
import { evaluateActivity } from './stats.js';

// Jednorázové doplnění aktivit, které webhook dřív zahodil (trenažér/pás před 24. 11. 2026).
// Všem sportovcům stáhne aktivity od `since` (YYYY-MM-DD, UTC) a vloží jen ty, které v DB chybějí.
// Bez notifikací. Opakované spuštění nic nezdvojí (jen chybějící řádky).
export async function refillMissing(since = '2026-11-01') {
  const after = Math.floor(Date.parse(since + 'T00:00:00Z') / 1000);
  const { data: athletes, error } = await db().from('athletes').select('*');
  if (error) throw error;
  const out = [];
  for (const athlete of athletes) {
    const item = { sportovec: [athlete.firstname, athlete.lastname].filter(Boolean).join(' ') || athlete.id, doplneno: 0, km: 0 };
    try {
      const token = await validToken(athlete);
      const rows = [];
      for (let page = 1; page <= 5; page++) {
        const batch = await listActivities(token, after, page);
        rows.push(...batch.map((a) => toRow(athlete.id, a)).filter(Boolean));
        if (batch.length < 100) break;
      }
      if (rows.length) {
        const { data: existing, error: e1 } = await db().from('activities').select('strava_id').in('strava_id', rows.map((r) => r.strava_id));
        if (e1) throw e1;
        const known = new Set(existing.map((r) => Number(r.strava_id)));
        const fresh = rows.filter((r) => !known.has(Number(r.strava_id))).sort((a, b) => a.start_local.localeCompare(b.start_local));
        for (const row of fresh) {
          const { error: e2 } = await db().from('activities').upsert(row, { onConflict: 'strava_id' });
          if (e2) throw e2;
          const p = await evaluateActivity(row);
          if (p) await db().from('activities').update({ praise: p.text, praise_strong: p.strong }).eq('strava_id', row.strava_id);
          item.doplneno++;
          item.km += row.distance_m / 1000;
        }
        item.jizdy = fresh.map((r) => `${r.start_local.slice(0, 10)} ${r.sport_type} ${(r.distance_m / 1000).toFixed(1)} km`);
      }
      item.km = Math.round(item.km * 10) / 10;
    } catch (e) {
      item.chyba = String(e?.message || e);
    }
    out.push(item);
  }
  return out;
}
