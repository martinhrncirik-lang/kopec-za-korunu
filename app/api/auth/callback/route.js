import { NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { APP_URL } from '@/lib/config';
import { db } from '@/lib/db';
import { exchangeCode, backfill } from '@/lib/strava';
import { cleanStravaUrl } from '@/lib/avatar';
import { SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieValue } from '@/lib/session';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const scope = url.searchParams.get('scope') || '';
  const jar = await cookies();

  if (url.searchParams.get('error') || !code) return NextResponse.redirect(`${APP_URL}/?chyba=zamitnuto`);
  if (!state || state !== jar.get('kzk_oauth_state')?.value) return NextResponse.redirect(`${APP_URL}/?chyba=state`);
  if (!scope.includes('activity:read')) return NextResponse.redirect(`${APP_URL}/?chyba=opravneni`);

  const t = await exchangeCode(code);
  const { data: athlete, error } = await db()
    .from('athletes')
    .upsert(
      {
        strava_id: t.athlete.id,
        firstname: t.athlete.firstname,
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        expires_at: t.expires_at,
        strava_avatar_url: cleanStravaUrl(t.athlete.profile),
        strava_avatar_checked: true,
      },
      { onConflict: 'strava_id' },
    )
    .select()
    .single();
  if (error) throw error;

  // Historie posledních 12 týdnů se stáhne na pozadí, uživatel nečeká.
  after(() => backfill(athlete).catch((e) => console.error('backfill', e)));

  const res = NextResponse.redirect(`${APP_URL}/`);
  res.cookies.set(SESSION_COOKIE, sessionCookieValue(athlete.id), {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: SESSION_MAX_AGE, path: '/',
  });
  res.cookies.delete('kzk_oauth_state');
  return res;
}
