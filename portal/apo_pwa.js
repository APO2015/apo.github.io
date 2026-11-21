/* APO — وحدة مشتركة لبوابتي العملاء والمعلنين: (1) مسح QR البطاقة  (2) تثبيت البوابة كتطبيق (PWA).
   نسخة واحدة تُوضع بجانب الصفحة نفسها (portal/ و portal_ads/). لا مفاتيح ولا بيانات: القراءة محلية بالكامل.
   الإعداد من الصفحة قبل تحميل الملف:  window.APO_PWA_CFG = { kind: 'client'|'adv', sw: 'portal_sw.js', onCode: function(code){...} }
   الاستعمال:  APO_PWA.scan()  يفتح الكاميرا ← عند قراءة QR صحيح يستدعي onCode(الكود).  APO_PWA.label() نص زر المسح بلغة الصفحة. */
(function () {
  var CFG = window.APO_PWA_CFG || {};
  var S = {
    ar: { scan: 'مسح QR البطاقة', hint: 'وجّه الكاميرا نحو QR البطاقة', scanning: 'جارٍ البحث عن الـQR…', pick: 'التقط صورة للـ QR بدل المسح المباشر', cancel: 'إلغاء', loading: 'جارٍ القراءة…',
      secure: 'المسح بالكاميرا يتطلب اتصالاً آمناً (https).', deny: 'لم يُسمح باستعمال الكاميرا: فعّل الإذن من إعدادات المتصفح، أو استعمل «التقط صورة».', none: 'لا توجد كاميرا متاحة.', busy: 'الكاميرا مستعملة من تطبيق آخر.',
      unsup: 'متصفحك لا يدعم الكاميرا المباشرة: استعمل «التقط صورة».', nodec: 'تعذّر تحميل مكتبة القراءة: استعمل «التقط صورة» أو اكتب الكود.', img: 'لم يُعثر على QR في الصورة، جرّب صورة أوضح.', wrong: 'هذا QR ليس لبطاقة هذه البوابة.',
      inst: 'تثبيت التطبيق', iosinst: 'للتثبيت: اضغط زر المشاركة ⬆︎ ثم «إضافة إلى الشاشة الرئيسية».', instdone: 'تم تثبيت التطبيق ✓', manual: 'للتثبيت: من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».' },
    en: { scan: 'Scan card QR', hint: 'Point the camera at the card QR', scanning: 'Looking for the QR…', pick: 'Take a photo of the QR instead', cancel: 'Cancel', loading: 'Reading…',
      secure: 'Camera scanning needs a secure connection (https).', deny: 'Camera permission denied: allow it in the browser settings, or use “Take a photo”.', none: 'No camera available.', busy: 'The camera is in use by another app.',
      unsup: 'Your browser has no live camera support: use “Take a photo”.', nodec: 'Could not load the reader library: use “Take a photo” or type the code.', img: 'No QR found in the photo, try a clearer one.', wrong: 'This QR is not a card for this portal.',
      inst: 'Install app', iosinst: 'To install: tap the Share button ⬆︎ then “Add to Home Screen”.', instdone: 'App installed ✓', manual: 'To install: open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.' },
    fr: { scan: 'Scanner le QR de la carte', hint: 'Pointez la caméra vers le QR de la carte', scanning: 'Recherche du QR…', pick: 'Prendre une photo du QR à la place', cancel: 'Annuler', loading: 'Lecture…',
      secure: 'Le scan par caméra exige une connexion sécurisée (https).', deny: 'Accès caméra refusé : autorisez-le dans les réglages du navigateur, ou utilisez « Prendre une photo ».', none: 'Aucune caméra disponible.', busy: 'La caméra est utilisée par une autre application.',
      unsup: 'Votre navigateur ne gère pas la caméra en direct : utilisez « Prendre une photo ».', nodec: 'Bibliothèque de lecture indisponible : utilisez « Prendre une photo » ou saisissez le code.', img: 'Aucun QR trouvé sur la photo, essayez une photo plus nette.', wrong: 'Ce QR n’est pas une carte de ce portail.',
      inst: 'Installer l’application', iosinst: 'Pour installer : touchez Partager ⬆︎ puis « Sur l’écran d’accueil ».', instdone: 'Application installée ✓', manual: 'Pour installer : menu du navigateur (⋮) puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».' }
  };
  function L() { var l = (document.documentElement.lang || 'ar').slice(0, 2); return S[l] || S.ar; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- مكتبة jsQR (ملف jsqr.min.js بجانب الصفحة، أو في ../portal_staff/) ---------- */
  var jsqrP = null;
  function tryLoad(src) { return new Promise(function (res) { var s = document.createElement('script'); s.src = src; s.onload = function () { res(!!window.jsQR); }; s.onerror = function () { res(false); }; document.head.appendChild(s); }); }
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (jsqrP) return jsqrP;
    jsqrP = tryLoad('jsqr.min.js').then(function (ok) { return ok ? true : tryLoad('../portal_staff/jsqr.min.js'); }).then(function () { return window.jsQR || null; });
    return jsqrP;
  }

  /* ---------- استخراج الكود من محتوى الـQR: رابط ?c=… أو APO-CLI:/APO-ADV: ---------- */
  function parse(raw) {
    raw = String(raw || '');
    var m = /[?&]c=([A-Za-z0-9\-]+)/i.exec(raw) || /APO-(?:CLI|ADV):([A-Za-z0-9\- ]+)/i.exec(raw);
    if (!m) return null;
    var c = String(m[1]).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (CFG.kind === 'adv') { if (c.indexOf('ADV') !== 0) return null; }
    else if (c.length !== 18) return null;
    return c;
  }

  var nativeBroken = false;
  function decodeQr(src) {
    var w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height;
    if (!w || !h) return Promise.resolve(null);
    var k = Math.min(1, 1024 / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(src, 0, 0, cw, ch);
    function viaJs() {
      // مكتبة jsQR على عدة أحجام: صور الشاشات/الطباعة قد تُقرأ بحجم دون آخر
      return loadJsQR().then(function (lib) {
        if (!lib) throw new Error('nodecoder');
        var sizes = [1024, 640, 420, 800];
        for (var i = 0; i < sizes.length; i++) {
          var kk = Math.min(1, sizes[i] / Math.max(w, h)), ww = Math.max(1, Math.round(w * kk)), hh = Math.max(1, Math.round(h * kk));
          var c2 = document.createElement('canvas'); c2.width = ww; c2.height = hh;
          var x2 = c2.getContext('2d', { willReadFrequently: true }); x2.drawImage(src, 0, 0, ww, hh);
          var d = x2.getImageData(0, 0, ww, hh), r = lib(d.data, ww, hh, { inversionAttempts: 'attemptBoth' });
          if (r && r.data) return r.data;
        }
        return null;
      });
    }
    if ('BarcodeDetector' in window && !nativeBroken) {
      var det; try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { nativeBroken = true; return viaJs(); }
      // بعض الهواتف (شاومي/بوكو) فيها BarcodeDetector لا يجد شيئاً أبداً: إن لم يجد نلجأ إلى jsQR بدل الاستسلام
      return det.detect(cv).then(function (r) {
        if (r && r.length && r[0].rawValue) return String(r[0].rawValue);
        return viaJs().catch(function () { return null; });
      }).catch(function () { nativeBroken = true; return viaJs(); });
    }
    return viaJs();
  }

  function toast(msg) {
    var d = document.createElement('div');
    d.setAttribute('role', 'status');
    d.style.cssText = 'position:fixed;inset-inline:16px;bottom:78px;max-width:480px;margin:0 auto;background:#0f172a;color:#fff;border-radius:12px;padding:11px 14px;font-size:14px;text-align:center;z-index:70;box-shadow:0 8px 30px rgba(0,0,0,.35)';
    d.textContent = msg; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4200);
  }

  function scan() {
    var t = L();
    if (!window.isSecureContext) { toast(t.secure); return; }
    var hasNative = 'BarcodeDetector' in window;
    loadJsQR().then(function (lib) {
      if (!hasNative && !lib) { toast(t.nodec); return; }
      var m = document.createElement('div');
      m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px';
      m.innerHTML = '<div style="background:var(--card,#fff);color:var(--ink,#111);border-radius:16px;padding:14px;width:100%;max-width:460px;max-height:92vh;overflow:auto">' +
        '<div style="text-align:center;font-size:13.5px;opacity:.8">' + esc(t.hint) + '</div>' +
        '<video id="apoqv" playsinline muted autoplay style="width:100%;border-radius:12px;margin:8px 0;background:#000;max-height:48vh"></video>' +
        '<div id="apoqs" style="text-align:center;min-height:20px;font-size:13.5px"></div>' +
        '<input type="file" id="apoqf" accept="image/*" capture="environment" style="display:none">' +
        '<button type="button" id="apoqp" style="width:100%;margin-top:8px;padding:11px;border-radius:12px;border:1.5px solid var(--brand,#15507f);background:transparent;color:var(--brand,#15507f);font-size:14.5px;font-weight:700;cursor:pointer">' + esc(t.pick) + '</button>' +
        '<button type="button" id="apoqx" style="width:100%;margin-top:8px;padding:11px;border-radius:12px;border:1.5px solid rgba(128,128,128,.5);background:transparent;color:inherit;font-size:14.5px;cursor:pointer">' + esc(t.cancel) + '</button></div>';
      document.body.appendChild(m);
      var v = m.querySelector('#apoqv'), qs = m.querySelector('#apoqs'), stream = null, tm = null, busy = false, finished = false;
      function say(k, bad) { qs.textContent = k ? t[k] : ''; qs.style.color = bad ? '#dc2626' : ''; }
      function stop() { clearInterval(tm); try { if (stream) stream.getTracks().forEach(function (x) { x.stop(); }); } catch (e) {} if (m.parentNode) m.remove(); }
      function handle(raw) {
        if (finished) return; var c = parse(raw);
        if (!c) { say('wrong', true); return; }
        finished = true; stop(); if (CFG.onCode) CFG.onCode(c);
      }
      m.querySelector('#apoqx').onclick = stop;
      var qf = m.querySelector('#apoqf');
      m.querySelector('#apoqp').onclick = function () { qf.click(); };
      qf.onchange = function () {
        var f = qf.files && qf.files[0]; if (!f) return; say('loading');
        var done = function (src) { decodeQr(src).then(function (raw) { if (raw == null) say('img', true); else handle(raw); }).catch(function () { say('nodec', true); }); };
        if (window.createImageBitmap) createImageBitmap(f).then(done).catch(function () { say('img', true); });
        else { var im = new Image(); im.onload = function () { done(im); }; im.onerror = function () { say('img', true); }; im.src = URL.createObjectURL(f); }
      };
      function camErr(e) { var n = e && e.name; say(n === 'NotFoundError' || n === 'OverconstrainedError' ? 'none' : (n === 'NotReadableError' ? 'busy' : 'deny'), true); }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say('unsup', true); return; }
      say('scanning');
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).catch(function (e) {
        if (e && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        throw e;
      }).then(function (st) {
        if (!document.body.contains(m)) { st.getTracks().forEach(function (x) { x.stop(); }); return; }
        stream = st; v.srcObject = st; v.setAttribute('playsinline', 'true'); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        tm = setInterval(function () {
          if (!document.body.contains(m)) { stop(); return; }
          if (busy || v.readyState < 2) return; busy = true;
          decodeQr(v).then(function (raw) { busy = false; if (raw != null) handle(raw); }).catch(function (e) { busy = false; if (e && e.message === 'nodecoder') { clearInterval(tm); say('nodec', true); } });
        }, 300);
      }).catch(camErr);
    });
  }

  /* ---------- تثبيت كتطبيق ---------- */
  var deferred = null, KEY = 'apo_inst_no_' + (CFG.kind || 'p');
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function hideBar(remember) { var b = document.getElementById('instbar'); if (b) b.remove(); if (remember) { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} } }
  function showBar(mode) {
    if (document.getElementById('instbar') || standalone()) return;
    try { var dn = parseInt(localStorage.getItem(KEY) || '0', 10); if (dn && Date.now() - dn < 3 * 86400000) return; } catch (e) {}
    var t = L(), b = document.createElement('div'); b.id = 'instbar';
    b.style.cssText = 'position:fixed;inset-inline:12px;bottom:12px;max-width:520px;margin:0 auto;background:var(--card,#fff);color:var(--ink,#111);border:1.5px solid var(--brand,#15507f);border-radius:16px;padding:10px 12px;display:flex;gap:10px;align-items:center;justify-content:space-between;z-index:45;box-shadow:0 8px 30px rgba(0,0,0,.35);font-size:14px';
    b.innerHTML = (mode === 'btn' ? '<button type="button" id="instgo" style="flex:1;border:0;border-radius:12px;padding:11px;font-size:15px;font-weight:700;background:var(--brand,#15507f);color:#fff;cursor:pointer">📲 ' + esc(t.inst) + '</button>' : '<span>' + esc(mode === 'ios' ? t.iosinst : t.manual) + '</span>') +
      '<button type="button" id="instx" aria-label="x" style="border:0;background:transparent;color:inherit;font-size:18px;cursor:pointer;padding:4px 8px">✕</button>';
    document.body.appendChild(b);
    document.getElementById('instx').onclick = function () { hideBar(true); };
    var g = document.getElementById('instgo');
    if (g) g.onclick = function () { if (!deferred) return; deferred.prompt(); deferred.userChoice.then(function () { deferred = null; hideBar(false); }).catch(function () {}); };
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; hideBar(false); showBar('btn'); });
  window.addEventListener('appinstalled', function () { hideBar(false); toast(L().instdone); });
  window.addEventListener('load', function () {
    try { if (CFG.sw && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register(CFG.sw).catch(function () {}); } catch (e) {}
    // iOS: لا يوجد beforeinstallprompt ← تعليمات يدوية. المتصفحات الأخرى: إن لم يصل حدث التثبيت خلال 4 ثوانٍ نعرض الإرشاد اليدوي.
    setTimeout(function () {
      if (standalone() || deferred) return;
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) showBar('ios');
      else if (/android/i.test(navigator.userAgent)) setTimeout(function () { if (!deferred) showBar('manual'); }, 2500);
    }, 1500);
  });

  window.APO_PWA = { scan: scan, label: function () { return L().scan; }, parse: parse };
})();
