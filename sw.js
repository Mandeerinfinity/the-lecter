/* The Lecter · service worker. Network-first so updates arrive promptly; the cache keeps it working offline.
   All paths are relative, so it works at the site root or under a subpath such as /the-lecter/. */
const VERSION = 'lecter-v3.0.0';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/util.js', 'js/perf.js', 'js/audio.js', 'js/audio3.js', 'js/dial.js', 'js/caseback.js', 'js/tourbillon.js', 'js/effects.js', 'js/modes-a.js', 'js/menu.js', 'js/parlour.js', 'js/studio.js',
  'js/core2.js', 'js/salon-a.js', 'js/salon-b.js', 'js/salon-c.js', 'js/visual3.js', 'js/galleria-a.js', 'js/galleria-b.js', 'js/app.js',
  'fonts/Cinzel-VariableFont_wght.ttf', 'fonts/CormorantGaramond-VariableFont_wght.ttf', 'fonts/CormorantGaramond-Italic-VariableFont_wght.ttf', 'fonts/PinyonScript-Regular.ttf', 'fonts/SpecialElite-Regular.ttf',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
