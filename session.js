import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'kzk_session';

function sign(value) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('base64url');
}

export function sessionCookieValue(athleteId) {
  const v = String(athleteId);
  return `${v}.${sign(v)}`;
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 dní

// Vrací interní ID sportovce, nebo null.
export async function currentAthleteId() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [v, sig] = raw.split('.');
  if (!v || !sig) return null;
  const expected = sign(v);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return Number(v);
}
