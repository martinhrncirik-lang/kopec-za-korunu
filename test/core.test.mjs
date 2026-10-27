import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSpayd, variableSymbol } from '../lib/spayd.js';
import { judge } from '../lib/stats.js';
import { previousMonth } from '../lib/months.js';

test('IBAN účtu 663939/0300 má platný kontrolní součet', () => {
  const iban = 'CZ7103000000000000663939';
  const r = iban.slice(4) + iban.slice(0, 4);
  const num = r.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  assert.equal(BigInt(num) % 97n, 1n);
});

test('VS = RRMM + ID na 6 míst', () => {
  assert.equal(variableSymbol('2026-10', 1), '2610000001');
  assert.equal(variableSymbol('2027-01', 42), '2701000042');
});

test('SPAYD řetězec', () => {
  const s = buildSpayd({ iban: 'CZ7103000000000000663939', amount: 347, vs: '2610000001', message: 'Kopec za korunu 2026-10' });
  assert.equal(s, 'SPD*1.0*ACC:CZ7103000000000000663939*AM:347.00*CC:CZK*X-VS:2610000001*MSG:Kopec za korunu 2026-10');
});

test('předchozí měsíc přes přelom roku', () => {
  assert.equal(previousMonth('2027-01'), '2026-12');
});

const ride = (km, elev = 0, start = '2026-10-20T08:00:00', extra = {}) => ({ sport_type: 'Ride', distance_m: km * 1000, elevation_m: elev, start_local: start, ...extra });
const hist = [ride(40), ride(55), ride(60, 500), ride(30), ride(45)];

test('málo historie a nic zvláštního = žádná pochvala', () => {
  assert.equal(judge(ride(30), { prev12w: [ride(20)] }), null);
});

test('nejdelší jízda všech dob má přednost před stovkou', () => {
  const p = judge(ride(150), { prev12w: hist, allTimeBiggestRideM: 140000 });
  assert.equal(p.kind, 'alltime'); assert.ok(p.strong); assert.match(p.text, /o 10 km víc.*140 km/);
  // Strava už jízdu započítala → rovnost je taky rekord
  assert.equal(judge(ride(150), { allTimeBiggestRideM: 150000 }).kind, 'alltime');
  // kratší než rekord → ne
  assert.notEqual(judge(ride(150), { allTimeBiggestRideM: 200000 }).kind, 'alltime');
});

test('každá stovka, s pořadím v roce', () => {
  const p = judge(ride(104), { prev12w: hist, hundredsBefore: 2 });
  assert.equal(p.kind, 'hundred'); assert.match(p.text, /Stovka! 104 km.*Už 3\. letos/);
});

test('tisíc výškových metrů', () => {
  assert.equal(judge(ride(70, 1200), { prev12w: hist }).kind, 'climb1000');
});

test('nejdelší za 12 týdnů a převýšení za 12 týdnů', () => {
  assert.match(judge(ride(72), { prev12w: hist }).text, /Nejdelší jízda.*72 km.*o 12 km.*60 km/);
  assert.match(judge(ride(50, 900), { prev12w: hist }).text, /převýšení.*900 m.*o 400 m/);
});

test('série dní v řadě: 3, 5, 10 a jen první aktivita dne', () => {
  const days = ['2026-10-18', '2026-10-19'];
  assert.match(judge(ride(20, 0, '2026-10-20T08:00:00'), { prevDays: days }).text, /^3 dní v řadě.*od 18\. 10\./);
  assert.equal(judge(ride(20, 0, '2026-10-20T08:00:00'), { prevDays: [...days, '2026-10-20'] }), null);
  assert.equal(judge(ride(20, 0, '2026-10-20T08:00:00'), { prevDays: ['2026-10-19'] }), null); // 2 dny = nic
});

test('roční milník po 1000 km', () => {
  const p = judge(ride(30), { ytdBeforeM: 2985000 });
  assert.equal(p.kind, 'milestone'); assert.match(p.text, /Letos už 3\s000 km.*3\s000 Kč/);
  assert.equal(judge(ride(10), { ytdBeforeM: 2985000 }), null);
});

test('slabší pochvaly: zima, ráno, návrat – bez notifikace', () => {
  const w = judge(ride(20, 0, '2026-11-20T08:00:00', { avg_temp: 1 }), {});
  assert.equal(w.kind, 'winter'); assert.equal(w.strong, false);
  assert.equal(judge(ride(20, 0, '2026-10-20T05:42:00'), {}).kind, 'early');
  const c = judge(ride(20, 0, '2026-10-20T08:00:00'), { lastBefore: '2026-10-01' });
  assert.equal(c.kind, 'comeback'); assert.match(c.text, /po 19 dnech/);
});

test('silná pochvala vyhraje nad slabou (žádná inflace)', () => {
  const p = judge(ride(104, 0, '2026-11-20T05:30:00', { avg_temp: 0 }), { lastBefore: '2026-10-01' });
  assert.equal(p.kind, 'hundred');
});

import { vocative } from '../lib/vocative.js';
test('oslovení v 5. pádě', () => {
  const cases = { Martin: 'Martine', Jakub: 'Jakube', Lukáš: 'Lukáši', Jiří: 'Jiří', Pavel: 'Pavle', Petr: 'Petře',
    Marek: 'Marku', Jan: 'Jane', Michal: 'Michale', Ondřej: 'Ondřeji', Jana: 'Jano', Lucie: 'Lucie', Karel: 'Karle', Daniel: 'Danieli' };
  for (const [k, v] of Object.entries(cases)) assert.equal(vocative(k), v, k);
});

import { decodePolyline } from '../lib/polyline.js';
test('dekódování polyline (příklad z dokumentace Googlu)', () => {
  assert.deepEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
});

import { RECIPIENTS } from '../lib/recipients.js';
test('IBANy všech příjemců mají platný kontrolní součet a sedí s číslem účtu', () => {
  for (const r of RECIPIENTS.filter((x) => x.iban)) {
    const num = (r.iban.slice(4) + r.iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
    assert.equal(BigInt(num) % 97n, 1n, r.id);
    const [acc, bank] = r.account.split('/');
    const [pre, base] = acc.includes('-') ? acc.split('-') : ['0', acc];
    assert.equal(r.iban.slice(4), bank + pre.padStart(6, '0') + base.padStart(10, '0'), r.id);
  }
});

import { donationMessage } from '../lib/spayd.js';
test('QR: jméno plátce ve zprávě, jméno příjemce v RN, bez diakritiky', () => {
  const s = buildSpayd({ iban: 'CZ7603000000000076327632', amount: 63, message: donationMessage('2026-10-23', 'Martin Hrnčiřík'), recipientName: 'Člověk v tísni' });
  assert.equal(s, 'SPD*1.0*ACC:CZ7603000000000076327632*AM:63.00*CC:CZK*RN:Clovek v tisni*MSG:Kopec za korunu 2026-10-23, Martin Hrncirik');
  assert.ok(s.length < 200);
});
