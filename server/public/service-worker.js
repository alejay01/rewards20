const CACHE_NAME = "boudin-boss-rewards-cache-v3";
const OFFLINE_URL = "/offline";

const ASSETS_TO_CACHE = [
  "/manifest.webmanifest",
  OFFLINE_URL
];

// Install Event - Pre-cache minimal offline shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Pre-caching offline assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clear old caches and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing legacy cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network-First for HTML/document resources and API requests, fallback to cache
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Completely bypass cache for all server API endpoints
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "Offline. No internet connection." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // 2. Network-Only / Direct Policy for HTML document / navigation requests (NEVER cache HTML dynamically, ensuring absolute fresh loads on online page refreshes)
  const isHtmlRequest = 
    event.request.mode === "navigate" || 
    (event.request.method === "GET" && event.request.headers.get("accept")?.includes("text/html"));

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails (offline), return cached offline page shell fallback
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // 3. Stale-While-Revalidate for other static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* ignore background fetch errors when offline */ });
          
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If asset is not in cache and network fails, return offline response
          return new Response("Offline resource unavailable", { status: 404 });
        });
    })
  );
});
