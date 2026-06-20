// CampusConnect Service Worker v8.0
// STRATEGY: HTML files → always network fresh | Assets → cache first

const CACHE_NAME = 'campusconnect-v8';

// Only cache truly static assets that never change
const STATIC_ASSETS = [
  '/Campuconnect-/manifest.json'
];

// Install — minimal cache
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).catch(function(){})
  );
});

// Activate — delete ALL old caches immediately
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          // Delete every cache including old versions
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// FETCH — smart strategy
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  var method = e.request.method;

  // Only handle GET requests
  if (method !== 'GET') return;

  // ── ALWAYS NETWORK FRESH (never cache these) ──
  // Firebase, Google APIs, Sheets
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('docs.google.com') ||
    url.includes('gstatic.com/firebasejs') ||
    url.includes('drive.google.com') ||
    url.includes('imgur.com') ||
    url.includes('youtube.com')
  ) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response('{}', {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // ── HTML FILES — ALWAYS FETCH FRESH FROM NETWORK ──
  // This is the KEY fix — HTML pages are NEVER served from cache
  if (
    url.includes('.html') ||
    url.endsWith('/') ||
    url.includes('/Campuconnect-/') && !url.includes('.')
  ) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(function() {
        // Only use cache as fallback when completely offline
        return caches.match(e.request).then(function(cached) {
          return cached || new Response(
            '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1117;color:#4caf50">' +
            '<h2>📡 You are offline</h2>' +
            '<p style="color:#999">Please check your internet connection</p>' +
            '<button onclick="location.reload()" style="margin-top:20px;padding:12px 24px;background:#0d4a1a;color:white;border:none;border-radius:10px;font-size:14px;cursor:pointer">🔄 Try Again</button>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // ── JS/CSS/IMAGES — Cache first, update in background ──
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var networkFetch = fetch(e.request).then(function(response) {
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() { return cached; });

      return cached || networkFetch;
    })
  );
});

// Listen for message to force clear cache
self.addEventListener('message', function(e) {
  if (e.data === 'CLEAR_CACHE') {
    caches.keys().then(function(keys) {
      keys.forEach(function(key) { caches.delete(key); });
    });
  }
});
