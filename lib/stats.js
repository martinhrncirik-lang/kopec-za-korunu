import { db } from './db.js';
import { SPORT_GROUPS, sportGroup } from './config.js';

const km = (m) => Number(m) / 1000;
export const fmtKm = (v) => v.toLocaleString('cs-CZ', { maximumFractionDigits: 1 });
const fmtInt = (v) => Math.round(v).toLocaleString('cs-CZ');
const dayOf = (startLocal) => startLocal.slice(0, 10);
const dayDiff = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400e3);
const czDate = (d) => { const [, m, day] = d.split('-').map(Number); return `${day}. ${m}.`; };

// Pochvala jen z tvrdých čísel (podmínky Stravy zakazují používat data v AI).
// Každá jízda dostane NEJVÝŠ JEDNU pochvalu: tu nejsilnější podle pořadí níže.
// strong = posílá se notifikace „Tohle byl švih!"; slabší pochvaly jen v aplikaci.
//
// ctx = {
//   prev12w:   předchozí aktivity stejného druhu za 12 týdnů   [{distance_m, elevation_m}]
//   prevDays:  data (YYYY-MM-DD) všech započítaných aktivit před touto, aspoň 15 dní zpět
//   lastBefore: datum poslední započítané aktivity před touto (nebo null = žádná historie)
//   ytdBeforeM: započítané metry letos před touto aktivitou (null = neznámo)
//   hundredsBefore: počet letošních stovek (u běhu půlmaratonů) před touto
//   allTimeBiggestRideM: nejdelší jízda všech dob ze Stravy (null = neznámo)
// }
export function judge(a, ctx = {}) {
  const group = sportGroup(a.sport_type);
  if (!group) return null;
  const isRun = group === 'run';
  const d = km(a.distance_m);
  const e = Number(a.elevation_m) || 0;
  const today = dayOf(a.start_local);
  const prev12 = ctx.prev12w || [];

  // 1) Nejdelší jízda všech dob (jen kolo – Strava jinou statistiku nedává)
  const big = ctx.allTimeBiggestRideM;
  if (!isRun && big != null && Number(a.distance_m) >= big - 50 && d >= 20) {
    const text = Number(a.distance_m) > big + 50
      ? `Nejdelší jízda v historii: ${fmtKm(d)} km, o ${fmtKm(d - big / 1000)} km víc než dosavadní osobní maximum (${fmtKm(big / 1000)} km).`
      : `Nejdelší jízda, jakou máte na Stravě: ${fmtKm(d)} km. Osobní rekord.`;
    return { text, strong: true, kind: 'alltime' };
  }

  // 2) Každá stovka (u běhu půlmaraton)
  const limit = isRun ? 21.0975 : 100;
  if (d >= limit) {
    const n = (ctx.hundredsBefore ?? 0) + 1;
    const nth = ctx.hundredsBefore != null && n > 1 ? ` Už ${n}. letos.` : '';
    const text = isRun ? `Půlmaraton: ${fmtKm(d)} km.${nth}` : `Stovka! ${fmtKm(d)} km v jednom zátahu.${nth}`;
    return { text, strong: true, kind: 'hundred' };
  }

  // 3) Každá jízda nad 1 000 m převýšení
  if (e >= 1000) {
    return { text: `Přes tisíc výškových metrů: ${fmtInt(e)} m na jedné ${isRun ? 'trase' : 'jízdě'}.`, strong: true, kind: 'climb1000' };
  }

  // 4) a 5) Rekordy za 12 týdnů – až s aspoň 5 předchozími aktivitami, jinak by byl rekord každý druhý den
  if (prev12.length >= 5) {
    const maxD = Math.max(...prev12.map((x) => km(x.distance_m)));
    if (d > maxD) {
      return { text: `Nejdelší ${isRun ? 'běh' : 'jízda'} za posledních 12 týdnů: ${fmtKm(d)} km, o ${fmtKm(d - maxD)} km víc než dosavadní maximum (${fmtKm(maxD)} km).`, strong: true, kind: 'long12' };
    }
    const maxE = Math.max(...prev12.map((x) => Number(x.elevation_m) || 0));
    if (e >= 300 && e > maxE) {
      return { text: `Největší převýšení za posledních 12 týdnů: ${fmtInt(e)} m, o ${fmtInt(e - maxE)} m víc než dosud (${fmtInt(maxE)} m).`, strong: true, kind: 'climb12' };
    }
  }

  // 6) Série dní v řadě: 3, 5, 10 – jen u první aktivity dne
  const days = new Set(ctx.prevDays || []);
  if (!days.has(today)) {
    let streak = 1;
    let cursor = today;
    for (;;) {
      const prev = new Date(Date.parse(cursor + 'T00:00:00Z') - 86400e3).toISOString().slice(0, 10);
      if (!days.has(prev)) break;
      streak++; cursor = prev;
    }
    if ([3, 5, 10].includes(streak)) {
      return { text: `${streak} dní v řadě ${isRun ? 'v běžeckých botách' : 'na kole'}. Série trvá od ${czDate(cursor)}`, strong: true, kind: 'streak' };
    }
  }

  // 7) Roční milník po každých 1 000 km (to, co se počítá do darů)
  if (ctx.ytdBeforeM != null) {
    const before = Math.floor(ctx.ytdBeforeM / 1e6);
    const after = Math.floor((ctx.ytdBeforeM + Number(a.distance_m)) / 1e6);
    if (after > before) {
      const k = fmtInt(after * 1000);
      return { text: `Letos už ${k} km. To je ${k} Kč na dobrou věc.`, strong: true, kind: 'milestone' };
    }
  }

  // 8)–10) Slabší pochvaly: jen v aplikaci, bez samostatné notifikace
  if (a.avg_temp != null && Number(a.avg_temp) < 3) {
    return { text: `${isRun ? 'Běh' : 'Jízda'} při ${fmtInt(a.avg_temp)} °C. Tohle se počítá dvakrát, aspoň morálně.`, strong: false, kind: 'winter' };
  }
  const hhmm = a.start_local.slice(11, 16);
  if (hhmm < '06:00') {
    return { text: `Start v ${hhmm.replace(/^0/, '')}. Kilometry před snídaní.`, strong: false, kind: 'early' };
  }
  if (ctx.lastBefore) {
    const gap = dayDiff(today, ctx.lastBefore);
    if (gap >= 14) {
      return { text: `Zpátky ${isRun ? 'v botách' : 'v sedle'} po ${gap} dnech. Vítejte zpět.`, strong: false, kind: 'comeback' };
    }
  }
  return null;
}

// Sestaví kontext z databáze (a případně ze statistik Stravy) a vyhodnotí aktivitu.
// stats = výsledek GET /athletes/{id}/stats, nebo null (např. při zpětném přepočtu).
export async function evaluateActivity(row, { stats = null } = {}) {
  const group = sportGroup(row.sport_type);
  if (!group) return null;
  const types = SPORT_GROUPS[group];
  const allTypes = Object.values(SPORT_GROUPS).flat();
  const start = Date.parse(row.start_local + 'Z');
  const iso = (ms) => new Date(ms).toISOString().slice(0, 19);
  const yearStart = `${row.start_local.slice(0, 4)}-01-01T00:00:00`;

  const before = () => db().from('activities').select('distance_m, elevation_m, start_local, sport_type')
    .eq('athlete_id', row.athlete_id).neq('strava_id', row.strava_id).lt('start_local', row.start_local);

  const [r12, rYear, rLast, ath] = await Promise.all([
    before().in('sport_type', types).gte('start_local', iso(start - 84 * 86400e3)),
    before().in('sport_type', allTypes).gte('start_local', yearStart),
    before().in('sport_type', allTypes).order('start_local', { ascending: false }).limit(1),
    db().from('athletes').select('history_since').eq('id', row.athlete_id).maybeSingle(),
  ]);
  for (const r of [r12, rYear, rLast]) if (r.error) throw r.error;

  // Roční údaje jen když máme historii od začátku roku, jinak by milník lhal.
  const hs = ath.data?.history_since;
  const haveYear = hs && hs <= yearStart.slice(0, 10);
  const yearRows = rYear.data;
  const limitM = group === 'run' ? 21097.5 : 100000;
  const since15 = iso(start - 15 * 86400e3);

  return judge(row, {
    prev12w: r12.data,
    prevDays: [...new Set(yearRows.filter((x) => x.start_local >= since15).map((x) => dayOf(x.start_local)))],
    lastBefore: rLast.data[0] ? dayOf(rLast.data[0].start_local) : null,
    ytdBeforeM: haveYear ? yearRows.reduce((s, x) => s + Number(x.distance_m), 0) : null,
    hundredsBefore: haveYear ? yearRows.filter((x) => types.includes(x.sport_type) && Number(x.distance_m) >= limitM).length : null,
    allTimeBiggestRideM: stats?.biggest_ride_distance ?? null,
  });
}
