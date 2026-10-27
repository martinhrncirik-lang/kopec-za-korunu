'use client';
import { useState } from 'react';

export default function RecipientSettings({ choices, initial }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState('');

  async function choose(id) {
    const prev = value;
    setValue(id);
    setStatus('Ukládám…');
    const res = await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ default_recipient: id }),
    });
    if (res.ok) setStatus('Uloženo');
    else { setValue(prev); setStatus('Uložení se nepovedlo'); }
  }

  return (
    <div className="avatar-options">
      {choices.map((c) => (
        <label key={c.id} className="radio">
          <input type="radio" name="recipient" checked={value === c.id} onChange={() => choose(c.id)} />
          {c.name}
        </label>
      ))}
      {status && <p className="muted small">{status}</p>}
    </div>
  );
}
