'use strict';
/* ============================================================
   إعدادات جودة البث (v1.3.0)
   - دقة البث: 720p / 1080p / 2K / 4K
   - الإطارات: 30 أو 60 fps
   - بطاقات جاهزة (خفيف / متوازن / احترافي / فائق) + ضبط يدوي للجودة (Bitrate) وضغط المعالج.
   - يقرأ app.js القيم من الحقول المخفية resSel / fpsSel ومن bitrate / encSel.
   ============================================================ */
(() => {
  const RES = { 720: [1280, 720, '720p', 'HD'], 1080: [1920, 1080, '1080p', 'Full HD'], 1440: [2560, 1440, '1440p', '2K'], 2160: [3840, 2160, '2160p', '4K'] };
  const FPSL = [30, 60];
  const LADDER = [1500, 2500, 3500, 4500, 6000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 40000];
  const REC = { 720: { 30: 4500, 60: 6000 }, 1080: { 30: 6000, 60: 8000 }, 1440: { 30: 10000, 60: 12000 }, 2160: { 30: 20000, 60: 30000 } };
  const ENC = ['ultrafast', 'superfast', 'veryfast', 'faster'];
  const PRESETS = [
    { k: 'light',    res: 720,  fps: 30, enc: 'veryfast',  ic: 'zap' },
    { k: 'balanced', res: 1080, fps: 30, enc: 'veryfast',  ic: 'check' },
    { k: 'pro',      res: 1080, fps: 60, enc: 'superfast', ic: 'star' },
    { k: 'ultra',    res: 2160, fps: 60, enc: 'ultrafast', ic: 'spark' }
  ];

  Object.assign(I18N.ar, {
    spIntroT: 'إعدادات البث', spIntroS: 'كل قسم مشروح تحته. إذا ما كنت متأكد اختر بطاقة جاهزة من «جودة البث» وسيضبط البرنامج الباقي، ثم اضغط حفظ.',
    spConnT: 'الاتصال بالمنصة', spConnS: 'رابط ومفتاح البث من لوحة تحكم Kick (Creator Dashboard ← Stream)', spUrlH: 'يبدأ بـ rtmps:// وينتهي بـ /app. انسخه كما هو من Kick.', spKeyH: 'سري: لا تعطيه لأحد ولا تعرضه في البث. إذا تسرّب جدّده من Kick.',
    spConnOk: 'جاهز للبث', spConnNo: 'غير مكتمل',
    spResH: 'الدقة الأعلى = وضوح أكبر لكن تحتاج معالج قوي وإنترنت أسرع.', spFpsH: '30 مناسب لأغلب البثوث. 60 أنعم للألعاب السريعة لكنه يضاعف الحمل.', spBrH: 'كمية البيانات المرسلة في الثانية. لازم تبقى أقل من سرعة رفع إنترنتك بحوالي 30%.',
    spEncT: 'التشفير (Encoder)', spEncS: 'كيف يضغط البرنامج الفيديو قبل إرساله. التفاصيل التقنية بشرح مبسّط.',
    spEncH: 'الأخف يقلل حمل المعالج لكنه يعطي جودة أقل بنفس الـ Bitrate.',
    spRc: 'نمط التحكم بالجودة', spRcH: 'CBR = سرعة إرسال ثابتة (الأفضل للبث المباشر وموصى به من المنصات). VBR = متغيّرة وتوفّر بيانات لكن قد تسبب تقطيعاً.',
    spKf: 'المسافة بين الإطارات المفتاحية', spKfH: 'المنصات تطلب غالباً 2 ثانية. لا تغيّرها إلا لسبب.',
    spLl: 'التأخير مقابل الجودة', spLlH: 'تأخير منخفض = ردود فعل أسرع مع الشات. جودة أعلى = صورة أحسن بنفس الـ Bitrate لكن التأخير يزيد.',
    spLlLow: 'تأخير منخفض (موصى به)', spLlQ: 'جودة أعلى (تأخير أكبر)',
    spRcCbr: 'CBR - ثابت (موصى به)', spRcVbr: 'VBR - متغيّر',
    spKfS: '{n} ثانية',
    spAudT: 'الصوت', spAudS: 'جودة صوت البث (الميكروفون وصوت الخلاط). التردد ثابت 48 kHz.',
    spAbr: 'جودة الصوت (Bitrate)', spAbrH: '128 كافية للكلام، و160-192 للموسيقى.', spAch: 'القنوات', spAchH: 'ستيريو لصوت أوضح للموسيقى والألعاب. مونو يوفر بيانات للكلام فقط.',
    spAchSt: 'ستيريو (موصى به)', spAchMo: 'مونو',
    spFinT: 'ملخص الإعدادات', spFinS: 'هذا ما سيُستخدم عند الضغط على «ابدأ البث».', spReset: 'استعادة الإعدادات الافتراضية', spResetDone: 'تمت استعادة الافتراضي — اضغط «حفظ» لتثبيته',
    spFRes: 'الدقة والإطارات', spFBr: 'جودة الفيديو', spFEnc: 'التشفير', spFAud: 'الصوت', spFKf: 'الإطار المفتاحي', spFLat: 'نمط التأخير',
    sqT: 'جودة البث', sqS: 'اختر الدقة والإطارات، أو ابدأ ببطاقة جاهزة. كل شي يتضبط لك تلقائياً.',
    sqRes: 'دقة البث', sqPreset_light: 'خفيف', sqPreset_balanced: 'متوازن', sqPreset_pro: 'احترافي', sqPreset_ultra: 'فائق',
    sqRecTag: '★ موصى به', sqPerHour: 'تقريباً \u200E{g} GB\u200E لكل ساعة بث',
    sqSumRes: 'الدقة', sqSumFps: 'الإطارات', sqSumBr: 'الجودة',
    sqNoteOk: 'الإعداد مناسب. لو انقطع البث أو سخن الجهاز، خفّف الدقة أو الإطارات.',
    sqNoteLowBr: '⚠ الجودة (Bitrate) منخفضة لهذه الدقة؛ ستظهر الصورة ضعيفة. اختر الموصى به ({r} kbps).',
    sqNoteHeavy: '⚠ هذه الدقة تحتاج معالج قوي ورفع إنترنت عالٍ. لو تقطّع البث، اختر دقة أقل أو 30 إطار.',
    sqNoteKick: '⚠ حدود Kick المعلنة: أقصى دقة 1080p و60 إطار وأقصى بت ريت 8000 kbps (H.264 و CBR). البرنامج يرسل الدقة المختارة فعلياً، لكن Kick هي اللي تقرر ما تقبله وما يظهر للمشاهدين في خيارات الجودة، وقد ترفض أو تخفّض ما فوق 1080p.',
    sqNote4k: '⚠ بث 4K يتطلب جهازاً قوياً جداً ورفعاً ثابتاً (20+ Mbps)، وبعض المنصات تحدّ الدقة والجودة القصوى المسموحة. جرّب «فحص الإنترنت والجهاز» أولاً.',
    sqNoteUp: 'المشهد يُرسم فعلياً بدقة البث ({w}×{h}) — النص والأشكال حادّة، والكاميرا والشاشة تُلتقط بنفس الدقة إذا جهازك يدعمها. الصور والفيديوهات منخفضة الدقة تبقى بتفاصيلها الأصلية. بعد بدء البث ستجد القياس الحقيقي في صفحة «مراجعة وقياس».'
  });
  Object.assign(I18N.en, {
    spIntroT: 'Stream settings', spIntroS: 'Every section is explained below it. If unsure, pick a ready preset in "Stream quality" and the app adjusts the rest, then press Save.',
    spConnT: 'Platform connection', spConnS: 'Stream URL and key from Kick (Creator Dashboard → Stream)', spUrlH: 'Starts with rtmps:// and ends with /app. Copy it exactly from Kick.', spKeyH: 'Secret: never share it or show it on stream. If leaked, regenerate it on Kick.',
    spConnOk: 'Ready to stream', spConnNo: 'Incomplete',
    spResH: 'Higher resolution = sharper picture but needs a stronger CPU and faster internet.', spFpsH: '30 suits most streams. 60 is smoother for fast games but doubles the load.', spBrH: 'Data sent per second. Keep it about 30% below your upload speed.',
    spEncT: 'Encoder', spEncS: 'How the app compresses the video before sending it, in plain words.',
    spEncH: 'Lighter presets reduce CPU load but give lower quality at the same bitrate.',
    spRc: 'Rate control', spRcH: 'CBR = constant send rate (best for live, recommended by platforms). VBR = variable, saves data but may cause stutter.',
    spKf: 'Keyframe interval', spKfH: 'Platforms usually require 2 seconds. Change only if you have a reason.',
    spLl: 'Latency vs quality', spLlH: 'Low latency = faster reactions with chat. Higher quality = better picture at the same bitrate but more delay.',
    spLlLow: 'Low latency (recommended)', spLlQ: 'Higher quality (more delay)',
    spRcCbr: 'CBR - constant (recommended)', spRcVbr: 'VBR - variable',
    spKfS: '{n} seconds',
    spAudT: 'Audio', spAudS: 'Stream audio quality (mic and mixer sound). Sample rate is fixed at 48 kHz.',
    spAbr: 'Audio quality (Bitrate)', spAbrH: '128 is enough for speech; 160-192 for music.', spAch: 'Channels', spAchH: 'Stereo for clearer music/games. Mono saves data for speech only.',
    spAchSt: 'Stereo (recommended)', spAchMo: 'Mono',
    spFinT: 'Settings summary', spFinS: 'This is what will be used when you press "Start stream".', spReset: 'Restore defaults', spResetDone: 'Defaults restored — press Save to keep them',
    spFRes: 'Resolution & frame rate', spFBr: 'Video quality', spFEnc: 'Encoder', spFAud: 'Audio', spFKf: 'Keyframe', spFLat: 'Latency mode',
    sqT: 'Stream quality', sqS: 'Pick resolution and frame rate, or start with a ready preset. Everything adjusts automatically.',
    sqRes: 'Stream resolution', sqPreset_light: 'Light', sqPreset_balanced: 'Balanced', sqPreset_pro: 'Pro', sqPreset_ultra: 'Ultra',
    sqRecTag: '★ Recommended', sqPerHour: 'About {g} GB per hour of streaming',
    sqSumRes: 'Resolution', sqSumFps: 'Frame rate', sqSumBr: 'Bitrate',
    sqNoteOk: 'Settings look good. If the stream drops or your PC gets hot, lower the resolution or frame rate.',
    sqNoteLowBr: '⚠ Bitrate is low for this resolution; the picture will look soft. Pick the recommended value ({r} kbps).',
    sqNoteHeavy: '⚠ This resolution needs a strong CPU and fast upload. If the stream stutters, choose a lower resolution or 30 fps.',
    sqNoteKick: '⚠ Kick\'s published limits: max 1080p, 60 fps and 8,000 kbps (H.264, CBR). The app really sends the resolution you pick, but Kick decides what it accepts and which quality options viewers see, and it may reject or downscale anything above 1080p.',
    sqNote4k: '⚠ 4K streaming needs a very strong PC and a steady upload (20+ Mbps), and some platforms cap the maximum resolution/bitrate. Run the "Internet & device check" first.',
    sqNoteUp: 'The scene is truly rendered at the stream resolution ({w}×{h}) — text and shapes are sharp, and the camera/screen are captured at that resolution when your device supports it. Low-resolution images/videos keep their own detail. After you go live, see the real measurements in "Review & measure".'
  });

  const DEFS = { bitrate: 4500, res: 720, fps: 30, enc: 'veryfast', rc: 'cbr', kf: 2, ll: 1, abr: 128, ach: 2 };
  const ABR = [96, 128, 160, 192, 256], KF = [1, 2, 3, 4];
  const $r = () => parseInt($('resSel').value, 10) || 720;
  const $f = () => parseInt($('fpsSel').value, 10) === 60 ? 60 : 30;
  const $b = () => parseInt($('bitrate').value, 10) || REC[$r()][$f()];
  const resTxt = r => RES[r][2] + ' · ' + RES[r][3];

  /* إعدادات للاستخدام من app.js */
  const SQ = window.SQ = {
    dims: r => { const d = RES[parseInt(r, 10)] || RES[720]; return [d[0], d[1]]; },
    /* الفيديو يمر بمرحلتين: المتصفح (VP8) ← ffmpeg (x264 → Kick). نعطي المرحلة الأولى ضعف الـ Bitrate (وحد أدنى حسب الدقة) حتى لا تخسر الصورة جودتها قبل الترميز النهائي */
    vbps: (br, dim) => { const px = dim ? dim[0] * dim[1] : 921600, floor = px >= 8e6 ? 24e6 : px >= 3.6e6 ? 14e6 : px >= 2e6 ? 10e6 : 6e6; return Math.max(floor, Math.min(80e6, Math.round((parseInt(br, 10) || 3500) * 1000 * 2))); },
    last: null, onStart(i){ SQ.last = i; },
    rec: (r, f) => REC[r] && REC[r][f] || 4500,
    buildBitrate, paint, set, DEFS
  };

  function buildBitrate() {
    const sel = $('bitrate'); if (!sel) return;
    const cur = sel.value || String(settings.bitrate || 3500), rec = SQ.rec($r(), $f());
    sel.innerHTML = LADDER.map(n => `<option value="${n}">${n.toLocaleString('en-US')} kbps · ${(n / 1000).toFixed(n % 1000 ? 1 : 0)} Mbps${n === rec ? '  ' + t('sqRecTag') : ''}</option>`).join('');
    sel.value = LADDER.includes(+cur) ? cur : String(LADDER.reduce((a, b) => Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
    const e = $('encSel'); if (e) {
      const ev = e.value || settings.enc || 'veryfast';
      e.innerHTML = [['ultrafast', 'encFast'], ['superfast', 'encSuper'], ['veryfast', 'encBal'], ['faster', 'encQ']].map(([n, k]) => `<option value="${n}">${t(k)}</option>`).join('');
      e.value = ENC.includes(ev) ? ev : 'veryfast';
    }
    buildExtra();
  }
  function fillSel(id, opts, def) {
    const el = $(id); if (!el) return; const v = el.value || String(def);
    el.innerHTML = opts.map(([val, txt]) => `<option value="${val}">${txt}</option>`).join('');
    el.value = opts.some(o => String(o[0]) === v) ? v : String(def);
  }
  function buildExtra() {
    fillSel('rcSel', [['cbr', t('spRcCbr')], ['vbr', t('spRcVbr')]], settings.rc || DEFS.rc);
    fillSel('kfSel', KF.map(n => [n, t('spKfS', { n })]), settings.kf || DEFS.kf);
    fillSel('llSel', [[1, t('spLlLow')], [0, t('spLlQ')]], settings.ll === 0 ? 0 : DEFS.ll);
    fillSel('abrSel', ABR.map(n => [n, '\u200E' + n + ' kbps']), settings.abr || DEFS.abr);
    fillSel('achSel', [[2, t('spAchSt')], [1, t('spAchMo')]], settings.ach || DEFS.ach);
  }
  function finalSum() {
    const res = $r(), fps = $f(), br = $b(), e = $('encSel');
    const rows = [
      [t('spFRes'), RES[res][3] + ' (' + RES[res][0] + '×' + RES[res][1] + ') · ' + fps + ' fps'],
      [t('spFBr'), (br / 1000).toFixed(br % 1000 ? 1 : 0) + ' Mbps · ' + $('rcSel').selectedOptions[0].text],
      [t('spFEnc'), e.selectedOptions[0] ? e.selectedOptions[0].text : ''],
      [t('spFKf'), t('spKfS', { n: $('kfSel').value })],
      [t('spFLat'), $('llSel').selectedOptions[0].text],
      [t('spFAud'), $('abrSel').value + ' kbps · ' + $('achSel').selectedOptions[0].text + ' · 48 kHz']
    ];
    setHtml($('spFinal'), rows.map(([k, v]) => `<div class="sp-r"><span>${esc(k)}</span><b dir="auto">${esc(v)}</b></div>`).join(''));
    const ok = !!($('kUrl').value.trim() && $('kKey').value.trim()), pill = $('spConnPill');
    if (pill) { pill.textContent = t(ok ? 'spConnOk' : 'spConnNo'); pill.classList.toggle('ok', ok); }
  }
  const setHtml = (el, h) => { if (el && el.__h !== h) { el.__h = h; el.innerHTML = h; } };

  function ensureHidden() {
    const rs = $('resSel'), fs = $('fpsSel');
    if (!rs.options.length) rs.innerHTML = Object.keys(RES).map(k => `<option value="${k}">${k}</option>`).join('');
    if (!fs.options.length) fs.innerHTML = FPSL.map(k => `<option value="${k}">${k}</option>`).join('');
  }

  function paint() {
    ensureHidden();
    const res = $r(), fps = $f(), br = $b(), enc = $('encSel').value;
    $('sqResSeg').innerHTML = Object.keys(RES).map(k => `<button type="button" data-res="${k}" class="${+k === res ? 'on' : ''}"><b>${RES[k][3]}</b><small>${RES[k][2]}</small></button>`).join('');
    $('sqFpsSeg').innerHTML = FPSL.map(f => `<button type="button" data-fps="${f}" class="${f === fps ? 'on' : ''}"><b>${f}</b><small>fps</small></button>`).join('');
    $('sqPresets').innerHTML = PRESETS.map(p => {
      const on = p.res === res && p.fps === fps && SQ.rec(p.res, p.fps) === br;
      return `<button type="button" class="sq-pc${on ? ' on' : ''}" data-p="${p.k}"><span class="sq-pi">${ic(p.ic, 16)}</span><b>${esc(t('sqPreset_' + p.k))}</b><small dir="ltr">${RES[p.res][3]} · ${p.fps}</small></button>`;
    }).join('');
    const gb = (br * 3600 / 8 / 1e6).toFixed(1);
    $('sqSum').innerHTML = `<div class="sq-chip"><small>${esc(t('sqSumRes'))}</small><b dir="ltr">${RES[res][0]}×${RES[res][1]}</b></div>`
      + `<div class="sq-chip"><small>${esc(t('sqSumFps'))}</small><b dir="ltr">${fps} fps</b></div>`
      + `<div class="sq-chip"><small>${esc(t('sqSumBr'))}</small><b dir="ltr">${(br / 1000).toFixed(br % 1000 ? 1 : 0)} Mbps</b></div>`
      + `<div class="sq-gb">${esc(t('sqPerHour', { g: gb }))}</div>`;
    // ملاحظات ذكية
    const rec = SQ.rec(res, fps), notes = [];
    if (res > 1080 || br > 8000) notes.push(t('sqNoteKick'));
    if (res >= 2160) notes.push(t('sqNote4k'));
    else if (res >= 1440 || (res >= 1080 && fps === 60)) notes.push(t('sqNoteHeavy'));
    if (br < rec * 0.6) notes.push(t('sqNoteLowBr', { r: rec.toLocaleString('en-US') }));
    if (res > 720) notes.push(t('sqNoteUp', { w: RES[res][0], h: RES[res][1] }));
    const n = $('sqNote'); n.hidden = false; n.classList.toggle('warn', notes.some(x => x.startsWith('⚠')));
    n.innerHTML = (notes.length ? notes : [t('sqNoteOk')]).map(x => `<div>${esc(x)}</div>`).join('');
    finalSum();
    try { paintIcons(); } catch (e) {}
  }

  /* values: { res, fps, br, enc } — أي حقل ناقص يبقى كما هو */
  function set(v) {
    ensureHidden();
    if (v.res && RES[v.res]) $('resSel').value = String(v.res);
    if (v.fps) $('fpsSel').value = String(v.fps === 60 ? 60 : 30);
    buildBitrate();
    if (v.br) { const b = LADDER.reduce((a, c) => Math.abs(c - v.br) < Math.abs(a - v.br) ? c : a); $('bitrate').value = String(b); }
    if (v.enc && ENC.includes(v.enc)) $('encSel').value = v.enc;
    paint();
  }

  /* ---------- تفاعل ---------- */
  $('sqResSeg').onclick = e => {
    const b = e.target.closest('[data-res]'); if (!b) return;
    const r = +b.dataset.res; $('resSel').value = String(r);
    buildBitrate(); $('bitrate').value = String(SQ.rec(r, $f()));
    if (r >= 2160) $('encSel').value = 'ultrafast'; else if (r >= 1440 && ['veryfast', 'faster'].includes($('encSel').value)) $('encSel').value = 'superfast';
    paint();
  };
  $('sqFpsSeg').onclick = e => {
    const b = e.target.closest('[data-fps]'); if (!b) return;
    $('fpsSel').value = b.dataset.fps; buildBitrate(); $('bitrate').value = String(SQ.rec($r(), $f())); paint();
  };
  $('sqPresets').onclick = e => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    const p = PRESETS.find(x => x.k === b.dataset.p); if (p) set({ res: p.res, fps: p.fps, br: SQ.rec(p.res, p.fps), enc: p.enc });
  };
  ['bitrate', 'encSel', 'rcSel', 'kfSel', 'llSel', 'abrSel', 'achSel', 'kUrl', 'kKey'].forEach(id => { const el = $(id); el.addEventListener('change', paint); el.addEventListener('input', finalSum); });
  $('spReset').onclick = () => {
    $('rcSel').value = DEFS.rc; $('kfSel').value = String(DEFS.kf); $('llSel').value = String(DEFS.ll); $('abrSel').value = String(DEFS.abr); $('achSel').value = String(DEFS.ach);
    set({ res: DEFS.res, fps: DEFS.fps, br: SQ.rec(DEFS.res, DEFS.fps), enc: DEFS.enc });
    toast('✔ ' + t('spResetDone'), 4000);
  };

  /* ---------- hooks ---------- */
  const _fillForm = fillForm;
  fillForm = function () {
    _fillForm();
    ensureHidden();
    $('resSel').value = RES[settings.res] ? String(settings.res) : '720';
    $('fpsSel').value = +settings.fps === 60 ? '60' : '30';
    buildBitrate();
    $('bitrate').value = String(LADDER.reduce((a, c) => Math.abs(c - settings.bitrate) < Math.abs(a - settings.bitrate) ? c : a));
    $('encSel').value = ENC.includes(settings.enc) ? settings.enc : 'veryfast';
    buildExtra(); paint();
  };
  const _applyI18n = applyI18n;
  applyI18n = function () { _applyI18n(); try { ensureHidden(); buildBitrate(); paint(); } catch (e) {} };
  ensureHidden(); buildBitrate(); paint();
})();
