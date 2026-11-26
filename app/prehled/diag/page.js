import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { diagnoseRide } from '@/lib/diag';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Diagnostika – Kopec za korunu', robots: { index: false } };

// Diagnostika poslední (nebo ?id=) jízdy – jen pro autora, uvnitř aplikace (sdílí přihlášení).
export default async function Diag({ searchParams }) {
  const uid = await currentAthleteId();
  const me = uid ? await getAthlete(uid) : null;
  if (!isAdmin(me)) notFound();
  const sp = await searchParams;
  const out = await diagnoseRide(me, sp?.id, sp?.apply === '1');
  return (
    <>
      <h1>Diagnostika jízdy</h1>
      <p className="muted small">Udělej screenshot (nebo víc, když je to dlouhé) a pošli ho Claudovi.</p>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '.78rem', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
        {JSON.stringify(out, null, 2)}
      </pre>
      {!out.prepocitano && out.jizda && (
        <p><a className="btn" href={`/prehled/diag?id=${out.jizda}&apply=1`}>Přepočítat tuhle jízdu a poslat notifikaci</a></p>
      )}
      <p><Link className="link" href="/prehled">← Přehled</Link></p>
    </>
  );
}
