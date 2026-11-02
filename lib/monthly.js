import { db } from './db.js';
import { RATE_CZK_PER_KM } from './config.js';
import { previousMonth } from './months.js';

// Hodnoticí věta k uzavřenému měsíci. Jen z reálných dat, nejvýš jedna věta – ta nejsilnější pravdivá.
const NOM = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
const LOC = ['lednu', 'únoru', 'březnu', 'dubnu', 'květnu', 'červnu', 'červenci', 'srpnu', 'září', 'říjnu', 'listopadu', 'prosinci'];
const INS = ['lednem', 'únorem', 'březnem', 'dubnem', 'květnem', 'červnem', 'červencem', 'srpnem', 'zářím', 'říjnem', 'listopadem', 'prosincem'];
const ORD = ['', 'Nejlepší', 'Druhý nejlepší', 'Třetí nejlepší'];
const MOUNTAINS = [['Everest', 8849], ['Mont Blanc', 4806], ['Sněžka', 1603]];

const mIdx = (m) => Number(m.slice(5, 7)) - 1;
const yr = (m) => m.slice(0, 4);
const int = (v) => Math.round(v).toLocaleString('cs-CZ');
const daysIn = (m) => new Date(Date.UTC(Number(yr(m)), mIdx(m) + 1, 0)).getUTCDate();
const isWinter = (m) => [10, 11, 0, 1].includes(mIdx(m));

// target = { month, km, elev, days }; others = stejné objekty pro dřívější celé měsíce (nejnovější na konci)
export function monthVerdict(target, others, sinceMonth) {
  const name = NOM[mIdx(target.month)];
  const since = `od ${GEN[mIdx(sinceMonth)]}${yr(sinceMonth) !== yr(target.month) ? ` ${yr(sinceMonth)}` : ''}`;
  const czk = Math.round(target.km * RATE_CZK_PER_KM);
  const prev = others.find((o) => o.month === previousMonth(target.month));

  if (others.length >= 2) {
    const sorted = [...others, target].sort((a, b) => b.km - a.km);
    const rank = sorted.indexOf(target) + 1;
    // 1) Nejlepší měsíc
    if (rank === 1) {
      const runner = sorted[1];
      return `Nejvíc kilometrů ${since}. ${name} překonal dosavadní maximum z ${GEN[mIdx(runner.month)]} o ${int(target.km - runner.km)} km.`;
    }
    // 2) Pořadí
    if (rank <= 3 && sorted.length >= 4) {
      const above = sorted.slice(0, rank - 1).map((o) => INS[mIdx(o.month)]);
      return `${ORD[rank]} měsíc ${since}, ${rank === 2 ? 'hned ' : ''}za ${above.join(' a ')}.`;
    }
    // 3) Nad průměrem
    const avg = others.reduce((s, o) => s + o.km, 0) / others.length;
    const pct = avg > 0 ? Math.round((target.km / avg - 1) * 100) : 0;
    if (pct >= 10) return `O ${pct} % víc, než je váš měsíční průměr ${since} (${int(avg)} km).`;
  }

  // Zimní měsíc: srovnání jen se zimou, ať se leden neměří s červencem
  if (isWinter(target.month)) {
    const winters = others.filter((o) => isWinter(o.month));
    if (winters.length >= 1 && winters.every((o) => target.km > o.km)) {
      return `Nejlepší zimní měsíc ${since}: o ${int(target.km - Math.max(...winters.map((o) => o.km)))} km víc než dosavadní zimní maximum.`;
    }
  }

  // 4) Lepší než minulý měsíc
  if (prev && target.km > prev.km) {
    return `O ${int(target.km - prev.km)} km víc než v ${LOC[mIdx(prev.month)]}.${isWinter(target.month) ? ' Zima vás nezastavila.' : ''}`;
  }

  if (others.length >= 2) {
    // 5) Převýšení
    const maxE = Math.max(...others.map((o) => o.elev));
    const m = MOUNTAINS.find(([, h]) => target.elev >= h);
    if (target.elev > maxE && m) {
      const x = (target.elev / m[1]).toLocaleString('cs-CZ', { maximumFractionDigits: 1 });
      return `Nejvíc nastoupaných metrů ${since}: ${int(target.elev)} m, to je ${x}× ${m[0]} od hladiny moře.`;
    }
    // 6) Pravidelnost
    const maxD = Math.max(...others.map((o) => o.days));
    if (target.days > maxD && target.days >= 4) {
      return `Aktivní ${target.days} dní z ${daysIn(target.month)}. Nejčastěji ${since}.`;
    }
  }

  // 7) Poctivě, bez předstírání
  if (prev && prev.km > target.km) {
    return `O ${int(prev.km - target.km)} km méně než v ${LOC[mIdx(prev.month)]}. Ale ${int(czk)} Kč je pořád ${int(czk)} Kč, které by jinak nebyly.`;
  }
  return `${int(target.km)} km = ${int(czk)} Kč, které by jinak nebyly.`;
}

// Načte data z databáze a vrátí větu pro daný uzavřený měsíc (nebo null, když v něm nic nebylo).
export async function monthVerdictFor(athleteId, month) {
  const { data: ath } = await db().from('athletes').select('history_since').eq('id', athleteId).maybeSingle();
  const hs = ath?.history_since || `${yr(month)}-01-01`;
  // první celý měsíc v databázi
  let since = hs.slice(0, 7);
  if (hs.slice(8, 10) !== '01') since = nextMonth(since);
  if (since > month) since = month;

  const { data, error } = await db().from('activities')
    .select('month, distance_m, elevation_m, start_local')
    .eq('athlete_id', athleteId).gte('month', since).lte('month', month);
  if (error) throw error;

  const by = {};
  for (let m = since; m <= month; m = nextMonth(m)) by[m] = { month: m, km: 0, elev: 0, days: 0, _d: new Set() };
  for (const a of data) {
    const o = by[a.month]; if (!o) continue;
    o.km += Number(a.distance_m) / 1000; o.elev += Number(a.elevation_m) || 0; o._d.add(a.start_local.slice(0, 10));
  }
  const all = Object.values(by).map(({ _d, ...o }) => ({ ...o, days: _d.size }));
  const target = all.pop();
  if (!target || target.km <= 0) return null;
  return monthVerdict(target, all, since);
}

function nextMonth(m) {
  let y = Number(yr(m)), mm = mIdx(m) + 2;
  if (mm === 13) { mm = 1; y += 1; }
  return `${y}-${String(mm).padStart(2, '0')}`;
}
