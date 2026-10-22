/* Ideal Ferma SW v6 — tarmoq ustuvor, avto-yangilanish */
const CACHE = 'ideal-ferma-v7';

self.addEventListener('install', (e) => {
  // kutmasdan darhol faol bo‘lish
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'CLEAR_CACHE') {
    e.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // tashqi CDN / Firebase — tarmoq
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('tailwindcss') ||
    url.hostname.includes('fonts.')
  ) {
    return;
  }

  // version.json va sw.js hech qachon cache qilinmasin
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }

  // HTML / navigatsiya — AVVAL TARMOQ
  const isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');

  if (isHTML) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((c) => c || caches.match('./index.html'))
        )
    );
    return;
  }

  // boshqa fayllar — tarmoq, keyin cache
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
