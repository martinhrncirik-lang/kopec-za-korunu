import { notFound } from 'next/navigation';
import { getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { refillMissing } from '@/lib/refill';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = { title: 'Doplnit jízdy – Kopec za korunu', robots: { index: false } };

// Jen autor: doplní všem sportovcům chybějící aktivity od 1. 11. 2026 (hlavně trenažér). Bez notifikací.
export default async function Refill({ searchParams }) {
  const uid = await currentAthleteId();
  const me = uid ? await getAthlete(uid) : null;
  if (!isAdmin(me)) notFound();
  const sp = await searchParams;
  const run = sp?.run === '1';
  const out = run ? await refillMissing('2026-11-01') : null;
  return (
    <>
      <h1>Doplnit jízdy od 1. 11.</h1>
      <p className="muted small">Všem sportovcům stáhne aktivity ze Stravy od 1. 11. a doplní ty, které v aplikaci chybějí (hlavně trenažér). Bez notifikací; opakované spuštění nic nezdvojí.</p>
      {out ? (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '.78rem', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
          {JSON.stringify(out, null, 2)}
        </pre>
      ) : (
        <p><a className="btn" href="/prehled/doplnit?run=1">Doplnit</a></p>
      )}
      <p><a className="link" href="/prehled">← Přehled</a></p>
    </>
  );
}
