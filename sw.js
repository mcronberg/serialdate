// Version (IMPORTANT: Keep in sync with VERSION in script.js!)
const VERSION = '1.92';
const CACHE_NAME = `serial-date-converter-v${VERSION}`;
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './assets/icon.png',
    './robots.txt',
    './sitemap.xml'
];

// Install: Cache assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting(); // Force new SW to take over immediately
});

// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim(); // Take control of all clients immediately
});

// Fetch: Network First, then Cache (Best for frequent updates)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // Update cache with new version
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return response;
            })
            .catch(() => caches.match(e.request)) // Fallback to cache if offline
    );
});
