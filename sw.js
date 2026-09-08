const CACHE_NAME = 'plantilla-v5';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './img/isotipo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve del caché si está, si no va a la red
        return response || fetch(event.request).catch(() => console.log('Fetch falló, en modo offline.'));
      })
  );
});
