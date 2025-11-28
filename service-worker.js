const CACHE = "sw-v0.0.35";
const ASSETS = [
  "/",
  "/index.html",
  "/styles/main.css",
  "/scripts/main.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/samplers/applause-crowd.mp3",
  "/samplers/amen-break-no-copyright-remake-120bpm-25924.mp3",
  "/samplers/beat-addictive-percussive-rhythm-loop-120bpm-438642.mp3",
  "/samplers/bells-melody-loop-266598.mp3",
  "/samplers/break-drum-loop-132276.mp3",
  "/samplers/cs-fx-up-2-d-128bpm.mp3",
  "/samplers/cs-hihat-loop-01-128bpm.mp3",
  "/samplers/cs-hithat-loop-03-128bpm.mp3",
  "/samplers/cs-kick-04-d-128bpm.mp3",
  "/samplers/emotional-guitar-loop-02-301396.mp3",
  "/samplers/foo-fighters-type-guitar-loop-2-246591.mp3",
  "/samplers/happy-new-year.mp3",
  "/samplers/hard-rock-guitar-loop-1-289431.mp3",
  "/samplers/hip-hop-drum-loop-main-beat-102-bpm-265600.mp3",
  "/samplers/juice-wrld-x-marshmello-guitar-loop-246372.mp3",
  "/samplers/nostalgia-melody-loop-v1-264546.mp3",
  "/samplers/pluck-loop-02-gminor-126bpm-405157.mp3",
  "/samplers/santaclaus_hohoho.mp3",
  "/samplers/typical-trap-loop-140bpm-129880.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION") {
    const payload = { type: "SW_VERSION", version: CACHE };
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(payload);
    } else if (event.source) {
      event.source.postMessage(payload);
    }
  }
});
