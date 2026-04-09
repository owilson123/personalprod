const CACHE = 'command-center-v2';

self.addEventListener('install', () => self.skipWaiting());

// On activate: take control immediately AND delete any old caches
self.addEventListener('activate', e => e.waitUntil(
  Promise.all([
    self.clients.claim(),
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ),
  ])
));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
