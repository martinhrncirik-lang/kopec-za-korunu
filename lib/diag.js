import { db } from './db.js';
import { validToken, getActivity, toRow } from './strava.js';
import { evaluateActivity } from './stats.js';
import { outdoorTempDebug } from './weather.js';

// Diagnostika jízdy pro autora: co poslala Strava, co vrátilo počasí, co je v databázi,
// jaká pochvala by vyšla teď a co se zapsalo do deníku webhook_events. Nic nemění.
export async function diagnoseRide(me, id) {
  if (!id) {
    const { data } = await db().from('activities').select('strava_id').eq('athlete_id', me.id).order('start_local', { ascending: false }).limit(1);
    id = data?.[0]?.strava_id;
  }
  if (!id) return { chyba: 'žádná jízda v databázi' };

  const out = { jizda: String(id) };
  try {
    const a = await getActivity(await validToken(me), id);
    out.strava = {
      nazev: a.name, typ: a.sport_type, start_date: a.start_date, start_date_local: a.start_date_local,
      elapsed_time: a.elapsed_time, start_latlng: a.start_latlng ?? null, ma_mapu: !!a.map?.summary_polyline,
      average_temp_ze_zarizeni: a.average_temp ?? null, zarizeni: a.device_name ?? null,
    };
    out.pocasi = await outdoorTempDebug(a);
    const row = toRow(me.id, a);
    if (row) {
      if (row.avg_temp == null) row.avg_temp = out.pocasi.temp;
      const p = await evaluateActivity(row);
      out.pochvala_kdyby_prisla_ted = p || 'žádná';
    }
  } catch (e) {
    out.strava_chyba = `${e.status || ''} ${e.message}`;
  }
  const { data: dbRow } = await db().from('activities').select('*').eq('strava_id', id).maybeSingle();
  out.v_databazi = dbRow || 'není';
  const { data: events } = await db().from('webhook_events').select('received_at, result, payload')
    .eq('payload->>object_id', String(id)).order('received_at', { ascending: true }).limit(10);
  out.denik_webhooku = (events || []).map((e) => ({ kdy: e.received_at, typ: e.payload?.aspect_type, vysledek: e.result }));

  return out;
}
