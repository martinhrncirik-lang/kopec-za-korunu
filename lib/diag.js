import { db } from './db.js';
import { validToken, getActivity, toRow } from './strava.js';
import { evaluateActivity } from './stats.js';
import { outdoorTempDebug, withWeather } from './weather.js';
import { notifyAthlete } from './push.js';
import { headline } from './praise-fun.js';
import { APP_URL } from './config.js';

// Diagnostika jízdy pro autora: co poslala Strava, co vrátilo počasí, co je v databázi,
// jaká pochvala by vyšla teď a co se zapsalo do deníku webhook_events. Nic nemění.
// apply = přepočítat teplotu a pochvalu podle současných pravidel, uložit a u silné pochvaly poslat notifikaci.
export async function diagnoseRide(me, id, apply = false) {
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
      out.teplota_pro_pochvalu = await withWeather(row, a);
      const p = await evaluateActivity(row);
      out.pochvala_kdyby_prisla_ted = p || 'žádná';
      if (apply) {
        await db().from('activities').update({ avg_temp: row.avg_temp, praise: p?.text ?? null, praise_strong: p?.strong ?? null }).eq('strava_id', row.strava_id);
        let sent = 0;
        if (p?.strong) {
          sent = await notifyAthlete(me.id, {
            title: p.kind === 'winter' ? `${headline('winter', p.text)} 🥶` : 'Tohle byl švih! 🚴',
            body: `${p.text} Pošleš za něj dar?`,
            url: `${APP_URL}/svih/${row.strava_id}?intro=2`,
          });
        }
        out.prepocitano = `uloženo, notifikací odesláno: ${sent}`;
      }
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
