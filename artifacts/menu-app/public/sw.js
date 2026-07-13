const CACHE = "audiverse-v1";
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

/* Network-first para navegación, cache-first para assets estáticos */
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  /* No interceptar requests a Supabase u otras APIs externas */
  if (!url.origin.includes(self.location.hostname)) return;

  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(request).then((cached) =>
      cached ?? fetch(request).then((res) => {
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
    )
  );
});
