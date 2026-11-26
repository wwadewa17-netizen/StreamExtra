'use strict';
/* ============================================================
   لوحة منشئ Kick (v1.3.0) — صفحات Kick الرسمية داخل البرنامج بتصميم البرنامج
   كل تبويب يفتح رابط Kick الرسمي لحساب المستخدم المربوط (بدل اسم ثابت):
     الشات · معلومات الجلسة · موجز النشاط · إجراءات المشرف · معلومات البث · إجراءات القناة
   - نفس جلسة Kick المحفوظة: اللي يُكتب هنا يوصل Kick، واللي يُكتب في Kick يظهر هنا (الشات الرسمي نفسه).
   - تصميم الصفحات يتغير ليطابق الوضع الليلي/النهاري وألوان البرنامج.
   ============================================================ */
(() => {
  /* v1.3.0: كل التبويبات (الجلسة / النشاط / المشرف / القناة / معلومات البث) صارت واجهات داخل البرنامج بالكامل.
     بياناتها تُجلب من Kick عبر نوافذ مخفية (kick:dashTab في main.js) وتُعرض في kpanel.js — بدون صفحات Kick ظاهرة. فقط الشات له خيار "شات Kick الرسمي". */
  const PAGES = {
    chat:     { pane: 'kpChat',     url: s => `https://kick.com/popout/${s}/chat` }
  };
  const NATIVE_TABS = ['session', 'activity', 'mod', 'info', 'channel'];
  Object.assign(IC, {
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'
  });
  Object.assign(I18N.ar, { kdReload: 'تحديث الصفحة', kdOpen: 'فتح في نافذة', kdNeed: 'اربط حساب Kick أولاً (الإعدادات ← ربط Kick) لتظهر لوحة قناتك هنا.', kdNeedBtn: 'ربط Kick', kdLogin: 'تسجيل دخول Kick', kdNative: 'عرض الشات الداخلي', kdOfficial: 'عرض شات Kick' });
  Object.assign(I18N.en, { kdReload: 'Reload page', kdOpen: 'Open in window', kdNeed: 'Connect your Kick account first (Settings → Kick link) to show your channel panel here.', kdNeedBtn: 'Connect Kick', kdLogin: 'Kick login', kdNative: 'Show built-in chat', kdOfficial: 'Show Kick chat' });

  const D = { slug: '', views: {}, keys: {}, tab: 'chat', native: true };

  const parseSlug = v => {
    let x = String(v || '').trim().replace(/^https?:\/\//i, '').replace(/^(www\.)?(dashboard\.)?kick\.com\/?/i, '').replace(/[?#].*$/, '');
    const p = x.split('/').filter(Boolean); if (p[0] && /^(popout|video|videos|dashboard|categories)$/i.test(p[0])) p.shift();
    const s = (p[0] || '').toLowerCase(); return /^[a-z0-9_\-]+$/.test(s) ? s : '';
  };
  async function getSlug() {
    let c = null; try { c = await api.kickConfig(); } catch (e) {}
    if (!c) return '';
    return String((c.user && (c.user.slug || c.user.name)) || '').toLowerCase().replace(/\s+/g, '-') || parseSlug(c.channel);
  }

  /* ---------- CSS يطابق ألوان البرنامج ---------- */
  function css() {
    const g = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const light = document.documentElement.dataset.theme === 'light';
    const bg = g('--well') || (light ? '#f4f4f6' : '#0c0c0e'), panel = g('--panel2') || (light ? '#fff' : '#17171a');
    const txt = g('--txt') || (light ? '#111' : '#f4f4f5'), line = g('--line') || '#2a2a30', ac = g('--ac') || '#53fc18';
    return `
:root{color-scheme:${light ? 'light' : 'dark'}!important}
html,body{background:${bg}!important;color:${txt}!important;font-family:"Segoe UI",Tahoma,system-ui,sans-serif!important}
body{--background:${bg}!important}
[class*="bg-surface"],[class*="bg-black"],[class*="bg-secondary"],[class*="bg-gray"],[class*="bg-neutral"]{background-color:${panel}!important}
[class*="border"]{border-color:${line}!important}
[class*="rounded"],button,input,select,textarea{border-radius:10px!important}
input,select,textarea{background:${panel}!important;color:${txt}!important;border:1px solid ${line}!important;outline:none!important}
input:focus,select:focus,textarea:focus{border-color:${ac}!important;box-shadow:0 0 0 3px color-mix(in srgb,${ac} 22%,transparent)!important}
[class*="bg-green"],[class*="bg-primary"]{background-color:${ac}!important;color:#07120a!important}
[data-chat-entry]{background:transparent!important;margin:0!important;padding:3px 8px!important;border-radius:8px!important;line-height:1.55!important;overflow-wrap:anywhere!important}
[data-chat-entry]:hover{background:rgba(127,127,127,.14)!important}
::selection{background:color-mix(in srgb,${ac} 40%,transparent)}
::-webkit-scrollbar{width:9px;height:9px}::-webkit-scrollbar-thumb{background:rgba(127,127,127,.4);border-radius:8px}::-webkit-scrollbar-track{background:transparent}`;
  }
  async function style(k) {
    const wv = D.views[k]; if (!wv || !wv.__ready) return;
    try { if (D.keys[k]) { try { await wv.removeInsertedCSS(D.keys[k]); } catch (e) {} D.keys[k] = null; } D.keys[k] = await wv.insertCSS(css()); } catch (e) {}
  }
  const styleAll = () => Object.keys(D.views).forEach(style);
  new MutationObserver(() => setTimeout(styleAll, 80)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

  /* ---------- بناء الواجهة ---------- */
  function wrapFor(k) {
    const pane = $(PAGES[k].pane); if (!pane) return null;
    let w = pane.querySelector(':scope > .kd-wrap'); if (w) return w;
    w = document.createElement('div'); w.className = 'kd-wrap';
    w.innerHTML = `<div class="kd-bar"><span class="kd-slug" dir="ltr"></span><span class="kd-sp"></span>` +
      (k === 'chat' ? `<button type="button" class="icon-btn kd-sw" data-tt="kdNative">${ic('chat', 14)}</button>` : '') +
      `<button type="button" class="icon-btn kd-rl" data-tt="kdReload">${ic('refresh', 14)}</button>` +
      `<button type="button" class="icon-btn kd-ex" data-tt="kdOpen">${ic('ext', 14)}</button></div>` +
      `<div class="kd-body"><div class="kd-need" hidden><span>${esc(t('kdNeed'))}</span><button class="sbtn" type="button"><i>${ic('link', 14)}</i><span>${esc(t('kdNeedBtn'))}</span></button></div></div>`;
    pane.appendChild(w); pane.classList.add('kd-on');
    if (k === 'chat') { pane.classList.toggle('kd-native', D.native); const b0 = w.querySelector('.kd-sw'); if (b0) b0.classList.toggle('on', D.native); }
    w.querySelector('.kd-rl').onclick = () => { const v = D.views[k]; if (v) try { v.reload(); } catch (e) {} };
    w.querySelector('.kd-ex').onclick = () => { if (D.slug) api.kickOpenWeb(k === 'chat' ? 'popout' : 'dashboard'); };
    w.querySelector('.kd-need button').onclick = () => openSettings('kick');
    const sw = w.querySelector('.kd-sw'); if (sw) sw.onclick = () => { D.native = !D.native; pane.classList.toggle('kd-native', D.native); sw.classList.toggle('on', D.native); sync(); };
    return w;
  }
  function mount(k) {
    const w = wrapFor(k); if (!w) return;
    const bar = w.querySelector('.kd-slug'); bar.textContent = D.slug ? '@' + D.slug : '';
    const need = w.querySelector('.kd-need'); need.hidden = !!D.slug;
    const body = w.querySelector('.kd-body');
    if (!D.slug) { if (D.views[k]) { D.views[k].remove(); delete D.views[k]; } return; }
    const url = PAGES[k].url(D.slug);
    let wv = D.views[k];
    if (wv && wv.__url === url) return;
    if (wv) { wv.remove(); delete D.views[k]; }
    wv = document.createElement('webview');
    wv.setAttribute('partition', 'persist:streamextra-kickembed');
    wv.setAttribute('allowpopups', '');
    wv.className = 'kd-wv'; wv.__url = url; wv.__ready = false;
    wv.addEventListener('dom-ready', () => { wv.__ready = true; style(k); });
    wv.addEventListener('did-navigate', () => style(k));
    wv.addEventListener('did-navigate-in-page', () => style(k));
    wv.addEventListener('did-finish-load', () => style(k));
    wv.setAttribute('src', url);
    body.appendChild(wv); D.views[k] = wv;
  }
  function mountTab(k) {
    if (!PAGES[k]) return;
    if (k === 'chat' && D.native) { if (D.views.chat) { D.views.chat.remove(); delete D.views.chat; } return; }   // الشات: نظام البرنامج الداخلي (يقرأ من رابط شات Kick ويرسل إليه)
    mount(k);
  }


  /* ---------- قارئ الشات: نفس صفحة شات Kick الرسمية لكن مخفية، نسحب منها الرسائل ونعرضها بتصميم البرنامج ----------
     الصفحة تعمل بنفس جلسة Kick المحفوظة (اللي مرّت Cloudflare)، فكل رسالة تُكتب في Kick تظهر هنا فوراً. */
  const SCRAPE = `(function(){
    if(!window.__seInst){ window.__seInst = 1; window.__seQ = []; var seen = new Set(); var first = true;
      function txtOf(c){ var t=''; (function walk(n){ n.childNodes.forEach(function(x){ if(x.nodeType===3){ t+=x.textContent; } else if(x.nodeType===1){ var im = x.tagName==='IMG'?x:(x.querySelector&&x.querySelector('img')); var m = im&&/emotes\\/(\\d+)/.exec(im.getAttribute('src')||im.getAttribute('data-src')||''); if(m&&(x===im||!(x.textContent||'').trim())) t+='[emote:'+m[1]+':'+(im.getAttribute('alt')||im.getAttribute('title')||'emote')+']'; else if(x!==im&&x.childNodes.length&&x.querySelector('img')) walk(x); else t+=(x.getAttribute('alt')||x.getAttribute('title')||x.textContent||''); } }); })(c); return t.replace(/\\s+/g,' ').trim(); }
      function scan(){ document.querySelectorAll('[data-chat-entry]').forEach(function(el){
        var id = el.getAttribute('data-chat-entry'); if(!id || seen.has(id)) return;
        var u = el.querySelector('.chat-entry-username,[class*="chat-entry-username"],[class*="username"]'); var c = el.querySelector('.chat-entry-content,[class*="chat-entry-content"]');
        if(!u || !c) return; var t = txtOf(c); if(!t) return;
        seen.add(id); if(seen.size>800) seen.delete(seen.values().next().value);
        if(!first) window.__seQ.push({ id:id, user:(u.textContent||'').trim(), text:t, color:(u.style&&u.style.color)||'' }); }); first = false; }
      setInterval(scan, 400); scan();
    }
    return (window.__seQ||[]).splice(0);
  })()`;
  const R = { wv: null, slug: '', t: null };
  function readerStop() { clearInterval(R.t); R.t = null; if (R.wv) { R.wv.remove(); R.wv = null; } R.slug = ''; }
  function readerStart(slug) {
    if (!slug) return readerStop();
    if (R.wv && R.slug === slug) return;
    readerStop(); R.slug = slug;
    const wv = document.createElement('webview');
    wv.setAttribute('partition', 'persist:streamextra-kickembed');
    wv.setAttribute('src', `https://kick.com/popout/${slug}/chat`);
    wv.style.cssText = 'position:fixed;left:-9999px;top:0;width:420px;height:700px;opacity:0;pointer-events:none';
    let ready = false; wv.addEventListener('dom-ready', () => { ready = true; });
    wv.addEventListener('did-navigate', () => { ready = true; });
    document.body.appendChild(wv); R.wv = wv;
    let busy = false;
    R.t = setInterval(async () => {
      if (!ready || busy || R.wv !== wv) return; busy = true;
      try { const q = await wv.executeJavaScript(SCRAPE); if (Array.isArray(q) && window.KDom) q.forEach(m => window.KDom(m)); } catch (e) {}
      busy = false;
    }, 500);
  }

  async function sync() {
    const s = await getSlug();
    if (s !== D.slug) { D.slug = s; const c = $('kChan'); if (c && s) { c.textContent = '@' + s; c.hidden = false; } Object.keys(D.views).forEach(k => { if (k !== D.tab) { D.views[k].remove(); delete D.views[k]; } }); }
    mountTab(D.tab);
    readerStart(D.slug);
    if (D.slug && D.slug !== D.dashSlug) {          // v1.5: الجلسة ظاهرة دائماً بجانب الشات، فنجلب بياناتها من Kick مباشرة
      D.dashSlug = D.slug; D.dashTab = 'session';
      try { api.kickDashTab({ slug: D.slug, tab: 'session' }); } catch (e) {}
      try { if (window.KX && KX.tab) KX.tab('session'); } catch (e) {}
    }
    Object.keys(PAGES).forEach(k => { const w = wrapFor(k); if (w) { w.querySelector('.kd-slug').textContent = D.slug ? '@' + D.slug : ''; w.querySelector('.kd-need').hidden = !!D.slug; } });
  }

  document.querySelectorAll('#kTabs [data-kt]').forEach(b => b.addEventListener('click', () => { D.tab = b.dataset.kt; sync(); try { if (window.KX && KX.tab) KX.tab(D.tab); } catch (e) {} }));
  window.addEventListener('focus', () => sync());
  setInterval(sync, 4000);
  Object.keys(PAGES).forEach(wrapFor);
  sync();
  const _ai = applyI18n; applyI18n = function () { _ai(); try { document.querySelectorAll('.kd-need span:first-child').forEach(e => e.textContent = t('kdNeed')); } catch (e) {} };
})();
