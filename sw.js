'use strict';

// Beim Deploy hochzählen, sonst hängt die alte Version im Cache (siehe CLAUDE.md)
const VERSION = 'myskat-v6';

const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'img/pushups.jpg',
  'img/jacks.jpg',
  'img/crunches.jpg',
  'img/squats.jpg',
  'img/burpees.jpg',
  'fonts/PirataOne-Regular.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((cached) => cached || fetch(event.request))
  );
});
