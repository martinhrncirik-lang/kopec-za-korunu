import { notFound, redirect } from 'next/navigation';
import { monthSummary, getAthlete } from '@/lib/db';
import { pickRecipientId } from '@/lib/recipients';
import { currentAthleteId } from '@/lib/session';
import { isMonth, monthLabel } from '@/lib/months';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { variableSymbol, donationMessage } from '@/lib/spayd';
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

  const athlete = await getAthlete(athleteId);
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
        message={donationMessage(mesic, athlete?.payer_name)}
        basePath={`/vypis/${mesic}`}
        isDouble={isDouble}
        recipientId={pickRecipientId(sp?.pro, athlete)}
        defaultId={pickRecipientId(null, athlete)}
      />
      {count > 0 && (
        <ShareButton text={`${monthLabel(mesic)}: ${fmtKm(km)} km = ${amount} Kč na dobrou věc. Kopec za korunu.`} />
      )}
    </>
  );
}
