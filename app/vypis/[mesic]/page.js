import { notFound, redirect } from 'next/navigation';
import { monthSummary } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { isMonth, monthLabel } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { variableSymbol } from '@/lib/spayd';
import { fmtKm } from '@/lib/stats';
import DonationCard from '@/app/components/DonationCard';
import ShareButton from '@/app/components/ShareButton';

export const dynamic = 'force-dynamic';

export default async function Statement({ params, searchParams }) {
  const { mesic } = await params;
  const sp = await searchParams;
  if (!isMonth(mesic)) notFound();
  const athleteId = await currentAthleteId();
  if (!athleteId) redirect('/');

  const { km, count } = await monthSummary(athleteId, mesic);
  const isDouble = sp?.x === '2';
  const base = Math.round(km * RATE_CZK_PER_KM);
  const amount = base * (isDouble ? 2 : 1);

  return (
    <>
      <h1>Výpis: {monthLabel(mesic)}</h1>
      <section className="card stat">
        <p className="big">{fmtKm(km)} km</p>
        <p>{count} aktivit · {RATE_CZK_PER_KM} Kč/km · {base.toLocaleString('cs-CZ')} Kč</p>
      </section>
      <DonationCard
        amount={amount}
        vs={variableSymbol(mesic, athleteId)}
        message={`Kopec za korunu ${mesic}`}
        basePath={`/vypis/${mesic}`}
        isDouble={isDouble}
        recipientId={sp?.pro}
      />
      {count > 0 && (
        <ShareButton text={`${monthLabel(mesic)}: ${fmtKm(km)} km = ${amount} Kč pro Nadaci rodiny Vlčkových. Kopec za korunu.`} />
      )}
    </>
  );
}
