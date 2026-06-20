// CampusConnect Service Worker v9.0
// SIMPLE & STABLE - No aggressive caching

const CACHE_NAME = 'campusconnect-v9';

// Install - skip waiting immediately
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

// Activate - clear ALL old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        return caches.delete(key);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// FETCH - Network always first, no caching of HTML at all
self.addEventListener('fetch', function(e) {
  // Only handle GET
  if (e.request.method !== 'GET') return;

  var url = e.request.url;

  // Skip non-http requests (chrome-extension etc)
  if (!url.startsWith('http')) return;

  // Always go to network - simple and clean
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).catch(function() {
      // Only if completely offline, try cache
      return caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        // Offline fallback page
        if (url.includes('.html') || !url.includes('.')) {
          return new Response(
            '<html><body style="background:#0d1117;color:#4caf50;font-family:sans-serif;text-align:center;padding:50px">' +
            '<h2>📡 No Internet</h2><p style="color:#999;margin:10px 0">Please check your connection</p>' +
            '<button onclick="location.reload()" style="padding:12px 24px;background:#0d4a1a;color:white;border:none;border-radius:10px;font-size:14px;cursor:pointer;margin-top:10px">🔄 Try Again</button>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      });
    })
  );
});
