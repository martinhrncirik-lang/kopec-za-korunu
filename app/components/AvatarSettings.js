'use client';
import { useRef, useState } from 'react';

// Zmenší obrázek v prohlížeči na čtverec 400×400 (JPEG), ať se nenahrávají 5MB fotky z mobilu.
async function toSquareJpeg(file, size = 400) {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.getContext('2d').drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
  return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
}

export default function AvatarSettings({ initialSource, stravaUrl, customUrl }) {
  const [source, setSource] = useState(initialSource || 'strava');
  const [custom, setCustom] = useState(customUrl);
  const [status, setStatus] = useState('');
  const fileRef = useRef(null);

  async function choose(next) {
    if (next === 'custom' && !custom) { fileRef.current?.click(); return; }
    setSource(next);
    setStatus('Ukládám…');
    const res = await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: next }),
    });
    setStatus(res.ok ? 'Uloženo' : 'Uložení se nepovedlo');
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Nahrávám…');
    try {
      const blob = await toSquareJpeg(file);
      const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      setCustom(url);
      setSource('custom');
      setStatus('Uloženo');
    } catch (err) {
      console.error(err);
      setStatus('Nahrání se nepovedlo');
    }
    e.target.value = '';
  }

  const shown = source === 'custom' ? custom : source === 'strava' ? stravaUrl : null;

  return (
    <div className="avatar-settings">
      <div className="avatar-preview">
        {shown ? <img src={shown} alt="" /> : <span>bez obrázku</span>}
      </div>
      <div className="avatar-options">
        <label className="radio">
          <input type="radio" name="avatar" checked={source === 'strava'} onChange={() => choose('strava')} disabled={!stravaUrl} />
          Profilový obrázek ze Stravy{!stravaUrl && <span className="muted small"> (na Stravě žádný nemáte)</span>}
        </label>
        <label className="radio">
          <input type="radio" name="avatar" checked={source === 'custom'} onChange={() => choose('custom')} />
          Vlastní obrázek
        </label>
        <label className="radio">
          <input type="radio" name="avatar" checked={source === 'none'} onChange={() => choose('none')} />
          Žádný
        </label>
        <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
          {custom ? 'Nahrát jiný obrázek' : 'Nahrát obrázek'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
        {status && <p className="muted small">{status}</p>}
      </div>
    </div>
  );
}
