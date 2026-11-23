import { db, getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { validToken, getActivity, toRow } from '@/lib/strava';
import { evaluateActivity } from '@/lib/stats';
import { outdoorTempDebug } from '@/lib/weather';

export const dynamic = 'force-dynamic';

// Diagnostika jízdy jen pro autora (ADMIN_STRAVA_ID). Nic nemění, jen ukáže:
// co poslala Strava (poloha, teplota ze zařízení), co vrátilo počasí, co je v databázi,
// co by teď vyšlo za pochvalu a co se zapsalo do deníku webhook_events.
// /api/admin/diag            → poslední jízda autora
// /api/admin/diag?id=123     → konkrétní jízda
export async function GET(req) {
  const uid = await currentAthleteId();
  const me = uid ? await getAthlete(uid) : null;
  if (!isAdmin(me)) return new Response('Not found', { status: 404 });

  const q = new URL(req.url).searchParams;
  let id = q.get('id');
  if (!id) {
    const { data } = await db().from('activities').select('strava_id').eq('athlete_id', me.id).order('start_local', { ascending: false }).limit(1);
    id = data?.[0]?.strava_id;
  }
  if (!id) return Response.json({ chyba: 'žádná jízda v databázi' });

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

  return new Response(JSON.stringify(out, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
