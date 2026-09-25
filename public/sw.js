// Harvy TV Remote Progressive Web App Service Worker
const CACHE_NAME = 'harvy-tv-remote-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-maskable-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/icon.svg'
];

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#070a11" />
  <title>Harvy TV Remote</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #070a11;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: #0f172a;
      border: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
    }
    h1 {
      font-size: 1.25rem;
      margin: 0 0 8px 0;
      color: #38bdf8;
    }
    p {
      font-size: 0.875rem;
      color: #94a3b8;
      max-width: 300px;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    button {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
    }
  </style>
</head>
<body>
  <div class="icon">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
      <polyline points="17 2 12 7 7 2"></polyline>
    </svg>
  </div>
  <h1>Harvy TV Remote</h1>
  <p>You appear to be offline. Connect to your Wi-Fi network to continue controlling your Android TV.</p>
  <button onclick="window.location.reload()">Retry Connection</button>
</body>
</html>`;

// Install Event: Precaching core shell and assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response && response.status === 200) {
              await cache.put(url, response);
            }
          } catch {
            // Ignore single asset fetch issues
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup stale caches and claim clients immediately
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

// Fetch Event: Robust offline fallback for Chrome PWA installability requirements
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS GET requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // 1. Navigation requests (Opening the app, entering URL, reload)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Look for cached document
          const cachedMatch = await caches.match(event.request);
          if (cachedMatch) return cachedMatch;

          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;

          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;

          // Ultimate offline fallback guaranteed to return HTTP 200
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. Static assets & API requests: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background revalidate for local assets
        if (event.request.url.startsWith(self.location.origin)) {
          fetch(event.request)
            .then((freshResponse) => {
              if (freshResponse && freshResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, freshResponse));
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return new Response('', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
    })
  );
});
