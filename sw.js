const CACHE_NAME = 'burger-rock-metal-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/app.js',
  './manifest.json',
  './img/logo.png',
  './img/isotipo.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.warn('SW cache install error (non-fatal):', err))
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
  // Solo cachear peticiones GET del mismo origen
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve del caché si está, si no va a la red
        return response || fetch(event.request).catch(() => {
          // Si falla la red y no está en caché, retornar página principal
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

