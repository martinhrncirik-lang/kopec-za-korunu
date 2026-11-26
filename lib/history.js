import { validToken, listActivitiesRange, toRow } from './strava.js';
import { previousMonth } from './months.js';

// Podmínky Stravy (API Policy 6.2, 5.5): data ze Stravy smíme držet nejvýš 7 dní a nesmíme je trvale
// ukládat ani jako odvozené součty. Proto se historie (měsíční součty, rekordy, série, výpisy) počítá
// pokaždé živě z API Stravy. V tabulce activities je jen krátká mezipaměť posledních jízd s pochvalou
// (maže ji denně /api/cron/cleanup).

const DAY = 86400;
const monthStartUtc = (month) => { const [y, m] = month.split('-').map(Number); return Date.UTC(y, m - 1, 1) / 1000; };
export function nextMonth(month) {
  let [y, m] = month.split('-').map(Number);
  m += 1; if (m === 13) { m = 1; y += 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}
export function monthMinus(month, n) { let m = month; for (let i = 0; i < n; i++) m = previousMonth(m); return m; }

// Krátká paměť v běžící instanci serveru (2 minuty), ať „Zpět“ a přechody mezi stránkami
// nečekají pokaždé na Stravu. Jen v RAM, nic se neukládá do databáze; webhook ji pro sportovce vymaže.
const TTL_MS = 2 * 60 * 1000;
const memo = new Map();
export function forgetAthlete(athleteId) {
  for (const k of memo.keys()) if (k.startsWith(`${athleteId}:`)) memo.delete(k);
}

// Započítané aktivity sportovce mezi dvěma časy (epoch s), převedené na řádky. Nic neukládá.
// beforeEpoch = null → až do teď.
export function fetchRows(athlete, afterEpoch, beforeEpoch = null, { maxPages = 10, fresh = false } = {}) {
  const key = `${athlete.id}:${Math.floor(afterEpoch)}:${beforeEpoch ? Math.floor(beforeEpoch) : 'now'}`;
  const hit = memo.get(key);
  if (!fresh && hit && Date.now() - hit.at < TTL_MS) return hit.promise;
  const promise = loadRows(athlete, afterEpoch, beforeEpoch, maxPages);
  memo.set(key, { at: Date.now(), promise });
  promise.catch(() => memo.delete(key)); // chyba se nepamatuje
  if (memo.size > 500) memo.delete(memo.keys().next().value);
  return promise;
}

async function loadRows(athlete, afterEpoch, beforeEpoch, maxPages) {
  const token = await validToken(athlete);
  const rows = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await listActivitiesRange(token, afterEpoch, beforeEpoch, page);
    rows.push(...batch.map((a) => toRow(athlete.id, a)).filter(Boolean));
    if (batch.length < 100) break;
  }
  return rows.sort((a, b) => a.start_local.localeCompare(b.start_local));
}

// Aktivity v měsících from..to (YYYY-MM, místní čas). Okraj ±1 den kvůli časovému pásmu, pak přesný filtr.
export async function fetchMonths(athlete, fromMonth, toMonth = fromMonth, opts = {}) {
  // Rozsah končící v budoucnu (běžící měsíc) se klíčuje jako „do teď“, ať se sdílí s ostatními dotazy.
  const end = monthStartUtc(nextMonth(toMonth)) + DAY;
  const rows = await fetchRows(athlete, monthStartUtc(fromMonth) - DAY, end > Date.now() / 1000 ? null : end, opts);
  return rows.filter((r) => r.month >= fromMonth && r.month <= toMonth);
}

export function summarize(rows, month) {
  const mine = rows.filter((r) => r.month === month);
  return { km: mine.reduce((s, r) => s + Number(r.distance_m), 0) / 1000, count: mine.length };
}

export async function monthSummary(athlete, month) {
  return summarize(await fetchMonths(athlete, month), month);
}

// Historie pro pochvalu: aktivity od začátku roku (aspoň 12 týdnů zpět) až do teď.
// Pozdější jízdy než ta hodnocená vyřadí praiseContext; webhook z ní počítá i součet měsíce.
export async function fetchPraiseHistory(athlete, startLocal, opts = {}) {
  const start = Date.parse(startLocal + 'Z') / 1000;
  const jan1 = Date.UTC(Number(startLocal.slice(0, 4)), 0, 1) / 1000;
  return fetchRows(athlete, Math.min(jan1, start - 84 * DAY) - DAY, null, opts);
}
