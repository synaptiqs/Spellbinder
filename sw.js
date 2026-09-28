// Spellbinder service worker — cuts repeat-visit latency by caching the app
// shell and game assets on-device. Bump CACHE_VERSION (and the BUILD_VERSION
// in index.html) on every deploy so clients fetch fresh files.
const CACHE_VERSION = 'v0.1.0';
const CACHE = `spellbinder-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './game.js?v=0.1.0',
  './src/scenes/BootScene.js',
  './src/scenes/TitleScene.js',
  './src/scenes/CharCreateScene.js',
  './src/scenes/WorldMapScene.js',
  './src/scenes/BattleScene.js',
  './src/scenes/ResultsScene.js',
  './src/scenes/ProfileScene.js',
  './src/scenes/LeaderboardScene.js',
  './src/scenes/DashboardScene.js',
  './src/systems/FirebaseSystem.js',
  './src/systems/ProgressSystem.js',
  './src/systems/SaveSystem.js',
  './src/systems/WordSystem.js',
  './src/data/words-k3.js',
  './src/data/words-4-8.js',
  './src/data/words-9-12.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return; // leave CDN/Firebase to the browser

  // Navigations: network first, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }

  // Everything else same-origin (JS, CSS, images, audio): cache first, populate on miss.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
    )
  );
});
