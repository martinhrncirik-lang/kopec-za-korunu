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
