'use strict';
/* ============================================================
   فحص الإنترنت والجهاز (Stream quality check)
   - يقيس: الـ Ping + سرعة الرفع (Upload) + أداء الجهاز (FPS الفعلي للعرض + عدد الأنوية + الذاكرة).
   - يقترح: جودة البث (Bitrate) + عدد الإطارات (FPS) + مستوى ضغط المعالج.
   - مصمم بدون تعليق: كل شي async مع مهلة زمنية (Timeout) وزر إلغاء، ولا فيه أي حلقات ثقيلة تجمّد الواجهة.
   - ما يشتغل أثناء البث (عشان ما يخرّب البث).
   ============================================================ */
(() => {
  const UP_URL = 'https://speed.cloudflare.com/__up';
  const PING_URL = 'https://speed.cloudflare.com/__down?bytes=0';
  const BITRATES = [1500, 2500, 3500, 4500, 6000, 8000, 10000, 12000, 15000, 20000, 25000, 30000];
  const UP_MS = 6000;            // مدة قياس الرفع
  const HARD_CAP_MS = 20000;     // أقصى مدة للفحص كله
  const CHUNK = 512 * 1024;      // حجم كل دفعة رفع

  Object.assign(I18N.ar, {
    fpsLbl: 'عدد الإطارات في الثانية (FPS)', encLbl: 'مستوى ضغط المعالج (الجودة مقابل الحمل على الجهاز)',
    encFast: 'خفيف جداً - للأجهزة الضعيفة', encSuper: 'خفيف - أداء سريع', encBal: 'متوازن (موصى به)', encQ: 'جودة أعلى - يحتاج جهاز قوي',
    ncT: 'فحص الإنترنت والجهاز',
    ncNote: 'يقيس سرعة رفع الإنترنت وأداء جهازك، ثم يقترح لك أفضل جودة بث بدون تقطيع. أوقف أي تحميل أو رفع ثاني أثناء الفحص (يستغرق حوالي 15 ثانية).',
    ncRun: 'ابدأ الفحص', ncAgain: 'أعد الفحص', ncCancel: 'إلغاء الفحص',
    ncPing: 'استجابة الإنترنت (Ping)', ncUp: 'سرعة الرفع', ncFps: 'أداء الجهاز (FPS فعلي)', ncCpu: 'المعالج / الذاكرة',
    ncRecT: 'التوصية', ncApply: 'تطبيق التوصية', ncApplied: 'تم تطبيق التوصية — اضغط \"حفظ\" لتثبيتها',
    ncPingS: 'قياس استجابة الإنترنت...', ncUpS: 'قياس سرعة الرفع...', ncDevS: 'فحص أداء الجهاز...', ncDone: 'اكتمل الفحص',
    ncLive: 'البث شغال الآن — أوقف البث أولاً ثم شغّل الفحص (حتى ما ينقطع البث).',
    ncNetFail: 'تعذر قياس سرعة الإنترنت (ممكن الاتصال ضعيف أو محجوب). تقدر تختار الجودة يدوياً من القوائم فوق. نتيجة فحص الجهاز ظاهرة تحت.',
    ncCancelled: 'تم إلغاء الفحص',
    ncWeakNet: '⚠ رفع الإنترنت ضعيف جداً — حتى أقل جودة ممكن تتقطع. جرّب كابل شبكة بدل الواي فاي.',
    ncWeakPc: '⚠ جهازك ضعيف للبث بجودة عالية — أغلق البرامج الثانية وخفّف الصور والفيديوهات في المشهد.',
    ncUnstable: 'الاتصال غير مستقر، لذلك اخترنا جودة أقل لضمان بث بدون تقطيع.',
    ncQExc: 'ممتاز', ncQGood: 'جيد', ncQMid: 'متوسط', ncQBad: 'ضعيف',
    ncRecLine: 'الدقة: <b>{res}</b> · الجودة: <b>{br} kbps</b> · الإطارات: <b>{fps} fps</b> · الضغط: <b>{enc}</b>'
  });
  Object.assign(I18N.en, {
    fpsLbl: 'Frames per second (FPS)', encLbl: 'CPU load level (quality vs. load on your PC)',
    encFast: 'Very light - for weak PCs', encSuper: 'Light - fast performance', encBal: 'Balanced (recommended)', encQ: 'Higher quality - needs a strong PC',
    ncT: 'Internet & device check',
    ncNote: 'Measures your upload speed and your PC performance, then suggests the best stream quality without lag. Stop any other download/upload during the test (about 15 seconds).',
    ncRun: 'Start check', ncAgain: 'Check again', ncCancel: 'Cancel check',
    ncPing: 'Internet response (Ping)', ncUp: 'Upload speed', ncFps: 'Device performance (real FPS)', ncCpu: 'CPU / Memory',
    ncRecT: 'Recommendation', ncApply: 'Apply recommendation', ncApplied: 'Recommendation applied - press \"Save\" to keep it',
    ncPingS: 'Measuring internet response...', ncUpS: 'Measuring upload speed...', ncDevS: 'Checking device performance...', ncDone: 'Check finished',
    ncLive: 'You are live - stop the stream first, then run the check (so the stream is not interrupted).',
    ncNetFail: 'Could not measure internet speed (the connection may be weak or blocked). You can pick the quality manually from the lists above. The device result is shown below.',
    ncCancelled: 'Check cancelled',
    ncWeakNet: '⚠ Your upload is very weak - even the lowest quality may stutter. Try a network cable instead of Wi-Fi.',
    ncWeakPc: '⚠ Your PC is weak for high-quality streaming - close other programs and use fewer images/videos in the scene.',
    ncUnstable: 'The connection is unstable, so a lower quality was chosen to keep the stream smooth.',
    ncQExc: 'Excellent', ncQGood: 'Good', ncQMid: 'Fair', ncQBad: 'Weak',
    ncRecLine: 'Resolution: <b>{res}</b> · Quality: <b>{br} kbps</b> · Frames: <b>{fps} fps</b> · Compression: <b>{enc}</b>'
  });

  const NC = { running: false, ctl: null, res: null, rec: null, timer: null };
  const sleep = (ms, sig) => new Promise(res => { const h = setTimeout(res, ms); if(sig) sig.addEventListener('abort', () => { clearTimeout(h); res(); }, { once: true }); });
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const encName = v => t(v === 'ultrafast' ? 'encFast' : v === 'superfast' ? 'encSuper' : v === 'faster' ? 'encQ' : 'encBal');
  const resName = r => r === 2160 ? '4K' : r === 1440 ? '2K' : r + 'p';

  /* ---------- UI helpers ---------- */
  function setBar(p){ $('ncBar').hidden = p == null; if(p != null) $('ncBarI').style.width = Math.max(0, Math.min(100, p)) + '%'; }
  function setStep(txt){ const s = $('ncStep'); s.hidden = !txt; s.textContent = txt || ''; }
  function setRunning(on){
    NC.running = on;
    $('ncRun').hidden = on; $('ncStop').hidden = !on;
    $('ncRunT').textContent = t(NC.res ? 'ncAgain' : 'ncRun');
    if(!on){ setBar(null); setStep(''); }
  }

  /* ---------- 1) Ping ---------- */
  async function measurePing(sig){
    const times = [];
    for(let i = 0; i < 6 && !sig.aborted; i++){
      const c = new AbortController(), tm = setTimeout(() => c.abort(), 2500);
      sig.addEventListener('abort', () => c.abort(), { once: true });
      const t0 = performance.now();
      try{ await fetch(PING_URL + '&r=' + Math.random(), { cache: 'no-store', signal: c.signal }); if(i > 0) times.push(performance.now() - t0); }   // أول طلب (اتصال جديد) نتجاهله
      catch(e){ /* تجاهل */ }
      clearTimeout(tm);
      setBar(4 + i * 3);
      await sleep(60, sig);
    }
    return times.length ? { ms: Math.round(med(times)), jitter: Math.round(Math.max(...times) - Math.min(...times)) } : null;
  }

  /* ---------- 2) Upload ---------- */
  function makeChunk(){
    const buf = new Uint8Array(CHUNK), seed = new Uint8Array(65536);
    crypto.getRandomValues(seed);
    for(let o = 0; o < CHUNK; o += seed.length) buf.set(seed.subarray(0, Math.min(seed.length, CHUNK - o)), o);
    return new Blob([buf]);
  }
  async function measureUpload(sig, from, to){
    const blob = makeChunk(), samples = [], t0 = performance.now();
    let bytes = 0, fails = 0;
    async function worker(){
      while(!sig.aborted && performance.now() - t0 < UP_MS && fails < 3){
        const c = new AbortController(), tm = setTimeout(() => c.abort(), 4500);
        sig.addEventListener('abort', () => c.abort(), { once: true });
        const s0 = performance.now();
        try{
          const r = await fetch(UP_URL, { method: 'POST', body: blob, cache: 'no-store', signal: c.signal });
          await r.arrayBuffer().catch(() => {});
          const dt = (performance.now() - s0) / 1000;
          if(dt > 0){ bytes += CHUNK; samples.push((CHUNK * 8 / 1e6) / dt); }
        }catch(e){ if(!sig.aborted) fails++; }
        clearTimeout(tm);
      }
    }
    const tick = setInterval(() => setBar(from + (to - from) * Math.min(1, (performance.now() - t0) / UP_MS)), 200);
    try{ await Promise.all([worker(), worker(), worker()]); } finally { clearInterval(tick); }
    const secs = (performance.now() - t0) / 1000;
    if(!bytes || samples.length < 2) return null;
    const avg = (bytes * 8 / 1e6) / secs;                 // Mbps إجمالي فعلي
    const sorted = samples.slice().sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.2)];    // الأبطأ 20% = مقياس الثبات
    return { mbps: avg, stable: low >= avg * 0.5 / 3 };     // العمال 3 متوازيين، فالسرعة الواحدة ≈ avg/3
  }

  /* ---------- 3) Device ---------- */
  function rafFps(sig, ms){
    return new Promise(res => {
      let n = 0, t0 = performance.now();
      const step = now => {
        n++;
        if(sig.aborted || now - t0 >= ms) return res(n / ((now - t0) / 1000));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  async function measureDevice(sig, from, to){
    const out = [], t0 = performance.now(), TOTAL = 3300;
    const tick = setInterval(() => setBar(from + (to - from) * Math.min(1, (performance.now() - t0) / TOTAL)), 150);
    const raf = rafFps(sig, 1600);                           // سرعة عرض واجهة البرنامج
    for(let i = 0; i < 3 && !sig.aborted; i++){              // FPS الحقيقي لمحرك المشهد (نفس الرقم اللي بالشريط السفلي)
      await sleep(1100, sig);
      const v = parseInt(($('fps').textContent || '').replace(/[^\d]/g, ''), 10);
      if(!isNaN(v)) out.push(v);
    }
    const ui = await raf; clearInterval(tick);
    const scene = out.length ? out.reduce((a, b) => a + b, 0) / out.length : 0;
    return { scene: Math.round(scene), ui: Math.round(ui), cores: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0 };
  }

  /* ---------- Recommendation ---------- */
  function recommend(net, dev){
    let br = 3500, fps = 30, res = 720, enc = 'veryfast', warns = [], unstable = false;
    if(net){
      const cap = net.mbps * 1000 * 0.65;                    // نستخدم 65% فقط من الرفع (هامش أمان)
      let pick = BITRATES[0]; BITRATES.forEach(b => { if(b <= cap) pick = b; });
      br = pick; unstable = !net.stable;
      if(unstable && br > BITRATES[0]) br = BITRATES[Math.max(0, BITRATES.indexOf(br) - 1)];
      if(cap < 1200) warns.push('ncWeakNet');
    }
    const weak = dev.scene && (dev.scene < 20 || dev.cores > 0 && dev.cores <= 2);
    const mid = dev.scene && (dev.scene < 27 || dev.cores > 0 && dev.cores <= 4);
    const strong = dev.cores >= 8 && dev.scene >= 29, ultra = dev.cores >= 12 && dev.scene >= 29;
    // الدقة والإطارات حسب الرفع أولاً ثم قدرة الجهاز
    if(br >= 25000) { res = 2160; fps = 60; } else if(br >= 20000) { res = 2160; fps = 30; }
    else if(br >= 12000) { res = 1440; fps = 60; } else if(br >= 10000) { res = 1440; fps = 30; }
    else if(br >= 8000) { res = 1080; fps = 60; } else if(br >= 6000) { res = 1080; fps = 30; }
    else if(br >= 4500) { res = 720; fps = 60; } else { res = 720; fps = 30; }
    if(weak){ enc = 'ultrafast'; fps = 30; res = 720; br = Math.min(br, 3500); warns.push('ncWeakPc'); }
    else if(mid){ enc = 'veryfast'; if(res > 1080) res = 1080; if(res >= 1080) fps = 30; br = Math.min(br, res === 1080 ? 6000 : 4500); }
    else if(!ultra && res > 1440){ res = 1440; }
    if(!weak && res >= 2160) enc = 'ultrafast'; else if(!weak && res >= 1440) enc = 'superfast'; else if(strong && !weak && res <= 1080 && fps === 30) enc = 'faster';
    return { br, fps, res, enc, warns, unstable };
  }
  function qualityOf(net, dev, rec){
    let score = 3;
    if(net){ if(net.mbps * 1000 * 0.65 < 1500) score = 0; else if(net.mbps * 1000 * 0.65 < 3000) score = Math.min(score, 1); else if(net.mbps * 1000 * 0.65 < 4500) score = Math.min(score, 2); }
    if(dev.scene && dev.scene < 20) score = Math.min(score, 0); else if(dev.scene && dev.scene < 27) score = Math.min(score, 1);
    return ['ncQBad', 'ncQMid', 'ncQGood', 'ncQExc'][score];
  }

  /* ---------- Render result ---------- */
  function cardCls(v, good, mid){ return v >= good ? 'nc-q-good' : v >= mid ? 'nc-q-mid' : 'nc-q-bad'; }
  function showResult(net, dev, rec, netFailed){
    const el = $('ncRes'); el.hidden = false;
    const ping = net && net.ping;
    const cells = [];
    cells.push(`<div class="nc-c ${ping ? cardCls(-ping.ms, -80, -180) : ''}"><small>${esc(t('ncPing'))}</small><b>${ping ? ping.ms + ' ms' : '–'}</b></div>`);
    cells.push(`<div class="nc-c ${net && net.up ? cardCls(net.up.mbps, 6, 3) : ''}"><small>${esc(t('ncUp'))}</small><b>${net && net.up ? net.up.mbps.toFixed(1) + ' Mbps' : '–'}</b></div>`);
    cells.push(`<div class="nc-c ${cardCls(dev.scene, 28, 20)}"><small>${esc(t('ncFps'))}</small><b>${dev.scene || '–'} fps</b></div>`);
    cells.push(`<div class="nc-c"><small>${esc(t('ncCpu'))}</small><b>${dev.cores || '–'} cores${dev.mem ? ' · ' + dev.mem + '+ GB' : ''}</b></div>`);
    const warns = rec.warns.map(k => `<div class="nc-warn">${esc(t(k))}</div>`).join('') + (netFailed ? `<div class="nc-warn">${esc(t('ncNetFail'))}</div>` : '') + (rec.unstable ? `<div class="nc-warn">${esc(t('ncUnstable'))}</div>` : '');
    cells.push(`<div class="nc-rec"><b>${esc(t('ncRecT'))}: ${esc(t(qualityOf(net && net.up, dev, rec)))}</b><br>${t('ncRecLine', { res: resName(rec.res), br: rec.br, fps: rec.fps, enc: esc(encName(rec.enc)) })}</div>`);
    cells.push(warns);
    cells.push(`<button class="save nc-apply" id="ncApply" type="button"><i data-ic="check"></i><span>${esc(t('ncApply'))}</span></button>`);
    el.innerHTML = cells.join('');
    paintIcons();
    $('ncApply').onclick = applyRec;
  }
  function applyRec(){
    const r = NC.rec; if(!r) return;
    if(window.SQ) SQ.set({ res: r.res, fps: r.fps, br: r.br, enc: r.enc });
    toast('✔ ' + t('ncApplied'), 5000);
  }

  /* ---------- Run ---------- */
  async function run(){
    if(NC.running) return;
    if(typeof live !== 'undefined' && live){ toast(t('ncLive'), 6000); return; }
    const ctl = new AbortController(), sig = ctl.signal; NC.ctl = ctl;
    clearTimeout(NC.timer); NC.timer = setTimeout(() => ctl.abort(), HARD_CAP_MS + 4000);
    $('ncRes').hidden = true; setRunning(true); setBar(0);
    let ping = null, up = null;
    try{
      setStep(t('ncPingS')); ping = await measurePing(sig);
      if(!sig.aborted){ setStep(t('ncUpS')); up = await measureUpload(sig, 22, 75); }
      if(!sig.aborted){ setStep(t('ncDevS')); }
      const dev = sig.aborted ? null : await measureDevice(sig, 75, 100);
      if(sig.aborted || !dev){ toast(t('ncCancelled')); setRunning(false); return; }
      const net = (ping || up) ? { ping, up } : null;
      const rec = recommend(up, dev);
      NC.res = { net, dev }; NC.rec = rec;
      setRunning(false); showResult(net, dev, rec, !up);
      applyRec();                                         // نعبّي القوائم بالتوصية تلقائياً (بدون حفظ)
    }catch(e){
      setRunning(false); toast('❌ ' + (e && e.message || e), 5000);
    }finally{ clearTimeout(NC.timer); NC.ctl = null; if(NC.running) setRunning(false); }
  }
  $('ncRun').onclick = run;
  $('ncStop').onclick = () => { if(NC.ctl) NC.ctl.abort(); };

  /* ---------- hooks ---------- */
  const _applyI18n = applyI18n;
  applyI18n = function(){ _applyI18n(); try{ if(!NC.running) $('ncRunT').textContent = t(NC.res ? 'ncAgain' : 'ncRun'); if(NC.res && !$('ncRes').hidden) showResult(NC.res.net, NC.res.dev, NC.rec, !(NC.res.net && NC.res.net.up)); }catch(e){} };
  $('ncRunT').textContent = t('ncRun');
  applyI18n();
})();
