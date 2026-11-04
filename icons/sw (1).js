var CACHE = "timelog-v3";
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
// 페이지(HTML)는 네트워크 우선 → 업데이트가 바로 반영됨. 오프라인이면 캐시 사용.
// 아이콘 등 나머지는 캐시 우선.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var isPage = e.request.mode === "navigate" || /\.html$/.test(new URL(e.request.url).pathname);
  if (isPage) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || caches.match("./index.html"); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    }).catch(function () { return caches.match("./index.html"); })
  );
});
