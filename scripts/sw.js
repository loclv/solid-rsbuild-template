/* Build template: emitted only by the production build. */
const CACHE_PREFIX = 'solid-rsbuild-shell-';
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const PRECACHE_URLS = __PRECACHE_MANIFEST__;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })));
    // Intentionally no skipWaiting: updates must not replace an active session.
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Serve HTML and assets from the same build. Never cache API or user data.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/index.html')) || fetch(request);
    })());
  } else if (PRECACHE_URLS.includes(url.pathname) && !url.search) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request)) || fetch(request);
    })());
  }
});
