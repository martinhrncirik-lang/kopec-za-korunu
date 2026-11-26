import { db } from '@/lib/db';

// Denní úklid (vercel.json). Podmínky Stravy (API Policy 6.2) povolují držet data ze Stravy nejvýš 7 dní.
// Mažeme mezipaměť jízd a technický deník starší 6 dní, takže nic nezůstane déle než 7 dní.
const KEEP_DAYS = 6;

export async function GET(req) {
  const expected = (process.env.CRON_SECRET || '').trim();
  if (!expected || (req.headers.get('authorization') || '').trim() !== `Bearer ${expected}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const cutoff = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString();
  const acts = await db().from('activities').delete({ count: 'exact' }).lt('created_at', cutoff);
  const evs = await db().from('webhook_events').delete({ count: 'exact' }).lt('received_at', cutoff);
  if (acts.error || evs.error) {
    return Response.json({ error: acts.error?.message || evs.error?.message }, { status: 500 });
  }
  return Response.json({ activities: acts.count, webhook_events: evs.count, cutoff });
}
