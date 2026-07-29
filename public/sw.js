// Batchize offline.
//
// The whole engine already runs on the visitor's machine, so the only thing
// standing between this and working on a plane is the request for the files
// themselves. That is a service worker's entire job here: there is no data to
// sync, no queue to replay, no conflict to resolve, because nothing was ever
// on a server.
//
// Strategy: network-first for HTML so a redeploy is picked up immediately and
// nobody is stuck on a stale build; cache-first for the hashed assets, which
// are immutable by construction.

const VERSION = "batchize-v1";
const SHELL = "/batchize/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll([SHELL, SHELL + "favicon.svg"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never touch anything that is not ours. Fonts come from Google and are
  // handled by the browser's own cache.
  if (url.origin !== self.location.origin) return;

  const isDocument =
    request.mode === "navigate" || request.destination === "document";

  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match(SHELL))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
