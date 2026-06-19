// CampusConnect Service Worker v3.0
const CACHE_NAME = 'campusconnect-v3';
const STATIC_ASSETS = [
  '/Campuconnect-/',
  '/Campuconnect-/index.html',
  '/Campuconnect-/login.html',
  '/Campuconnect-/register.html',
  '/Campuconnect-/chat.html',
  '/Campuconnect-/media-hub.html',
  '/Campuconnect-/newsfeed.html',
  '/Campuconnect-/courses.html',
  '/Campuconnect-/results.html',
  '/Campuconnect-/dashboard.html',
  '/Campuconnect-/leaderboard.html',
  '/Campuconnect-/admin.html',
  '/Campuconnect-/admin-news.html',
  '/Campuconnect-/admin-media.html',
  '/Campuconnect-/admin-docs.html',
  '/Campuconnect-/admin-results.html',
  '/Campuconnect-/admin-timetable.html',
  '/Campuconnect-/admin-manage.html',
  '/Campuconnect-/docs.html',
  '/Campuconnect-/manifest.json'
];

// INSTALL — cache all static assets
self.addEventListener('install', function(e) {
  self.skipWaiting(); // activate immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ACTIVATE — delete old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim(); // take control immediately
    })
  );
});

// FETCH — network first for API/Firebase, cache first for static
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Always network-first for Firebase, Google Sheets, APIs
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('googleapis.com') ||
      url.includes('docs.google.com') ||
      url.includes('gstatic.com/firebasejs')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
      })
    );
    return;
  }

  // Cache first, then network for static assets
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        // Update cache in background
        fetch(e.request).then(function(fresh) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, fresh);
          });
        }).catch(function() {});
        return cached;
      }
      // Not in cache — fetch from network
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback
        return new Response('<h1 style="font-family:sans-serif;text-align:center;padding:40px;color:#4caf50">📡 You are offline.<br><br>Please check your connection.</h1>', {
          headers: { 'Content-Type': 'text/html' }
        });
      });
    })
  );
});
