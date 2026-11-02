import { APP_URL, RATE_CZK_PER_KM } from '@/lib/config';
import { db, monthSummary } from '@/lib/db';
import { notifyAthlete } from '@/lib/push';
import { currentMonth, previousMonth, monthLabel } from '@/lib/months';
import { fmtKm } from '@/lib/stats';

// Spouští Vercel Cron 1. den v měsíci (viz vercel.json).
// Vercel posílá hlavičku Authorization: Bearer <CRON_SECRET>.
// Každé spuštění se zapíše do tabulky webhook_events (payload.type = 'cron'), ať je vidět, co se stalo.
async function log(payload, result) {
  try {
    await db().from('webhook_events').insert({ payload: { type: 'cron', ...payload }, result: String(result).slice(0, 500) });
  } catch (e) {
    console.error('cron log', e);
  }
}

export async function GET(req) {
  const expected = (process.env.CRON_SECRET || '').trim();
  const got = (req.headers.get('authorization') || '').trim();
  if (!expected || got !== `Bearer ${expected}`) {
    await log({ auth: got ? 'wrong' : 'missing' }, 'odmítnuto: chybný nebo chybějící CRON_SECRET');
    return new Response('Unauthorized', { status: 401 });
  }

  const month = previousMonth(currentMonth());
  const { data: athletes, error } = await db().from('athletes').select('id');
  if (error) {
    await log({ month }, `chyba databáze: ${error.message}`);
    throw error;
  }

  const details = [];
  let notified = 0;
  for (const a of athletes) {
    try {
      const { km, count } = await monthSummary(a.id, month);
      if (count === 0) { details.push(`#${a.id}: 0 aktivit`); continue; }
      const czk = Math.round(km * RATE_CZK_PER_KM);
      const sent = await notifyAthlete(a.id, {
        title: `${monthLabel(month)}: ${fmtKm(km)} km = ${czk} Kč`,
        body: 'Výpis a QR kód pro dar jsou připravené. Nebo rovnou dvojnásobek?',
        url: `${APP_URL}/vypis/${month}`,
      });
      notified += sent;
      details.push(`#${a.id}: ${fmtKm(km)} km, notifikací ${sent}${sent === 0 ? ' (žádné zařízení s povolenými notifikacemi)' : ''}`);
    } catch (e) {
      details.push(`#${a.id}: chyba ${e.message}`);
    }
  }
  await log({ month, athletes: athletes.length }, `výpis ${month}: ${details.join('; ')}`);
  return Response.json({ month, athletes: athletes.length, notified, details });
}
