const CACHE_NAME = 'tractor-seva-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-512x512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass cache for APIs, Dev uploads, websocket, and Vite core/npm dependencies in development
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/dev-') || 
    url.pathname.includes('/@vite') || 
    url.pathname.includes('/node_modules') || 
    url.pathname.includes('chrome-extension') ||
    url.pathname.startsWith('/src/') ||
    req.method !== 'GET'
  ) {
    return;
  }

  // Handle HTML navigation requests
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // Handle other static assets (cache first)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        // Cache valid HTTP status 200 GET requests
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Return cached placeholder for images if offline
        if (req.headers.get('accept')?.includes('image/')) {
          return caches.match('/icons/icon-192x192.png');
        }
      });
    })
  );
});

// Event listener for updates message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
