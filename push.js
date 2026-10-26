import webpush from 'web-push';
import { db } from './db.js';

let ready = false;
function init() {
  if (ready) return;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  ready = true;
}

// payload: { title, body, url }
export async function notifyAthlete(athleteId, payload) {
  init();
  const { data: subs, error } = await db()
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('athlete_id', athleteId);
  if (error) throw error;
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(s.subscription, JSON.stringify(payload));
      sent++;
    } catch (err) {
      // 404/410 = zařízení odběr zrušilo, uklidíme
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db().from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      } else {
        console.error('push failed', err.statusCode, err.body);
      }
    }
  }
  return sent;
}
