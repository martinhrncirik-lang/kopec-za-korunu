import { db } from './db.js';
import { SPORT_GROUPS, sportGroup } from './config.js';

const km = (m) => Number(m) / 1000;
export const fmtKm = (v) => v.toLocaleString('cs-CZ', { maximumFractionDigits: 1 });

// Pochvala jen na základě tvrdých čísel. Žádné AI – to podmínky Stravy zakazují.
// Vrací text pochvaly, nebo null.
export function judge(activity, previous, sameYearPrevious = []) {
  const group = sportGroup(activity.sport_type);
  const noun = group === 'run' ? 'běh' : 'jízda';
  const d = km(activity.distance_m);

  // 1) První stovka (jízda) / první půlmaraton (běh) v sezoně
  const milestone = group === 'run' ? 21.1 : 100;
  if (d >= milestone && !sameYearPrevious.some((a) => km(a.distance_m) >= milestone)) {
    const year = activity.start_local.slice(0, 4);
    return group === 'run'
      ? `První půlmaraton v roce ${year}: ${fmtKm(d)} km. Tohle si zaslouží víc než lajk.`
      : `První stovka v sezoně ${year}: ${fmtKm(d)} km. Kolo to přežilo, peněženka taky přežije.`;
  }

  // Na srovnání s historií chceme aspoň 5 předchozích aktivit, jinak by každá druhá byla "rekord".
  if (previous.length < 5) return null;

  const maxD = Math.max(...previous.map((a) => km(a.distance_m)));
  if (d > maxD) {
    return `Nejdelší ${noun} za posledních 12 týdnů: ${fmtKm(d)} km, o ${fmtKm(d - maxD)} km víc než dosavadní maximum (${fmtKm(maxD)} km).`;
  }

  const e = Number(activity.elevation_m);
  const maxE = Math.max(...previous.map((a) => Number(a.elevation_m)));
  if (e >= 300 && e > maxE) {
    return `Největší převýšení za posledních 12 týdnů: ${Math.round(e)} m, o ${Math.round(e - maxE)} m víc než dosud (${Math.round(maxE)} m).`;
  }

  return null;
}

export async function evaluateActivity(activity) {
  const group = sportGroup(activity.sport_type);
  if (!group) return null;
  const types = SPORT_GROUPS[group];
  const start = new Date(activity.start_local + 'Z');
  const since = new Date(start.getTime() - 84 * 86400e3).toISOString().slice(0, 19);
  const yearStart = `${activity.start_local.slice(0, 4)}-01-01T00:00:00`;

  const base = () =>
    db()
      .from('activities')
      .select('distance_m, elevation_m, start_local')
      .eq('athlete_id', activity.athlete_id)
      .neq('strava_id', activity.strava_id)
      .in('sport_type', types)
      .lt('start_local', activity.start_local);

  const [{ data: previous, error: e1 }, { data: sameYear, error: e2 }] = await Promise.all([
    base().gte('start_local', since),
    base().gte('start_local', yearStart),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return judge(activity, previous, sameYear);
}
