const CACHE = 'splittit-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if(req.method !== 'GET') return;
  if(new URL(req.url).origin !== self.location.origin) return;

  // Icons: Cache zuerst
  if(/\.(png|ico)$/.test(new URL(req.url).pathname)){
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
        return res;
      }))
    );
    return;
  }

  // HTML, Manifest u. a.: Netzwerk zuerst (damit Updates ankommen), offline aus dem Cache
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
