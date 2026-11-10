import { NextResponse } from 'next/server';
import { APP_URL, STRAVA_OAUTH } from '@/lib/config';
import { db, getAthlete } from '@/lib/db';
import { currentAthleteId, SESSION_COOKIE } from '@/lib/session';
import { validToken } from '@/lib/strava';

// „Odpojit" – zrušit přístup ke Stravě a smazat všechna data sportovce.
export async function POST() {
  const id = await currentAthleteId();
  const athlete = id ? await getAthlete(id) : null;
  if (athlete) {
    try {
      const token = await validToken(athlete);
      await fetch(`${STRAVA_OAUTH}/deauthorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ access_token: token }),
      });
    } catch { /* i když Strava neodpoví, data smažeme */ }
    await db().from('athletes').delete().eq('id', athlete.id); // aktivity a odběry notifikací kaskádou
  }
  const res = NextResponse.redirect(`${APP_URL}/?odpojeno=1`, 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
