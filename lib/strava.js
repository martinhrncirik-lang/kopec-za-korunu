import { APP_URL, STRAVA_API, STRAVA_OAUTH, sportGroup, isIndoor } from './config.js';
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
export const listActivitiesRange = (token, afterEpoch, beforeEpoch, page = 1) =>
  api(token, `/athlete/activities?after=${Math.floor(afterEpoch)}${beforeEpoch ? `&before=${Math.floor(beforeEpoch)}` : ''}&per_page=100&page=${page}`);

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
    // ze zařízení; u nových jízd ji přepíše počasí (lib/weather.js). Trenažér bez teploty (pokoj ≠ zima).
    avg_temp: isIndoor(a) ? null : (a.average_temp ?? null),
  };
}

export const getAthleteStats = (token, stravaAthleteId) => api(token, `/athletes/${stravaAthleteId}/stats`);

// Doplní příjmení sportovcům, kteří se přihlásili před 10. 11. 2026 (jednorázově, jen pro přehled autora).
export async function ensureLastname(athlete) {
  if (athlete.lastname != null) return athlete;
  try {
    const me = await api(await validToken(athlete), '/athlete');
    const lastname = me.lastname || '';
    await db().from('athletes').update({ lastname }).eq('id', athlete.id);
    return { ...athlete, lastname };
  } catch (e) {
    console.error('lastname', e);
    return athlete;
  }
}
