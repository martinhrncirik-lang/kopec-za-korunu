import { APP_URL, RATE_CZK_PER_KM } from '@/lib/config';
import { db, monthSummary } from '@/lib/db';
import { notifyAthlete } from '@/lib/push';
import { currentMonth, previousMonth, monthLabel } from '@/lib/months';
import { fmtKm } from '@/lib/stats';

// Spouští Vercel Cron 1. den v měsíci (viz vercel.json).
// Vercel posílá hlavičku Authorization: Bearer <CRON_SECRET>.
export async function GET(req) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const month = previousMonth(currentMonth());
  const { data: athletes, error } = await db().from('athletes').select('id');
  if (error) throw error;

  let notified = 0;
  for (const a of athletes) {
    const { km, count } = await monthSummary(a.id, month);
    if (count === 0) continue;
    const czk = Math.round(km * RATE_CZK_PER_KM);
    notified += await notifyAthlete(a.id, {
      title: `${monthLabel(month)}: ${fmtKm(km)} km = ${czk} Kč`,
      body: 'Výpis a QR kód pro dar jsou připravené. Nebo rovnou dvojnásobek?',
      url: `${APP_URL}/vypis/${month}`,
    });
  }
  return Response.json({ month, athletes: athletes.length, notified });
}
