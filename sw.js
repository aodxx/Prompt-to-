var CACHE_NAME = 'prompt-template-v1';
var APP_SHELL = [
  '/Prompt-to-/index.html',
  '/Prompt-to-/manifest.json',
  '/Prompt-to-/icons/icon-192.png',
  '/Prompt-to-/icons/icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// App shell: cache-first. API calls (Google Apps Script) always go to network.
self.addEventListener('fetch', function(event){
  var url = event.request.url;
  if(url.indexOf('script.google.com') !== -1){
    return; // let the network handle live data, don't cache it
  }
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request);
    })
  );
});
    
