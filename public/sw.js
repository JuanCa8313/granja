const CACHE_NAME = 'granja-hub-pwa-v2';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'reload' }).then((res) => {
              if (res && res.status === 200) {
                return cache.put(url, res);
              }
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Recibir lista de scripts y estilos ya cargados en el DOM durante la primera visita
// para que queden en caché inmediatamente y funcionen al recargar sin internet.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_CURRENT_PAGE_ASSETS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) =>
        Promise.allSettled(
          event.data.urls.map(async (rawUrl) => {
            try {
              const u = new URL(rawUrl, self.location.origin);
              if (u.origin !== self.location.origin) return;
              const existing = await cache.match(u.href);
              if (!existing) {
                const res = await fetch(u.href);
                if (res && res.status === 200) {
                  await cache.put(u.href, res);
                }
              }
            } catch {
              // Ignorar si ya está offline
            }
          })
        )
      )
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar llamadas externas (ej. Supabase) ni rutas /api/
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Navegación HTML: Network-First con timeout de 3s y fallback a shell offline ('/')
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const networkResponse = await fetch(event.request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            cache.put(OFFLINE_URL, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;
          const cachedShell = await caches.match(OFFLINE_URL);
          if (cachedShell) return cachedShell;
          return new Response('Modo Offline - Recarga una vez con conexión para guardar la aplicación.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  // 2. Assets estáticos de Next.js (/_next/static/...), íconos y manifest: Cache-First con actualización en segundo plano
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request, { ignoreSearch: url.pathname.startsWith('/_next/static/') });
      if (cached) {
        fetch(event.request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, networkResponse.clone());
            }
          })
          .catch(() => {});
        return cached;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        const fallback = await caches.match(event.request, { ignoreSearch: true });
        if (fallback) return fallback;
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })()
  );
});
