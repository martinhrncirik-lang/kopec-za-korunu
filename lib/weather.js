// Venkovní teplota k jízdě z Open-Meteo (zdarma, bez klíče; CC BY 4.0 – uvedeno na stránce O aplikaci).
// Použije se jen tehdy, když zařízení teplotu neměří (fitness náramky, telefon). Strava
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
export async function outdoorTemp(activity) {
  const [lat, lng] = activity?.start_latlng || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !activity.start_date) return null;
  const startMs = Date.parse(activity.start_date);
  const endMs = startMs + (activity.elapsed_time || activity.moving_time || 0) * 1000;
  const ageDays = (Date.now() - startMs) / 86400e3;
  if (!(ageDays >= -1 && ageDays <= 30)) return null; // jen čerstvé jízdy (předpověď drží i pár týdnů zpět)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}`
    + `&hourly=temperature_2m&timezone=UTC&past_days=${Math.min(31, Math.ceil(ageDays) + 1)}&forecast_days=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    return averageTemp((await res.json()).hourly, startMs, endMs);
  } catch (e) {
    console.error('weather', e?.name || e);
    return null;
  }
}

// Doplní řádku teplotu z počasí, když ji zařízení nezměřilo.
export async function withWeather(row, activity) {
  if (row && row.avg_temp == null) row.avg_temp = await outdoorTemp(activity);
  return row;
}
