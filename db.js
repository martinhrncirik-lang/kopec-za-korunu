import { createClient } from '@supabase/supabase-js';

// Serverový klient se secret klíčem. Nikdy se nedostane do prohlížeče.
let client;
export function db() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export async function getAthlete(id) {
  const { data, error } = await db().from('athletes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAthleteByStravaId(stravaId) {
  const { data, error } = await db().from('athletes').select('*').eq('strava_id', stravaId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function monthSummary(athleteId, month) {
  const { data, error } = await db()
    .from('activities')
    .select('distance_m')
    .eq('athlete_id', athleteId)
    .eq('month', month);
  if (error) throw error;
  const km = data.reduce((s, a) => s + Number(a.distance_m), 0) / 1000;
  return { km, count: data.length };
}

export async function monthsWithData(athleteId) {
  const { data, error } = await db()
    .from('activities')
    .select('month')
    .eq('athlete_id', athleteId)
    .order('month', { ascending: false });
  if (error) throw error;
  return [...new Set(data.map((r) => r.month))];
}
