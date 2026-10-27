import { db } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { uploadCustomAvatar } from '@/lib/avatar';
import { RECIPIENTS } from '@/lib/recipients';

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

  const body = await req.json();
  const update = {};
  if (body.source !== undefined) {
    if (!['strava', 'custom', 'none'].includes(body.source)) return new Response('Bad request', { status: 400 });
    update.avatar_source = body.source;
  }
  if (body.default_recipient !== undefined) {
    if (!RECIPIENTS.some((r) => r.id === body.default_recipient)) return new Response('Bad request', { status: 400 });
    update.default_recipient = body.default_recipient;
  }
  if (!Object.keys(update).length) return new Response('Bad request', { status: 400 });
  const { error } = await db().from('athletes').update(update).eq('id', athleteId);
  if (error) return new Response('DB error', { status: 500 });
  return Response.json({ ok: true });
}
