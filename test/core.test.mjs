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

const ride = (km, elev = 0) => ({ sport_type: 'Ride', distance_m: km * 1000, elevation_m: elev, start_local: '2026-10-20T08:00:00' });

test('málo historie = žádná pochvala', () => {
  assert.equal(judge(ride(80), [ride(20), ride(30)], [ride(20)]), null);
});

test('nejdelší jízda za 12 týdnů', () => {
  const prev = [ride(40), ride(55), ride(60), ride(30), ride(45)];
  assert.match(judge(ride(72), prev, prev), /Nejdelší jízda.*72 km.*o 12 km.*60 km/);
});

test('první stovka v sezoně', () => {
  const prev = [ride(40), ride(55), ride(60), ride(30), ride(45)];
  assert.match(judge(ride(104), prev, prev), /První stovka/);
});

test('převýšení', () => {
  const prev = [ride(60, 400), ride(55, 300), ride(70, 500), ride(65, 200), ride(68, 350)];
  assert.match(judge(ride(50, 900), prev, prev), /převýšení.*900 m.*o 400 m/);
});
