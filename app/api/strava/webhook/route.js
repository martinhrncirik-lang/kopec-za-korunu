import { after } from 'next/server';
import { APP_URL, RATE_CZK_PER_KM } from '@/lib/config';
import { db, getAthleteByStravaId, monthSummary } from '@/lib/db';
import { validToken, getActivity, getAthleteStats, toRow } from '@/lib/strava';
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
  let ev;
  try { ev = await req.json(); } catch { return new Response('bad json', { status: 400 }); }
  const expectedSub = (process.env.STRAVA_SUBSCRIPTION_ID || '').trim();
  if (expectedSub && String(ev.subscription_id).trim() !== expectedSub) {
    after(() => logEvent(ev, `ignored: subscription_id ${ev.subscription_id} ≠ ${expectedSub}`));
    return new Response('ignored');
  }
  after(async () => {
    try {
      const result = await handle(ev);
      await logEvent(ev, result || 'ok');
    } catch (e) {
      console.error('webhook', ev, e);
      await logEvent(ev, `error: ${e.message}`);
    }
  });
  return new Response('ok');
}

// Každá zpráva od Stravy se zapíše do tabulky webhook_events (Supabase → Table Editor).
async function logEvent(ev, result) {
  try {
    await db().from('webhook_events').insert({ payload: ev, result: String(result).slice(0, 500) });
  } catch (e) {
    console.error('logEvent', e);
  }
}

async function handle(ev) {
  const athlete = await getAthleteByStravaId(ev.owner_id);
  if (!athlete) return `neznámý sportovec ${ev.owner_id}`;

  // Sportovec odpojil aplikaci ve Stravě → podle podmínek smažeme jeho data.
  if (ev.object_type === 'athlete' && ev.updates?.authorized === 'false') {
    await db().from('athletes').delete().eq('id', athlete.id); // aktivity a odběry kaskádou
    return 'sportovec odhlášen, data smazána';
  }
  if (ev.object_type !== 'activity') return `přeskočeno: ${ev.object_type}`;

  if (ev.aspect_type === 'delete') {
    await db().from('activities').delete().eq('strava_id', ev.object_id);
    return 'aktivita smazána';
  }

  const token = await validToken(athlete);
  let activity;
  try {
    activity = await getActivity(token, ev.object_id);
  } catch (e) {
    if (e.status === 404) return 'aktivita na Stravě nenalezena'; // mezitím smazaná
    throw e;
  }

  const row = toRow(athlete.id, activity);
  if (!row) {
    // Typ se nepočítá (nebo se změnil např. z Ride na EBikeRide) → pryč z výpočtu
    await db().from('activities').delete().eq('strava_id', ev.object_id);
    return `nepočítá se: ${activity.sport_type}`;
  }

  const { data: existing } = await db().from('activities').select('praise').eq('strava_id', row.strava_id).maybeSingle();
  const { error } = await db().from('activities').upsert(row, { onConflict: 'strava_id' });
  if (error) throw error;

  // Notifikace jen u nové aktivity, ne při každé editaci názvu.
  if (ev.aspect_type !== 'create' || existing) return `uloženo bez notifikace: ${row.sport_type} ${fmtKm(row.distance_m / 1000)} km`;

  // Statistiky Stravy (nejdelší jízda všech dob) – jen u kola, chyba nevadí
  let stats = null;
  if (!['Run', 'TrailRun'].includes(row.sport_type)) {
    try { stats = await getAthleteStats(token, athlete.strava_id); } catch (e) { console.error('stats', e.status); }
  }
  const p = await evaluateActivity(row, { stats });
  const praise = p?.text;
  const km = row.distance_m / 1000;
  const { km: monthKm } = await monthSummary(athlete.id, row.month);
  const monthCzk = Math.round(monthKm * RATE_CZK_PER_KM);

  let sent;
  if (p) await db().from('activities').update({ praise: p.text, praise_strong: p.strong }).eq('strava_id', row.strava_id);
  if (p?.strong) {
    sent = await notifyAthlete(athlete.id, {
      title: 'Tohle byl švih! 🚴',
      body: `${praise} Pošlete za něj dar?`,
      url: `${APP_URL}/svih/${row.strava_id}`,
    });
  } else {
    sent = await notifyAthlete(athlete.id, {
      title: `+${fmtKm(km)} km pro NRV`,
      body: `${p ? p.text + ' ' : ''}Tento měsíc máte ${fmtKm(monthKm)} km, tedy ${monthCzk} Kč.`,
      url: `${APP_URL}/svih/${row.strava_id}`,
    });
  }
  return `uloženo, ${p ? `pochvala (${p.kind}${p.strong ? '' : ', slabší'}), ` : ''}notifikací odesláno: ${sent}`;
}
