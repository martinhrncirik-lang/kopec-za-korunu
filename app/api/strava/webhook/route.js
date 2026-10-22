import { after } from 'next/server';
import { APP_URL, RATE_CZK_PER_KM } from '@/lib/config';
import { db, getAthleteByStravaId, monthSummary } from '@/lib/db';
import { validToken, getActivity, toRow } from '@/lib/strava';
import { evaluateActivity, fmtKm } from '@/lib/stats';
import { notifyAthlete } from '@/lib/push';

// GET: Strava ověřuje webhook při registraci (jednorázově).
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  if (p.get('hub.mode') === 'subscribe' && p.get('hub.verify_token') === process.env.STRAVA_VERIFY_TOKEN) {
    return Response.json({ 'hub.challenge': p.get('hub.challenge') });
  }
  return new Response('Forbidden', { status: 403 });
}

// POST: Strava hlásí novou/změněnou/smazanou aktivitu nebo odhlášení sportovce.
// Musíme odpovědět do 2 sekund, takže práce běží až po odeslání odpovědi.
export async function POST(req) {
  const ev = await req.json();
  const expectedSub = process.env.STRAVA_SUBSCRIPTION_ID;
  if (expectedSub && String(ev.subscription_id) !== expectedSub) return new Response('ignored');
  after(() => handle(ev).catch((e) => console.error('webhook', ev, e)));
  return new Response('ok');
}

async function handle(ev) {
  const athlete = await getAthleteByStravaId(ev.owner_id);
  if (!athlete) return;

  // Sportovec odpojil aplikaci ve Stravě → podle podmínek smažeme jeho data.
  if (ev.object_type === 'athlete' && ev.updates?.authorized === 'false') {
    await db().from('athletes').delete().eq('id', athlete.id); // aktivity a odběry kaskádou
    return;
  }
  if (ev.object_type !== 'activity') return;

  if (ev.aspect_type === 'delete') {
    await db().from('activities').delete().eq('strava_id', ev.object_id);
    return;
  }

  const token = await validToken(athlete);
  let activity;
  try {
    activity = await getActivity(token, ev.object_id);
  } catch (e) {
    if (e.status === 404) return; // mezitím smazaná
    throw e;
  }

  const row = toRow(athlete.id, activity);
  if (!row) {
    // Typ se nepočítá (nebo se změnil např. z Ride na EBikeRide) → pryč z výpočtu
    await db().from('activities').delete().eq('strava_id', ev.object_id);
    return;
  }

  const { data: existing } = await db().from('activities').select('praise').eq('strava_id', row.strava_id).maybeSingle();
  const { error } = await db().from('activities').upsert(row, { onConflict: 'strava_id' });
  if (error) throw error;

  // Notifikace jen u nové aktivity, ne při každé editaci názvu.
  if (ev.aspect_type !== 'create' || existing) return;

  const praise = await evaluateActivity(row);
  const km = row.distance_m / 1000;
  const { km: monthKm } = await monthSummary(athlete.id, row.month);
  const monthCzk = Math.round(monthKm * RATE_CZK_PER_KM);

  if (praise) {
    await db().from('activities').update({ praise }).eq('strava_id', row.strava_id);
    await notifyAthlete(athlete.id, {
      title: 'Tohle byl švih! 🚴',
      body: `${praise} Pošlete za něj dar?`,
      url: `${APP_URL}/svih/${row.strava_id}`,
    });
  } else {
    await notifyAthlete(athlete.id, {
      title: `+${fmtKm(km)} km pro NRV`,
      body: `Tento měsíc máte ${fmtKm(monthKm)} km, tedy ${monthCzk} Kč.`,
      url: `${APP_URL}/`,
    });
  }
}
