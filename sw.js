const CACHE_NAME = 'rot-insa-v1-';

const URLS_TO_CACHE = {
    static: [
        'index.js',
        'index.css',
        'index.html',

        'favicon/android-chrome-192x192.png',
        'favicon/android-chrome-512x512.png',
        'favicon/apple-touch-icon.png',
        'favicon/browserconfig.xml',
        'favicon/favicon.ico',
        'favicon/favicon-16x16.png',
        'favicon/favicon-32x32.png',
        'favicon/manifest.json',
        'favicon/mstile-150x150.png',
        'favicon/safari-pinned-tab.svg',

        'https://fonts.googleapis.com/css?family=Roboto+Slab:300|Roboto:300,400,500,700,400italic',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        '//unpkg.com/vue-material/dist/vue-material.css',

        '//unpkg.com/vue/dist/vue.min.js',
        '//unpkg.com/vue-material/dist/vue-material.js',

        'images/fap.jpg',
        'images/hardcore.jpg',
        'images/informaticien.jpg',
        'images/joker.jpg',
        'images/obama.jpg',
        'images/poulet.jpg',
        'images/ribery.jpg',
    ],
    decks: [
        'manifest.json',
        'decks/fap.json',
        'decks/hardcore.json',
        'decks/if.json',
        'decks/jenaijamais.json',
        'decks/repliques.json',
        'decks/ringoffire.json',
        'decks/rotistandard.json',
    ]
};


self.addEventListener('install', event => {
    let promises = [];

    promises.push(caches.open(CACHE_NAME + 'decks').then(cache => cache.addAll(URLS_TO_CACHE.decks)));
    promises.push(caches.open(CACHE_NAME + 'static').then(cache => cache.addAll(URLS_TO_CACHE.static)));

    event.waitUntil(Promise.all(promises));
});

self.addEventListener('fetch', event => {

    let requestURL = new URL(event.request.url);

    // Routing for local URLs
    if (requestURL.origin === location.origin) {
        // Handle decks URLs (fetch first, cache next)
        if (/^\/decks\//.test(requestURL.pathname)) {
            event.respondWith(fetch(event.request)
                .then(r => addToCache(CACHE_NAME + 'decks', event.request, r))
                .catch(() => caches.match(event.request))
            );
            return;
        }
    }

    // Default pattern (cache first, fetch next)
    event.respondWith(caches.match(event.request)
        .then(response => response || fetch(event.request)
            .then(r => addToCache(CACHE_NAME + 'static', event.request, r)))
    );
});


function addToCache(cacheName, request, response) {
    return caches.open(cacheName).then(cache => cache.put(request, response.clone()));
}