// sw.js - Service Worker cho PWA Gom Bat Trang
// Network-first: luon lay ban moi, chi dung cache khi mat mang

const CACHE_NAME = 'gom-bt-v10';

const STATIC_ASSETS = [
  './', './index.html', './css/style.css',
  './js/config.js', './js/app.js', './js/scanner.js', './js/chat.js', './js/viewer3d.js',
  './manifest.json', './assets/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ error: 'Offline' }),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || (event.request.destination === 'document' ? caches.match('./index.html') : undefined)
        )
      )
  );
});
