import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getAthlete } from '@/lib/db';
import { fetchMonths, summarize } from '@/lib/history';
import { pickRecipientId } from '@/lib/recipients';
import { monthVerdictFor } from '@/lib/monthly';
import { currentMonth } from '@/lib/months';
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
  if (!athlete) redirect('/');
  // Živě ze Stravy jen daný měsíc (nic se neukládá). Hodnoticí věta potřebuje 12 měsíců zpět,
  // proto se dopočítá zvlášť a dorazí do stránky dodatečně (Suspense), částka a QR nečekají.
  const past = mesic < currentMonth();
  const { km, count } = summarize(await fetchMonths(athlete, mesic), mesic);
  const isDouble = sp?.x === '2';
  const base = Math.round(km * RATE_CZK_PER_KM);
  const amount = base * (isDouble ? 2 : 1);

  return (
    <>
      <h1>Výpis: {monthLabel(mesic)}</h1>
      <section className="card stat">
        <p className="big">{fmtKm(km)} km</p>
        <p>{count} aktivit · {RATE_CZK_PER_KM} Kč/km · {base.toLocaleString('cs-CZ')} Kč</p>
        {count > 0 && past && <Suspense fallback={null}><Verdict athlete={athlete} month={mesic} /></Suspense>}
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

async function Verdict({ athlete, month }) {
  let verdict = null;
  try { verdict = await monthVerdictFor(athlete, month); } catch (e) { console.error('verdict', e); }
  return verdict ? <p className="statement-verdict">{verdict}</p> : null;
}
