'use client';
import { useState } from 'react';

export default function PayerNameSetting({ initial }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState('');

  async function save(e) {
    e.preventDefault();
    setStatus('Ukládám…');
    const res = await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payer_name: value }),
    });
    setStatus(res.ok ? 'Uloženo' : 'Uložení se nepovedlo');
  }

  return (
    <form className="payer-name" onSubmit={save}>
      <input type="text" value={value} maxLength={40} placeholder="Jméno a příjmení" onChange={(e) => { setValue(e.target.value); setStatus(''); }} />
      <button className="btn ghost" type="submit">Uložit</button>
      {status && <p className="muted small">{status}</p>}
    </form>
  );
}
