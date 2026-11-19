/* APO staff portals — shared core (login by personal code → real Supabase session → same RLS as the desktop/mobile app).
   Each portal page sets window.APO_STAFF_CFG and calls APO_STAFF.start(). No secrets here: only the public (publishable) key. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://ijhkzkufnewlkuxoqcim.supabase.co';
  var ANON_KEY = 'sb_publishable_0X9fbtIUmWVwb4GunSbt6A_v72zvU1M';
  var IDLE_MIN = 20;
  var CFG = window.APO_STAFF_CFG || {};
  var ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

  /* ---------- i18n ---------- */
  var T = {
    ar: { scanning: 'جارٍ البحث عن QR…', scanpick: '📷 التقط صورة للـ QR', scanjs: 'هذا المتصفح لا يدعم المسح المباشر. أضف ملف jsqr.min.js إلى مجلد البوابات أو اكتب الكود.', scansecure: 'المسح يتطلب اتصالاً آمناً (https).', scandeny: 'رُفض إذن الكاميرا: فعّله من إعدادات المتصفح ثم أعد المحاولة.', scannone: 'لا توجد كاميرا في هذا الجهاز.', scanbusy: 'الكاميرا مستخدمة من تطبيق آخر. أغلقه وأعد المحاولة.', scanimg: 'لم أجد QR في الصورة. قرّب البطاقة وأعد التصوير.', instbtn: '📲 ثبّت التطبيق', iosinst: 'للتثبيت: اضغط زر المشاركة ⬆ ثم «إضافة إلى الشاشة الرئيسية».', instdone: 'تم تثبيت التطبيق.', scan: 'مسح QR البطاقة', scanunsup: 'مسح QR غير مدعوم في هذا المتصفح. اكتب الكود يدوياً.', scancam: 'تعذّر فتح الكاميرا. اسمح بها أو اكتب الكود.', scanwrong: 'هذا QR ليس لبطاقة موظف.', scanhint: 'وجّه الكاميرا إلى QR على بطاقتك', install: 'ثبّت البوابة على الشاشة الرئيسية من قائمة المتصفح', photo: 'صورة العمل', nophoto: 'لا صورة لهذه الحالة.', photoerr: 'تعذّر تحميل الصورة.', signin: 'دخول', code: 'الكود الشخصي', codeph: 'اكتب كودك', logout: 'خروج', refresh: 'تحديث', loading: 'جارٍ التحميل…', badcode: 'الكود غير صحيح. تأكد من كتابته.', wrongrole: 'هذا الكود ليس لهذه البوابة.', failed: 'تعذّر الدخول. تأكد من الكود أو أن حسابك مفعّل.', neterr: 'تعذّر الاتصال. حاول مرة أخرى.', session: 'انتهت الجلسة. ادخل من جديد.', idle: 'أُغلقت الجلسة بعد خمول. ادخل من جديد.', suspended: 'حسابك موقوف. راجع مدير المعمل.', notfound: 'لا يوجد حساب بهذا الكود.', updated: 'آخر تحديث', done: 'تم', cancel: 'إلغاء', save: 'حفظ', notes: 'ملاحظات', note: 'ملاحظة', none: 'لا شيء', search: 'بحث…', account: 'حساب', foot: 'APO Digital Lab', theme: 'الثيم', sessinfo: 'جلسة خاصة تُغلق بعد 20 دقيقة خمول', received: 'مستلمة', design: 'تصميم', milling: 'قيد التصنيع', trial: 'في التجربة', finishing: 'تشطيب', ready: 'جاهزة', delivered: 'مسلّمة', cancelled: 'ملغاة', crown: 'تاج', bridge: 'جسر', veneer: 'فينير', denture: 'طقم كامل', partial: 'طقم جزئي', implant: 'زرعة', nightguard: 'واقي ليلي', ortho: 'جهاز تقويم', other: 'أخرى', st_pending: 'بانتظار البدء', st_working: 'قيد العمل', st_trial: 'في التجربة', st_done: 'تمت', due: 'الاستحقاق', patient: 'المريض', worktype: 'النوع', status: 'الحالة', teeth: 'الأسنان', shade: 'اللون', material: 'المادة', remake: 'إعادة تصنيع' },
    en: { scanning: 'Looking for a QR…', scanpick: '📷 Take a photo of the QR', scanjs: 'This browser cannot scan live. Add jsqr.min.js to the portals folder or type the code.', scansecure: 'Scanning needs a secure (https) connection.', scandeny: 'Camera permission denied: enable it in the browser settings and retry.', scannone: 'No camera on this device.', scanbusy: 'The camera is used by another app. Close it and retry.', scanimg: 'No QR found in the photo. Move closer and retake.', instbtn: '📲 Install the app', iosinst: 'To install: tap the Share button ⬆ then “Add to Home Screen”.', instdone: 'App installed.', scan: 'Scan card QR', scanunsup: 'QR scanning is not supported in this browser. Type the code.', scancam: 'Could not open the camera. Allow it or type the code.', scanwrong: 'This QR is not an employee card.', scanhint: 'Point the camera at the QR on your card', install: 'Add this portal to your home screen from the browser menu', photo: 'Work photo', nophoto: 'No photo for this case.', photoerr: 'Could not load the photo.', signin: 'Sign in', code: 'Personal code', codeph: 'Enter your code', logout: 'Sign out', refresh: 'Refresh', loading: 'Loading…', badcode: 'Invalid code. Check how you typed it.', wrongrole: 'This code is not for this portal.', failed: 'Could not sign in. Check the code or that your account is active.', neterr: 'Connection failed. Try again.', session: 'Session ended. Sign in again.', idle: 'Signed out after inactivity. Sign in again.', suspended: 'Your account is suspended. Contact the lab manager.', notfound: 'No account for this code.', updated: 'Last updated', done: 'Done', cancel: 'Cancel', save: 'Save', notes: 'Notes', note: 'Note', none: 'None', search: 'Search…', account: 'Account', foot: 'APO Digital Lab', theme: 'Theme', sessinfo: 'Private session, closes after 20 min idle', received: 'Received', design: 'Design', milling: 'In production', trial: 'In trial', finishing: 'Finishing', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled', crown: 'Crown', bridge: 'Bridge', veneer: 'Veneer', denture: 'Full denture', partial: 'Partial denture', implant: 'Implant', nightguard: 'Night guard', ortho: 'Ortho appliance', other: 'Other', st_pending: 'Waiting', st_working: 'In progress', st_trial: 'In trial', st_done: 'Done', due: 'Due', patient: 'Patient', worktype: 'Type', status: 'Status', teeth: 'Teeth', shade: 'Shade', material: 'Material', remake: 'Remake' },
    fr: { scanning: 'Recherche du QR…', scanpick: '📷 Photographier le QR', scanjs: 'Ce navigateur ne peut pas scanner en direct. Ajoutez jsqr.min.js au dossier des portails ou saisissez le code.', scansecure: 'Le scan exige une connexion sécurisée (https).', scandeny: 'Accès caméra refusé : activez-le dans les réglages du navigateur puis réessayez.', scannone: 'Aucune caméra sur cet appareil.', scanbusy: 'La caméra est utilisée par une autre application. Fermez-la et réessayez.', scanimg: 'Aucun QR trouvé dans la photo. Rapprochez-vous et reprenez.', instbtn: '📲 Installer l’application', iosinst: 'Pour installer : touchez Partager ⬆ puis « Sur l’écran d’accueil ».', instdone: 'Application installée.', scan: 'Scanner le QR de la carte', scanunsup: 'Scan QR non pris en charge par ce navigateur. Saisissez le code.', scancam: 'Caméra inaccessible. Autorisez-la ou saisissez le code.', scanwrong: 'Ce QR n’est pas une carte d’employé.', scanhint: 'Dirigez la caméra vers le QR de votre carte', install: 'Ajoutez ce portail à l’écran d’accueil depuis le menu du navigateur', photo: 'Photo du travail', nophoto: 'Aucune photo pour ce cas.', photoerr: 'Impossible de charger la photo.', signin: 'Connexion', code: 'Code personnel', codeph: 'Saisissez votre code', logout: 'Déconnexion', refresh: 'Actualiser', loading: 'Chargement…', badcode: 'Code invalide. Vérifiez la saisie.', wrongrole: "Ce code n'est pas pour ce portail.", failed: 'Connexion impossible. Vérifiez le code ou que votre compte est actif.', neterr: 'Connexion échouée. Réessayez.', session: 'Session terminée. Reconnectez-vous.', idle: 'Déconnecté après inactivité. Reconnectez-vous.', suspended: 'Votre compte est suspendu. Contactez le gérant.', notfound: 'Aucun compte pour ce code.', updated: 'Dernière mise à jour', done: 'OK', cancel: 'Annuler', save: 'Enregistrer', notes: 'Notes', note: 'Note', none: 'Aucun', search: 'Rechercher…', account: 'Compte', foot: 'APO Digital Lab', theme: 'Thème', sessinfo: "Session privée, fermée après 20 min d'inactivité", received: 'Reçu', design: 'Conception', milling: 'En production', trial: 'En essayage', finishing: 'Finition', ready: 'Prêt', delivered: 'Livré', cancelled: 'Annulé', crown: 'Couronne', bridge: 'Bridge', veneer: 'Facette', denture: 'Prothèse complète', partial: 'Prothèse partielle', implant: 'Implant', nightguard: 'Gouttière', ortho: 'Appareil ortho', other: 'Autre', st_pending: 'En attente', st_working: 'En cours', st_trial: 'En essayage', st_done: 'Terminée', due: 'Échéance', patient: 'Patient', worktype: 'Type', status: 'Statut', teeth: 'Dents', shade: 'Teinte', material: 'Matériau', remake: 'Refonte' }
  };
  var lang = 'ar';
  function t(k) { return (T[lang] && T[lang][k]) || (T.en && T.en[k]) || k; }
  function addStrings(extra) { for (var l in extra) { T[l] = T[l] || {}; for (var k in extra[l]) T[l][k] = extra[l][k]; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  /* ---------- code ---------- */
  function chk(s) { var tt = 0; for (var i = 1; i <= s.length; i++) { var ch = s.charAt(i - 1); var v = ALPHA.indexOf(ch); if (v < 0) v = ch === '0' ? 30 : ch === '1' ? 29 : 0; tt = (tt + v * i) % 31; } return ALPHA.charAt(tt); }
  function codeOk(c) { return !!c && c.length >= 7 && /^[0-9A-HJKMNP-Z]+$/.test(c) && chk(c.slice(0, -1)) === c.slice(-1); }
  function normCode(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function loginEmail(code) { var l = code.toLowerCase(); return code.length === 20 ? 'c' + l + '@chk.apo-lab.net' : code.length === 18 ? 'a' + l + '@acct.apo-lab.net' : 't' + l + '@tech.apo-lab.net'; }

  /* ---------- session ---------- */
  var SKEY = 'apo_staff_sess_' + (CFG.role || 'x');
  var sess = null, lastAct = Date.now(), idleTimer = null;
  function saveSess() { ssSet(SKEY, JSON.stringify(sess)); }
  function loadSess() { try { var s = JSON.parse(ssGet(SKEY) || 'null'); if (s && s.access) sess = s; } catch (e) {} }
  function jwtUid(tok) { try { var p = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(atob(p)).sub; } catch (e) { return null; } }
  function hdrs(extra) { var h = { apikey: ANON_KEY, 'Content-Type': 'application/json' }; h.Authorization = 'Bearer ' + (sess ? sess.access : ANON_KEY); if (extra) for (var k in extra) h[k] = extra[k]; return h; }

  function authCall(grant, body) {
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=' + grant, { method: 'POST', headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }
  function setTokens(j) { sess = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, uid: jwtUid(j.access_token) }; saveSess(); }
  function refreshTok() {
    if (!sess || !sess.refresh) return Promise.reject(new Error('nosess'));
    return authCall('refresh_token', { refresh_token: sess.refresh }).then(function (r) { if (!r.ok) throw new Error('nosess'); setTokens(r.j); });
  }
  function ensureFresh() { return sess && sess.exp - Date.now() < 60000 ? refreshTok() : Promise.resolve(); }

  function api(method, path, body, extraHdr) {
    return ensureFresh().then(function () {
      return fetch(SUPABASE_URL + '/rest/v1/' + path, { method: method, headers: hdrs(extraHdr), body: body === undefined ? undefined : JSON.stringify(body) });
    }).then(function (r) {
      if (r.status === 401) { return refreshTok().then(function () { return fetch(SUPABASE_URL + '/rest/v1/' + path, { method: method, headers: hdrs(extraHdr), body: body === undefined ? undefined : JSON.stringify(body) }); }).catch(function () { logout('session'); throw new Error('session'); }); }
      return r;
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.text().then(function (txt) {
        var j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
        if (!r.ok) { var e = new Error((j && (j.message || j.hint)) || ('HTTP ' + r.status)); e.status = r.status; e.body = j; throw e; }
        return j;
      });
    });
  }
  function get(path) { return api('GET', path); }
  /* ملف من Storage الخاص (جلسة المستخدم نفسها؛ الخادم يقيّد القراءة بمجلد معمله) → Blob */
  function fetchBlob(bucket, path) {
    return ensureFresh().then(function () {
      return fetch(SUPABASE_URL + '/storage/v1/object/authenticated/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'), { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + sess.access } });
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); });
  }
  /* رفع ملف إلى Storage الخاص بجلسة المستخدم (الخادم يفرض المجلد وموافقة المدير والحجم والنوع) */
  function uploadBlob(bucket, path, blob, contentType) {
    return ensureFresh().then(function () {
      return fetch(SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'POST', headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + sess.access, 'Content-Type': contentType, 'x-upsert': 'true' }, body: blob });
    }).then(function (r) { if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return true; });
  }
  function post(table, row) { return api('POST', table, row, { Prefer: 'return=minimal' }); }
  function patch(path, row) { return api('PATCH', path, row, { Prefer: 'return=minimal' }); }
  function rpc(name, args) { return api('POST', 'rpc/' + name, args || {}); }
  function logActivity(action, entityId, details, label, entity) {
    // نفس سجل التطبيق (activity_log). فشل التسجيل لا يعطّل العمل.
    var me = CFG._me || {};
    post('activity_log', { action: action, entity: entity || 'case', entity_id: entityId || null, entity_label: label || null, details: ('[portal] ' + (details || '')).trim(), actor_name: me.name || null, actor_role: CFG.role }).catch(function () {});
  }

  /* ---------- UI helpers ---------- */
  var root;
  function $(id) { return document.getElementById(id); }
  function applyTheme(m) { document.documentElement.setAttribute('data-theme', m); lsSet('apo_staff_theme', m); }
  function curTheme() { var a = document.documentElement.getAttribute('data-theme'); if (a) return a; return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function applyLang(l) { lang = l; lsSet('apo_staff_lang', l); document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; document.title = (CFG.title && CFG.title[l]) || 'APO'; }
  function toolsHtml() {
    var h = '';
    ['ar', 'en', 'fr'].forEach(function (l) { h += '<button data-lang="' + l + '" class="' + (lang === l ? 'on' : '') + '">' + l.toUpperCase() + '</button>'; });
    h += '<button data-theme-btn="1" title="' + esc(t('theme')) + '">' + (curTheme() === 'dark' ? '☀️' : '🌙') + '</button>';
    return h;
  }
  function bindTools(rerender) {
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.onclick = function () { applyLang(b.getAttribute('data-lang')); rerender(); }; });
    var tb = document.querySelector('[data-theme-btn]'); if (tb) tb.onclick = function () { applyTheme(curTheme() === 'dark' ? 'light' : 'dark'); rerender(); };
  }
  var toastT;
  function toast(msg, bad) { var el = document.createElement('div'); el.className = 'toast' + (bad ? ' bad' : ''); el.textContent = msg; document.body.appendChild(el); clearTimeout(toastT); setTimeout(function () { el.remove(); }, bad ? 5000 : 2600); }
  function modal(html, onBind) { var m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div>' + html + '</div>'; m.addEventListener('click', function (e) { if (e.target === m) m.remove(); }); document.body.appendChild(m); if (onBind) onBind(m); return m; }
  function fmtDate(s) { if (!s) return '—'; try { var d = new Date(s); if (isNaN(d)) return String(s).slice(0, 10); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); } catch (e) { return '—'; } }
  function fmtTime(d) { d = d || new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  var STATUS_COL = { received: '#6b7c93', design: '#7e57c2', milling: '#1e88e5', trial: '#06b6d4', finishing: '#f59e0b', ready: '#16a34a', delivered: '#0f766e', cancelled: '#dc2626' };
  function pill(status) { return '<span class="pill" style="background:' + (STATUS_COL[status] || '#64748b') + '">' + esc(t(status)) + '</span>'; }

  /* ---------- screens ---------- */
  function loginScreen(msg) {
    root.innerHTML = '<div class="wrap"><header><h1>' + esc((CFG.title && CFG.title[lang]) || 'APO') + '</h1><div class="tools">' + toolsHtml() + '</div></header>' +
      '<div class="card"><div style="text-align:center;font-size:42px">' + (CFG.icon || '🔐') + '</div>' +
      '<div class="sub" style="text-align:center;margin:4px 0 12px">' + esc(t('sessinfo')) + '</div>' +
      '<label class="sub">' + esc(t('code')) + '</label><input class="code" id="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + esc(t('codeph')) + '">' +
      '<button class="btn block" id="go">' + esc(t('signin')) + '</button><button class="btn alt block" id="scan">📷 ' + esc(t('scan')) + '</button><div class="err" id="msg">' + esc(msg || '') + '</div></div><footer>' + esc(t('foot')) + '</footer></div>';
    bindTools(function () { loginScreen(msg); });
    var inp = $('code'), go = $('go');
    $('scan').onclick = function () { scanQr(function (c) { inp.value = c; go.click(); }); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') go.click(); };
    go.onclick = function () {
      var c = normCode(inp.value), m = $('msg'); m.textContent = '';
      if (!codeOk(c)) { m.textContent = t('badcode'); return; }
      if (c.length !== CFG.codeLen) { m.textContent = t('wrongrole'); return; }
      go.disabled = true; go.innerHTML = '<span class="spin">⟳</span> ' + esc(t('loading'));
      authCall('password', { email: loginEmail(c), password: 'APO-' + c }).then(function (r) {
        if (!r.ok) { go.disabled = false; go.textContent = t('signin'); m.textContent = t('failed'); return; }
        setTokens(r.j); lastAct = Date.now(); enter();
      }).catch(function () { go.disabled = false; go.textContent = t('signin'); m.textContent = t('neterr'); });
    };
  }
  /* ---------- مسح QR بطاقة الموظف (APO-TECH: / APO-ACCT: / APO-CHK:) ----------
     يعمل على كل المتصفحات: BarcodeDetector الأصلي إن وُجد (كروم)، وإلا مكتبة jsQR المحلية (ملف jsqr.min.js بجانب الصفحات)،
     وفي الحالتين بديل «التقط صورة للـ QR». القراءة محلية بالكامل: لا يُرفع شيء، ولا يوضع الكود في رابط. */
  var jsqrP = null;
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (jsqrP) return jsqrP;
    jsqrP = new Promise(function (res) { var s = document.createElement('script'); s.src = 'jsqr.min.js'; s.onload = function () { res(window.jsQR || null); }; s.onerror = function () { res(null); }; document.head.appendChild(s); });
    return jsqrP;
  }
  function parseCard(raw) { var mm = /APO-(TECH|ACCT|CHK):([A-Za-z0-9\- ]+)/i.exec(String(raw || '')); return mm ? normCode(mm[2]) : null; }
  var nativeBroken = false;
  /* يفكّ QR من فيديو/صورة: يعيد النص أو null. يرمي 'nodecoder' إن لم يتوفر أي مفكّك. */
  function decodeQr(src) {
    var w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height;
    if (!w || !h) return Promise.resolve(null);
    var k = Math.min(1, 1024 / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(src, 0, 0, cw, ch);
    function viaJs() {
      return loadJsQR().then(function (lib) {
        if (!lib) throw new Error('nodecoder');
        var d = cx.getImageData(0, 0, cw, ch), r = lib(d.data, cw, ch, { inversionAttempts: 'attemptBoth' });
        return r && r.data ? r.data : null;
      });
    }
    if ('BarcodeDetector' in window && !nativeBroken) {
      var det; try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { nativeBroken = true; return viaJs(); }
      return det.detect(cv).then(function (r) { return r && r.length ? String(r[0].rawValue || '') : null; }).catch(function () { nativeBroken = true; return viaJs(); });
    }
    return viaJs();
  }
  function scanQr(onCode) {
    if (!window.isSecureContext) { toast(t('scansecure'), true); return; }
    var hasNative = 'BarcodeDetector' in window;
    loadJsQR().then(function (lib) {
      if (!hasNative && !lib) { toast(t('scanjs'), true); return; }
      var m = modal('<div class="sub" style="text-align:center">' + esc(t('scanhint')) + '</div><video id="qv" playsinline muted autoplay style="width:100%;border-radius:12px;margin:8px 0;background:#000;max-height:48vh"></video><div class="sub" id="qs" style="text-align:center;min-height:20px"></div>' +
        '<input type="file" id="qf" accept="image/*" capture="environment" style="display:none"><button class="btn alt block" id="qp">' + esc(t('scanpick')) + '</button><button class="btn alt block" id="qx" style="margin-top:8px">' + esc(t('cancel')) + '</button>');
      var v = m.querySelector('#qv'), qs = m.querySelector('#qs'), stream = null, tm = null, busy = false, finished = false;
      function say(k, bad) { qs.textContent = k ? t(k) : ''; qs.style.color = bad ? 'var(--bad)' : ''; }
      function stop() { clearInterval(tm); try { if (stream) stream.getTracks().forEach(function (x) { x.stop(); }); } catch (e) {} if (m.parentNode) m.remove(); }
      function handle(raw) {
        if (finished) return; var code = parseCard(raw);
        if (!code) { say('scanwrong', true); return; }
        finished = true; stop(); onCode(code);
      }
      m.querySelector('#qx').onclick = stop;
      var qf = m.querySelector('#qf');
      m.querySelector('#qp').onclick = function () { qf.click(); };
      qf.onchange = function () {
        var f = qf.files && qf.files[0]; if (!f) return; say('loading');
        var done = function (src) { decodeQr(src).then(function (raw) { if (raw == null) say('scanimg', true); else handle(raw); }).catch(function () { say('scanjs', true); }); };
        if (window.createImageBitmap) createImageBitmap(f).then(done).catch(function () { say('scanimg', true); });
        else { var im = new Image(); im.onload = function () { done(im); }; im.onerror = function () { say('scanimg', true); }; im.src = URL.createObjectURL(f); }
      };
      function camErr(e) { var n = e && e.name; say(n === 'NotAllowedError' || n === 'SecurityError' ? 'scandeny' : (n === 'NotFoundError' || n === 'OverconstrainedError' ? 'scannone' : (n === 'NotReadableError' ? 'scanbusy' : 'scandeny')), true); }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say('scanunsup', true); return; }
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
          decodeQr(v).then(function (raw) { busy = false; if (raw != null) handle(raw); }).catch(function (e) { busy = false; if (e && e.message === 'nodecoder') { clearInterval(tm); say('scanjs', true); } });
        }, 300);
      }).catch(camErr);
    });
  }
  /* ---------- تثبيت البوابة كتطبيق (PWA) ---------- */
  var deferredInstall = null;
  function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function hideInstall(remember) { var b = document.getElementById('instbar'); if (b) b.remove(); if (remember) { try { localStorage.setItem('apo_inst_no', '1'); } catch (e) {} } }
  function showInstall(ios) {
    if (document.getElementById('instbar') || isStandalone()) return;
    try { if (localStorage.getItem('apo_inst_no') === '1') return; } catch (e) {}
    var b = document.createElement('div'); b.id = 'instbar';
    b.innerHTML = (ios ? '<span>' + esc(t('iosinst')) + '</span>' : '<button class="btn" id="instgo">' + esc(t('instbtn')) + '</button>') + '<button class="x" id="instx" aria-label="x">✕</button>';
    document.body.appendChild(b);
    document.getElementById('instx').onclick = function () { hideInstall(true); };
    var g = document.getElementById('instgo');
    if (g) g.onclick = function () { if (!deferredInstall) return; deferredInstall.prompt(); deferredInstall.userChoice.then(function () { deferredInstall = null; hideInstall(false); }).catch(function () {}); };
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; showInstall(false); });
  window.addEventListener('appinstalled', function () { hideInstall(false); toast(t('instdone')); });
  window.addEventListener('load', function () { setTimeout(function () { if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone()) showInstall(true); }, 1500); });

  function logout(reason) { sess = null; ssDel(SKEY); clearInterval(idleTimer); loginScreen(reason ? t(reason) : ''); }

  function enter() {
    root.innerHTML = '<div class="wrap"><div class="empty"><span class="spin">⟳</span> ' + esc(t('loading')) + '</div></div>';
    Promise.resolve(CFG.identify ? CFG.identify(ctx) : null).then(function (ok) {
      if (ok && ok.error) { var k = ok.error; sess = null; ssDel(SKEY); loginScreen(t(k)); return; }
      startIdle(); show();
    }).catch(function (e) { if (e && e.message === 'session') return; sess = null; ssDel(SKEY); loginScreen(t('neterr')); });
  }
  function startIdle() {
    clearInterval(idleTimer);
    idleTimer = setInterval(function () { if (Date.now() - lastAct > IDLE_MIN * 60000) logout('idle'); }, 30000);
  }
  ['click', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { lastAct = Date.now(); }, { passive: true }); });

  var ctx = { t: t, esc: esc, get: get, blob: fetchBlob, upload: uploadBlob, post: post, patch: patch, rpc: rpc, toast: toast, modal: modal, fmtDate: fmtDate, fmtTime: fmtTime, pill: pill, addStrings: addStrings, logActivity: logActivity, lang: function () { return lang; }, uid: function () { return sess && sess.uid; }, cfg: CFG, STATUS_COL: STATUS_COL };

  var loading = false;
  function show() {
    if (loading) return; loading = true;
    var prev = root.firstChild; // keep UI while refreshing
    Promise.resolve(CFG.load(ctx)).then(function (data) {
      loading = false;
      var head = '<div class="wrap"><header><div><h1>' + esc((CFG.title && CFG.title[lang]) || 'APO') + '</h1><div class="who">' + esc((CFG._me && CFG._me.name) || '') + (CFG._lab ? ' · ' + esc(CFG._lab) : '') + '</div></div><div class="tools">' + toolsHtml() +
        '<button id="rf">⟳ ' + esc(t('refresh')) + '</button><button id="lo">' + esc(t('logout')) + '</button></div></header><div class="who" id="upd">' + esc(t('updated')) + ': ' + fmtTime() + '</div><div id="body"></div><footer>' + esc(t('foot')) + '</footer></div>';
      root.innerHTML = head;
      bindTools(function () { show(); });
      $('rf').onclick = function () { var b = $('rf'); b.innerHTML = '<span class="spin">⟳</span> ' + esc(t('loading')); show(); };
      $('lo').onclick = function () { logout(); };
      function rerender() { show(); }
      CFG.render(ctx, data, $('body'), show, rerender);
    }).catch(function (e) {
      loading = false;
      if (e && e.message === 'session') return;
      toast((e && e.message) || t('neterr'), true);
      var rf = $('rf'); if (rf) rf.innerHTML = '⟳ ' + esc(t('refresh'));
      if (!prev || !$('body')) { root.innerHTML = '<div class="wrap"><div class="err">' + esc(t('neterr')) + '</div><div style="text-align:center"><button class="btn" onclick="location.reload()">' + esc(t('refresh')) + '</button></div></div>'; }
    });
  }

  function start() {
    root = document.getElementById('app');
    try { if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('staff_sw.js').catch(function () {}); } catch (e) {}
    var sl = lsGet('apo_staff_lang'); applyLang(sl && T[sl] ? sl : 'ar');
    var th = lsGet('apo_staff_theme'); if (th) document.documentElement.setAttribute('data-theme', th);
    loadSess();
    if (sess) { lastAct = Date.now(); enter(); } else loginScreen('');
  }
  window.APO_STAFF = { start: start, ctx: ctx };
})();
