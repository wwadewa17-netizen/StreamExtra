'use strict';
/* ============================================================
   v1.7 — تخطيط الصناديق (المشاهد / العناصر / الخلاط / الجلسة / الشات):
   - اسحب شريط عنوان أي صندوق لتغيير مكانه.
   - اسحب حافة الصندوق (الخط بين صندوقين) لتكبيره أو تصغيره.
   - زر الإعادة في شريط المعاينة (أو دبل-كليك على الحافة) يرجع التخطيط الافتراضي.
   الترتيب والأحجام تُحفظ تلقائياً.
   ============================================================ */
(() => {
  Object.assign(I18N.ar, { layoutResetT: 'إعادة ترتيب الصناديق وأحجامها للوضع الافتراضي', layoutLockT: 'قفل / فتح تخطيط الصناديق' });
  Object.assign(I18N.en, { layoutResetT: 'Reset box layout and sizes', layoutLockT: 'Lock / unlock box layout' });

  const row = document.querySelector('.docks'); if (!row) return;
  const ORDER_K = 'se_dock_order', W_K = 'se_dock_w';
  const DEF_ORDER = ['dkScenes', 'dkSources', 'dkMixer', 'dkSession', 'dkKick'];
  const DEF_W = { dkScenes: .72, dkSources: .85, dkMixer: 1, dkSession: 1.35, dkKick: 1.9 };
  const docks = () => [...row.querySelectorAll(':scope > .dock')];
  const byId = id => document.getElementById(id);
  const rtl = () => getComputedStyle(row).direction === 'rtl';
  const minW = d => parseFloat(getComputedStyle(d).minWidth) || 150;

  function save() {
    LS.set(ORDER_K, JSON.stringify(docks().map(d => d.id)));
    const w = {}; docks().forEach(d => { w[d.id] = +(parseFloat(d.style.getPropertyValue('--w')) || DEF_W[d.id] || 1).toFixed(4); });
    LS.set(W_K, JSON.stringify(w));
  }
  function load() {
    let order = null, w = null;
    try { order = JSON.parse(LS.get(ORDER_K, 'null')); } catch (e) {}
    try { w = JSON.parse(LS.get(W_K, 'null')); } catch (e) {}
    if (Array.isArray(order)) {
      const ids = DEF_ORDER.slice(); const ok = order.filter(id => ids.includes(id)); ids.forEach(id => { if (!ok.includes(id)) ok.push(id); });
      ok.forEach(id => { const d = byId(id); if (d) row.appendChild(d); });
    }
    docks().forEach(d => { const v = w && +w[d.id]; if (v > 0) d.style.setProperty('--w', String(v)); });
  }
  function reset() {
    DEF_ORDER.forEach(id => { const d = byId(id); if (d) row.appendChild(d); });
    docks().forEach(d => d.style.setProperty('--w', String(DEF_W[d.id] || 1)));
    save();
  }

  /* ---------- مقابض تغيير الحجم: على حافة كل صندوق (بينه وبين التالي) ---------- */
  docks().forEach(d => {
    const h = document.createElement('div'); h.className = 'dresz'; d.appendChild(h);
    h.addEventListener('dblclick', reset);
    h.addEventListener('pointerdown', e => {
      if (e.button !== 0 || document.body.classList.contains('dock-locked')) return;
      const a = d, b = d.nextElementSibling; if (!b || !b.classList.contains('dock')) return;
      e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('drag'); document.body.classList.add('dock-sizing');
      const x0 = e.clientX, wa = a.getBoundingClientRect().width, wb = b.getBoundingClientRect().width, sum = wa + wb;
      const ma = minW(a), mb = minW(b), sgn = rtl() ? -1 : 1;
      const all = docks(), totalPx = all.reduce((s, x) => s + x.getBoundingClientRect().width, 0);
      const wsum = all.reduce((s, x) => s + (parseFloat(x.style.getPropertyValue('--w')) || DEF_W[x.id] || 1), 0);
      const k = wsum / totalPx;                                   // تحويل بكسل ← وزن
      h.onpointermove = ev => {
        const na = clamp(wa + (ev.clientX - x0) * sgn, ma, Math.max(ma, sum - mb));
        a.style.setProperty('--w', String(+(na * k).toFixed(4))); b.style.setProperty('--w', String(+((sum - na) * k).toFixed(4)));
      };
      h.onpointerup = h.onpointercancel = () => { h.onpointermove = h.onpointerup = h.onpointercancel = null; h.classList.remove('drag'); document.body.classList.remove('dock-sizing'); save(); try { window.dispatchEvent(new Event('resize')); } catch (e) {} };
    });
  });

  /* ---------- تحريك الصناديق: اسحب شريط العنوان ---------- */
  row.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const head = e.target.closest('.dock-head'); if (!head || !row.contains(head)) return;
    if (e.target.closest('button,select,input,textarea,label,a,.k-tabs,.k-stats,.scn-chip')) return;
    if (document.body.classList.contains('dock-locked')) return;
    const d = head.closest('.dock'); if (!d || document.body.classList.contains('k-bigmode')) return;
    const x0 = e.clientX; let moving = false;
    const mv = ev => {
      if (!moving) { if (Math.abs(ev.clientX - x0) < 8) return; moving = true; d.classList.add('dragging'); document.body.classList.add('dock-moving'); }
      // نحرّك الصندوق مع المؤشر مباشرة عند عبور منتصف صندوق مجاور
      const sibs = docks().filter(s => s !== d);
      for (const s of sibs) {
        const r = s.getBoundingClientRect(), mid = r.left + r.width / 2;
        const before = d.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING;   // s بعد d في الـDOM
        const dr = d.getBoundingClientRect(); const dMid = dr.left + dr.width / 2;
        if (before && ((rtl() ? ev.clientX < mid && dMid > mid : ev.clientX > mid && dMid < mid))) { row.insertBefore(d, s.nextElementSibling); break; }
        if (!before && ((rtl() ? ev.clientX > mid && dMid < mid : ev.clientX < mid && dMid > mid))) { row.insertBefore(d, s); break; }
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      if (moving) { d.classList.remove('dragging'); document.body.classList.remove('dock-moving'); save(); }
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });

  const rb = byId('layoutReset'); if (rb) { rb.onclick = reset; try { paintIcons(rb); } catch (e) {} }
  const lb = byId('layoutLock');
  const setLock = on => { document.body.classList.toggle('dock-locked', on); if (lb) lb.classList.toggle('on', on); };
  if (lb) { try { paintIcons(lb); } catch (e) {} lb.onclick = () => { const on = !document.body.classList.contains('dock-locked'); setLock(on); LS.set('se_dock_lock', on ? '1' : '0'); }; }
  setLock(LS.get('se_dock_lock', '0') === '1');
  load();
  try { applyI18n(); } catch (e) {}
})();
