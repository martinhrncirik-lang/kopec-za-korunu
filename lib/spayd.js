// QR Platba (Short Payment Descriptor, SPAYD) – český standard ČBA.
// Bankovní aplikace načte řetězec a předvyplní platbu.

function clean(text, max) {
  // Hvězdička je v SPAYD oddělovač, nesmí být v hodnotách.
  // Diakritiku odstraňujeme: ne všechny banky ji ve zprávě pro příjemce zobrazí správně.
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\*/g, '').trim().slice(0, max);
}

export function variableSymbol(month, athleteId) {
  // RRMM + ID sportovce na 6 míst, celkem 10 číslic.
  // month = 'YYYY-MM', např. '2026-10', athleteId = 1 → '2610000001'
  const [yyyy, mm] = month.split('-');
  return `${yyyy.slice(2)}${mm}${String(athleteId).padStart(6, '0')}`;
}

export function buildSpayd({ iban, amount, vs, message, recipientName }) {
  if (!iban) throw new Error('Chybí DONATION_IBAN');
  const parts = [
    'SPD',
    '1.0',
    `ACC:${iban.replace(/\s/g, '')}`,
    `AM:${Number(amount).toFixed(2)}`,
    'CC:CZK',
  ];
  if (recipientName) parts.push(`RN:${clean(recipientName, 35)}`);
  if (vs) parts.push(`X-VS:${vs}`);
  if (message) parts.push(`MSG:${clean(message, 60)}`);
  return parts.join('*');
}

// Zpráva pro příjemce: odkud dar je a od koho (bez VS je to jediná identifikace dárce).
export function donationMessage(what, payerName) {
  return payerName ? `Kopec za korunu ${what}, ${payerName}` : `Kopec za korunu ${what}`;
}
