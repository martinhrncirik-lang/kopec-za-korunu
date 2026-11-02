import { APP_URL, RATE_CZK_PER_KM } from '@/lib/config';
import { db, monthSummary } from '@/lib/db';
import { notifyAthlete } from '@/lib/push';
import { currentMonth, previousMonth, monthLabel } from '@/lib/months';
import { fmtKm } from '@/lib/stats';
import { monthVerdictFor } from '@/lib/monthly';

// Spouští Vercel Cron 1.–5. den v měsíci v 7:00 UTC (viz vercel.json); každý dostane výpis jen jednou.
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

  // Kdo už výpis za tento měsíc dostal (cron běží 1.–5. den, pošle jen jednou)
  const { data: prevRuns } = await db().from('webhook_events').select('payload, result')
    .eq('payload->>type', 'cron').eq('payload->>month', month);
  const alreadySent = new Set();
  for (const r of prevRuns || []) {
    for (const id of r.payload?.sent || []) alreadySent.add(Number(id));
    for (const m of String(r.result).matchAll(/#(\d+): [^;]*notifikací ([1-9]\d*)/g)) alreadySent.add(Number(m[1]));
  }

  const details = [];
  const sentIds = [];
  let notified = 0;
  for (const a of athletes) {
    if (alreadySent.has(Number(a.id))) { details.push(`#${a.id}: už odesláno dříve`); continue; }
    try {
      const { km, count } = await monthSummary(a.id, month);
      if (count === 0) { details.push(`#${a.id}: 0 aktivit`); continue; }
      const czk = Math.round(km * RATE_CZK_PER_KM);
      let verdict = null;
      try { verdict = await monthVerdictFor(a.id, month); } catch (e) { console.error('verdict', e); }
      const sent = await notifyAthlete(a.id, {
        title: `${monthLabel(month)}: ${fmtKm(km)} km = ${czk} Kč`,
        body: `${verdict ? verdict + ' ' : ''}Výpis a QR kód pro dar jsou připravené.`,
        url: `${APP_URL}/vypis/${month}`,
      });
      notified += sent;
      if (sent > 0) sentIds.push(a.id);
      details.push(`#${a.id}: ${fmtKm(km)} km, notifikací ${sent}${sent === 0 ? ' (žádné zařízení s povolenými notifikacemi)' : ''}`);
    } catch (e) {
      details.push(`#${a.id}: chyba ${e.message}`);
    }
  }
  await log({ month, athletes: athletes.length, sent: sentIds }, `výpis ${month}: ${details.join('; ')}`);
  return Response.json({ month, athletes: athletes.length, notified, details });
}
