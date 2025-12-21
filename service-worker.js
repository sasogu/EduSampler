const CACHE = "sw-v0.1.09";
const ASSETS = [
  "./",
  "./index.html",
  "./styles/main.css",
  "./scripts/main.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./samplers/guitarras/emotional-guitar-loop-02-301396.mp3",
  "./samplers/guitarras/foo-fighters-type-guitar-loop-2-246591.mp3",
  "./samplers/guitarras/hard-rock-guitar-loop-1-289431.mp3",
  "./samplers/guitarras/juice-wrld-x-marshmello-guitar-loop-246372.mp3",
  "./samplers/melodias/bells-melody-loop-266598.mp3",
  "./samplers/melodias/nostalgia-melody-loop-v1-264546.mp3",
  "./samplers/melodias/pluck-loop-01-gminor-126bpm-405155.mp3",
  "./samplers/melodias/pluck-loop-02-gminor-126bpm-405157.mp3",
  "./samplers/melodias/pluck-loop-04-dminor-128bpm-405154.mp3",
  "./samplers/melodias/pluck-loop-06-dmajor-120bpm-405151.mp3",
  "./samplers/melodias/synth-loop-01-126bpm-gminor-320268.mp3",
  "./samplers/melodias/synth-loop-02-135bpm-fminor-320270.mp3",
  "./samplers/melodias/synth-loop-03-135bpm-dminor-320271.mp3",
  "./samplers/ritmos/amen-break-no-copyright-remake-120bpm-25924.mp3",
  "./samplers/ritmos/beat-addictive-percussive-rhythm-loop-120bpm-438642.mp3",
  "./samplers/ritmos/break-drum-loop-132276.mp3",
  "./samplers/ritmos/cs-hihat-loop-01-128bpm.mp3",
  "./samplers/ritmos/cs-hithat-loop-03-128bpm.mp3",
  "./samplers/ritmos/cs-kick-04-d-128bpm.mp3",
  "./samplers/ritmos/hip-hop-drum-loop-main-beat-102-bpm-265600.mp3",
  "./samplers/ritmos/kick-loop-short-16-140bpm-eminor-320605.mp3",
  "./samplers/ritmos/typical-trap-loop-140bpm-129880.mp3",
  "./samplers/varios/applause-crowd.mp3",
  "./samplers/varios/cs-fx-up-1-d-128bpm-258888.mp3",
  "./samplers/varios/cs-fx-up-2-d-128bpm.mp3",
  "./samplers/varios/happy-new-year.mp3",
  "./samplers/varios/santaclaus_hohoho.mp3",
  "./samplers/vocal/angelic-voice-81921.mp3",
  "./samplers/vocal/vocal-anthem-sha-loop-130bpm-272073.mp3",
  "./samplers/vocal/vocal-loop-vocoder-36386.mp3",
  "./samplers/vocal/woman-vocal-gladiator-type-65610.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(ASSETS);
      // activar inmediatamente para forzar actualización
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          const isNav = event.request.mode === "navigate" || event.request.destination === "document";
          if (isNav) {
            return caches.match("./index.html");
          }
        })
      );
    })
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || !event.data.type) return;
  if (event.data.type === "GET_VERSION") {
    const payload = { type: "SW_VERSION", version: CACHE };
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(payload);
    } else if (event.source) {
      event.source.postMessage(payload);
    }
  }
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
