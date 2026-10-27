const STATIC_CACHE = "vejr-static-v1";
const API_CACHE = "vejr-api-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./Assets/CSS/site.css",
    "./Assets/JS/site.js",
    "./Assets/JS/openMeteo.js",
    "./Assets/JS/weatherView.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key.startsWith("vejr-") && key !== STATIC_CACHE && key !== API_CACHE)
                .map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    const isWeatherApi = url.hostname === "api.open-meteo.com"
        || url.hostname === "geocoding-api.open-meteo.com";

    if (isWeatherApi) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
    }
});

async function networkFirst(request) {
    const cache = await caches.open(API_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response.clone());
        } else {
            const cachedResponse = await cache.match(request);
            if (cachedResponse) return cachedResponse;
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;
        throw error;
    }
}

async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, response.clone());
    }
    return response;
}
