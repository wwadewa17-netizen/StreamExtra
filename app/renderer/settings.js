'use strict';
/* ============================================================
   صفحات الإعدادات (v1.3.0)
   - الأزرار على اليمين، ولكل قسم صفحة كاملة بعنوان ووصف وأيقونة.
   - حفظ تلقائي لإعدادات البث (دقة / إطارات / Bitrate / تشفير / صوت / رابط ومفتاح) فور تغييرها،
     فما يصير أبداً أن تختار جودة ثم تبدأ البث بإعدادات قديمة.
   - «مراجعة وقياس»: قياس حقيقي من ffmpeg أثناء البث (الدقة المرسَلة فعلياً، الإطارات، البت ريت، الإطارات المتساقطة، السرعة)
     وشريط قياس صغير في أسفل البرنامج.
   ============================================================ */
(() => {
  const PAGES = {
    general:     { ic: 'palette',  grp: 0 },
    video:       { ic: 'monitor',  grp: 1, foot: true },
    encoder:     { ic: 'sliders',  grp: 1, foot: true },
    audio:       { ic: 'music',    grp: 1, foot: true },
    network:     { ic: 'activity', grp: 1, foot: true },
    review:      { ic: 'check',    grp: 1, foot: true },
    kick:        { ic: 'link',     grp: 2, foot: true },
    hotkeys:     { ic: 'keyboard', grp: 3 },
    transitions: { ic: 'shuffle',  grp: 3 },
    updates:     { ic: 'refresh',  grp: 4 }
  };

  Object.assign(I18N.ar, {
    grpGeneral: 'عام', grpStream: 'البث', grpKick: 'Kick', grpControl: 'التحكم',
    stDest: 'وجهة البث', stVideo: 'جودة الفيديو', stEncoder: 'التشفير', stNetwork: 'فحص الإنترنت', stReview: 'مراجعة وقياس',
    pg_general: 'لغة البرنامج ومظهره.',
    pg_dest: 'رابط ومفتاح البث من Kick. هنا يُرسل البرنامج الفيديو.', pg_video: 'الدقة والإطارات وجودة الصورة (Bitrate). بطاقات جاهزة أو ضبط يدوي.',
    pg_encoder: 'كيف يضغط البرنامج الفيديو قبل إرساله: السرعة، نمط الإرسال، التأخير.', pg_audio: 'جودة صوت البث وتمرير صوت التطبيقات.',
    pg_network: 'قِس سرعة رفعك وأداء جهازك واحصل على إعداد مقترح.', pg_review: 'ملخص كل إعدادات البث + قياس حقيقي أثناء البث.',
    pg_kick: 'كل ربط Kick في صفحة وحدة: القناة، رابط ومفتاح البث، وتسجيل الدخول للشات والإشراف.', pg_hotkeys: 'اختصارات لوحة المفاتيح للمشاهد والبث والمايك.', pg_transitions: 'شكل ومدة الانتقال بين المشاهد.',
    pgLangS: 'اختر لغة الواجهة، والاتجاه يتغيّر تلقائياً.', pgThemeS: 'مظهر نهاري أو ليلي.',
    stAutoSaved: 'تُحفظ التغييرات تلقائياً', stAutoDone: 'تم الحفظ تلقائياً', stLiveNote: 'البث شغّال — التغييرات تُطبَّق من البث القادم',
    lvT: 'القياس الفعلي', lvS: 'أرقام حقيقية يقرأها البرنامج من المشفّر (ffmpeg) أثناء البث، وليست من الإعدادات.',
    lvIdle: 'ابدأ البث لترى القياس الحقيقي', lvIdleRow: 'لا يوجد بث شغّال الآن.',
    lvIn: 'دقة الصورة الواصلة للمشفّر', lvOut: 'دقة الإرسال الفعلية إلى Kick', lvFps: 'الإطارات المشفّرة فعلياً', lvBr: 'سرعة الإرسال الفعلية (متوسط)',
    lvDrop: 'إطارات متساقطة', lvSpeed: 'سرعة المشفّر',
    lvWant: 'المطلوب', lvOk: 'مطابق لإعداداتك ✓', lvSlow: 'المشفّر لا يلحق — خفّف الدقة أو الإطارات', lvMis: 'الدقة لا تطابق الإعداد', lvUp: 'الدخل أقل من المطلوب — ليس دقة حقيقية', lvUpToast: 'الصورة الواصلة للمشفّر {a} فقط وليست {b}. الخرج مكبّر وليس دقة حقيقية. خفّف الدقة أو الإطارات أو جرّب فحص الجهاز.', lvMeasuring: 'جاري القياس…',
    lvRt: 'أقل من 1× = جهازك لا يلحق بالجودة المختارة',
    sbMeas: 'القياس الفعلي للبث',
    testListenMic: 'تكلّم الآن — تسمع صوتك في سماعاتك (استخدم سماعات رأس لتجنّب الصدى). اضغط «إيقاف التجربة» لقطعه فوراً.',
    testOkMic: '✓ المايك يشتغل وتسمع صوتك الآن. اضغط «إيقاف التجربة» لقطعه.', testAutoStop: 'توقفت تجربة الصوت تلقائياً'
  });
  Object.assign(I18N.en, {
    grpGeneral: 'General', grpStream: 'Streaming', grpKick: 'Kick', grpControl: 'Controls',
    stDest: 'Destination', stVideo: 'Video quality', stEncoder: 'Encoder', stNetwork: 'Network check', stReview: 'Review & measure',
    pg_general: 'App language and appearance.',
    pg_dest: 'Your Kick stream URL and key. This is where the app sends video.', pg_video: 'Resolution, frame rate and picture quality (bitrate). Ready presets or manual.',
    pg_encoder: 'How the app compresses video before sending: speed, send mode, latency.', pg_audio: 'Stream audio quality and app-audio routing.',
    pg_network: 'Measure your upload speed and PC performance and get a suggested setup.', pg_review: 'Summary of every stream setting + real measurements while live.',
    pg_kick: 'All Kick linking in one page: channel, stream URL & key, and sign-in for chat and moderation.', pg_hotkeys: 'Keyboard shortcuts for scenes, streaming and the mic.', pg_transitions: 'Style and duration of scene transitions.',
    pgLangS: 'Pick the interface language; direction switches automatically.', pgThemeS: 'Light or dark appearance.',
    stAutoSaved: 'Changes are saved automatically', stAutoDone: 'Saved automatically', stLiveNote: 'You are live — changes apply to the next stream',
    lvT: 'Real measurements', lvS: 'Real numbers read from the encoder (ffmpeg) while you stream — not from the settings.',
    lvIdle: 'Go live to see real measurements', lvIdleRow: 'No stream is running right now.',
    lvIn: 'Picture size reaching the encoder', lvOut: 'Actual output size sent to Kick', lvFps: 'Frames actually encoded', lvBr: 'Actual send rate (average)',
    lvDrop: 'Dropped frames', lvSpeed: 'Encoder speed',
    lvWant: 'requested', lvOk: 'Matches your settings ✓', lvSlow: 'Encoder is falling behind — lower the resolution or frame rate', lvMis: 'Resolution does not match the setting', lvUp: 'Input is lower than requested — not true resolution', lvUpToast: 'The picture reaching the encoder is only {a}, not {b}. The output is upscaled, not true resolution. Lower the resolution or frame rate, or run the device check.', lvMeasuring: 'Measuring…',
    lvRt: 'Below 1× = your PC cannot keep up with the chosen quality',
    sbMeas: 'Real stream measurements',
    testListenMic: 'Speak now — you hear your voice in your headphones (use headphones to avoid echo). Press "Stop test" to cut it instantly.',
    testOkMic: '✓ Mic works and you hear yourself. Press "Stop test" to cut it.', testAutoStop: 'Audio test stopped automatically'
  });

  /* ---------- رأس الصفحة + التذييل ---------- */
  window.onSettingsPage = function (n) {
    const p = PAGES[n] || PAGES.general;
    const hic = $('stHic'); if (hic) hic.innerHTML = ic(p.ic, 20);
    const sub = $('stSub'); if (sub) sub.textContent = t('pg_' + n);
    const ft = $('stFoot'); if (ft) ft.hidden = !p.foot;
    paintAuto();
    if (n === 'review') renderLive();
  };

  /* ---------- حفظ تلقائي ---------- */
  let lastJson = '', timer = null, flashT = null;
  const autoEl = () => $('stAutoT');
  function paintAuto(done) {
    const el = autoEl(); if (!el) return;
    const liveNow = document.body.classList.contains('live');
    el.textContent = done ? t('stAutoDone') : (liveNow ? t('stLiveNote') : t('stAutoSaved'));
    $('stAuto').classList.toggle('done', !!done);
    $('stAuto').classList.toggle('warn', liveNow && !done);
  }
  async function commit() {
    timer = null;
    let next; try { next = collectSettings(); } catch (e) { return; }
    const js = JSON.stringify(next); if (js === lastJson) return; lastJson = js;
    settings = next; try { renderChip(); } catch (e) {}
    try { const r = await api.saveSettings(settings); if (r && r.ok) { paintAuto(true); clearTimeout(flashT); flashT = setTimeout(() => paintAuto(), 1800); } } catch (e) {}
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(commit, 350); };
  const wrap = $('stScroll');
  ['input', 'change', 'click'].forEach(ev => wrap.addEventListener(ev, e => {
    if (!PAGES[curTab] || !PAGES[curTab].foot) return;
    if (ev === 'click' && !e.target.closest('button')) return;
    schedule();
  }));
  // نثبّت اللقطة الأولى عند فتح الإعدادات حتى لا نحفظ بدون تغيير
  const _openSettings = openSettings;
  openSettings = function (tab) { _openSettings(tab); try { lastJson = JSON.stringify(collectSettings()); } catch (e) {} };
  const _close = closeSettingsModal;
  closeSettingsModal = function () { if (timer) { clearTimeout(timer); commit(); } _close(); };
  $('closeSettings').onclick = () => closeSettingsModal();
  $('ov').onmousedown = e => { if (e.target === $('ov')) closeSettingsModal(); };

  /* ---------- القياس الحقيقي ---------- */
  let M = null;      // آخر قياس من ffmpeg
  const mbps = k => (k / 1000).toFixed(k >= 10000 ? 1 : 2) + ' Mbps';
  function verdict(m) {
    if (!m || !m.outW) return { k: 'lvMeasuring', cls: '' };
    const w = m.want || {};
    if (m.outW !== w.w || m.outH !== w.h) return { k: 'lvMis', cls: 'bad' };
    if (m.inW && (m.inW !== w.w || m.inH !== w.h)) return { k: 'lvUp', cls: 'bad' };   // خرج بالدقة المطلوبة لكن الدخل أقل: تكبير وليس دقة حقيقية
    if (m.frames > 90 && (m.speed && m.speed < 0.97 || m.fps && m.fps < w.fps * 0.88)) return { k: 'lvSlow', cls: 'bad' };
    return { k: 'lvOk', cls: 'ok' };
  }
  function renderLive() {
    const rows = $('lvRows'), pill = $('lvPill'); if (!rows) return;
    if (!M) { rows.innerHTML = `<div class="sp-r"><span>${esc(t('lvIdleRow'))}</span><b>—</b></div>`; pill.textContent = t('lvIdle'); pill.className = 'sp-pill'; return; }
    const v = verdict(M), w = M.want || {};
    pill.textContent = t(v.k); pill.className = 'sp-pill ' + v.cls;
    const dim = (a, b) => a ? a + '×' + b : '…';
    const R = [
      [t('lvIn'), dim(M.inW, M.inH), M.inW ? (M.inW === w.w && M.inH === w.h ? 'ok' : 'bad') : ''],
      [t('lvOut'), dim(M.outW, M.outH) + (M.codec ? ' · ' + M.codec.toUpperCase() : ''), M.outW === w.w && M.outH === w.h ? 'ok' : 'bad'],
      [t('lvFps'), (M.fps ? M.fps.toFixed(1) : '…') + ' fps  (' + t('lvWant') + ' ' + w.fps + ')', M.fps && M.fps >= w.fps * 0.9 ? 'ok' : (M.frames > 90 ? 'bad' : '')],
      [t('lvBr'), M.kbps ? mbps(M.kbps) + '  (' + t('lvWant') + ' ' + mbps(w.br) + ')' : '…', ''],
      [t('lvDrop'), String(M.drop || 0), M.drop > 0 ? 'warn' : 'ok'],
      [t('lvSpeed'), M.speed ? M.speed.toFixed(2) + '×' : '…', M.speed && M.speed < 0.97 ? 'bad' : (M.speed ? 'ok' : '')]
    ];
    rows.innerHTML = R.map(([k, val, c]) => `<div class="sp-r ${c}"><span>${esc(k)}</span><b dir="ltr">${esc(val)}</b></div>`).join('') + `<div class="sp-h lv-h">${esc(t('lvRt'))}</div>`;
  }
  /* شريط القياس في أسفل البرنامج */
  const sbf = document.querySelector('.statusbar .sp');
  if (sbf) sbf.insertAdjacentHTML('afterend', '<span class="sb-item ltr-i sb-meas" id="sbMeas" hidden></span>');
  function renderSb() {
    const el = $('sbMeas'); if (!el) return;
    if (!M || !M.outW || !document.body.classList.contains('live')) { el.hidden = true; return; }
    const v = verdict(M);
    el.hidden = false; el.className = 'sb-item ltr-i sb-meas ' + v.cls; el.title = t('sbMeas') + ' — ' + t(v.k);
    el.textContent = M.outW + '×' + M.outH + ' · ' + (M.fps ? Math.round(M.fps) : '…') + ' fps · ' + (M.kbps ? mbps(M.kbps) : '…');
  }
  let warnedUp = false;
  if (window.api && api.onStats) api.onStats(m => { M = m; if (!warnedUp && verdict(m).k === 'lvUp') { warnedUp = true; try { toast('⚠ ' + t('lvUpToast', { a: m.inW + '×' + m.inH, b: (m.want || {}).w + '×' + (m.want || {}).h }), 10000); } catch (e) {} } renderSb(); if (curTab === 'review' && $('ov').classList.contains('open')) renderLive(); });
  if (window.api && api.onStatus) api.onStatus(p => {
    if (p.state === 'live') { M = null; warnedUp = false; }
    if (p.state === 'stopped' || p.state === 'error') { renderSb(); }
    renderSb(); paintAuto();
  });

  /* ---------- ربط اللغة ---------- */
  const _apply = applyI18n;
  applyI18n = function () { _apply(); try { paintAuto(); renderLive(); renderSb(); } catch (e) {} };
  try { paintIcons(); applyI18n(); } catch (e) {}
})();
