import { NextResponse } from 'next/server';
import { APP_URL } from '@/lib/config';
import { SESSION_COOKIE } from '@/lib/session';

export async function POST() {
  const res = NextResponse.redirect(`${APP_URL}/`, 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
