'use client';
import { useState } from 'react';

const OPTIONS = [
  ['svih', 'Jen při švihu a měsíční výpis', 'Rekordy, stovky, série a milníky. Obyčejná jízda se tiše zapíše.'],
  ['all', 'Po každé jízdě', 'Krátká zpráva s kilometry po každé aktivitě.'],
  ['monthly', 'Jen měsíční výpis', 'Jednou měsíčně, nic víc.'],
];

export default function NotifyModeSetting({ initial }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState('');

  async function choose(id) {
    const prev = value;
    setValue(id);
    setStatus('Ukládám…');
    const res = await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notify_mode: id }),
    });
    if (res.ok) setStatus('Uloženo');
    else { setValue(prev); setStatus('Uložení se nepovedlo'); }
  }

  return (
    <div className="avatar-options notify-mode">
      <p className="muted small">Kdy posílat notifikace:</p>
      {OPTIONS.map(([id, label, hint]) => (
        <label key={id} className="radio">
          <input type="radio" name="notify_mode" checked={value === id} onChange={() => choose(id)} />
          <span>{label}<br /><span className="muted small">{hint}</span></span>
        </label>
      ))}
      {status && <p className="muted small">{status}</p>}
    </div>
  );
}
