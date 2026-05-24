self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('campusconnect-v1').then(function(cache) {
      return cache.addAll([
        '/Campuconnect-/',
        '/Campuconnect-/index.html',
        '/Campuconnect-/newsfeed.html',
        '/Campuconnect-/chat.html',
        '/Campuconnect-/media.html'
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
