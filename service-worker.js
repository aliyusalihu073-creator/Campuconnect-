self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('campusconnect-v2').then(function(cache) {
      return cache.addAll([
        '/Campuconnect-/',
        '/Campuconnect-/index.html',
        '/Campuconnect-/chat.html',
        '/Campuconnect-/media-hub.html',
        '/Campuconnect-/courses.html',
        '/Campuconnect-/results.html',
        '/Campuconnect-/newsfeed.html',
        '/Campuconnect-/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
