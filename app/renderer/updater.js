'use strict';
/* التحديثات: فحص GitHub عند الفتح وكل 30 دقيقة. زر "تحديث الآن" يحمّل الملفات الجديدة في مجلد التثبيت الذي اخترته (من السيتب)،
   ويعرض التقدّم هنا داخل البرنامج، ثم يقفل البرنامج ويفتحه من جديد تلقائياً — لا شيء غير ذلك.
   Updates: checks GitHub on start and every 30 min. "Update now" downloads the new files into the install folder chosen in Setup,
   shows progress inside the app, then closes and re-opens it automatically. */
(() => {
  const TX = {
    ar: {
      title: 'يوجد تحديث جديد', sub: 'حدّث البرنامج للحصول على أحدث الميزات والإصلاحات.', cur: 'إصدارك الحالي', nw: 'الإصدار الجديد',
      btn: 'تحديث الآن', later: 'لاحقاً', note: 'سيُحمَّل التحديث، ثم يُغلق البرنامج ويُعاد فتحه تلقائياً.',
      live: '⚠ أنت في بث مباشر الآن — التحديث سيقطع البث. يُفضّل إنهاء البث أولاً.',
      ptitle: 'جاري تحديث البرنامج', pdl: 'جاري تحميل التحديث…', pready: 'اكتمل التحميل — جاري إعادة تشغيل البرنامج…', pnote: 'لا تُغلق الجهاز. سيُعاد فتح البرنامج تلقائياً.',
      pfail: 'تعذّر إكمال التحديث', pfailSub: 'تحقق من الإنترنت ثم أعد المحاولة. برنامجك الحالي ما زال يعمل كما هو.', retry: 'إعادة المحاولة', close: 'إغلاق',
      dl: 'تحميل النسخة الجديدة', dlNote: 'نسختك غير مثبّتة بملف StreamExtra-Setup.exe، لذلك التحديث التلقائي غير متاح. حمّل الملف الجديد وثبّته.'
    },
    en: {
      title: 'A new update is available', sub: 'Update the app to get the latest features and fixes.', cur: 'Current version', nw: 'New version',
      btn: 'Update now', later: 'Later', note: 'The update is downloaded, then the app closes and re-opens automatically.',
      live: '⚠ You are live right now — updating will cut the stream. Stop the stream first.',
      ptitle: 'Updating the app', pdl: 'Downloading the update…', pready: 'Download complete — restarting the app…', pnote: 'Please wait. The app will re-open automatically.',
      pfail: 'The update could not be completed', pfailSub: 'Check your internet and try again. Your current app is still working as before.', retry: 'Try again', close: 'Close',
      dl: 'Download the new version', dlNote: 'This copy was not installed with StreamExtra-Setup.exe, so automatic update is not available. Download the new file and install it.'
    }
  };

  Object.assign(I18N.ar, {
    updTab: 'التحديثات', grpAbout: 'حول البرنامج', pg_updates: 'إصدارك الحالي، وآخر إصدار متوفر، وفحص التحديثات.',
    updCur: 'إصدارك الحالي', updCurDate: 'تاريخ إصدارك', updLatest: 'آخر إصدار متوفر', updLatestDate: 'تاريخ الإصدار الجديد',
    updChecked: 'آخر فحص', updNext: 'الفحص التلقائي القادم', updCheckBtn: 'فحص التحديثات', updChecking: 'جاري الفحص…', updRunBtn: 'تحديث الآن',
    updPillOk: 'أنت على آخر إصدار', updPillNew: 'يوجد تحديث جديد', updPillErr: 'تعذّر الفحص', updPillWait: 'جاري الفحص…',
    updNoSetup: 'التحديث التلقائي يعمل فقط للنسخة المثبّتة بملف StreamExtra-Setup.exe.', updAuto: 'يفحص البرنامج GitHub تلقائياً عند الفتح وكل 30 دقيقة.',
    updNewSub: 'اضغط «تحديث الآن» — سيُحمَّل التحديث ويُعاد فتح البرنامج تلقائياً.',
    updNone: '—', updIn: 'بعد', updMin: 'دقيقة', updNow: 'الآن', updDateUnknown: 'غير معروف',
    updNotes: 'ما الجديد', updSrc: 'مصدر الفحص', updRetry: 'إعادة المحاولة',
    updErrOffline: 'لا يوجد اتصال بالإنترنت أو أن GitHub غير متاح حالياً. تأكد من الاتصال ثم أعد المحاولة.',
    updErrTimeout: 'انتهت مهلة الاتصال. الشبكة بطيئة، أعد المحاولة بعد قليل.',
    updErrNotfound: 'ملف app/package.json غير موجود على GitHub (فرع main). تأكد أنك رفعت «محتوى» مجلد GitHub_Upload وليس المجلد نفسه، وأنك ضغطت Commit changes.', updTried: 'تفاصيل الفحص',
    updErrHttp: 'رد الخادم برمز خطأ غير متوقع. أعد المحاولة لاحقاً.', updErrBad: 'ملف الإصدار على الخادم غير صالح.'
  });
  Object.assign(I18N.en, {
    updTab: 'Updates', grpAbout: 'About', pg_updates: 'Your version, the latest release, and update check.',
    updCur: 'Your current version', updCurDate: 'Your version date', updLatest: 'Latest available version', updLatestDate: 'New version release date',
    updChecked: 'Last checked', updNext: 'Next automatic check', updCheckBtn: 'Check for updates', updChecking: 'Checking…', updRunBtn: 'Update now',
    updPillOk: 'You are up to date', updPillNew: 'Update available', updPillErr: 'Check failed', updPillWait: 'Checking…',
    updNoSetup: 'Automatic update only works for the copy installed with StreamExtra-Setup.exe.', updAuto: 'The app checks GitHub automatically on start and every 30 minutes.',
    updNewSub: 'Press “Update now” — the update downloads and the app re-opens automatically.',
    updNone: '—', updIn: 'in', updMin: 'min', updNow: 'now', updDateUnknown: 'Unknown',
    updNotes: "What's new", updSrc: 'Checked via', updRetry: 'Try again',
    updErrOffline: 'No internet connection, or GitHub is currently unreachable. Check your connection and try again.',
    updErrTimeout: 'The connection timed out. Your network is slow, try again in a moment.',
    updErrNotfound: 'app/package.json was not found on GitHub (main branch). Make sure you uploaded the CONTENTS of GitHub_Upload (not the folder itself) and pressed Commit changes.', updTried: 'Check details',
    updErrHttp: 'The server answered with an unexpected error. Try again later.', updErrBad: 'The release file on the server is invalid.'
  });

  const css = `
  #seUpd{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:var(--ovl,rgba(0,0,0,.6));backdrop-filter:blur(5px)}
  #seUpd .box{width:460px;max-width:92vw;max-height:92vh;overflow:auto;background:var(--panel);color:var(--txt);border:1px solid var(--line2);border-radius:20px;box-shadow:var(--shm);padding:30px 28px 22px;text-align:center;position:relative}
  #seUpd .box:before{content:"";position:absolute;inset:0 0 auto 0;height:4px;border-radius:20px 20px 0 0;background:linear-gradient(90deg,var(--ac-d,var(--ac)),var(--ac-h,var(--ac)))}
  #seUpd .ic{width:62px;height:62px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;font-size:28px;color:var(--on-ac,#fff);background:linear-gradient(135deg,var(--ac-h),var(--ac));box-shadow:0 8px 24px rgba(var(--ac-rgb,161,20,44),.35)}
  #seUpd .ic.spin{animation:updpulse 1.4s ease-in-out infinite}
  @keyframes updpulse{50%{transform:scale(1.07);box-shadow:0 8px 30px rgba(var(--ac-rgb,161,20,44),.55)}}
  #seUpd h2{margin:0 0 6px;font-size:20px}
  #seUpd p{margin:0 0 16px;opacity:.75;font-size:13.5px;line-height:1.6}
  #seUpd .vers{display:flex;gap:10px;align-items:stretch;justify-content:center;margin-bottom:16px}
  #seUpd .vers div{flex:1;border:1px solid var(--line2);border-radius:12px;padding:10px 6px;font-size:12px;background:var(--well,transparent)}
  #seUpd .vers b{display:block;font-size:20px;margin-top:3px;direction:ltr}
  #seUpd .vers .n{border-color:var(--ac)}
  #seUpd .vers .n b{color:var(--ac-t,var(--ac))}
  #seUpd .vers .ar{display:grid;place-items:center;flex:none;width:22px;border:0;background:none;padding:0;opacity:.5;font-size:16px}
  #seUpd .warn{display:none;margin:0 0 14px;padding:9px 11px;border-radius:9px;background:rgba(255,170,0,.14);border:1px solid rgba(255,170,0,.4);font-size:12.5px;line-height:1.5}
  #seUpd .go{width:100%;padding:12px;border:0;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;color:var(--on-ac,#fff);background:linear-gradient(135deg,var(--ac-h),var(--ac))}
  #seUpd .go:hover{filter:brightness(1.08)}
  #seUpd .sec{width:100%;padding:11px;border:1px solid var(--line2);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;background:var(--panel2,transparent);color:inherit;margin-top:8px}
  #seUpd .later{margin-top:8px;background:none;border:0;color:inherit;opacity:.6;cursor:pointer;font-size:12.5px;padding:6px 10px}
  #seUpd .later:hover{opacity:1}
  #seUpd .note{margin-top:12px;font-size:11.5px;opacity:.55;line-height:1.5}
  #seUpd .pbar{height:10px;border-radius:99px;background:var(--panel3,rgba(255,255,255,.08));overflow:hidden;margin:6px 0 8px}
  #seUpd .pbar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,var(--ac-d,var(--ac)),var(--ac-h,var(--ac)));transition:width .35s ease}
  #seUpd .pct{font-size:22px;font-weight:800;direction:ltr;margin-bottom:2px}
  #seUpd .ps{font-size:13px;opacity:.8;min-height:20px}
  .upd-notes{text-align:start;margin:0 0 14px;padding:11px 14px;border-radius:12px;background:var(--well,rgba(255,255,255,.04));border:1px solid var(--line,rgba(255,255,255,.08));font-size:12.5px;line-height:1.65}
  .upd-notes b{display:block;margin-bottom:4px;font-size:12px;opacity:.85}
  .upd-notes ul{margin:0;padding-inline-start:18px}
  #mUpdates [hidden],.upd-dot[hidden]{display:none!important}
  #mUpdates .upd-hero{display:flex;align-items:center;gap:14px;padding:16px;margin:0 0 12px;border-radius:16px;border:1px solid var(--line);background:var(--well);position:relative;overflow:hidden}
  #mUpdates .upd-hero:before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--mut)}
  #mUpdates .upd-hero.ok:before{background:#3ddc84}#mUpdates .upd-hero.warn:before{background:#ffb020}#mUpdates .upd-hero.bad:before{background:#ff6b80}
  #mUpdates .upd-hero .hi{width:50px;height:50px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:23px;font-weight:800;background:var(--panel3,var(--panel));color:var(--mut)}
  #mUpdates .upd-hero.ok .hi{background:rgba(61,220,132,.15);color:#3ddc84}
  #mUpdates .upd-hero.warn .hi{background:rgba(255,176,32,.16);color:#ffb020}
  #mUpdates .upd-hero.bad .hi{background:rgba(255,107,128,.16);color:#ff6b80}
  #mUpdates .upd-hero .ht{min-width:0;flex:1}
  #mUpdates .upd-hero .ht b{display:block;font-size:15.5px}
  #mUpdates .upd-hero .ht small{display:block;margin-top:3px;opacity:.72;line-height:1.55;font-size:12.5px}
  #mUpdates .upd-vs{display:flex;align-items:center;gap:7px;flex:none;direction:ltr;font-weight:800;font-size:13px}
  #mUpdates .upd-vs i{font-style:normal;padding:4px 10px;border-radius:99px;background:var(--panel3,var(--panel));border:1px solid var(--line2)}
  #mUpdates .upd-vs i.n{background:rgba(255,176,32,.14);border-color:rgba(255,176,32,.5);color:#ffb020}
  #mUpdates .upd-vs u{text-decoration:none;opacity:.5}
  #mUpdates .upd-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 10px}
  #mUpdates .upd-tile{padding:13px 14px;border-radius:14px;border:1px solid var(--line);background:var(--well)}
  #mUpdates .upd-tile.new{border-color:rgba(255,176,32,.55)}
  #mUpdates .upd-tile.ok{border-color:rgba(61,220,132,.4)}
  #mUpdates .upd-tile span{display:block;font-size:11.5px;color:var(--mut);font-weight:700}
  #mUpdates .upd-tile b{display:block;font-size:23px;margin:4px 0 2px;direction:ltr;text-align:start}
  #mUpdates .upd-tile small{display:block;font-size:12px;color:var(--mut)}
  #mUpdates .upd-act{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 8px}
  #mUpdates .upd-act .sbtn{padding:9px 16px;font-size:13px}
  #mUpdates .upd-act .sbtn.on{background:linear-gradient(135deg,var(--ac-h,var(--ac)),var(--ac));color:var(--on-ac,#fff);border-color:var(--ac)}
  #mUpdates .upd-act .sbtn.spin svg{animation:updspin .9s linear infinite}
  @keyframes updspin{to{transform:rotate(360deg)}}
  .upd-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ffb020;margin-inline-start:auto;box-shadow:0 0 0 3px rgba(255,176,32,.25)}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'seUpd'; document.body.appendChild(el);

  const lg = () => { try { return lang === 'en' ? 'en' : 'ar'; } catch (e) { return document.documentElement.lang === 'en' ? 'en' : 'ar'; } };
  const L = () => TX[lg()];
  const g = id => document.getElementById(id);
  const tt = k => (typeof t === 'function' ? t(k) : k);
  const esc2 = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let dismissed = false, last = null, checking = false, updating = false;
  const EV = 30 * 60 * 1000;

  const notesOf = i => { const n = i && i.notes; if (!n) return []; const a = n[lg()] || n.ar || n.en; return Array.isArray(a) ? a.slice(0, 8) : []; };
  const notesHtml = (i, title) => { const a = notesOf(i); return a.length ? `<div class="upd-notes"><b>${esc2(title)}</b><ul>${a.map(v => '<li>' + esc2(v) + '</li>').join('')}</ul></div>` : ''; };

  /* ---------- النافذة: السؤال ← التقدّم ← الخطأ ---------- */
  function show(info) {
    const x = L();
    el.dir = lg() === 'ar' ? 'rtl' : 'ltr';
    el.innerHTML = `<div class="box">
      <div class="ic">⬇</div>
      <h2>${x.title}</h2><p>${x.sub}</p>
      <div class="vers"><div>${x.cur}<b>${esc2(info.current)}</b></div><div class="ar">${lg() === 'ar' ? '←' : '→'}</div><div class="n">${x.nw}<b>${esc2(info.latest)}</b></div></div>
      ${notesHtml(info, tt('updNotes'))}
      <div class="warn" id="seUpdWarn">${x.live}</div>
      <button class="go" id="seUpdGo">${info.canUpdate ? x.btn : x.dl}</button>
      <div><button class="later" id="seUpdLater">${x.later}</button></div>
      <div class="note">${info.canUpdate ? x.note : x.dlNote}</div></div>`;
    el.style.display = 'flex';
    if (document.body.classList.contains('live')) el.querySelector('#seUpdWarn').style.display = 'block';
    el.querySelector('#seUpdLater').onclick = () => { dismissed = true; el.style.display = 'none'; };
    el.querySelector('#seUpdGo').onclick = info.canUpdate ? startUpdate : () => {
      try { window.open('https://github.com/' + (info.repo || 'wwadewa17-netizen/StreamExtra') + '/raw/main/StreamExtra-Setup.exe'); } catch (e) {}
      el.style.display = 'none';
    };
  }

  function showProgress() {
    const x = L();
    el.dir = lg() === 'ar' ? 'rtl' : 'ltr';
    el.innerHTML = `<div class="box">
      <div class="ic spin">⬇</div>
      <h2>${x.ptitle}</h2>
      <div class="pct" id="seUpdPct">0%</div>
      <div class="pbar"><i id="seUpdBar"></i></div>
      <div class="ps" id="seUpdSt">${x.pdl}</div>
      <div class="note">${x.pnote}</div></div>`;
    el.style.display = 'flex';
  }

  function showError(detail) {
    const x = L();
    updating = false;
    el.innerHTML = `<div class="box">
      <div class="ic" style="background:linear-gradient(135deg,#ff6b80,#a1142c)">!</div>
      <h2>${x.pfail}</h2><p>${x.pfailSub}</p>
      <button class="go" id="seUpdRetry">${x.retry}</button>
      <button class="sec" id="seUpdClose">${x.close}</button></div>`;
    el.style.display = 'flex';
    el.querySelector('#seUpdRetry').onclick = startUpdate;
    el.querySelector('#seUpdClose').onclick = () => { el.style.display = 'none'; };
  }

  async function startUpdate() {
    if (updating) return;
    updating = true; showProgress();
    let r; try { r = await api.updateRun(); } catch (e) { r = { ok: false }; }
    if (!r || !r.ok) showError();
  }

  if (api.onUpdateProgress) api.onUpdateProgress(p => {
    if (!updating || !p) return;
    const bar = g('seUpdBar'), pct = g('seUpdPct'), s = g('seUpdSt'), x = L();
    if (p.state === 'error') { showError(p.msg); return; }
    const v = p.state === 'ready' ? 1 : Math.min(0.99, (Number(p.pct) || 0) / 0.95);
    if (bar) bar.style.width = Math.round(v * 100) + '%';
    if (pct) pct.textContent = Math.round(v * 100) + '%';
    if (s) s.textContent = p.state === 'ready' ? x.pready : x.pdl;
  });

  /* ---------- صفحة "التحديثات" في الإعدادات ---------- */
  function fmtDate(d) {
    if (!d) return tt('updDateUnknown');
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); const dt = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString(lg() === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  const fmtTime = ms => new Date(ms).toLocaleTimeString(lg() === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
  function errText(e) {
    e = String(e || '');
    if (e === 'timeout') return tt('updErrTimeout');
    if (e === 'notfound') return tt('updErrNotfound');
    if (/^http/.test(e)) return tt('updErrHttp');
    if (e === 'badjson') return tt('updErrBad');
    return tt('updErrOffline');
  }

  function paintPage() {
    const rows = g('updRows'); if (!rows) return;
    const i = last, pill = g('updPill'), hero = g('updHero');
    g('updCheckT').textContent = checking ? tt('updChecking') : (i && i.error ? tt('updRetry') : tt('updCheckBtn'));
    g('updCheckBtn').disabled = checking;
    g('updCheckBtn').classList.toggle('spin', checking);
    g('updRunT').textContent = tt('updRunBtn');
    if (!i) {
      pill.textContent = tt('updPillWait'); pill.className = 'sp-pill'; rows.innerHTML = '';
      hero.className = 'upd-hero'; hero.innerHTML = `<span class="hi">…</span><span class="ht"><b>${esc2(tt('updChecking'))}</b></span>`;
      g('updNotes').innerHTML = ''; g('updRunBtn').hidden = true; return;
    }
    const err = !!i.error, newer = !!i.available && !err;
    pill.textContent = err ? tt('updPillErr') : newer ? tt('updPillNew') : tt('updPillOk');
    pill.className = 'sp-pill ' + (err ? 'bad' : newer ? 'warn' : 'ok');
    hero.className = 'upd-hero ' + (err ? 'bad' : newer ? 'warn' : 'ok');
    const hT = err ? tt('updPillErr') : newer ? tt('updPillNew') : tt('updPillOk');
    const hS = err ? errText(i.error) : newer ? (i.canUpdate ? tt('updNewSub') : tt('updNoSetup')) : (i.canUpdate ? tt('updAuto') : tt('updNoSetup'));
    const vs = newer ? `<span class="upd-vs"><i>${esc2(i.current)}</i><u>→</u><i class="n">${esc2(i.latest)}</i></span>` : '';
    hero.innerHTML = `<span class="hi">${err ? '!' : newer ? '⬇' : '✓'}</span><span class="ht"><b>${esc2(hT)}</b><small>${esc2(hS)}</small></span>${vs}`;
    const mins = Math.max(0, Math.round((i.checkedAt + EV - Date.now()) / 60000));
    const tiles = `<div class="upd-tiles">
      <div class="upd-tile"><span>${esc2(tt('updCur'))}</span><b>${esc2(i.current)}</b><small>${esc2(fmtDate(i.currentDate))}</small></div>
      <div class="upd-tile ${err ? '' : newer ? 'new' : 'ok'}"><span>${esc2(tt('updLatest'))}</span><b>${esc2(err ? tt('updNone') : i.latest)}</b><small>${esc2(err ? tt('updNone') : fmtDate(i.latestDate))}</small></div></div>`;
    const R = [[tt('updChecked'), fmtTime(i.checkedAt)], [tt('updNext'), mins <= 0 ? tt('updNow') : tt('updIn') + ' ' + mins + ' ' + tt('updMin')]];
    if (i.source && !err) R.push([tt('updSrc'), i.source]);
    if (i.tried && i.tried.length) R.push([tt('updTried'), i.tried.map(t => t.name + ': ' + (t.v || t.err || '-')).join('  |  ')]);
    rows.innerHTML = tiles + R.map(([k, v]) => `<div class="sp-r"><span>${esc2(k)}</span><b dir="ltr">${esc2(v)}</b></div>`).join('');
    g('updNotes').innerHTML = newer ? notesHtml(i, tt('updNotes')) : '';
    g('updRunBtn').hidden = !newer;
    g('updNote').textContent = '';
    const dot = g('updDot'); if (dot) dot.hidden = !newer;
  }

  async function check(manual) {
    if (checking || updating) return;
    checking = true; paintPage();
    try {
      const i = await api.updateCheck();
      if (i) { last = Object.assign({ checkedAt: Date.now() }, i); }
    } catch (e) { last = Object.assign(last || { current: '?', currentDate: '', latest: '?', latestDate: '', available: false, canUpdate: false }, { error: 'offline', checkedAt: Date.now() }); }
    checking = false; paintPage();
    if (last && last.available && !last.error && (manual || !dismissed)) show(last);
  }

  document.addEventListener('click', e => {
    if (e.target.closest('#updCheckBtn')) check(true);
    const rb = e.target.closest('#updRunBtn'); if (rb && !rb.disabled) { if (last && (!last.canUpdate || document.body.classList.contains('live'))) show(last); else startUpdate(); }
  });

  // عند فتح صفحة "التحديثات": نرسم آخر نتيجة، ونفحص إن لم يُفحص من قبل
  const _page = window.onSettingsPage;
  window.onSettingsPage = function (n) {
    if (_page) _page(n);
    if (n === 'updates') { paintPage(); if (!last || Date.now() - last.checkedAt > 60 * 1000) check(true); }
  };
  const _ai = applyI18n;
  applyI18n = function () { _ai(); try { paintPage(); } catch (e) {} };

  // updater.js يتحمّل بعد app.js، وكان البرنامج يترجم الواجهة قبل إضافة نصوص التحديثات، فكان زر/صفحة التحديثات تظهر بدون ترجمة.
  // الحل: نعيد تطبيق اللغة مرة وحدة بعد إضافة نصوصنا.
  try { applyI18n(); } catch (e) {}
  setTimeout(() => check(false), 1500);                 // عند فتح البرنامج
  setInterval(() => check(false), EV);                  // وكل نصف ساعة أثناء بقائه مفتوحاً
})();
