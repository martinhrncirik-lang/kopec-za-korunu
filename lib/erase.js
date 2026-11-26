import { db } from './db.js';

// Smaže všechno o sportovci: řádek v athletes (aktivity a odběry notifikací kaskádou)
// a vlastní profilové obrázky v úložišti (soubory `<id>-*.jpg` v bucketu avatars).
export async function eraseAthlete(athleteId) {
  try {
    const storage = db().storage.from('avatars');
    const { data: files } = await storage.list('', { search: `${athleteId}-`, limit: 100 });
    const paths = (files || []).map((f) => f.name).filter((n) => n.startsWith(`${athleteId}-`));
    if (paths.length) await storage.remove(paths);
  } catch (e) {
    console.error('erase avatar', e); // bucket nemusí existovat; data v DB smažeme i tak
  }
  const { error } = await db().from('athletes').delete().eq('id', athleteId);
  if (error) throw error;
}
