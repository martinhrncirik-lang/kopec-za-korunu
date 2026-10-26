import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { variableSymbol } from '@/lib/spayd';
import { fmtKm } from '@/lib/stats';
import DonationCard from '@/app/components/DonationCard';
import ShareButton from '@/app/components/ShareButton';

export const dynamic = 'force-dynamic';

// Stránka pro mimořádný švih: pochvala se statistikou + QR na dar za tuto jízdu.
export default async function Svih({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const athleteId = await currentAthleteId();
  if (!athleteId) redirect('/');

  const { data: a } = await db()
    .from('activities')
    .select('*')
    .eq('strava_id', id)
    .eq('athlete_id', athleteId) // cizí aktivity neukazujeme
    .maybeSingle();
  if (!a) notFound();

  const km = a.distance_m / 1000;
  const isDouble = sp?.x === '2';
  const amount = Math.round(km * RATE_CZK_PER_KM) * (isDouble ? 2 : 1);

  return (
    <>
      <h1>{a.praise ? 'Tohle byl švih!' : 'Aktivita'}</h1>
      <section className="card stat">
        {a.praise && <p className="praise">{a.praise}</p>}
        <p className="muted">{fmtKm(km)} km · {Math.round(a.elevation_m)} m převýšení</p>
      </section>
      <p className="muted small">Dar za tuto jízdu je navíc k měsíčnímu výpisu. Měsíční výpis ho neodečítá.</p>
      <DonationCard
        amount={amount}
        vs={variableSymbol(a.month, athleteId)}
        message={`Kopec za korunu svih ${a.start_local.slice(0, 10)}`}
        basePath={`/svih/${id}`}
        isDouble={isDouble}
      />
      {a.praise && <ShareButton text={`${a.praise} A každý kilometr = koruna pro Nadaci rodiny Vlčkových.`} />}
    </>
  );
}
