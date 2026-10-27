import { db } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { uploadCustomAvatar } from '@/lib/avatar';

// POST JSON {source: 'strava'|'custom'|'none'} = změna volby
// POST image/* (tělo = obrázek) = nahrání vlastního obrázku
export async function POST(req) {
  const athleteId = await currentAthleteId();
  if (!athleteId) return new Response('Unauthorized', { status: 401 });
  const type = req.headers.get('content-type') || '';

  if (type.startsWith('image/')) {
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.length > 1024 * 1024) return new Response('Obrázek je moc velký', { status: 413 });
    const url = await uploadCustomAvatar(athleteId, bytes, type);
    return Response.json({ ok: true, url });
  }

  const { source } = await req.json();
  if (!['strava', 'custom', 'none'].includes(source)) return new Response('Bad request', { status: 400 });
  const { error } = await db().from('athletes').update({ avatar_source: source }).eq('id', athleteId);
  if (error) return new Response('DB error', { status: 500 });
  return Response.json({ ok: true });
}
