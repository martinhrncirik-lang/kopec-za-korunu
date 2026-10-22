import QRCode from 'qrcode';
import { DONATION_IBAN, DONATION_ACCOUNT_LABEL } from '@/lib/config';
import { buildSpayd } from '@/lib/spayd';

// QR Platba + tlačítko 2× dar. Server komponenta – QR se generuje na serveru jako SVG.
export default async function DonationCard({ amount, vs, message, basePath, isDouble }) {
  if (amount < 1) {
    return <p className="muted">Zatím tu není ani koruna. Kolo čeká.</p>;
  }
  const spayd = buildSpayd({ iban: DONATION_IBAN, amount, vs, message });
  const svg = await QRCode.toString(spayd, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });

  return (
    <section className="card donation">
      <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <dl>
        <dt>Částka</dt><dd className="big">{amount.toLocaleString('cs-CZ')} Kč{isDouble ? ' (2×)' : ''}</dd>
        <dt>Účet</dt><dd>{DONATION_ACCOUNT_LABEL}</dd>
        <dt>Variabilní symbol</dt><dd>{vs}</dd>
        <dt>Zpráva</dt><dd>{message}</dd>
      </dl>
      <p className="muted small">Naskenujte v bankovní aplikaci, platba se předvyplní.</p>
      {isDouble ? (
        <a className="btn ghost" href={basePath}>Zpět na základní dar</a>
      ) : (
        <a className="btn" href={`${basePath}?x=2`}>Daruju dvojnásobek</a>
      )}
    </section>
  );
}
