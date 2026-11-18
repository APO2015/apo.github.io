/* APO staff portals — service worker (للتثبيت على الشاشة الرئيسية فقط).
   لا يلمس أي طلب خارج هذا النطاق (Supabase/الصور): لا تخزّن بيانات ولا رموز دخول. شبكة أولاً، والنسخة المخزّنة عند انقطاع الشبكة لقشرة الصفحة فقط. */
var V = 'apo-staff-v1';
var SHELL = ['staff_core.js', 'staff_core.css'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (!/\.(html|js|css|png|webmanifest)$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r); }));
});
