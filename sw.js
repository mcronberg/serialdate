// Version (IMPORTANT: Keep in sync with VERSION in script.js!)
const VERSION = "1.98";
const CACHE_NAME = `serial-date-converter-v${VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./tailwind.css",
  "./date-utils.js",
  "./script.js",
  "./manifest.json",
  "./assets/icon.png",
  "./assets/flags/gb.svg",
  "./assets/flags/dk.svg",
  "./assets/flags/no.svg",
  "./assets/flags/se.svg",
  "./assets/flags/de.svg",
  "./robots.txt",
  "./sitemap.xml",
];

// Install: Cache assets
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting(); // Force new SW to take over immediately
});

// Activate: Clean up old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    }),
  );
  self.clients.claim(); // Take control of all clients immediately
});

// Fetch: Stale-While-Revalidate for same-origin GET requests only.
// Cross-origin requests and non-GET requests (e.g. the analytics POST to
// Google Forms) are left untouched - the Cache API only supports caching GET
// requests, and intercepting third-party calls here provided no benefit.
self.addEventListener("fetch", (e) => {
  const { request } = e;

  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      // `cache: 'no-cache'` forces revalidation with the server instead
      // of letting the browser's HTTP cache silently return a stale
      // response, which would otherwise defeat this background refresh
      // (and could keep serving an outdated app even after a new
      // version is deployed).
      const networkFetch = fetch(request, { cache: "no-cache" })
        .then((networkResponse) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => cachedResponse);

      // Serve cache instantly if available (fast repeat visits) while
      // updating it in the background; otherwise wait for the network.
      return cachedResponse || networkFetch;
    }),
  );
});
