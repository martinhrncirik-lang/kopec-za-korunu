// Venkovní teplota k jízdě z Open-Meteo (zdarma, bez klíče; CC BY 4.0 – uvedeno na stránce O aplikaci).
// Má přednost před teplotou ze zařízení (to se na ruce / na řídítkách ohřívá). Strava
// svoje „Polojasno, 0 °C" aplikacím přes API nedává.

const TIMEOUT_MS = 4000;

// Průměr hodinových teplot, které spadají do jízdy; když žádná nespadá, nejbližší hodina.
export function averageTemp(hourly, startMs, endMs) {
  const times = hourly?.time || [];
  const temps = hourly?.temperature_2m || [];
  const pts = times.map((t, i) => [Date.parse(t + 'Z'), temps[i]]).filter(([ms, v]) => Number.isFinite(ms) && v != null);
  if (!pts.length) return null;
  const inside = pts.filter(([ms]) => ms >= startMs - 30 * 60e3 && ms <= endMs + 30 * 60e3);
  if (inside.length) return Math.round((inside.reduce((s, [, v]) => s + v, 0) / inside.length) * 10) / 10;
  const mid = (startMs + endMs) / 2;
  return pts.reduce((best, p) => (Math.abs(p[0] - mid) < Math.abs(best[0] - mid) ? p : best))[1];
}

// activity = aktivita ze Stravy (start_latlng, start_date v UTC, elapsed_time)
// Vrací i podrobnosti pro diagnostiku (/api/admin/diag).
export async function outdoorTempDebug(activity) {
  const [lat, lng] = activity?.start_latlng || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { temp: null, reason: 'Strava neposlala polohu startu (start_latlng)', start_latlng: activity?.start_latlng ?? null };
  if (!activity.start_date) return { temp: null, reason: 'chybí start_date' };
  const startMs = Date.parse(activity.start_date);
  const endMs = startMs + (activity.elapsed_time || activity.moving_time || 0) * 1000;
  const ageDays = (Date.now() - startMs) / 86400e3;
  if (!(ageDays >= -1 && ageDays <= 30)) return { temp: null, reason: `jízda je stará ${ageDays.toFixed(1)} dne` };
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}`
    + `&hourly=temperature_2m&timezone=UTC&past_days=${Math.min(31, Math.ceil(ageDays) + 1)}&forecast_days=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
    if (!res.ok) return { temp: null, reason: `Open-Meteo HTTP ${res.status}`, url };
    const temp = averageTemp((await res.json()).hourly, startMs, endMs);
    return { temp, reason: temp == null ? 'Open-Meteo bez hodinových dat' : 'ok', url };
  } catch (e) {
    console.error('weather', e?.name || e);
    return { temp: null, reason: `chyba: ${e?.name || ''} ${e?.message || e}`, url };
  }
}

export async function outdoorTemp(activity) {
  return (await outdoorTempDebug(activity)).temp;
}

// Doplní řádku teplotu z počasí, když ji zařízení nezměřilo.
// Teplota k jízdě: přednost má POČASÍ (venkovní teplota v místě startu), zařízení jen jako záloha.
// Důvod (23. 11.): Garmin vívosmart 5 na zápěstí hlásil 10 °C, venku bylo 1,8 °C – zařízení
// na ruce nebo na řídítkách se ohřívá. Vrací popis zdroje do deníku webhook_events.
export async function withWeather(row, activity) {
  if (!row) return 'bez řádku';
  const device = row.avg_temp;
  const d = await outdoorTempDebug(activity);
  if (d.temp != null) {
    row.avg_temp = d.temp;
    return `teplota z počasí ${d.temp} °C (zařízení ${device ?? '—'})`;
  }
  return device != null ? `teplota ze zařízení ${device} °C (počasí: ${d.reason})` : `bez teploty (${d.reason})`;
}
