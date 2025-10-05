const CACHE = 'hv-v4';
const PRECACHE = ['index.html','styles.css','app.js','manifest.webmanifest','data/all.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(res =>
      res || fetch(req).then(r => {
        if (req.url.includes('/data/')) {
          const cl = r.clone(); caches.open(CACHE).then(c => c.put(req, cl));
        }
        return r;
      }).catch(()=>res)
    )
  );
});
