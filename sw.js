// Service Worker para PWA - Liquid Glass Portfolio
// CAMBIO 1: Cambiamos el nombre de la versión para obligar al navegador a actualizar
const CACHE_NAME = 'gmdrax-portfolio-v2';

// CAMBIO 2: Rutas relativas (./) y añadimos database.json
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './database.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Borra cualquier caché que no sea la actual (v2)
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones HTTP/HTTPS (evitamos chrome-extension://, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonamos la respuesta válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Si no hay red, buscamos en caché
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si no está en caché y es navegación, podríamos devolver una página offline.html
            return new Response('Offline - No cache available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});