const CACHE_VERSION = 1;
const CACHE_NAME = `rot-insa-v${CACHE_VERSION}-`;

const URLS_TO_CACHE = {
    static: [
        'assets/favicon/android-chrome-192x192.png',
        'assets/favicon/android-chrome-512x512.png',
        'assets/favicon/apple-touch-icon.png',
        'assets/favicon/browserconfig.xml',
        'assets/favicon/favicon.ico',
        'assets/favicon/favicon-16x16.png',
        'assets/favicon/favicon-32x32.png',
        'assets/favicon/manifest.json',
        'assets/favicon/mstile-150x150.png',
        'assets/favicon/safari-pinned-tab.svg',

        'assets/font/Roboto-Medium.ttf',
        'assets/font/Roboto-Regular.ttf',
        'assets/font/RobotoSlab-Light.ttf',
        'assets/font/MaterialIcons-Regular.woff2',

        'assets/images/fap.jpg',
        'assets/images/hardcore.jpg',
        'assets/images/informaticien.jpg',
        'assets/images/joker.jpg',
        'assets/images/obama.jpg',
        'assets/images/poulet.jpg',
        'assets/images/ribery.jpg',

        'lib/vue/vue.js',
        'lib/vue-material/vue-material.js',
        'lib/vue-material/vue-material.css',
        'index.js',
        'index.css',
        'index.html',
    ],
    decks: [
        'decks/fap.json',
        'decks/hardcore.json',
        'decks/if.json',
        'decks/jenaijamais.json',
        'decks/manifest.json',
        'decks/repliques.json',
        'decks/ringoffire.json',
        'decks/rotistandard.json',
    ]
};


self.addEventListener('install', event => {
    const promises = [];

    promises.push(caches.open(CACHE_NAME + 'decks').then(cache => cache.addAll(URLS_TO_CACHE.decks)));
    promises.push(caches.open(CACHE_NAME + 'static').then(cache => cache.addAll(URLS_TO_CACHE.static)));

    event.waitUntil(Promise.all(promises));
});

self.addEventListener('fetch', event => {

    const requestURL = new URL(event.request.url);

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
    if (!request || request.url.indexOf('http') !== 0) return;
    return caches.open(cacheName).then(cache => cache.put(request, response.clone()));
}