'use client';

// Sdílení přes systémové menu telefonu (WhatsApp, Instagram, Messenger…).
// Sdílí jen text a odkaz na aplikaci, ne data ze Stravy o jiných lidech.
export default function ShareButton({ text, label = 'Sdílet' }) {
  async function share() {
    const url = window.location.origin;
    if (navigator.share) {
      try { await navigator.share({ text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert('Zkopírováno do schránky.');
    }
  }
  return <button className="btn ghost" onClick={share}>{label}</button>;
}
