const CACHE_NAME = "kajian-mian-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Biarkan request API dan halaman dinamis tetap online-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
