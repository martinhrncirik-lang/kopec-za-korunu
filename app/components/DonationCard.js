import QRCode from 'qrcode';
import { buildSpayd } from '@/lib/spayd';
import { RECIPIENTS, getRecipient } from '@/lib/recipients';

// Výběr příjemce + QR Platba + tlačítko 2× dar.
// Volba se nese v adrese (?pro=cvt&x=2), takže funguje bez JavaScriptu a jde sdílet.
export default async function DonationCard({ amount, vs, message, basePath, isDouble, recipientId, defaultId = 'nrv' }) {
  const r = getRecipient(recipientId);
  const href = (pro, dbl) => {
    const p = new URLSearchParams();
    if (pro !== defaultId) p.set('pro', pro);
    if (dbl) p.set('x', '2');
    const q = p.toString();
    return q ? `${basePath}?${q}` : basePath;
  };

  return (
    <>
      <nav className="recipients" aria-label="Komu darovat">
        {RECIPIENTS.map((x) => (
          <a key={x.id} href={href(x.id, isDouble)} className={x.id === r.id ? 'active' : ''} aria-current={x.id === r.id ? 'true' : undefined}>
            {x.short}{x.id === defaultId && <span className="star" title="Primární příjemce"> ★</span>}
          </a>
        ))}
      </nav>

      {amount < 1 ? (
        <p className="muted">Zatím tu není ani koruna. Kolo čeká.</p>
      ) : (
        <DonationQr r={r} amount={amount} vs={r.useVs ? vs : null} message={message} isDouble={isDouble}
          toggleHref={href(r.id, !isDouble)} />
      )}
    </>
  );
}

async function DonationQr({ r, amount, vs, message, isDouble, toggleHref }) {
  const spayd = buildSpayd({ iban: r.iban, amount, vs, message });
  const svg = await QRCode.toString(spayd, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  return (
    <section className="card donation">
      <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <dl>
        <dt>Příjemce</dt><dd>{r.name}</dd>
        <dt>Částka</dt><dd className="big">{amount.toLocaleString('cs-CZ')} Kč{isDouble ? ' (2×)' : ''}</dd>
        <dt>Účet</dt><dd>{r.account}</dd>
        {vs && (<><dt>Variabilní symbol</dt><dd>{vs}</dd></>)}
        <dt>Zpráva</dt><dd>{message}</dd>
      </dl>
      <p className="muted small">Naskenujte v bankovní aplikaci, platba se předvyplní.</p>
      {isDouble
        ? <a className="btn ghost" href={toggleHref}>Zpět na základní dar</a>
        : <a className="btn" href={toggleHref}>Daruju dvojnásobek</a>}
    </section>
  );
}
