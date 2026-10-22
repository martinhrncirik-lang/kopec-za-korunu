const NAMES = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];

export function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  const n = NAMES[m - 1];
  return `${n.charAt(0).toUpperCase()}${n.slice(1)} ${y}`;
}

export function isMonth(s) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

// Aktuální měsíc v pražském čase, formát YYYY-MM
export function currentMonth(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit' })
    .format(date)
    .slice(0, 7);
}

export function previousMonth(month) {
  let [y, m] = month.split('-').map(Number);
  m -= 1;
  if (m === 0) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}
