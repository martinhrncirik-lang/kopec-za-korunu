import { NextResponse } from 'next/server';
import { APP_URL } from '@/lib/config';
import { db } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';

// „Platí" – sportovec přijal filozofii Kopce, uvítání se už neukáže.
export async function POST() {
  const id = await currentAthleteId();
  if (id) await db().from('athletes').update({ welcomed_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.redirect(`${APP_URL}/`, 303);
}
