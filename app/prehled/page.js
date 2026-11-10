import { notFound } from 'next/navigation';
import { getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { isAdmin, overviewData } from '@/lib/admin';
import OverviewView from '@/app/components/OverviewView';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Přehled – Kopec za korunu', robots: { index: false } };

// Přehled pro autora. Komukoli jinému stránka „neexistuje“.
export default async function Overview() {
  const id = await currentAthleteId();
  const athlete = id ? await getAthlete(id) : null;
  if (!isAdmin(athlete)) notFound();
  return <OverviewView data={await overviewData()} />;
}
