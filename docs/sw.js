// Λειτουργία χωρίς ίντερνετ: κρατάει την εφαρμογή στη μνήμη του κινητού.
// Οι προσφορές (offers.json) φέρνονται πάντα φρέσκες όταν υπάρχει σύνδεση.
const CACHE = "plano-v1";
const SHELL = ["./", "index.html", "data.js", "app.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Πρώτα δίκτυο, αλλιώς ό,τι υπάρχει στη μνήμη
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
