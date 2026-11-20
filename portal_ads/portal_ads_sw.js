/* APO portal — service worker (للتثبيت على الشاشة الرئيسية فقط). لا يلمس أي طلب خارج هذا النطاق ولا طلباً فيه استعلام (?c=…)؛ شبكة أولاً. */
var V = 'apo-ads-v1';
var SHELL = ['apo_pwa.js', 'index.html'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin || u.search) return; // طلبات فيها استعلام (قد يحمل كوداً) لا تُخزَّن أبداً
  if (!/\.(html|js|css|png|webmanifest)$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r); }));
});
