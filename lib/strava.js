import { APP_URL, STRAVA_API, STRAVA_OAUTH, sportGroup } from './config.js';
import { db } from './db.js';

export function authorizeUrl(state) {
  const p = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/auth/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    // activity:read_all = počítají se i soukromé aktivity
    scope: 'read,activity:read_all',
    state,
  });
  return `${STRAVA_OAUTH}/authorize?${p}`;
}

async function tokenRequest(params) {
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      ...params,
    }),
  });
  if (!res.ok) throw new Error(`Strava token ${res.status}: ${await res.text()}`);
  return res.json();
}

export const exchangeCode = (code) => tokenRequest({ code, grant_type: 'authorization_code' });

// Access token Stravy platí 6 hodin; před vypršením ho obnovíme.
export async function validToken(athlete) {
  const now = Math.floor(Date.now() / 1000);
  if (athlete.expires_at - 120 > now) return athlete.access_token;
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: athlete.refresh_token });
  await db()
    .from('athletes')
    .update({ access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at })
    .eq('id', athlete.id);
  return t.access_token;
}

async function api(token, path) {
  const res = await fetch(`${STRAVA_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = new Error(`Strava API ${res.status} ${path}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const getActivity = (token, id) => api(token, `/activities/${id}`);
export const listActivities = (token, afterEpoch, page = 1) =>
  api(token, `/athlete/activities?after=${afterEpoch}&per_page=100&page=${page}`);

// Převod aktivity ze Stravy na řádek v databázi (jen čísla, která potřebujeme).
export function toRow(athleteId, a) {
  if (!sportGroup(a.sport_type) || !(a.distance > 0)) return null;
  const startLocal = a.start_date_local.replace('Z', '');
  return {
    strava_id: a.id,
    athlete_id: athleteId,
    sport_type: a.sport_type,
    start_local: startLocal,
    month: startLocal.slice(0, 7),
    distance_m: a.distance,
    elevation_m: a.total_elevation_gain || 0,
    moving_time_s: a.moving_time || 0,
    avg_temp: a.average_temp ?? null, // jen když zařízení měří teplotu
  };
}

export const getAthleteStats = (token, stravaAthleteId) => api(token, `/athletes/${stravaAthleteId}/stats`);

// Stáhne historii od začátku roku (aspoň 12 týdnů zpět) – kvůli ročnímu milníku, sériím a rekordům.
// Pak jednorázově vyhodnotí pochvaly za posledních 14 dní (bez notifikací, ať vidíte, jak to funguje).
export async function backfill(athlete) {
  const token = await validToken(athlete);
  const now = new Date();
  const jan1 = Date.UTC(now.getUTCFullYear(), 0, 1) / 1000;
  const after = Math.min(jan1, Math.floor(now / 1000) - 84 * 86400);
  const rows = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await listActivities(token, after, page);
    rows.push(...batch.map((a) => toRow(athlete.id, a)).filter(Boolean));
    if (batch.length < 100) break;
  }
  if (rows.length) {
    const { error } = await db().from('activities').upsert(rows, { onConflict: 'strava_id' });
    if (error) throw error;
  }
  const since = new Date(after * 1000).toISOString().slice(0, 10);
  await db().from('athletes').update({ history_since: since }).eq('id', athlete.id);

  const { evaluateActivity } = await import('./stats.js');
  const recent = rows
    .filter((r) => Date.parse(r.start_local + 'Z') > Date.now() - 14 * 86400e3)
    .sort((x, y) => x.start_local.localeCompare(y.start_local));
  for (const r of recent) {
    const p = await evaluateActivity(r);
    await db().from('activities').update({ praise: p?.text ?? null, praise_strong: p?.strong ?? true }).eq('strava_id', r.strava_id);
  }
  return rows.length;
}
