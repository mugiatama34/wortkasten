/* Wortkasten service worker — kabuk cache-first, kelime listesi network-first */
const SURUM = 'wortkasten-v12';
const KABUK = ['./', './index.html', './manifest.json',
               './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(KABUK)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(a => Promise.all(a.filter(n => n !== SURUM).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // yapay zeka ve github yazma istekleri: hic cache'e girmesin, dogrudan aga gitsin
  if (url.hostname === 'api.anthropic.com' || url.hostname === 'api.github.com') return;

  if (e.request.method !== 'GET') return;

  // kelime listesi: once agdan al, basarisizsa cache
  if (url.pathname.endsWith('kelimeler.json')) {
    e.respondWith(
      fetch(e.request)
        .then(y => { const kopya = y.clone(); caches.open(SURUM).then(c => c.put(e.request, kopya)); return y; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // kabuk: once cache
  e.respondWith(
    caches.match(e.request).then(v => v || fetch(e.request).then(y => {
      if (y.ok && url.origin === location.origin) {
        const kopya = y.clone(); caches.open(SURUM).then(c => c.put(e.request, kopya));
      }
      return y;
    }))
  );
});
