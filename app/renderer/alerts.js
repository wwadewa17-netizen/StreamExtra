/* ============================================================
   نظام الأليرتات (v1.9) — الخطوة الأولى: أليرت المتابعة الجديدة
   - يُرسم الأليرت على نفس الكانفس (cv) اللي ينبث، فيظهر في المعاينة وعند المشاهدين.
   - يشتغل من حدث المتابعة اللي يوصل لموجز النشاط (kpanel.js → addAct).
   - زر الأليرتات (تحت زر الإعدادات في لوحة التحكم) يفتح الإعدادات: تفعيل/إيقاف، المدة، المكان، النص، تجربة.
   - الإعدادات محفوظة في se_kalert، وجاهزة لإضافة أنواع ثانية (اشتراك، هدية...) بنفس الشكل.
   ============================================================ */
(() => {
  Object.assign(IC, {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    bellOff: '<path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.9 17.9 0 0 1 18 8"/><path d="M6.26 6.26A5.9 5.9 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><path d="M1 1l22 22"/>'
  });

  Object.assign(I18N.ar, {
    kAlertT: 'إعدادات الأليرتات',
    alTitle: 'إعدادات الأليرتات', alFollowH: 'أليرت المتابعة',
    alOn: 'تفعيل أليرت المتابعة الجديدة', alDur: 'مدة الظهور', alSec: 'ثواني', alPos: 'مكان الأليرت',
    alLabel: 'النص فوق الاسم', alFollowDef: 'متابع جديد',
    alTop: 'أعلى الوسط', alBottom: 'أسفل الوسط', alTR: 'أعلى اليمين', alTL: 'أعلى اليسار', alBR: 'أسفل اليمين', alBL: 'أسفل اليسار',
    alTest: 'تجربة الأليرت', alSave: 'حفظ',
    alNote: 'يظهر الأليرت على المعاينة وعلى البث نفسه عند وصول متابع جديد. لو وصل أكثر من متابع بنفس اللحظة تظهر الأليرتات واحد ورا الثاني.',
    alOnToast: 'تم تفعيل الأليرتات', alOffToast: 'تم إيقاف الأليرتات', alTestName: 'اسم_المتابع',
    alTabMain: 'أليرت المتابعة', alTabImg: 'الصورة', alTabName: 'اسم الحساب',
    alPrev: 'معاينة — اسحب العناصر بالماوس لتحريكها', alPick: 'اختيار صورة', alRemove: 'حذف الصورة', alReset: 'إعادة الضبط',
    alSize: 'الحجم', alColor: 'اللون', alShowImg: 'إظهار الصورة', alImgNote: 'بدون صورة يظهر القلب الافتراضي. اسحب الصورة في المعاينة لتحريكها.', alNameNote: 'اسحب الاسم في المعاينة لتحريكه، وغيّر حجمه ولونه من هنا.',
    alImgErr: 'تعذر قراءة الصورة',
    alTypes: 'أنواع الأليرتات', alSecGen: 'الإعدادات العامة', alSecImg: 'الصورة', alSecName: 'اسم الحساب', alSecLook: 'شكل البطاقة',
    alX: 'الموضع أفقي', alY: 'الموضع عمودي', alAccent: 'لون الإطار والنص الصغير', alBg: 'لون الخلفية', alBgA: 'شفافية الخلفية', alResetAll: 'إعادة كل الإعدادات',
    alAddImg: 'إضافة صورة', alChangeImg: 'تغيير الصورة', alAddName: 'اسم الحساب', alNameShow: 'إظهار اسم الحساب'
  });
  Object.assign(I18N.en, {
    kAlertT: 'Alert settings',
    alTitle: 'Alert settings', alFollowH: 'Follow alert',
    alOn: 'Enable new-follower alert', alDur: 'Display time', alSec: 'sec', alPos: 'Alert position',
    alLabel: 'Text above the name', alFollowDef: 'New follower',
    alTop: 'Top center', alBottom: 'Bottom center', alTR: 'Top right', alTL: 'Top left', alBR: 'Bottom right', alBL: 'Bottom left',
    alTest: 'Test alert', alSave: 'Save',
    alNote: 'The alert shows on the preview and on the stream itself when a new follower arrives. If several arrive at once they show one after another.',
    alOnToast: 'Alerts enabled', alOffToast: 'Alerts disabled', alTestName: 'follower_name',
    alTabMain: 'Follow alert', alTabImg: 'Image', alTabName: 'Account name',
    alPrev: 'Preview — drag the elements with the mouse to move them', alPick: 'Choose image', alRemove: 'Remove image', alReset: 'Reset',
    alSize: 'Size', alColor: 'Color', alShowImg: 'Show image', alImgNote: 'Without an image the default heart is shown. Drag the image in the preview to move it.', alNameNote: 'Drag the name in the preview to move it, and change its size and color here.',
    alImgErr: 'Could not read the image',
    alTypes: 'Alert types', alSecGen: 'General', alSecImg: 'Image', alSecName: 'Account name', alSecLook: 'Card look',
    alX: 'Position X', alY: 'Position Y', alAccent: 'Border & small-text color', alBg: 'Background color', alBgA: 'Background opacity', alResetAll: 'Reset all settings',
    alAddImg: 'Add image', alChangeImg: 'Change image', alAddName: 'Account name', alNameShow: 'Show account name'
  });

  /* ---------- الإعدادات ---------- */
  const KEY = 'se_kalert', POS = ['top', 'bottom', 'tr', 'tl', 'br', 'bl'], DURS = [3, 5, 8, 10, 15];
  const CW_ = 470, CH_ = 112;                               // مقاس بطاقة الأليرت
  const DIMG = () => ({ data: '', show: true, x: 56, y: 56, size: 72 });
  const DNAME = () => ({ show: true, x: 276, y: 76, size: 36, color: '#ffffff' });
  const DEF = { follow: { on: true, dur: 5, pos: 'top', text: '', accent: '#53fc18', bg: '#0e1014', bgA: 94, img: DIMG(), nm: DNAME() } };
  const num = (v, a, b, d) => { v = +v; return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  const hex = (v, d) => /^#[0-9a-fA-F]{6}$/.test(v) ? v : d;
  function norm(o) {
    const f = Object.assign({}, DEF.follow, o || {});
    f.on = !!f.on; f.dur = DURS.includes(+f.dur) ? +f.dur : 5; f.pos = POS.includes(f.pos) ? f.pos : 'top'; f.text = String(f.text || '').slice(0, 30);
    f.accent = hex(f.accent, '#53fc18'); f.bg = hex(f.bg, '#0e1014'); f.bgA = num(f.bgA, 0, 100, 94);
    const i = Object.assign(DIMG(), f.img || {}), n = Object.assign(DNAME(), f.nm || {});
    f.img = { data: typeof i.data === 'string' && i.data.startsWith('data:image/') ? i.data : '', show: i.show !== false, x: num(i.x, -60, CW_ + 60, 56), y: num(i.y, -60, CH_ + 60, 56), size: num(i.size, 24, 200, 72) };
    f.nm = { show: n.show !== false, x: num(n.x, -60, CW_ + 60, 276), y: num(n.y, -60, CH_ + 60, 76), size: num(n.size, 14, 90, 36), color: hex(n.color, '#ffffff') };
    return f;
  }
  function load() {
    let o = {}; try { o = JSON.parse(LS.get(KEY, '{}')) || {}; } catch (e) {}
    return { follow: norm(o.follow) };
  }
  let CFG = load();
  const save = () => LS.set(KEY, JSON.stringify(CFG));

  /* ---------- الطابور ---------- */
  const Q = []; let curA = null, gapUntil = 0;
  const IN = 450, OUT = 400, GAP = 350;
  function push(type, user) {
    const c = CFG[type]; if (!c || !c.on) return;
    if (Q.length >= 10) Q.shift();
    Q.push({ type, user: String(user || '').trim(), t0: 0 });
  }
  function clear() { Q.length = 0; curA = null; }

  /* ---------- الرسم (يُستدعى من drawSceneBody في app.js على كل إطار) ---------- */
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const ease = p => 1 - Math.pow(1 - p, 3);
  const FONT = '"Segoe UI", Tahoma, Arial, sans-serif';
  const imgCache = {};
  function getImg(src) {
    if (!src) return null;
    let im = imgCache[src];
    if (!im) { im = new Image(); im.src = src; imgCache[src] = im; const k = Object.keys(imgCache); if (k.length > 4) delete imgCache[k[0]]; }
    return im.complete && im.naturalWidth ? im : null;
  }
  // يرسم البطاقة بمقاس 470×112 عند (x,y) — يستعمله البث والمعاينة
  function card(c, x, y, cf, user, p, el, sel) {
    const W = CW_, H = CH_, label = cf.text || t('alFollowDef'), name = user || t('alFollowDef');
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, p));
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 24; c.shadowOffsetY = 6;
    const bgc = cf.bg.match(/\w\w/g).map(h => parseInt(h, 16)); rrect(c, x, y, W, H, 24); c.fillStyle = `rgba(${bgc[0]},${bgc[1]},${bgc[2]},${cf.bgA / 100})`; c.fill();
    const AC = cf.accent, ACF = AC + '29';
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
    rrect(c, x, y, W, H, 24); c.lineWidth = 3; c.strokeStyle = AC; c.stroke();

    // الصورة (أو القلب الافتراضي)
    const g = cf.img;
    if (g.show) {
      const cx = x + g.x, cy = y + g.y, r = g.size / 2, im = getImg(g.data);
      if (g.data) {
        c.save(); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.closePath(); c.clip();
        c.fillStyle = ACF; c.fillRect(cx - r, cy - r, g.size, g.size);
        if (im) { const k = Math.max(g.size / im.naturalWidth, g.size / im.naturalHeight), dw = im.naturalWidth * k, dh = im.naturalHeight * k; c.drawImage(im, cx - dw / 2, cy - dh / 2, dw, dh); }
        c.restore();
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = AC; c.stroke();
      } else {
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = ACF; c.fill();
        c.lineWidth = 2; c.strokeStyle = AC; c.stroke();
        c.save(); c.translate(cx, cy + 2 * g.size / 72); const s = (g.size / 72) * (1 + 0.08 * Math.sin(el / 160));
        c.scale(s, s);
        c.beginPath(); c.moveTo(0, 14); c.bezierCurveTo(-26, -4, -14, -24, 0, -10); c.bezierCurveTo(14, -24, 26, -4, 0, 14); c.closePath();
        c.fillStyle = AC; c.fill(); c.restore();
      }
    }

    // النصوص: الاسم (قابل للتحريك/التكبير/التلوين) + النص الصغير فوقه
    const n = cf.nm, nx = x + n.x, ny = y + n.y, maxW = Math.max(60, W - 40);
    if (n.show) {
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${n.size}px ${FONT}`; c.fillStyle = n.color;
    c.direction = /[\u0590-\u08FF]/.test(name) ? 'rtl' : 'ltr';
    c.fillText(fit(c, name, maxW), nx, ny);
    const ls = Math.max(12, Math.round(n.size * 0.61));
    c.font = `700 ${ls}px ${FONT}`; c.fillStyle = AC;
    c.direction = /[\u0590-\u08FF]/.test(label) ? 'rtl' : 'ltr';
    c.fillText(fit(c, label, maxW), nx, ny - n.size * 0.5 - ls * 0.62);
    }
    c.restore();
  }
  function draw(c, w, h) {
    const now = performance.now();
    if (!curA) {
      if (!Q.length || now < gapUntil) return;
      curA = Q.shift(); curA.t0 = now;
    }
    const cf = CFG[curA.type] || DEF.follow, hold = cf.dur * 1000, el = now - curA.t0, total = IN + hold + OUT;
    if (el >= total) { curA = null; gapUntil = now + GAP; return; }
    let p = 1;                                              // 0 = مخفي · 1 = ظاهر كامل
    if (el < IN) p = ease(el / IN); else if (el > IN + hold) p = 1 - ease((el - IN - hold) / OUT);

    const W = CW_, H = CH_, M = 36, pos = cf.pos;
    const top = pos === 'top' || pos === 'tr' || pos === 'tl';
    const x = pos === 'tl' || pos === 'bl' ? M : pos === 'tr' || pos === 'br' ? w - W - M : (w - W) / 2;
    const y0 = top ? M : h - H - M, slide = (1 - p) * (H + M) * (top ? -1 : 1);
    card(c, x, y0 + slide, cf, curA.user, p, el);
  }
  function fit(c, s, maxW) {                                 // قص الاسم الطويل بنقاط
    if (c.measureText(s).width <= maxW) return s;
    let a = s; while (a.length > 1 && c.measureText(a + '…').width > maxW) a = a.slice(0, -1);
    return a + '…';
  }

  /* ---------- نافذة الإعدادات + الزر ---------- */
  const btn = $('kAlert');
  function paintBtn() {
    if (!btn) return;
    const i = btn.querySelector('i[data-ic]'); if (!i) return;
    const on = CFG.follow.on, nm = on ? 'bell' : 'bellOff';
    if (i.dataset.ic !== nm || !i.innerHTML) { i.dataset.ic = nm; i.innerHTML = ic(nm); }
    btn.classList.toggle('al-off', !on);
  }
  function readImg(file, done) {                            // صورة → مربع صغير (حد أقصى 256px) محفوظ كـ data URL
    const fr = new FileReader();
    fr.onerror = () => toast(t('alImgErr'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => toast(t('alImgErr'));
      im.onload = () => {
        const k = Math.min(1, 256 / Math.max(im.naturalWidth, im.naturalHeight)), cw = Math.max(1, Math.round(im.naturalWidth * k)), ch = Math.max(1, Math.round(im.naturalHeight * k));
        const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch; cc.getContext('2d').drawImage(im, 0, 0, cw, ch);
        done(cc.toDataURL('image/png'));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function openDialog() {
    const orig = JSON.stringify(CFG); let committed = false, sel = 'nm', drag = null, raf = 0;
    const f = () => CFG.follow, esc2 = esc, rtl = (document.documentElement.dir || 'ltr'), box = $('dlgBox');
    const TYPES = [['follow', 'heart', 'alFollowH']];          // أنواع الأليرتات — نضيف هنا لاحقاً (اشتراك، هدية...)
    const side = () => `<div class="al-side"><div class="al-sideT">${esc2(t('alTypes'))}</div>${TYPES.map(([k, i, l]) => `<button type="button" class="al-tab on" data-type="${k}"><i data-ic="${i}"></i><span>${esc2(t(l))}</span></button>`).join('')}</div>`;
    const rng = (id, label, v, a, b) => `<label class="f al-rg"><span>${esc2(label)}</span><input type="range" id="${id}" min="${a}" max="${b}" value="${Math.round(v)}"><input type="number" class="al-num" id="${id}N" min="${a}" max="${b}" value="${Math.round(v)}"></label>`;
    const g0 = f();
    const sec = (k, title, inner) => `<div class="al-sec ${sel === k ? 'sel' : ''}" data-sec="${k}"><div class="al-secT">${esc2(title)}</div>${inner}</div>`;
    const panel = () => {
      const g = f();
      return `
      ${sec('gen', t('alSecGen'), `
        <label class="k-toggle"><input type="checkbox" id="alOn" ${g.on ? 'checked' : ''}><span class="k-sw"></span><b>${esc2(t('alOn'))}</b></label>
        <div class="grid2">
          <label class="f"><span>${esc2(t('alDur'))}</span><select id="alDur">${DURS.map(d => `<option value="${d}" ${d === g.dur ? 'selected' : ''}>${d} ${esc2(t('alSec'))}</option>`).join('')}</select></label>
          <label class="f"><span>${esc2(t('alPos'))}</span><select id="alPos">${POS.map(p => `<option value="${p}" ${p === g.pos ? 'selected' : ''}>${esc2(t({ top: 'alTop', bottom: 'alBottom', tr: 'alTR', tl: 'alTL', br: 'alBR', bl: 'alBL' }[p]))}</option>`).join('')}</select></label>
          <label class="f full"><span>${esc2(t('alLabel'))}</span><input type="text" id="alLabel" maxlength="30" value="${esc2(g.text)}" placeholder="${esc2(t('alFollowDef'))}"></label>
        </div>`)}
      ${sec('img', t('alSecImg'), `
        <div class="al-row"><button type="button" class="dbtn primary" id="alPick">${esc2(t(g.img.data ? 'alChangeImg' : 'alAddImg'))}</button><button type="button" class="dbtn" id="alRm" ${g.img.data ? '' : 'disabled'}>${esc2(t('alRemove'))}</button></div>
        <input type="file" id="alFile" accept="image/*" style="display:none">
        <label class="k-toggle"><input type="checkbox" id="alImgShow" ${g.img.show ? 'checked' : ''}><span class="k-sw"></span><b>${esc2(t('alShowImg'))}</b></label>
        ${rng('alISize', t('alSize'), g.img.size, 24, 200)}
        ${rng('alIX', t('alX'), g.img.x, -60, CW_ + 60)}
        ${rng('alIY', t('alY'), g.img.y, -60, CH_ + 60)}
        <div class="al-row"><button type="button" class="dbtn" data-rs="img">${esc2(t('alReset'))}</button></div>`)}
      ${sec('nm', t('alSecName'), `
        <label class="k-toggle"><input type="checkbox" id="alNShow" ${g.nm.show ? 'checked' : ''}><span class="k-sw"></span><b>${esc2(t('alNameShow'))}</b></label>
        ${rng('alNSize', t('alSize'), g.nm.size, 14, 90)}
        <label class="f"><span>${esc2(t('alColor'))}</span><input type="color" id="alNColor" value="${g.nm.color}"></label>
        ${rng('alNX', t('alX'), g.nm.x, -60, CW_ + 60)}
        ${rng('alNY', t('alY'), g.nm.y, -60, CH_ + 60)}
        <div class="al-row"><button type="button" class="dbtn" data-rs="nm">${esc2(t('alReset'))}</button></div>`)}
      ${sec('look', t('alSecLook'), `
        <div class="grid2">
          <label class="f"><span>${esc2(t('alAccent'))}</span><input type="color" id="alAccent" value="${g.accent}"></label>
          <label class="f"><span>${esc2(t('alBg'))}</span><input type="color" id="alBg" value="${g.bg}"></label>
        </div>
        ${rng('alBgA', t('alBgA'), g.bgA, 0, 100)}`)}
      <div class="al-row"><button type="button" class="dbtn danger" id="alAll">${esc2(t('alResetAll'))}</button></div>`;
    };
    const body = `<div class="al-wrap" style="direction:ltr">${side()}
      <div class="al-main" style="direction:${rtl}">
        <div class="al-left"><div class="al-prevT">${esc2(t('alPrev'))}</div><canvas id="alPrev" class="al-prev" width="640" height="360"></canvas></div>
        <div class="al-ctl" id="alPanel">${panel()}</div></div></div>`;

    // --- معاينة: البطاقة في مكانها الحقيقي على كانفس 1280×720 (مصغّرة للنصف) ---
    const SC = 0.5, pc = () => $('alPrev');
    const cardXY = () => {
      const M = 36, w = 1280, h = 720, pos = f().pos, top = pos === 'top' || pos === 'tr' || pos === 'tl';
      return [pos === 'tl' || pos === 'bl' ? M : pos === 'tr' || pos === 'br' ? w - CW_ - M : (w - CW_) / 2, top ? M : h - CH_ - M];
    };
    function nameBox() {
      const c = pc().getContext('2d'), n = f().nm; c.save(); c.font = `800 ${n.size}px ${FONT}`;
      const w = Math.min(CW_ - 40, c.measureText(t('alTestName')).width); c.restore();
      return { x: n.x - w / 2, y: n.y - n.size * 0.62, w, h: n.size * 1.24 };
    }
    function paintPrev() {
      const cv_ = pc(); if (!cv_ || !cv_.isConnected) { cancelAnimationFrame(raf); return; }
      const c = cv_.getContext('2d'), [x, y] = cardXY();
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv_.width, cv_.height);
      c.fillStyle = '#14161b'; c.fillRect(0, 0, cv_.width, cv_.height);
      c.setTransform(SC, 0, 0, SC, 0, 0);
      card(c, x, y, f(), t('alTestName'), 1, performance.now());
      if (sel === 'img' || sel === 'nm') {
        c.save(); c.translate(x, y); c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = '#ffd400';
        if (sel === 'img') { const g = f().img, r = g.size / 2 + 4; c.strokeRect(g.x - r, g.y - r, r * 2, r * 2); }
        else { const b = nameBox(); c.strokeRect(b.x - 5, b.y - 3, b.w + 10, b.h + 6); }
        c.restore();
      }
      raf = requestAnimationFrame(paintPrev);
    }
    const toCard = e => { const r = pc().getBoundingClientRect(), [x, y] = cardXY(); return [(e.clientX - r.left) / r.width * 1280 - x, (e.clientY - r.top) / r.height * 720 - y]; };
    function hit(px, py) {
      const g = f(), b = nameBox();
      if (g.nm.show && px >= b.x - 8 && px <= b.x + b.w + 8 && py >= b.y - 8 && py <= b.y + b.h + 8) return 'nm';
      if (g.img.show && Math.hypot(px - g.img.x, py - g.img.y) <= g.img.size / 2 + 8) return 'img';
      return null;
    }
    function select(k) {
      sel = k;
      document.querySelectorAll('.al-sec').forEach(x => x.classList.toggle('sel', x.dataset.sec === k));
      const el = document.querySelector(`.al-sec[data-sec="${k}"]`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    const PREF = { img: ['alI', 'alIX', 'alIY', 'alISize'], nm: ['alN', 'alNX', 'alNY', 'alNSize'] };
    function sync() {                                          // تحديث الحقول الرقمية/المنزلقات من القيم
      const g = f();
      [['alIX', g.img.x], ['alIY', g.img.y], ['alISize', g.img.size], ['alNX', g.nm.x], ['alNY', g.nm.y], ['alNSize', g.nm.size], ['alBgA', g.bgA]].forEach(([id, v]) => {
        const a = $(id), b = $(id + 'N'); if (a) a.value = Math.round(v); if (b) b.value = Math.round(v);
      });
    }
    function bindPrev() {
      const cv_ = pc();
      cv_.onpointerdown = e => {
        const [px, py] = toCard(e), k = hit(px, py); if (!k) return;
        select(k); drag = { k, dx: f()[k].x - px, dy: f()[k].y - py }; cv_.setPointerCapture(e.pointerId); e.preventDefault();
      };
      cv_.onpointermove = e => {
        const [px, py] = toCard(e);
        if (!drag) { cv_.style.cursor = hit(px, py) ? 'grab' : 'default'; return; }
        cv_.style.cursor = 'grabbing';
        const o = f()[drag.k]; o.x = Math.round(num(px + drag.dx, -60, CW_ + 60, o.x)); o.y = Math.round(num(py + drag.dy, -60, CH_ + 60, o.y)); save(); sync();
      };
      cv_.onpointerup = cv_.onpointercancel = () => { drag = null; };
    }
    function readGen() {
      const g = f(); g.on = $('alOn').checked; g.dur = +$('alDur').value || 5; g.pos = $('alPos').value; g.text = $('alLabel').value.trim().slice(0, 30); save(); paintBtn();
    }
    function bindPanel() {
      const g = f(), on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
      // منزلق + حقل رقمي لكل قيمة
      const pair = (id, set, a, b) => {
        const r = $(id), n = $(id + 'N'); if (!r || !n) return;
        const apply = v => { v = num(v, a, b, +r.value); set(v); r.value = n.value = Math.round(v); save(); };
        r.addEventListener('input', () => apply(r.value)); n.addEventListener('input', () => { if (n.value !== '') apply(n.value); });
        n.addEventListener('change', () => { n.value = r.value; });
      };
      pair('alISize', v => g.img.size = v, 24, 200); pair('alIX', v => g.img.x = v, -60, CW_ + 60); pair('alIY', v => g.img.y = v, -60, CH_ + 60);
      pair('alNSize', v => g.nm.size = v, 14, 90); pair('alNX', v => g.nm.x = v, -60, CW_ + 60); pair('alNY', v => g.nm.y = v, -60, CH_ + 60);
      pair('alBgA', v => g.bgA = v, 0, 100);
      ['alOn', 'alDur', 'alPos'].forEach(i => on(i, 'change', readGen)); on('alLabel', 'input', readGen);
      on('alImgShow', 'change', () => { g.img.show = $('alImgShow').checked; save(); });
      on('alNShow', 'change', () => { g.nm.show = $('alNShow').checked; save(); });
      on('alNColor', 'input', () => { g.nm.color = hex($('alNColor').value, '#ffffff'); save(); });
      on('alAccent', 'input', () => { g.accent = hex($('alAccent').value, '#53fc18'); save(); });
      on('alBg', 'input', () => { g.bg = hex($('alBg').value, '#0e1014'); save(); });
      on('alPick', 'click', () => $('alFile').click());
      on('alFile', 'change', e => { const fl = e.target.files && e.target.files[0]; if (!fl) return; readImg(fl, d => { g.img.data = d; g.img.show = true; save(); sel = 'img'; refresh(); }); });
      on('alRm', 'click', () => { g.img.data = ''; save(); refresh(); });
      document.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => {
        if (b.dataset.rs === 'img') { const keep = g.img.data; g.img = Object.assign(DIMG(), { data: keep }); } else g.nm = DNAME();
        save(); refresh();
      });
      on('alAll', 'click', () => { CFG.follow = norm(DEF.follow); CFG.follow.on = true; save(); paintBtn(); refresh(); });
      document.querySelectorAll('.al-sec').forEach(x => x.addEventListener('focusin', () => { if (x.dataset.sec === 'img' || x.dataset.sec === 'nm') { sel = x.dataset.sec; document.querySelectorAll('.al-sec').forEach(y => y.classList.toggle('sel', y === x)); } }));
    }
    function refresh() { $('alPanel').innerHTML = panel(); bindPanel(); }
    dlg({
      title: t('alTitle'), body, wide: true,
      onOpen: () => {
        box.classList.add('al-box'); paintIcons($('dlgB'));
        bindPrev(); bindPanel(); paintPrev();
        dlgClose = () => { cancelAnimationFrame(raf); box.classList.remove('al-box'); if (!committed) { try { CFG = { follow: norm(JSON.parse(orig).follow) }; save(); paintBtn(); } catch (e) {} } };
      },
      actions: [
        { label: t('alTest'), cb: () => { clear(); const was = CFG.follow.on; CFG.follow.on = true; push('follow', t('alTestName')); CFG.follow.on = was; return false; } },
        { label: t('cancel') },
        { label: t('alSave'), kind: 'primary', cb: () => { const was = JSON.parse(orig).follow.on; committed = true; save(); paintBtn(); if (was !== CFG.follow.on) { toast(t(CFG.follow.on ? 'alOnToast' : 'alOffToast')); if (!CFG.follow.on) clear(); } } }
      ]
    });
  }
  if (btn) btn.onclick = openDialog;

  /* ---------- ربط عام ---------- */
  window.SEAlert = { draw, push, clear, open: openDialog, cfg: () => CFG };
  try { paintIcons(btn || document); paintBtn(); } catch (e) {}
  const _ai = applyI18n;
  applyI18n = function () { _ai(); try { paintBtn(); } catch (e) {} };
})();
