// Service Worker: speichert das komplette Spiel im Browser-Cache,
// damit es installiert und offline gespielt werden kann.
// Bei Änderungen die Versionsnummer erhöhen — dann wird neu gecacht.
const CACHE = 'schattenpfad-v4';

const KERN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './src/main.js',
  './src/config.js',
  './src/input.js',
  './src/physics.js',
  './src/skeleton.js',
  './src/animations.js',
  './src/fighter.js',
  './src/combat.js',
  './src/ai.js',
  './src/stage.js',
  './src/ui.js',
  './src/particles.js',
  './src/sound.js',
  './src/music.js',
  './src/characters.js',
  './src/save.js',
  './assets/backgrounds/aschenpass-himmel.png',
  './assets/backgrounds/aschenpass-huegel.png',
  './assets/backgrounds/mondhain-himmel.png',
  './assets/backgrounds/mondhain-huegel.png',
  './assets/backgrounds/nebelschlucht-himmel.png',
  './assets/backgrounds/nebelschlucht-huegel.png',
  './assets/backgrounds/glutschmiede-himmel.png',
  './assets/backgrounds/glutschmiede-huegel.png',
  './assets/backgrounds/leere-himmel.png',
  './assets/backgrounds/leere-huegel.png',
  './assets/ui/titelbild.png',
  './assets/ui/waffe-schwert.png',
  './assets/ui/waffe-dolch.png',
  './assets/ui/waffe-stab.png',
  './assets/portraits/juro.png',
  './assets/portraits/scharr.png',
  './assets/portraits/veyra.png',
  './assets/portraits/lith.png',
  './assets/portraits/dorn.png',
  './assets/portraits/umbra.png',
  './src/bilder.js',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(KERN)));
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  // alte Cache-Versionen aufräumen
  ev.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;
  // Cache zuerst, Netz als Nachschub — so startet das Spiel auch offline
  ev.respondWith(
    caches.match(ev.request).then(
      (treffer) =>
        treffer ||
        fetch(ev.request).then((antwort) => {
          const kopie = antwort.clone();
          if (antwort.ok && new URL(ev.request.url).origin === location.origin) {
            caches.open(CACHE).then((cache) => cache.put(ev.request, kopie));
          }
          return antwort;
        }),
    ),
  );
});
