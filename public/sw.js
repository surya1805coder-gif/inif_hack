// ==============================================================================
// INFINITY HACKATHON 2026 — SERVICE WORKER (PWA & OFFLINE VENUE RESILIENCE)
// ==============================================================================

const CACHE_NAME = 'infinity-hackathon-v2';
const CORE_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/logo.png',
  '/favicon.ico',
  '/3mem.png',
  '/4mem.png'
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Evict obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Safe Stale-While-Revalidate & Network-First for Read APIs & HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET mutations (registrations, scores, check-ins must be live)
  if (request.method !== 'GET') {
    return;
  }

  // 1. Read-only API calls: Network-first with cache fallback
  if (url.pathname.startsWith('/api/domains') || url.pathname.startsWith('/api/timeline') || url.pathname === '/api/health') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 2. Other API calls (pass through live)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. HTML Pages & Navigations: Network-First with cache fallback (prevents stale portal UI)
  const isHtml = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // 4. Static assets & bundles: Cache-first with network background revalidation
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Fetch in background to update cache for next time
        fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkRes));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkRes;
      });
    })
  );
});
