// Il Mio Mese: funziona anche senza rete.
// Con la rete prende sempre la versione più recente della pagina; senza rete usa quella salvata.
// Quando pubblichi una nuova versione, cambia il numero qui sotto.
const CACHE = "il-mio-mese-v11";
const FILES = ["./", "./index.html", "./manifest.json", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const host = new URL(req.url).hostname;
  // Caratteri dell'app (Google Fonts): salvati la prima volta, poi usati anche offline
  if (req.method === "GET" && (host === "fonts.googleapis.com" || host === "fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
    return;
  }
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || req.destination === "document";
  if (isPage) {
    // Prima la rete (aggiornamenti subito), poi la copia salvata se sei offline
    e.respondWith(
      fetch(req, { cache: "no-store" }).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); }
        return res;
      }).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }
  // Icone e altri file: prima la copia salvata
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
