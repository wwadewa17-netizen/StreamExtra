/* ============================================================
   نظام الأليرتات (v1.9) — الخطوة الأولى: أليرت المتابعة الجديدة
   - يُرسم الأليرت على نفس الكانفس (cv) اللي ينبث، فيظهر في المعاينة وعند المشاهدين.
   - يشتغل من حدث المتابعة اللي يوصل لموجز النشاط (kpanel.js → addAct).
   - زر الأليرتات (تحت زر الإعدادات في لوحة التحكم) يفتح الإعدادات: تفعيل/إيقاف، المدة، المكان، النص، تجربة.
   - الإعدادات محفوظة في se_kalert، وجاهزة لإضافة أنواع ثانية (اشتراك، هدية...) بنفس الشكل.
   ============================================================ */
(() => {
  Object.assign(IC, {
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
    alOnToast: 'تم تفعيل الأليرتات', alOffToast: 'تم إيقاف الأليرتات', alTestName: 'اسم_المتابع'
  });
  Object.assign(I18N.en, {
    kAlertT: 'Alert settings',
    alTitle: 'Alert settings', alFollowH: 'Follow alert',
    alOn: 'Enable new-follower alert', alDur: 'Display time', alSec: 'sec', alPos: 'Alert position',
    alLabel: 'Text above the name', alFollowDef: 'New follower',
    alTop: 'Top center', alBottom: 'Bottom center', alTR: 'Top right', alTL: 'Top left', alBR: 'Bottom right', alBL: 'Bottom left',
    alTest: 'Test alert', alSave: 'Save',
    alNote: 'The alert shows on the preview and on the stream itself when a new follower arrives. If several arrive at once they show one after another.',
    alOnToast: 'Alerts enabled', alOffToast: 'Alerts disabled', alTestName: 'follower_name'
  });

  /* ---------- الإعدادات ---------- */
  const KEY = 'se_kalert', POS = ['top', 'bottom', 'tr', 'tl', 'br', 'bl'], DURS = [3, 5, 8, 10, 15];
  const DEF = { follow: { on: true, dur: 5, pos: 'top', text: '' } };
  function load() {
    let o = {}; try { o = JSON.parse(LS.get(KEY, '{}')) || {}; } catch (e) {}
    const f = Object.assign({}, DEF.follow, o.follow || {});
    f.on = !!f.on; f.dur = DURS.includes(+f.dur) ? +f.dur : 5; f.pos = POS.includes(f.pos) ? f.pos : 'top'; f.text = String(f.text || '').slice(0, 30);
    return { follow: f };
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

    const W = 470, H = 112, M = 36, pos = cf.pos;
    const top = pos === 'top' || pos === 'tr' || pos === 'tl';
    let x = pos === 'tl' || pos === 'bl' ? M : pos === 'tr' || pos === 'br' ? w - W - M : (w - W) / 2;
    const y0 = top ? M : h - H - M, slide = (1 - p) * (H + M) * (top ? -1 : 1), y = y0 + slide;

    const label = cf.text || t('alFollowDef'), name = curA.user || t('alFollowDef');
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, p));
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 24; c.shadowOffsetY = 6;
    rrect(c, x, y, W, H, 24); c.fillStyle = 'rgba(14,16,20,.94)'; c.fill();
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
    rrect(c, x, y, W, H, 24); c.lineWidth = 3; c.strokeStyle = '#53fc18'; c.stroke();

    // دائرة الأيقونة (قلب)
    const cx = x + 20 + 36, cy = y + H / 2;
    c.beginPath(); c.arc(cx, cy, 36, 0, Math.PI * 2); c.fillStyle = 'rgba(83,252,24,.16)'; c.fill();
    c.lineWidth = 2; c.strokeStyle = '#53fc18'; c.stroke();
    c.save(); c.translate(cx, cy + 2); const s = 1 + 0.08 * Math.sin(el / 160);
    c.scale(s, s);
    c.beginPath(); c.moveTo(0, 14); c.bezierCurveTo(-26, -4, -14, -24, 0, -10); c.bezierCurveTo(14, -24, 26, -4, 0, 14); c.closePath();
    c.fillStyle = '#53fc18'; c.fill(); c.restore();

    // النصوص (وسط المساحة المتبقية)
    const tx = x + 20 + 72 + 18, tw = W - (tx - x) - 20, mid = tx + tw / 2;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `700 22px ${FONT}`; c.fillStyle = '#53fc18';
    c.direction = /[\u0590-\u08FF]/.test(label) ? 'rtl' : 'ltr';
    c.fillText(fit(c, label, tw), mid, y + 36);
    c.font = `800 36px ${FONT}`; c.fillStyle = '#ffffff';
    c.direction = /[\u0590-\u08FF]/.test(name) ? 'rtl' : 'ltr';
    c.fillText(fit(c, name, tw), mid, y + 76);
    c.restore();
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
  function readForm() {
    const f = CFG.follow;
    f.on = $('alOn').checked; f.dur = +$('alDur').value || 5; f.pos = $('alPos').value; f.text = $('alLabel').value.trim().slice(0, 30);
    save(); paintBtn();
  }
  function openDialog() {
    const f = CFG.follow, esc2 = esc;
    const body = `<div class="kx-sec" style="margin-top:0">${esc2(t('alFollowH'))}</div>
      <label class="k-toggle"><input type="checkbox" id="alOn" ${f.on ? 'checked' : ''}><span class="k-sw"></span><b>${esc2(t('alOn'))}</b></label>
      <div class="grid2" style="margin-top:12px">
        <label class="f"><span>${esc2(t('alDur'))}</span><select id="alDur">${DURS.map(d => `<option value="${d}" ${d === f.dur ? 'selected' : ''}>${d} ${esc2(t('alSec'))}</option>`).join('')}</select></label>
        <label class="f"><span>${esc2(t('alPos'))}</span><select id="alPos">${POS.map(p => `<option value="${p}" ${p === f.pos ? 'selected' : ''}>${esc2(t({ top: 'alTop', bottom: 'alBottom', tr: 'alTR', tl: 'alTL', br: 'alBR', bl: 'alBL' }[p]))}</option>`).join('')}</select></label>
        <label class="f full"><span>${esc2(t('alLabel'))}</span><input type="text" id="alLabel" maxlength="30" value="${esc2(f.text)}" placeholder="${esc2(t('alFollowDef'))}"></label>
      </div>
      <div class="k-snote" style="margin-top:10px">${esc2(t('alNote'))}</div>`;
    dlg({
      title: t('alTitle'), body,
      actions: [
        { label: t('alTest'), cb: () => { readForm(); clear(); const was = CFG.follow.on; CFG.follow.on = true; push('follow', t('alTestName')); CFG.follow.on = was; return false; } },
        { label: t('cancel') },
        { label: t('alSave'), kind: 'primary', cb: () => { const was = CFG.follow.on; readForm(); if (was !== CFG.follow.on) { toast(t(CFG.follow.on ? 'alOnToast' : 'alOffToast')); if (!CFG.follow.on) clear(); } } }
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
