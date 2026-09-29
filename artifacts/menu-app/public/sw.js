const CACHE = "audiverse-v3";
const PRECACHE = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Network-first para TODOS los assets (siempre sirve la versión más reciente) */
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  /* No interceptar requests a Supabase u otras APIs externas */
  if (!url.origin.includes(self.location.hostname)) return;

  /* Network-first: intenta red, cae a caché solo si no hay conexión */
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("./index.html")))
  );
});
