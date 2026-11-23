// Service worker: přijímá push notifikace a po kliknutí otevře správnou stránku.
// Nová verze se aktivuje hned (bez čekání na zavření všech oken).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Kopec za korunu', body: event.data?.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kopec za korunu', {
      body: data.body || '',
      icon: '/icon-192.png',
      data: { url: data.url || '/' },
    }),
  );
});

// Klik na notifikaci: když už je aplikace otevřená (třeba na pozadí), iOS by ji jen přenesl
// do popředí na staré stránce – proto otevřené okno převedeme na adresu z notifikace.
// Jinak otevřeme nové.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      try {
        if ('focus' in w) await w.focus();
        if ('navigate' in w) { await w.navigate(url); return; }
      } catch {}
    }
    await clients.openWindow(url);
  })());
});
