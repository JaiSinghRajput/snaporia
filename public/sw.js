const CACHE_NAME = 'snaporia-cache-v1';
const ASSETS = [
  '/',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
      )
    ])
  );
});

// Network-first for navigations; cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return resp;
      }).catch(() => caches.match(request))
    );
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return resp;
        });
      })
    );
  }
});

// --- Web Push: handle incoming push for messaging ---
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New message';
    const options = {
      body: data.body || 'You have a new message',
      icon: data.icon || '/icons/android/android-launchericon-96-96.png',
      badge: data.badge || '/icons/android/android-launchericon-48-48.png',
      tag: data.tag || 'message',
      renotify: true,
      data: {
        url: data.url || '/',
        conversationId: data.conversationId,
      },
      actions: [
        { action: 'open', title: 'Open' },
      ],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // fallback
    event.waitUntil(self.registration.showNotification('New message', { body: 'Open to view' }));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Focus existing tab if already open
        if ('focus' in client) {
          const url = new URL(client.url);
          if (url.pathname === targetUrl || url.href.includes(targetUrl)) {
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
