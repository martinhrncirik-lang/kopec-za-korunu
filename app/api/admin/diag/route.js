import { getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { diagnoseRide } from '@/lib/diag';

export const dynamic = 'force-dynamic';

// JSON verze diagnostiky (jen autor). V aplikaci je stejná věc na /prehled/diag.
export async function GET(req) {
  const uid = await currentAthleteId();
  const me = uid ? await getAthlete(uid) : null;
  if (!isAdmin(me)) return new Response('Not found', { status: 404 });
  const out = await diagnoseRide(me, new URL(req.url).searchParams.get('id'));
  return new Response(JSON.stringify(out, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
