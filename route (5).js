import { db } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';

export async function POST(req) {
  const athleteId = await currentAthleteId();
  if (!athleteId) return new Response('Unauthorized', { status: 401 });
  const sub = await req.json();
  if (!sub?.endpoint || !sub?.keys) return new Response('Bad request', { status: 400 });
  const { error } = await db()
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, athlete_id: athleteId, subscription: sub }, { onConflict: 'endpoint' });
  if (error) return new Response('DB error', { status: 500 });
  return Response.json({ ok: true });
}
