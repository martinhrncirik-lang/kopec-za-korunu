import { redirect } from 'next/navigation';
import { getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { ensureStravaAvatar } from '@/lib/avatar';
import SettingsView from '@/app/components/SettingsView';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const id = await currentAthleteId();
  if (!id) redirect('/');
  let athlete = await getAthlete(id);
  if (!athlete) redirect('/');
  athlete = await ensureStravaAvatar(athlete);

  return (
    <>
      <SettingsView athlete={athlete} />
      <form action="/api/auth/logout" method="post"><button className="link">Odhlásit</button></form>
    </>
  );
}
