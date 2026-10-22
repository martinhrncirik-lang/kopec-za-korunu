'use client';
import { useEffect, useState } from 'react';

function keyToBytes(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushButton() {
  const [state, setState] = useState('loading'); // loading | unsupported | ios-install | off | on | denied | error

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState(ios && !standalone ? 'ios-install' : 'unsupported');
      return;
    }
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      if (Notification.permission === 'denied') return setState('denied');
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? 'on' : 'off');
    });
  }, []);

  async function enable() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setState('denied');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      setState(res.ok ? 'on' : 'error');
    } catch (e) {
      console.error(e);
      setState('error');
    }
  }

  const msg = {
    loading: null,
    unsupported: 'Tento prohlížeč notifikace neumí.',
    'ios-install': 'Na iPhonu: Sdílet → Přidat na plochu, pak aplikaci otevřete z plochy a notifikace půjdou zapnout.',
    denied: 'Notifikace jsou zablokované v nastavení prohlížeče.',
    on: 'Notifikace jsou zapnuté na tomto zařízení.',
    error: 'Zapnutí se nepovedlo, zkuste to znovu.',
  }[state];

  return (
    <div className="push">
      {(state === 'off' || state === 'error') && (
        <button className="btn" onClick={enable}>Zapnout notifikace</button>
      )}
      {msg && <p className="muted small">{msg}</p>}
    </div>
  );
}
