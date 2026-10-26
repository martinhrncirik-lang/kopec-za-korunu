// Service worker: přijímá push notifikace a po kliknutí otevře správnou stránku.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Kopec za korunu', body: event.data?.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kopec za korunu', {
      body: data.body || '',
      icon: '/icon.svg',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
