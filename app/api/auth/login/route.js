import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { authorizeUrl } from '@/lib/strava';

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set('kzk_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
  return res;
}
