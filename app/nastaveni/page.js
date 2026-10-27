import { redirect } from 'next/navigation';
import { getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { ensureStravaAvatar } from '@/lib/avatar';
import AvatarSettings from '@/app/components/AvatarSettings';
import PushButton from '@/app/components/PushButton';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const id = await currentAthleteId();
  if (!id) redirect('/');
  let athlete = await getAthlete(id);
  if (!athlete) redirect('/');
  athlete = await ensureStravaAvatar(athlete);

  return (
    <>
      <h1>Nastavení</h1>
      <section className="card">
        <h2>Profilový obrázek</h2>
        <AvatarSettings
          initialSource={athlete.avatar_source}
          stravaUrl={athlete.strava_avatar_url}
          customUrl={athlete.avatar_url}
        />
      </section>
      <section className="card">
        <h2>Notifikace</h2>
        <PushButton />
      </section>
      <p><a className="link" href="/">← Zpět</a></p>
      <form action="/api/auth/logout" method="post"><button className="link">Odhlásit</button></form>
    </>
  );
}
