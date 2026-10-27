import { db } from './db.js';
import { validToken } from './strava.js';
import { STRAVA_API } from './config.js';

// Strava vrací bez fotky relativní cestu "avatar/athlete/large.png" → bereme jen skutečné URL.
export function cleanStravaUrl(url) {
  return typeof url === 'string' && /^https:\/\//.test(url) ? url : null;
}

// Který obrázek ukázat podle nastavení sportovce.
export function avatarUrl(athlete) {
  if (!athlete) return null;
  if (athlete.avatar_source === 'custom') return athlete.avatar_url || null;
  if (athlete.avatar_source === 'none') return null;
  return athlete.strava_avatar_url || null; // výchozí: ze Stravy
}

// Doplní profilovku ze Stravy u sportovců, kteří se přihlásili před verzí 0.3.
export async function ensureStravaAvatar(athlete) {
  if (athlete.strava_avatar_checked) return athlete;
  try {
    const token = await validToken(athlete);
    const res = await fetch(`${STRAVA_API}/athlete`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return athlete;
    const a = await res.json();
    const url = cleanStravaUrl(a.profile);
    await db().from('athletes').update({ strava_avatar_url: url, strava_avatar_checked: true }).eq('id', athlete.id);
    return { ...athlete, strava_avatar_url: url, strava_avatar_checked: true };
  } catch (e) {
    console.error('ensureStravaAvatar', e);
    return athlete;
  }
}

const BUCKET = 'avatars';

export async function uploadCustomAvatar(athleteId, bytes, contentType) {
  const storage = db().storage;
  // Bucket se při prvním nahrání založí sám (veřejný, jen obrázky do 1 MB).
  const { error: bErr } = await storage.createBucket(BUCKET, {
    public: true, fileSizeLimit: 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (bErr && !/already exists/i.test(bErr.message)) throw bErr;

  const path = `${athleteId}-${Date.now()}.jpg`;
  const { error } = await storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true });
  if (error) throw error;
  const { data } = storage.from(BUCKET).getPublicUrl(path);

  // Starý vlastní obrázek uklidit
  const { data: old } = await db().from('athletes').select('avatar_url').eq('id', athleteId).single();
  if (old?.avatar_url) {
    const oldPath = old.avatar_url.split(`/${BUCKET}/`)[1];
    if (oldPath) await storage.from(BUCKET).remove([oldPath]);
  }
  await db().from('athletes').update({ avatar_url: data.publicUrl, avatar_source: 'custom' }).eq('id', athleteId);
  return data.publicUrl;
}
