/* ============================================================
   نظام الأليرتات (v2.2) — أليرت المتابعة الجديدة
   - يُرسم الأليرت على نفس الكانفس (cv) اللي ينبث، فيظهر في المعاينة وعند المشاهدين.
   - يشتغل من حدث المتابعة اللي يوصل لموجز النشاط (kpanel.js → addAct).
   - v2.2: 4 قوالب بلغتين (عربي / English) · خطوط عربية وإنجليزية حسب لغة القالب · خلفية القالب (ألوان/تدرّج/صورة) · القالب في وسط الشاشة وقابل للسحب والتحريك.
   - v2.1: قوالب جاهزة · رسالة الترحيب واسم المتابع منفصلان · أغنية · فيديو MP4 (بصوته) · نافذة بتبويبات.
   - الصوت والفيديو يمرّان عبر الخلاط (getMixer) فيصلان للبث ولسماعاتك.
   - ملفات الصوت/الفيديو تُحفظ في IndexedDB بمفاتيح تبدأ بـ alert_ (gcAssets في app.js يتجاوزها).
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
    alFollowDef: 'متابع جديد',
    alTop: 'أعلى الوسط', alBottom: 'أسفل الوسط', alTR: 'أعلى اليمين', alTL: 'أعلى اليسار', alBR: 'أسفل اليمين', alBL: 'أسفل اليسار', alCenter: 'وسط الشاشة',
    alSave: 'حفظ',
    alNote: 'يظهر الأليرت على المعاينة وعلى البث نفسه عند وصول متابع جديد، ويُشغَّل صوته مع البث. لو وصل أكثر من متابع بنفس اللحظة تظهر الأليرتات واحد ورا الثاني.',
    alOnToast: 'تم تفعيل الأليرتات', alOffToast: 'تم إيقاف الأليرتات', alTestName: 'اسم_المتابع',
    alPrev: 'معاينة مباشرة — اسحب القالب أو الرسالة أو الاسم أو الصورة بالماوس، وعجلة الماوس تكبّر/تصغّر النص', alPick: 'اختيار صورة', alRemove: 'حذف الصورة', alReset: 'إعادة الضبط',
    alSize: 'الحجم', alColor: 'اللون', alShowImg: 'إظهار الصورة / الأيقونة', alImgErr: 'تعذر قراءة الصورة',
    alTypes: 'أنواع الأليرتات', alSecGen: 'الإعدادات العامة', alSecImg: 'الصورة',
    alX: 'الموضع أفقي', alY: 'الموضع عمودي', alAccent: 'لون الإطار والأيقونة', alBg: 'لون الخلفية', alBgA: 'شفافية الخلفية', alResetAll: 'إعادة ضبط التصميم',
    alAddImg: 'إضافة صورة', alChangeImg: 'تغيير الصورة',
    /* v2.1 */
    alTabTpl: 'القوالب', alTabTxt: 'النصوص', alTabMed: 'الوسائط', alTabLook: 'الشكل', alTabGen: 'عام',
    alTplT: 'قوالب جاهزة', alTplHint: 'اختر قالباً بنقرة واحدة ثم عدّل عليه ما تشاء. صورتك وصوتك وفيديوك ونصوصك تبقى كما هي.', alTplVid: 'مناسب للفيديو', alTplApplied: 'تم تطبيق القالب',
    alSecMsg: 'رسالة الترحيب', alSecNm: 'اسم المتابع',
    alMsgShow: 'إظهار رسالة الترحيب', alMsgText: 'نص رسالة الترحيب', alNmShow: 'إظهار اسم المتابع',
    alNmNote: 'اسم المتابع الحقيقي يظهر تلقائياً عند وصول متابع. هنا تتحكم بشكله ومكانه فقط، والاسم التجريبي (تحت المعاينة) للتجربة.',
    alFont: 'الخط', alWeight: 'السماكة', alW4: 'عادي', alW6: 'متوسط', alW7: 'عريض', alW8: 'عريض جداً',
    alIco: 'شكل الأيقونة (عند عدم وجود صورة)', alIcoHeart: 'قلب', alIcoStar: 'نجمة', alIcoBolt: 'صاعقة', alIcoCrown: 'تاج',
    alSecVid: 'فيديو MP4', alVidAdd: 'إضافة فيديو', alVidChange: 'تغيير الفيديو', alVidRm: 'حذف الفيديو',
    alVidShow: 'إظهار الفيديو داخل البطاقة', alVidVol: 'مستوى صوت الفيديو',
    alVidNote: 'ارفع فيديو MP4 فيه الأغنية، فيُشغَّل الفيديو وصوته معاً في مقطع واحد. اختر مدة «تلقائي» ليبقى الأليرت حتى نهاية الفيديو. ينصح بحجم بطاقة كبير (قالب «سينمائي»).',
    alSecSnd: 'الأغنية / الصوت', alSndAdd: 'إضافة أغنية', alSndChange: 'تغيير الأغنية', alSndRm: 'حذف الأغنية',
    alSndVol: 'مستوى الصوت', alSndStart: 'البدء من الثانية', alSndFade: 'تلاشي الصوت في النهاية (ثانية)', alSndPrev: 'استماع', alSndStop: 'إيقاف',
    alSndNote: 'يدعم MP3 / WAV / OGG / M4A. الصوت يُشغَّل مع الأليرت على البث وعندك، ويتوقف (مع تلاشي) عند انتهاء مدة الأليرت.',
    alNoFile: 'لا يوجد ملف',
    alSecCard: 'حجم البطاقة والإطار', alCW: 'عرض البطاقة', alCH: 'ارتفاع البطاقة', alRad: 'استدارة الزوايا', alBW: 'سماكة الإطار', alGlow: 'توهج الإطار',
    alBg2: 'لون الخلفية الثاني (تدرّج)', alSecFx: 'التأثيرات', alGlass: 'تأثير زجاجي', alShine: 'لمعة متحركة', alFx: 'شرارات عند الظهور',
    alAnim: 'حركة الظهور', alAnimSlide: 'انزلاق', alAnimPop: 'تكبير', alAnimFade: 'تلاشي', alSecColors: 'الألوان',
    alDurAuto: 'تلقائي (حسب الفيديو/الأغنية)', alVidAuto: 'تم ضبط مدة الظهور على «تلقائي» لتناسب طول الفيديو (تقدر تغيّرها من تبويب عام)',
    alPlay: 'تشغيل التجربة', alTestNm: 'اسم المتابع للتجربة',
    alMediaErr: 'تعذر قراءة الملف أو أن صيغته غير مدعومة', alTooBig: 'الملف كبير جداً (الحد الأقصى {n} ميغابايت)',
    /* v2.2 */
    alLang: 'لغة القالب', alLangHint: 'اختر لغة القالب: يتغيّر النص الافتراضي لرسالة الترحيب (متابع جديد / New follower) وقائمة الخطوط المناسبة للغة. تظهر الخطوط المتوفرة على جهازك فقط، وكل خط بشكله.',
    alSecBg: 'خلفية القالب', alBgAdd: 'إضافة صورة خلفية', alBgChange: 'تغيير صورة الخلفية', alBgRm: 'حذف صورة الخلفية', alBgDim: 'تعتيم صورة الخلفية',
    alBgHint: 'غيّر لون الخلفية أو التدرّج أو ضع صورة خلفية للقالب. تطبيق قالب جديد يُرجع خلفيته الأصلية.',
    alSecPos: 'مكان القالب على الشاشة', alPosCustom: 'مخصص', alCardX: 'موضع القالب أفقي', alCardY: 'موضع القالب عمودي', alCenterNow: 'توسيط القالب',
    alPosHint: 'القالب يظهر افتراضياً في وسط الشاشة. اسحبه بالماوس داخل المعاينة (يلتصق بالمنتصف تلقائياً) أو عدّل الأرقام.'
  });
  Object.assign(I18N.en, {
    kAlertT: 'Alert settings',
    alTitle: 'Alert settings', alFollowH: 'Follow alert',
    alOn: 'Enable new-follower alert', alDur: 'Display time', alSec: 'sec', alPos: 'Alert position',
    alFollowDef: 'New follower',
    alTop: 'Top center', alBottom: 'Bottom center', alTR: 'Top right', alTL: 'Top left', alBR: 'Bottom right', alBL: 'Bottom left', alCenter: 'Screen center',
    alSave: 'Save',
    alNote: 'The alert shows on the preview and on the stream itself when a new follower arrives, and its sound plays on the stream. If several arrive at once they show one after another.',
    alOnToast: 'Alerts enabled', alOffToast: 'Alerts disabled', alTestName: 'follower_name',
    alPrev: 'Live preview — drag the card, message, name or image with the mouse; the mouse wheel resizes text', alPick: 'Choose image', alRemove: 'Remove image', alReset: 'Reset',
    alSize: 'Size', alColor: 'Color', alShowImg: 'Show image / icon', alImgErr: 'Could not read the image',
    alTypes: 'Alert types', alSecGen: 'General', alSecImg: 'Image',
    alX: 'Position X', alY: 'Position Y', alAccent: 'Border & icon color', alBg: 'Background color', alBgA: 'Background opacity', alResetAll: 'Reset design',
    alAddImg: 'Add image', alChangeImg: 'Change image',
    /* v2.1 */
    alTabTpl: 'Templates', alTabTxt: 'Texts', alTabMed: 'Media', alTabLook: 'Look', alTabGen: 'General',
    alTplT: 'Ready-made templates', alTplHint: 'Pick a template in one click, then tweak it. Your image, sound, video and texts are kept.', alTplVid: 'Great with video', alTplApplied: 'Template applied',
    alSecMsg: 'Welcome message', alSecNm: 'Follower name',
    alMsgShow: 'Show welcome message', alMsgText: 'Welcome message text', alNmShow: 'Show follower name',
    alNmNote: 'The real follower name appears automatically when someone follows. Here you only control its look and position; the test name (under the preview) is just for trying.',
    alFont: 'Font', alWeight: 'Weight', alW4: 'Regular', alW6: 'Semibold', alW7: 'Bold', alW8: 'Extra bold',
    alIco: 'Icon shape (when no image)', alIcoHeart: 'Heart', alIcoStar: 'Star', alIcoBolt: 'Bolt', alIcoCrown: 'Crown',
    alSecVid: 'MP4 video', alVidAdd: 'Add video', alVidChange: 'Change video', alVidRm: 'Remove video',
    alVidShow: 'Show the video inside the card', alVidVol: 'Video volume',
    alVidNote: 'Upload an MP4 that contains the song: video and sound play together as one clip. Choose «Auto» duration so the alert lasts until the video ends. A big card works best (the “Cinema” template).',
    alSecSnd: 'Song / sound', alSndAdd: 'Add song', alSndChange: 'Change song', alSndRm: 'Remove song',
    alSndVol: 'Volume', alSndStart: 'Start from second', alSndFade: 'Fade-out at the end (sec)', alSndPrev: 'Listen', alSndStop: 'Stop',
    alSndNote: 'Supports MP3 / WAV / OGG / M4A. The sound plays with the alert on the stream and for you, and stops (with a fade) when the alert ends.',
    alNoFile: 'No file',
    alSecCard: 'Card size & border', alCW: 'Card width', alCH: 'Card height', alRad: 'Corner radius', alBW: 'Border width', alGlow: 'Border glow',
    alBg2: 'Second background color (gradient)', alSecFx: 'Effects', alGlass: 'Glass effect', alShine: 'Moving shine', alFx: 'Sparkles on appear',
    alAnim: 'Entrance animation', alAnimSlide: 'Slide', alAnimPop: 'Pop', alAnimFade: 'Fade', alSecColors: 'Colors',
    alDurAuto: 'Auto (follows video/song)', alVidAuto: 'Display time set to “Auto” so the whole video plays (change it in the General tab)',
    alPlay: 'Play test', alTestNm: 'Test follower name',
    alMediaErr: 'Could not read the file, or its format is not supported', alTooBig: 'File is too large (max {n} MB)',
    /* v2.2 */
    alLang: 'Template language', alLangHint: 'Pick the template language: it changes the default welcome text (متابع جديد / New follower) and the font list for that language. Only fonts installed on your PC are shown, each in its own look.',
    alSecBg: 'Template background', alBgAdd: 'Add background image', alBgChange: 'Change background image', alBgRm: 'Remove background image', alBgDim: 'Background image dimming',
    alBgHint: 'Change the background color or gradient, or add a background image. Applying a new template restores its original background.',
    alSecPos: 'Template position on screen', alPosCustom: 'Custom', alCardX: 'Card position X', alCardY: 'Card position Y', alCenterNow: 'Center the card',
    alPosHint: 'The template shows in the middle of the screen by default. Drag it in the preview (it snaps to the center) or edit the numbers.'
  });

  /* ---------- الإعدادات ---------- */
  const KEY = 'se_kalert', POS = ['top', 'bottom', 'tr', 'tl', 'br', 'bl', 'center', 'custom'], DURS = [0, 3, 5, 8, 10, 15, 20, 30];
  const ANIMS = ['slide', 'pop', 'fade'], ICOS = ['heart', 'star', 'bolt', 'crown'], WEIGHTS = [400, 600, 700, 800];
  /* خطوط حسب اللغة (خطوط ويندوز الجاهزة + بعض الخطوط الشائعة لو مثبّتة عند المستخدم) — تُعرض فقط المتوفر منها */
  const FONTS_AR = ['Segoe UI', 'Tahoma', 'Arial', 'Times New Roman', 'Dubai', 'Sakkal Majalla', 'Traditional Arabic', 'Simplified Arabic', 'Arabic Typesetting', 'Andalus', 'Aldhabi', 'Courier New', 'Microsoft Sans Serif', 'Cairo', 'Tajawal', 'Almarai', 'Amiri', 'Noto Naskh Arabic', 'IBM Plex Sans Arabic'];
  const FONTS_EN = ['Segoe UI', 'Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Arial Black', 'Georgia', 'Times New Roman', 'Palatino Linotype', 'Comic Sans MS', 'Courier New', 'Lucida Console', 'Consolas', 'Bahnschrift', 'Segoe Script', 'Calibri', 'Cambria'];
  const FONTS_ = Array.from(new Set(FONTS_AR.concat(FONTS_EN)));
  const fontOk = (() => {                                  // هل الخط مثبّت؟ (مقارنة عرض نص مع الخطوط العامة)
    const cache = {}, cx = document.createElement('canvas').getContext('2d'), S = 'mmmmmmmmmmlli0OWاللغةالعربية';
    return name => {
      if (name in cache) return cache[name];
      let ok = false;
      for (const b of ['monospace', 'serif', 'sans-serif']) { cx.font = `40px ${b}`; const w0 = cx.measureText(S).width; cx.font = `40px "${name}", ${b}`; if (cx.measureText(S).width !== w0) { ok = true; break; } }
      return (cache[name] = ok);
    };
  })();
  const DEFTXT = { ar: 'متابع جديد', en: 'New follower' }, DEFNAME = { ar: 'متابع', en: 'Follower' }, TESTN = { ar: 'اسم_المتابع', en: 'follower_name' };
  const curLang = () => (typeof lang !== 'undefined' && lang === 'en') ? 'en' : 'ar';
  const FONT = '"Segoe UI", Tahoma, Arial, sans-serif';
  const DIMG = () => ({ data: '', show: true, x: 56, y: 56, size: 72 });
  const DBGI = () => ({ data: '', dim: 35 });
  const DNAME = () => ({ show: true, x: 276, y: 76, size: 36, color: '#ffffff', font: 'Segoe UI', weight: 800 });
  const DMSG = () => ({ show: true, text: '', x: 276, y: 44, size: 22, color: '#53fc18', font: 'Segoe UI', weight: 700 });
  const DVID = () => ({ id: '', name: '', vol: 100, show: true });
  const DSND = () => ({ id: '', name: '', vol: 80, start: 0, fade: 1 });
  const DEFF = () => ({
    v: 2, lang: 'ar', px: 405, py: 304, bgimg: DBGI(), tpl: 'classic', on: true, dur: 5, pos: 'center', anim: 'slide', fx: false, w: 470, h: 112,
    radius: 24, bw: 3, glow: 0, glass: false, shine: false, ico: 'heart',
    accent: '#53fc18', bg: '#0e1014', bg2: '#0e1014', bgA: 94,
    img: DIMG(), nm: DNAME(), msg: DMSG(), vid: DVID(), snd: DSND()
  });
  const num = (v, a, b, d) => { v = +v; return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  const hex = (v, d) => /^#[0-9a-fA-F]{6}$/.test(v) ? v : d;
  const rgba = (h, a) => { const m = h.slice(1).match(/../g).map(v => parseInt(v, 16)); return `rgba(${m[0]},${m[1]},${m[2]},${a})`; };
  function normTxt(src, def, f) {
    const o = Object.assign(def, src || {});
    return { show: o.show !== false, text: String(o.text || '').slice(0, 40), x: num(o.x, -60, f.w + 60, def.x), y: num(o.y, -60, f.h + 60, def.y), size: num(o.size, 10, 160, def.size),
      color: hex(o.color, def.color), font: FONTS_.includes(o.font) ? o.font : 'Segoe UI', weight: WEIGHTS.includes(+o.weight) ? +o.weight : def.weight };
  }
  function norm(o) {
    o = o || {};
    const f = Object.assign(DEFF(), o);
    f.lang = (o.lang === 'en' || o.lang === 'ar') ? o.lang : curLang();
    f.tpl = String(f.tpl || 'custom').slice(0, 24); f.on = !!f.on; f.dur = DURS.includes(+f.dur) ? +f.dur : 5; f.pos = POS.includes(f.pos) ? f.pos : 'center';
    if (!o.v || o.v < 2) f.pos = 'center';                   // ترحيل من v2.1: القالب في وسط الشاشة
    f.v = 2; f.px = Math.round(num(f.px, -900, 1700, 405)); f.py = Math.round(num(f.py, -600, 1100, 304));
    f.anim = ANIMS.includes(f.anim) ? f.anim : 'slide'; f.fx = !!f.fx; f.glass = !!f.glass; f.shine = !!f.shine; f.ico = ICOS.includes(f.ico) ? f.ico : 'heart';
    f.w = Math.round(num(f.w, 240, 900, 470)); f.h = Math.round(num(f.h, 70, 520, 112));
    f.radius = Math.round(num(f.radius, 0, 80, 24)); f.bw = Math.round(num(f.bw, 0, 10, 3)); f.glow = Math.round(num(f.glow, 0, 60, 0));
    f.accent = hex(f.accent, '#53fc18'); f.bg = hex(f.bg, '#0e1014'); f.bg2 = hex(f.bg2, f.bg); f.bgA = num(f.bgA, 0, 100, 94);
    const bg_ = Object.assign(DBGI(), o.bgimg || {});
    f.bgimg = { data: typeof bg_.data === 'string' && bg_.data.startsWith('data:image/') ? bg_.data : '', dim: Math.round(num(bg_.dim, 0, 85, 35)) };
    const i = Object.assign(DIMG(), o.img || {});
    f.img = { data: typeof i.data === 'string' && i.data.startsWith('data:image/') ? i.data : '', show: i.show !== false, x: num(i.x, -60, f.w + 60, 56), y: num(i.y, -60, f.h + 60, 56), size: num(i.size, 24, 200, 72) };
    const nmDef = DNAME(); f.nm = normTxt(o.nm, nmDef, f); f.nm.text = '';
    if (o.msg) f.msg = normTxt(o.msg, DMSG(), f);
    else {                                                   // ترحيل إعدادات v2.0: النص الصغير كان فوق الاسم
      const ls = Math.max(12, Math.round(f.nm.size * 0.61));
      f.msg = normTxt({ show: f.nm.show, text: o.text, x: f.nm.x, y: Math.round(f.nm.y - f.nm.size * 0.5 - ls * 0.62), size: ls, color: f.accent }, DMSG(), f);
    }
    delete f.text;
    const v = Object.assign(DVID(), o.vid || {}), s = Object.assign(DSND(), o.snd || {});
    f.vid = { id: /^alert_[\w-]{3,60}$/.test(v.id) ? v.id : '', name: String(v.name || '').slice(0, 80), vol: num(v.vol, 0, 100, 100), show: v.show !== false };
    f.snd = { id: /^alert_[\w-]{3,60}$/.test(s.id) ? s.id : '', name: String(s.name || '').slice(0, 80), vol: num(s.vol, 0, 100, 80), start: Math.round(num(s.start, 0, 600, 0)), fade: Math.round(num(s.fade, 0, 5, 1)) };
    return f;
  }
  function load() {
    let o = {}; try { o = JSON.parse(LS.get(KEY, '{}')) || {}; } catch (e) {}
    return { follow: norm(o.follow) };
  }
  let CFG = load();
  const save = () => LS.set(KEY, JSON.stringify(CFG));

  /* ---------- القوالب الجاهزة ---------- */
  const GEO = { w: 470, h: 112, img: { x: 56, y: 56, size: 72, show: true }, msg: { x: 276, y: 44, size: 22 }, nm: { x: 276, y: 76, size: 36 } };
  const mk = p => Object.assign({}, GEO, p, { img: Object.assign({}, GEO.img, p.img), msg: Object.assign({}, GEO.msg, p.msg), nm: Object.assign({}, GEO.nm, p.nm) });
  const TPLS = [
    { id: 'classic', ar: 'كيك كلاسيك', en: 'Kick Classic', fn: { ar: 'Segoe UI', en: 'Segoe UI' }, p: mk({ accent: '#53fc18', bg: '#0e1014', bg2: '#0e1014', bgA: 94, radius: 24, bw: 3, glow: 0, ico: 'heart', anim: 'slide', msg: { color: '#53fc18' }, nm: { color: '#ffffff' } }) },
    { id: 'neon', ar: 'نيون', en: 'Neon', fn: { ar: 'Tahoma', en: 'Bahnschrift' }, p: mk({ accent: '#00e5ff', bg: '#090a1f', bg2: '#1a0b3a', bgA: 96, radius: 18, bw: 3, glow: 26, shine: true, fx: true, ico: 'bolt', anim: 'pop', msg: { color: '#ff4fd8' }, nm: { color: '#ffffff' } }) },
    { id: 'glass', ar: 'زجاجي', en: 'Glass', fn: { ar: 'Dubai', en: 'Segoe UI' }, p: mk({ accent: '#bfe3ff', bg: '#1b2a44', bg2: '#2c3e63', bgA: 62, radius: 30, bw: 2, glass: true, shine: true, ico: 'star', anim: 'fade', msg: { color: '#cfe6ff' }, nm: { color: '#ffffff' } }) },
    { id: 'gold', ar: 'ذهبي VIP', en: 'Gold VIP', fn: { ar: 'Times New Roman', en: 'Georgia' }, p: mk({ accent: '#f5c542', bg: '#17120a', bg2: '#33260a', bgA: 97, radius: 20, bw: 3, glow: 16, shine: true, fx: true, ico: 'crown', anim: 'pop', msg: { color: '#f5c542' }, nm: { color: '#fff3c4' } }) }
  ];
  // يبني إعداداً كاملاً من قالب مع الإبقاء على ملفات المستخدم ونصوصه ومكان القالب
  function fromTpl(tp, cur, lg) {
    lg = lg || (cur && cur.lang) || curLang();
    const pick = n => fontOk(n) ? n : 'Segoe UI', fnt = pick(tp.fn[lg]);
    const o = Object.assign(DEFF(), tp.p, { tpl: tp.id, lang: lg });
    o.msg = Object.assign({}, tp.p.msg, { font: fnt }); o.nm = Object.assign({}, tp.p.nm, { font: fnt });
    if (cur) { o.on = cur.on; o.dur = cur.dur; o.pos = cur.pos; o.px = cur.px; o.py = cur.py; o.vid = cur.vid; o.snd = cur.snd; }
    const n = norm(o);
    if (cur) { n.img.data = cur.img.data; n.msg.text = cur.msg.text; }
    return n;
  }
  const tplById = id => TPLS.find(x => x.id === id) || TPLS[0];

  /* ---------- الملفات (صوت / فيديو) ---------- */
  const MED = {};                                           // id → { url, dur, bad }
  async function prep(id, kind) {
    if (!id) return null;
    if (MED[id]) return MED[id];
    let b = null; try { b = await idbGet(id); } catch (e) {}
    if (!b) return null;
    const m = { url: URL.createObjectURL(b), dur: 0, bad: false }; MED[id] = m;
    await new Promise(res => {
      const e = document.createElement(kind === 'video' ? 'video' : 'audio'); let done = false;
      const fin = ok => { if (done) return; done = true; if (!ok) m.bad = true; e.removeAttribute('src'); try { e.load(); } catch (x) {} res(); };
      e.preload = 'metadata'; e.onloadedmetadata = () => { m.dur = isFinite(e.duration) ? e.duration : 0; fin(true); }; e.onerror = () => fin(false);
      setTimeout(() => fin(false), 8000); e.src = m.url;
    });
    return m;
  }
  function release(id) { const m = MED[id]; if (m) { try { URL.revokeObjectURL(m.url); } catch (e) {} delete MED[id]; } }
  function prepAll() { const f = CFG.follow; try { prep(f.vid.id, 'video'); prep(f.snd.id, 'audio'); } catch (e) {} }
  const rmFile = id => { try { idbDel(id); } catch (e) {} release(id); };

  /* ---------- الطابور ---------- */
  const Q = []; let curA = null, gapUntil = 0;
  const IN = 450, OUT = 400, GAP = 350;
  function push(type, user, force) {
    const c = CFG[type]; if (!c || (!c.on && !force)) return;
    if (Q.length >= 10) Q.shift();
    Q.push({ type, user: String(user || '').trim(), t0: 0, seed: Math.random() * 1000, test: !!force });
  }
  function clear() { if (curA) stopMedia(curA); Q.length = 0; curA = null; }

  /* ---------- تشغيل الصوت والفيديو (عبر الخلاط → البث + سماعاتي) ---------- */
  function wire(e, vol) {
    const m = getMixer(); if (m.ctx.state === 'suspended') m.ctx.resume();
    const src = m.ctx.createMediaElementSource(e), g = m.ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(m.master); g.connect(m.mon);
    return { e, src, g, vol };
  }
  function startMedia(a, cf) {
    a.v = null; a.s = null;
    try {
      const v = cf.vid, s = cf.snd;
      if (v.id && MED[v.id] && !MED[v.id].bad) {
        const e = document.createElement('video'); e.playsInline = true; e.preload = 'auto'; e.src = MED[v.id].url;
        a.v = wire(e, v.vol / 100); e.play().catch(() => {});
      }
      if (s.id && MED[s.id] && !MED[s.id].bad) {
        const e = new Audio(); e.preload = 'auto'; e.src = MED[s.id].url; const st = s.start;
        e.addEventListener('loadedmetadata', () => { try { if (st > 0 && st < e.duration - 0.2) e.currentTime = st; } catch (x) {} });
        a.s = wire(e, s.vol / 100); e.play().catch(() => {});
      }
    } catch (err) {}
  }
  function stopMedia(a) {
    ['v', 's'].forEach(k => {
      const o = a && a[k]; if (!o) return;
      try { o.e.pause(); } catch (e) {}
      try { o.src.disconnect(); o.g.disconnect(); } catch (e) {}
      try { o.e.removeAttribute('src'); o.e.load(); } catch (e) {}
      a[k] = null;
    });
  }
  function fadeMedia(a, cf, remain) {                       // تلاشي الصوت قبل نهاية الأليرت
    const fd = cf.snd.fade * 1000; if (fd <= 0 || remain >= fd) return;
    const k = Math.max(0, remain / fd);
    ['v', 's'].forEach(x => { const o = a[x]; if (o) { try { o.g.gain.value = o.vol * k; } catch (e) {} } });
  }
  // مدة الظهور (بعد الدخول): ثابتة، أو تلقائية حسب طول الفيديو/الأغنية
  function holdOf(cf) {
    if (cf.dur > 0) return cf.dur * 1000;
    let d = 0; const v = cf.vid.id && MED[cf.vid.id], s = cf.snd.id && MED[cf.snd.id];
    if (v && v.dur) d = v.dur * 1000; else if (s && s.dur) d = Math.max(0, s.dur - cf.snd.start) * 1000;
    if (!d) return 5000;
    return Math.max(2000, Math.min(60000, d - IN));
  }

  /* ---------- الرسم (يُستدعى من drawSceneBody في app.js على كل إطار) ---------- */
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const ease = p => 1 - Math.pow(1 - p, 3);
  const back = t => { t = Math.max(0, Math.min(1, t)); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const rnd = s => { const v = Math.sin(s * 12.9898) * 43758.5453; return v - Math.floor(v); };
  const imgCache = {};
  function getImg(src) {
    if (!src) return null;
    let im = imgCache[src];
    if (!im) { im = new Image(); im.src = src; imgCache[src] = im; const k = Object.keys(imgCache); if (k.length > 6) delete imgCache[k[0]]; }
    return im.complete && im.naturalWidth ? im : null;
  }
  function fit(c, s, maxW) {                                // قص النص الطويل بنقاط
    if (c.measureText(s).width <= maxW) return s;
    let a = s; while (a.length > 1 && c.measureText(a + '…').width > maxW) a = a.slice(0, -1);
    return a + '…';
  }
  const tfont = o => `${o.weight} ${o.size}px "${o.font}", "Segoe UI", Tahoma, Arial, sans-serif`;
  function putText(c, s, o, x, y, maxW, shadow) {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = tfont(o); c.fillStyle = o.color;
    c.direction = /[\u0590-\u08FF]/.test(s) ? 'rtl' : 'ltr';
    if (shadow) { c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 9; c.shadowOffsetY = 1; }
    c.fillText(fit(c, s, maxW), x, y); c.restore();
  }
  function iconPath(c, k) {
    c.beginPath();
    if (k === 'star') { for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = -Math.PI / 2 + i * Math.PI / 5; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r + 1); } }
    else if (k === 'bolt') { [[3, -23], [-14, 3], [-3, 3], [-8, 23], [14, -5], [2, -5], [10, -23]].forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p[0], p[1])); }
    else if (k === 'crown') { [[-21, 13], [-23, -11], [-10, 0], [0, -19], [10, 0], [23, -11], [21, 13]].forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p[0], p[1])); }
    else { c.moveTo(0, 14); c.bezierCurveTo(-26, -4, -14, -24, 0, -10); c.bezierCurveTo(14, -24, 26, -4, 0, 14); }
    c.closePath();
  }
  function star4(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s); c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
  }
  function sparks(c, x, y, cf, el, seed) {                  // شرارات تتطاير حول البطاقة عند الظهور
    for (let i = 0; i < 18; i++) {
      const r1 = rnd(seed + i * 7.13), r2 = rnd(seed + i * 3.7 + 1), r3 = rnd(seed + i * 5.1 + 2);
      const age = el - r1 * 500, life = 1200; if (age < 0 || age > life) continue;
      const u = age / life, ang = r2 * Math.PI * 2, k = .7 + .3 * r3, d = 18 + r3 * 46;
      const px = x + cf.w / 2 + Math.cos(ang) * cf.w * .5 * k + Math.cos(ang) * d * u, py = y + cf.h / 2 + Math.sin(ang) * cf.h * .5 * k + Math.sin(ang) * d * u - 26 * u;
      c.save(); c.globalAlpha = (1 - u) * .95; c.fillStyle = i % 3 ? cf.accent : '#ffffff'; star4(c, px, py, (4 + r3 * 5) * (1 - u * .6)); c.restore();
    }
  }
  // يرسم البطاقة بمقاس cf.w × cf.h عند (x,y) — يستعمله البث والمعاينة والقوالب
  function card(c, x, y, cf, user, p, el, opt) {
    opt = opt || {};
    const W = cf.w, H = cf.h, R = Math.min(cf.radius, W / 2, H / 2), AC = cf.accent, A = cf.bgA / 100;
    const label = cf.msg.text || DEFTXT[cf.lang] || DEFTXT.ar, name = user || DEFNAME[cf.lang] || DEFNAME.ar;
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, p));
    // الجسم + الظل (أو التوهج)
    c.shadowColor = cf.glow > 0 ? rgba(AC, .5) : 'rgba(0,0,0,.45)'; c.shadowBlur = cf.glow > 0 ? cf.glow : 24; c.shadowOffsetY = cf.glow > 0 ? 0 : 6;
    const gb = c.createLinearGradient(x, y, x + W, y + H); gb.addColorStop(0, rgba(cf.bg, A)); gb.addColorStop(1, rgba(cf.bg2, A));
    rrect(c, x, y, W, H, R); c.fillStyle = gb; c.fill();
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
    // صورة خلفية القالب
    if (cf.bgimg && cf.bgimg.data) {
      const bi = getImg(cf.bgimg.data);
      if (bi) {
        c.save(); rrect(c, x, y, W, H, R); c.clip();
        const kk = Math.max(W / bi.naturalWidth, H / bi.naturalHeight), bw2 = bi.naturalWidth * kk, bh2 = bi.naturalHeight * kk;
        c.drawImage(bi, x + (W - bw2) / 2, y + (H - bh2) / 2, bw2, bh2);
        if (cf.bgimg.dim > 0) { c.fillStyle = `rgba(0,0,0,${cf.bgimg.dim / 100})`; c.fillRect(x, y, W, H); }
        c.restore();
      }
    }
    // فيديو داخل البطاقة
    let onVid = false; const ve = opt.video;
    if (cf.vid.show && ve && ve.readyState >= 2 && ve.videoWidth) {
      c.save(); rrect(c, x, y, W, H, R); c.clip();
      const k = Math.max(W / ve.videoWidth, H / ve.videoHeight), dw = ve.videoWidth * k, dh = ve.videoHeight * k;
      c.drawImage(ve, x + (W - dw) / 2, y + (H - dh) / 2, dw, dh);
      const sg = c.createLinearGradient(0, y, 0, y + H); sg.addColorStop(0, 'rgba(0,0,0,.06)'); sg.addColorStop(.5, 'rgba(0,0,0,.14)'); sg.addColorStop(1, 'rgba(0,0,0,.7)');
      c.fillStyle = sg; c.fillRect(x, y, W, H); c.restore(); onVid = true;
    }
    // زجاجي
    if (cf.glass) {
      const gg = c.createLinearGradient(0, y, 0, y + H); gg.addColorStop(0, 'rgba(255,255,255,.26)'); gg.addColorStop(.5, 'rgba(255,255,255,.06)'); gg.addColorStop(1, 'rgba(255,255,255,.13)');
      rrect(c, x, y, W, H, R); c.fillStyle = gg; c.fill();
    }
    // الإطار
    if (cf.bw > 0) {
      c.save(); if (cf.glow > 0) { c.shadowColor = AC; c.shadowBlur = cf.glow; }
      rrect(c, x, y, W, H, R); c.lineWidth = cf.bw; c.strokeStyle = AC; c.stroke(); c.restore();
    }
    // لمعة متحركة
    if (cf.shine) {
      const per = 3400, ph = (el % per) / per;
      if (ph < .42) {
        const u = ph / .42, bw = W * .22, bx = x - bw + u * (W + bw * 2);
        c.save(); rrect(c, x, y, W, H, R); c.clip();
        const sh = c.createLinearGradient(bx, 0, bx + bw, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,.28)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
        c.transform(1, 0, -.3, 1, 0, 0); c.fillStyle = sh; c.fillRect(bx + y * .3, y - 4, bw, H + 8); c.restore();
      }
    }
    // الصورة (أو الأيقونة الافتراضية)
    const g = cf.img;
    if (g.show) {
      const cx = x + g.x, cy = y + g.y, r = g.size / 2, ACF = rgba(AC, .16);
      if (g.data) {
        const im = getImg(g.data);
        c.save(); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.closePath(); c.clip();
        c.fillStyle = ACF; c.fillRect(cx - r, cy - r, g.size, g.size);
        if (im) { const k = Math.max(g.size / im.naturalWidth, g.size / im.naturalHeight), dw = im.naturalWidth * k, dh = im.naturalHeight * k; c.drawImage(im, cx - dw / 2, cy - dh / 2, dw, dh); }
        c.restore();
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = AC; c.stroke();
      } else {
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = onVid ? 'rgba(0,0,0,.35)' : ACF; c.fill();
        c.lineWidth = 2; c.strokeStyle = AC; c.stroke();
        c.save(); c.translate(cx, cy + 2 * g.size / 72); const s = (g.size / 72) * (1 + 0.08 * Math.sin(el / 160));
        c.scale(s, s); iconPath(c, cf.ico); c.fillStyle = AC; c.fill(); c.restore();
      }
    }
    // النصوص: رسالة الترحيب + اسم المتابع (كل واحد مستقل)
    const maxW = Math.max(60, W - 40);
    if (cf.msg.show) putText(c, label, cf.msg, x + cf.msg.x, y + cf.msg.y, maxW, onVid);
    if (cf.nm.show) putText(c, name, cf.nm, x + cf.nm.x, y + cf.nm.y, maxW, onVid);
    c.restore();
  }
  function slot(cf, w, h) {
    const M = 36, W = cf.w, H = cf.h, pos = cf.pos, top = pos === 'top' || pos === 'tr' || pos === 'tl';
    if (pos === 'custom') return [cf.px * w / 1280, cf.py * h / 720, cf.py * h / 720 + H / 2 < h / 2];
    const x = pos === 'tl' || pos === 'bl' ? M : pos === 'tr' || pos === 'br' ? w - W - M : (w - W) / 2;
    return [x, pos === 'center' ? (h - H) / 2 : top ? M : h - H - M, top];
  }
  function drawAlert(c, w, h, cf, a, el, hold) {
    const H = cf.h, M = 36; let p = 1;
    if (el < IN) p = ease(el / IN); else if (el > IN + hold) p = 1 - ease(Math.min(1, (el - IN - hold) / OUT));
    const [x, y0, top] = slot(cf, w, h); let dy = 0, s = 1;
    if (cf.anim === 'slide') dy = (1 - p) * (H + M) * (cf.pos === 'center' ? 1 : top ? -1 : 1);
    else if (cf.anim === 'pop') s = el < IN ? .6 + .4 * back(el / IN) : el > IN + hold ? .8 + .2 * p : 1;
    c.save();
    if (s !== 1) { const cx = x + cf.w / 2, cy = y0 + H / 2; c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); }
    card(c, x, y0 + dy, cf, a.user, p, el, { video: a.v ? a.v.e : null });
    c.restore();
    if (cf.fx) sparks(c, x, y0, cf, el, a.seed);
  }
  // يحرّك الطابور (آمن لو انستدعى أكثر من مرة بنفس الإطار) — يرجّع true لو في أليرت ظاهر
  function advance(now) {
    if (!curA) {
      if (!Q.length || now < gapUntil) return false;
      curA = Q.shift(); curA.t0 = now; startMedia(curA, CFG[curA.type] || CFG.follow);
    }
    const cf = CFG[curA.type] || CFG.follow, hold = holdOf(cf), el = now - curA.t0, total = IN + hold + OUT;
    if (el >= total) { stopMedia(curA); curA = null; gapUntil = now + GAP; return false; }
    fadeMedia(curA, cf, total - el);
    return true;
  }
  function draw(c, w, h) {
    const now = performance.now();
    if (!advance(now)) return;
    const cf = CFG[curA.type] || CFG.follow;
    drawAlert(c, w, h, cf, curA, now - curA.t0, holdOf(cf));
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
    const orig = JSON.stringify(CFG); let committed = false, sel = 'nm', tab = 'tpl', drag = null, raf = 0, tnCustom = false, testName = TESTN[CFG.follow.lang];
    const f = () => CFG.follow, esc2 = esc, rtl = (document.documentElement.dir || 'ltr'), box = $('dlgBox');
    const newIds = new Set(), oldIds = new Set();
    const TYPES = [['follow', 'heart', 'alFollowH']];          // أنواع الأليرتات — نضيف هنا لاحقاً (اشتراك، هدية...)
    const TABS = [['tpl', 'grid', 'alTabTpl'], ['txt', 'text', 'alTabTxt'], ['med', 'film', 'alTabMed'], ['look', 'palette', 'alTabLook'], ['gen', 'sliders', 'alTabGen']];
    const side = () => `<div class="al-side"><div class="al-sideT">${esc2(t('alTypes'))}</div>${TYPES.map(([k, i, l]) => `<button type="button" class="al-tab on" data-type="${k}"><i data-ic="${i}"></i><span>${esc2(t(l))}</span></button>`).join('')}</div>`;

    /* --- بناء الحقول (كل حقل يتسجل في REG ليُربط بعد الرسم) --- */
    let REG = [];
    const tg = (id, label, get, set) => { REG.push({ k: 'tg', id, set }); return `<label class="k-toggle"><input type="checkbox" id="${id}" ${get() ? 'checked' : ''}><span class="k-sw"></span><b>${esc2(label)}</b></label>`; };
    const cl = (id, label, get, set) => { REG.push({ k: 'cl', id, set }); return `<label class="f al-cl"><span>${esc2(label)}</span><input type="color" id="${id}" value="${get()}"></label>`; };
    const sl = (id, label, opts, get, set) => { REG.push({ k: 'sl', id, set }); return `<label class="f"><span>${esc2(label)}</span><select id="${id}">${opts.map(([v, l, st]) => `<option value="${v}" ${st ? `style="${st}"` : ''} ${String(v) === String(get()) ? 'selected' : ''}>${esc2(l)}</option>`).join('')}</select></label>`; };
    const tx = (id, label, get, set, ph) => { REG.push({ k: 'tx', id, set }); return `<label class="f full"><span>${esc2(label)}</span><input type="text" id="${id}" maxlength="40" value="${esc2(get())}" placeholder="${esc2(ph || '')}"></label>`; };
    const rg = (id, label, get, a, b, set) => { REG.push({ k: 'rg', id, set, get, a, b }); const v = Math.round(get()); return `<label class="f al-rg"><span>${esc2(label)}</span><input type="range" id="${id}" min="${a}" max="${b}" value="${v}"><input type="number" class="al-num" id="${id}N" min="${a}" max="${b}" value="${v}"></label>`; };
    const sec = (k, title, inner, hint) => `<div class="al-sec ${sel === k ? 'sel' : ''}" data-sec="${k}"><div class="al-secT">${esc2(title)}</div>${hint ? `<div class="al-hint">${esc2(hint)}</div>` : ''}${inner}</div>`;
    const fontOpts = cur => { const b = (f().lang === 'en' ? FONTS_EN : FONTS_AR).filter(fontOk); if (!b.includes(cur)) b.unshift(cur); return b.map(x => [x, x, `font-family:'${x}',sans-serif`]); }, wOpts = [[400, t('alW4')], [600, t('alW6')], [700, t('alW7')], [800, t('alW8')]];
    const txtSec = (key, title, showLbl, extra, hint) => {
      const o = () => f()[key], W = f().w, H = f().h;
      return sec(key, title, `
        ${tg('al_' + key + 'Show', showLbl, () => o().show, v => o().show = v)}
        ${extra || ''}
        <div class="grid2">${sl('al_' + key + 'Font', t('alFont'), fontOpts(o().font), () => o().font, v => o().font = v)}${sl('al_' + key + 'W', t('alWeight'), wOpts, () => o().weight, v => o().weight = +v)}</div>
        ${rg('al_' + key + 'Size', t('alSize'), () => o().size, 10, 160, v => o().size = v)}
        ${cl('al_' + key + 'Color', t('alColor'), () => o().color, v => o().color = v)}
        ${rg('al_' + key + 'X', t('alX'), () => o().x, -60, W + 60, v => o().x = v)}
        ${rg('al_' + key + 'Y', t('alY'), () => o().y, -60, H + 60, v => o().y = v)}
        <div class="al-row"><button type="button" class="dbtn" data-rs="${key}">${esc2(t('alReset'))}</button></div>`, hint);
    };
    const fileRow = (name, on, idPick, idRm, addL, chL, rmL, extraBtn) => `
      <div class="al-file ${on ? 'has' : ''}"><i data-ic="${idPick === 'alVPick' ? 'film' : 'music'}"></i><span class="al-fn">${esc2(on ? name || '—' : t('alNoFile'))}</span></div>
      <div class="al-row"><button type="button" class="dbtn primary" id="${idPick}">${esc2(on ? chL : addL)}</button><button type="button" class="dbtn" id="${idRm}" ${on ? '' : 'disabled'}>${esc2(rmL)}</button>${extraBtn || ''}</div>`;
    let pa = null;                                             // استماع للأغنية (سماعاتي فقط)
    const posCustom = () => { const g = f(); if (g.pos !== 'custom') { const [x, y] = slot(g, 1280, 720); g.px = Math.round(x); g.py = Math.round(y); g.pos = 'custom'; } };
    function setLang(l) {                                      // تبديل لغة القالب: النص الافتراضي + الخطوط
      const g = f(); if (g.lang === l) return;
      const other = l === 'ar' ? 'en' : 'ar', list = l === 'en' ? FONTS_EN : FONTS_AR, tp = tplById(g.tpl);
      g.lang = l;
      if (g.msg.text === DEFTXT[other]) g.msg.text = '';
      ['msg', 'nm'].forEach(k => { if (!list.includes(g[k].font)) g[k].font = fontOk(tp.fn[l]) ? tp.fn[l] : 'Segoe UI'; });
      if (!tnCustom) { testName = TESTN[l]; const ti = $('alTestNm'); if (ti) ti.value = testName; }
      save(); refresh();
    }
    function readBg(file, done) {                              // صورة الخلفية → JPEG حتى 960px (توفيراً للمساحة)
      const fr = new FileReader();
      fr.onerror = () => toast(t('alImgErr'));
      fr.onload = () => {
        const im = new Image();
        im.onerror = () => toast(t('alImgErr'));
        im.onload = () => {
          const k = Math.min(1, 960 / Math.max(im.naturalWidth, im.naturalHeight)), cw = Math.max(1, Math.round(im.naturalWidth * k)), ch = Math.max(1, Math.round(im.naturalHeight * k));
          const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch; cc.getContext('2d').drawImage(im, 0, 0, cw, ch);
          done(cc.toDataURL('image/jpeg', 0.86));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    }

    const panel = () => {
      REG = []; const g = f();
      if (tab === 'tpl') return `
        ${sec('lang', t('alLang'), `<div class="al-langs">${[['ar', 'عربي'], ['en', 'English']].map(([l, n]) => `<button type="button" class="al-lang ${g.lang === l ? 'on' : ''}" data-lang="${l}">${n}</button>`).join('')}</div>`, t('alLangHint'))}
        ${sec('tpl', t('alTplT'), `<div class="al-tpls">${TPLS.map(tp => `<button type="button" class="al-tpl ${g.tpl === tp.id ? 'on' : ''}" data-tpl="${tp.id}"><canvas width="360" height="124" data-tp="${tp.id}"></canvas><span class="al-tpn">${esc2(lang === 'ar' ? tp.ar : tp.en)}</span>${tp.vid ? `<em>${esc2(t('alTplVid'))}</em>` : ''}</button>`).join('')}</div>`, t('alTplHint'))}
        ${sec('bgs', t('alSecBg'), `
          <div class="grid2">${cl('alBg', t('alBg'), () => g.bg, v => g.bg = v)}${cl('alBg2', t('alBg2'), () => g.bg2, v => g.bg2 = v)}</div>
          ${rg('alBgA', t('alBgA'), () => g.bgA, 0, 100, v => g.bgA = v)}
          <div class="al-row"><button type="button" class="dbtn primary" id="alBgPick">${esc2(t(g.bgimg.data ? 'alBgChange' : 'alBgAdd'))}</button><button type="button" class="dbtn" id="alBgRm" ${g.bgimg.data ? '' : 'disabled'}>${esc2(t('alBgRm'))}</button></div>
          <input type="file" id="alBgFile" accept="image/*" style="display:none">
          ${rg('alBgDim', t('alBgDim'), () => g.bgimg.dim, 0, 85, v => g.bgimg.dim = Math.round(v))}`, t('alBgHint'))}`;
      if (tab === 'txt') return `
        ${txtSec('msg', t('alSecMsg'), t('alMsgShow'), tx('al_msgText', t('alMsgText'), () => g.msg.text, v => g.msg.text = v.trim().slice(0, 40), DEFTXT[f().lang]))}
        ${txtSec('nm', t('alSecNm'), t('alNmShow'), '', t('alNmNote'))}`;
      if (tab === 'med') return `
        ${sec('img', t('alSecImg'), `
          <div class="al-row"><button type="button" class="dbtn primary" id="alPick">${esc2(t(g.img.data ? 'alChangeImg' : 'alAddImg'))}</button><button type="button" class="dbtn" id="alRm" ${g.img.data ? '' : 'disabled'}>${esc2(t('alRemove'))}</button></div>
          <input type="file" id="alFile" accept="image/*" style="display:none">
          ${tg('alImgShow', t('alShowImg'), () => g.img.show, v => g.img.show = v)}
          ${sl('alIco', t('alIco'), [['heart', t('alIcoHeart')], ['star', t('alIcoStar')], ['bolt', t('alIcoBolt')], ['crown', t('alIcoCrown')]], () => g.ico, v => g.ico = v)}
          ${rg('alISize', t('alSize'), () => g.img.size, 24, 200, v => g.img.size = v)}
          ${rg('alIX', t('alX'), () => g.img.x, -60, g.w + 60, v => g.img.x = v)}
          ${rg('alIY', t('alY'), () => g.img.y, -60, g.h + 60, v => g.img.y = v)}
          <div class="al-row"><button type="button" class="dbtn" data-rs="img">${esc2(t('alReset'))}</button></div>`)}
        ${sec('vid', t('alSecVid'), `
          ${fileRow(g.vid.name, !!g.vid.id, 'alVPick', 'alVRm', t('alVidAdd'), t('alVidChange'), t('alVidRm'))}
          <input type="file" id="alVFile" accept="video/mp4,video/webm,.mp4,.webm,.mov,.m4v" style="display:none">
          ${tg('alVShow', t('alVidShow'), () => g.vid.show, v => g.vid.show = v)}
          ${rg('alVVol', t('alVidVol'), () => g.vid.vol, 0, 100, v => g.vid.vol = v)}`, t('alVidNote'))}
        ${sec('snd', t('alSecSnd'), `
          ${fileRow(g.snd.name, !!g.snd.id, 'alSPick', 'alSRm', t('alSndAdd'), t('alSndChange'), t('alSndRm'), `<button type="button" class="dbtn" id="alSPrev" ${g.snd.id ? '' : 'disabled'}>${esc2(t(pa ? 'alSndStop' : 'alSndPrev'))}</button>`)}
          <input type="file" id="alSFile" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus" style="display:none">
          ${rg('alSVol', t('alSndVol'), () => g.snd.vol, 0, 100, v => g.snd.vol = v)}
          ${rg('alSStart', t('alSndStart'), () => g.snd.start, 0, 120, v => g.snd.start = v)}
          ${rg('alSFade', t('alSndFade'), () => g.snd.fade, 0, 5, v => g.snd.fade = v)}`, t('alSndNote'))}`;
      if (tab === 'look') return `
        ${sec('card', t('alSecCard'), `
          ${rg('alW', t('alCW'), () => g.w, 240, 900, v => g.w = Math.round(v))}
          ${rg('alH', t('alCH'), () => g.h, 70, 520, v => g.h = Math.round(v))}
          ${rg('alRad', t('alRad'), () => g.radius, 0, 80, v => g.radius = Math.round(v))}
          ${rg('alBW', t('alBW'), () => g.bw, 0, 10, v => g.bw = Math.round(v))}
          ${rg('alGlow', t('alGlow'), () => g.glow, 0, 60, v => g.glow = Math.round(v))}`)}
        ${sec('colors', t('alSecColors'), `
          ${cl('alAccent', t('alAccent'), () => g.accent, v => g.accent = v)}`)}
        ${sec('fx', t('alSecFx'), `
          ${sl('alAnim', t('alAnim'), [['slide', t('alAnimSlide')], ['pop', t('alAnimPop')], ['fade', t('alAnimFade')]], () => g.anim, v => g.anim = v)}
          ${tg('alGlass', t('alGlass'), () => g.glass, v => g.glass = v)}
          ${tg('alShine', t('alShine'), () => g.shine, v => g.shine = v)}
          ${tg('alFx', t('alFx'), () => g.fx, v => g.fx = v)}`)}
        <div class="al-row"><button type="button" class="dbtn danger" id="alAll">${esc2(t('alResetAll'))}</button></div>`;
      const posL = { top: 'alTop', bottom: 'alBottom', tr: 'alTR', tl: 'alTL', br: 'alBR', bl: 'alBL', center: 'alCenter', custom: 'alPosCustom' };
      return sec('gen', t('alSecGen'), `
        ${tg('alOn', t('alOn'), () => g.on, v => { g.on = v; paintBtn(); })}
        <div class="grid2">
          ${sl('alDur', t('alDur'), DURS.map(d => [d, d ? d + ' ' + t('alSec') : t('alDurAuto')]), () => g.dur, v => g.dur = +v)}
          ${sl('alPos', t('alPos'), POS.map(p => [p, t(posL[p])]), () => g.pos, v => {
            if (v === 'custom') { const [x, y] = slot(g, 1280, 720); g.px = Math.round(x); g.py = Math.round(y); }
            g.pos = v; setTimeout(refresh, 0);
          })}
        </div>
        <div class="al-hint">${esc2(t('alNote'))}</div>`)
        + sec('cpos', t('alSecPos'), `
          ${rg('alCX', t('alCardX'), () => slot(g, 1280, 720)[0], -200, 1280, v => { posCustom(); g.px = Math.round(v); })}
          ${rg('alCY', t('alCardY'), () => slot(g, 1280, 720)[1], -200, 720, v => { posCustom(); g.py = Math.round(v); })}
          <div class="al-row"><button type="button" class="dbtn primary" id="alCenterBtn">${esc2(t('alCenterNow'))}</button></div>`, t('alPosHint'));
    };
    const tabsHtml = () => TABS.map(([k, i, l]) => `<button type="button" class="al-seg ${tab === k ? 'on' : ''}" data-tab="${k}"><i data-ic="${i}"></i><span>${esc2(t(l))}</span></button>`).join('');
    const body = `<div class="al-wrap" style="direction:ltr">${side()}
      <div class="al-main" style="direction:${rtl}">
        <div class="al-left">
          <div class="al-stage"><div class="al-prevT">${esc2(t('alPrev'))}</div><canvas id="alPrev" class="al-prev" width="800" height="450"></canvas></div>
          <div class="al-tools"><label class="f al-tn"><span>${esc2(t('alTestNm'))}</span><input type="text" id="alTestNm" maxlength="24" value="${esc2(testName)}"></label>
            <button type="button" class="dbtn primary al-play" id="alPlay"><i data-ic="play"></i><span>${esc2(t('alPlay'))}</span></button></div>
        </div>
        <div class="al-right"><div class="al-segs" id="alTabs">${tabsHtml()}</div><div class="al-ctl" id="alPanel">${panel()}</div></div>
      </div></div>`;

    // --- معاينة: البطاقة في مكانها الحقيقي على كانفس 1280×720 (مصغّرة) ---
    const SC = 0.625, pc = () => $('alPrev');
    const cardXY = () => { const [x, y] = slot(f(), 1280, 720); return [x, y]; };
    const strOf = k => k === 'nm' ? testName : (f().msg.text || DEFTXT[f().lang]);
    function tbox(k) {
      const o = f()[k], c = pc().getContext('2d'); c.save(); c.font = tfont(o);
      const w = Math.min(f().w - 40, c.measureText(strOf(k)).width); c.restore();
      return { x: o.x - w / 2, y: o.y - o.size * 0.62, w, h: o.size * 1.24 };
    }
    let pvEl = null, pvId = '';
    function prevVid() {                                       // إطار ثابت من الفيديو للمعاينة (بدون صوت)
      const id = f().vid.id, m = id && MED[id]; if (!m || m.bad) return null;
      if (pvId !== id) {
        pvId = id; pvEl = document.createElement('video'); pvEl.muted = true; pvEl.preload = 'auto'; pvEl.src = m.url;
        const e = pvEl; e.addEventListener('loadedmetadata', () => { try { e.currentTime = Math.min(1, (e.duration || 2) / 3); } catch (x) {} });
      }
      return pvEl;
    }
    function paintPrev() {
      const cv_ = pc(); if (!cv_ || !cv_.isConnected) { cancelAnimationFrame(raf); return; }
      const c = cv_.getContext('2d'), cf = f(), now = performance.now();
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv_.width, cv_.height);
      const bgG = c.createLinearGradient(0, 0, cv_.width, cv_.height); bgG.addColorStop(0, '#1d2230'); bgG.addColorStop(1, '#0f1218'); c.fillStyle = bgG; c.fillRect(0, 0, cv_.width, cv_.height);
      c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1; for (let i = 40; i < cv_.width; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, cv_.height); c.stroke(); } for (let j = 40; j < cv_.height; j += 40) { c.beginPath(); c.moveTo(0, j); c.lineTo(cv_.width, j); c.stroke(); }
      c.setTransform(SC, 0, 0, SC, 0, 0);
      const live = advance(now) && curA && curA.test;
      if (live) drawAlert(c, 1280, 720, cf, curA, now - curA.t0, holdOf(cf));
      else {
        const [x, y] = cardXY();
        card(c, x, y, cf, testName, 1, now, { video: prevVid() });
        if (drag && drag.k === 'card') {
          c.save(); c.setLineDash([8, 6]); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,.35)';
          c.beginPath(); c.moveTo(640, 0); c.lineTo(640, 720); c.moveTo(0, 360); c.lineTo(1280, 360); c.stroke(); c.restore();
        }
        if (sel === 'card') { c.save(); c.setLineDash([8, 6]); c.lineWidth = 2; c.strokeStyle = '#ffd400'; c.strokeRect(x - 4, y - 4, cf.w + 8, cf.h + 8); c.restore(); }
        if (sel === 'img' || sel === 'nm' || sel === 'msg') {
          c.save(); c.translate(x, y); c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = '#ffd400';
          if (sel === 'img') { const g = cf.img, r = g.size / 2 + 4; c.strokeRect(g.x - r, g.y - r, r * 2, r * 2); }
          else { const b = tbox(sel); c.strokeRect(b.x - 5, b.y - 3, b.w + 10, b.h + 6); }
          c.restore();
        }
      }
      raf = requestAnimationFrame(paintPrev);
    }
    const toAbs = e => { const r = pc().getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1280, (e.clientY - r.top) / r.height * 720]; };
    const toCard = e => { const r = pc().getBoundingClientRect(), [x, y] = cardXY(); return [(e.clientX - r.left) / r.width * 1280 - x, (e.clientY - r.top) / r.height * 720 - y]; };
    function hit(px, py) {
      const g = f();
      for (const k of ['nm', 'msg']) { if (!g[k].show) continue; const b = tbox(k); if (px >= b.x - 8 && px <= b.x + b.w + 8 && py >= b.y - 8 && py <= b.y + b.h + 8) return k; }
      if (g.img.show && Math.hypot(px - g.img.x, py - g.img.y) <= g.img.size / 2 + 8) return 'img';
      if (px >= 0 && px <= g.w && py >= 0 && py <= g.h) return 'card';
      return null;
    }
    function select(k, fromCanvas) {
      sel = k;
      if (fromCanvas) { const want = k === 'img' ? 'med' : 'txt'; if (tab !== want) { tab = want; refresh(); } }
      document.querySelectorAll('.al-sec').forEach(x => x.classList.toggle('sel', x.dataset.sec === k));
      const el = document.querySelector(`.al-sec[data-sec="${k}"]`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function sync() {                                          // تحديث الحقول الرقمية/المنزلقات من القيم (أثناء السحب)
      REG.forEach(r => { if (r.k !== 'rg') return; const v = Math.round(r.get()), a = $(r.id), b = $(r.id + 'N'); if (a) a.value = v; if (b) b.value = v; });
    }
    function bindPrev() {
      const cv_ = pc();
      cv_.onpointerdown = e => {
        if (curA && curA.test) return;
        const [px, py] = toCard(e), k = hit(px, py); if (!k) return;
        if (k === 'card') {
          const [ax, ay] = toAbs(e), [cx, cy] = cardXY(); sel = 'card';
          document.querySelectorAll('.al-sec').forEach(x => x.classList.remove('sel'));
          drag = { k, dx: cx - ax, dy: cy - ay }; cv_.setPointerCapture(e.pointerId); e.preventDefault(); return;
        }
        select(k, true); drag = { k, dx: f()[k].x - px, dy: f()[k].y - py }; cv_.setPointerCapture(e.pointerId); e.preventDefault();
      };
      cv_.onpointermove = e => {
        const [px, py] = toCard(e);
        if (!drag) { cv_.style.cursor = hit(px, py) ? 'grab' : 'default'; return; }
        cv_.style.cursor = 'grabbing';
        if (drag.k === 'card') {
          const cf = f(), [ax, ay] = toAbs(e); let nx = Math.round(ax + drag.dx), ny = Math.round(ay + drag.dy);
          const cx0 = Math.round((1280 - cf.w) / 2), cy0 = Math.round((720 - cf.h) / 2);
          if (Math.abs(nx - cx0) < 10) nx = cx0; if (Math.abs(ny - cy0) < 10) ny = cy0;      // يلتصق بمنتصف الشاشة
          cf.pos = 'custom'; cf.px = Math.max(-cf.w + 40, Math.min(1240, nx)); cf.py = Math.max(-cf.h + 40, Math.min(680, ny)); save(); sync(); return;
        }
        const o = f()[drag.k]; o.x = Math.round(num(px + drag.dx, -60, f().w + 60, o.x)); o.y = Math.round(num(py + drag.dy, -60, f().h + 60, o.y)); save(); sync();
      };
      cv_.onpointerup = cv_.onpointercancel = () => { const was = drag && drag.k === 'card'; drag = null; if (was && tab === 'gen') refresh(); };
      cv_.onwheel = e => {                                     // عجلة الماوس فوق النص/الصورة = تكبير وتصغير
        if (curA && curA.test) return;
        const [px, py] = toCard(e), k = hit(px, py); if (!k || k === 'card') return;
        e.preventDefault(); const o = k === 'img' ? f().img : f()[k], lo = k === 'img' ? 24 : 10, hi = k === 'img' ? 200 : 160;
        o.size = Math.round(num(o.size + (e.deltaY < 0 ? 2 : -2), lo, hi, o.size)); save(); sync();
      };
    }

    /* --- ملفات الصوت والفيديو --- */
    function dropId(id) { if (!id) return; if (newIds.has(id)) { newIds.delete(id); rmFile(id); } else oldIds.add(id); }
    function stopPA() { if (pa) { try { pa.pause(); } catch (e) {} pa = null; } const b = $('alSPrev'); if (b) b.textContent = t('alSndPrev'); }
    function togglePA() {
      if (pa) { stopPA(); return; }
      const s = f().snd, m = MED[s.id]; if (!m || m.bad) return;
      const a = new Audio(m.url); a.volume = Math.min(1, s.vol / 100); const st = s.start;
      a.onloadedmetadata = () => { try { if (st > 0 && st < a.duration - 0.2) a.currentTime = st; } catch (e) {} };
      a.onended = stopPA; pa = a; a.play().catch(() => {}); const b = $('alSPrev'); if (b) b.textContent = t('alSndStop');
    }
    async function pickMedia(kind, file) {
      const isV = kind === 'video', max = isV ? 150 : 40;
      if (file.size > max * 1048576) { toast(t('alTooBig', { n: max })); return; }
      const okT = isV ? (/^video\//.test(file.type) || /\.(mp4|webm|mov|m4v)$/i.test(file.name)) : (/^audio\//.test(file.type) || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.name));
      if (!okT) { toast(t('alMediaErr')); return; }
      const id = 'alert_' + (isV ? 'v' : 's') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try { await idbPut(id, file); } catch (e) { toast(t('alMediaErr')); return; }
      const m = await prep(id, kind);
      if (!m || m.bad) { rmFile(id); toast(t('alMediaErr')); return; }
      stopPA();
      const o = isV ? f().vid : f().snd; dropId(o.id); o.id = id; o.name = file.name.slice(0, 80); newIds.add(id);
      if (isV) { o.show = true; if (f().dur !== 0) { f().dur = 0; toast(t('alVidAuto'), 4500); } }
      save(); refresh();
    }
    function readGen() { save(); paintBtn(); }

    function bindPanel() {
      const g = f(), on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
      REG.forEach(r => {
        const el = $(r.id); if (!el) return;
        if (r.k === 'tg') el.addEventListener('change', () => { r.set(el.checked); readGen(); });
        else if (r.k === 'cl') el.addEventListener('input', () => { r.set(hex(el.value, '#ffffff')); save(); });
        else if (r.k === 'sl') el.addEventListener('change', () => { r.set(el.value); readGen(); });
        else if (r.k === 'tx') el.addEventListener('input', () => { r.set(el.value); save(); });
        else if (r.k === 'rg') {
          const n = $(r.id + 'N');
          const apply = v => { v = num(v, r.a, r.b, +el.value); r.set(v); el.value = n.value = Math.round(v); save(); };
          el.addEventListener('input', () => apply(el.value));
          n.addEventListener('input', () => { if (n.value !== '') apply(n.value); });
          n.addEventListener('change', () => { n.value = el.value; });
        }
      });
      // قوالب
      document.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => {
        CFG.follow = fromTpl(tplById(b.dataset.tpl), f()); save(); refresh(); toast(t('alTplApplied'), 1500);
      });
      // لغة القالب + الخلفية + التوسيط
      document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => setLang(b.dataset.lang));
      on('alBgPick', 'click', () => $('alBgFile').click());
      on('alBgFile', 'change', e => { const fl = e.target.files && e.target.files[0]; e.target.value = ''; if (fl) readBg(fl, d => { g.bgimg.data = d; save(); refresh(); }); });
      on('alBgRm', 'click', () => { g.bgimg.data = ''; save(); refresh(); });
      on('alCenterBtn', 'click', () => { g.pos = 'center'; save(); refresh(); });
      // صورة
      on('alPick', 'click', () => $('alFile').click());
      on('alFile', 'change', e => { const fl = e.target.files && e.target.files[0]; if (!fl) return; readImg(fl, d => { g.img.data = d; g.img.show = true; save(); sel = 'img'; refresh(); }); });
      on('alRm', 'click', () => { g.img.data = ''; save(); refresh(); });
      // فيديو
      on('alVPick', 'click', () => $('alVFile').click());
      on('alVFile', 'change', e => { const fl = e.target.files && e.target.files[0]; e.target.value = ''; if (fl) pickMedia('video', fl); });
      on('alVRm', 'click', () => { dropId(g.vid.id); g.vid = DVID(); save(); refresh(); });
      // أغنية
      on('alSPick', 'click', () => $('alSFile').click());
      on('alSFile', 'change', e => { const fl = e.target.files && e.target.files[0]; e.target.value = ''; if (fl) pickMedia('audio', fl); });
      on('alSRm', 'click', () => { stopPA(); dropId(g.snd.id); g.snd = DSND(); save(); refresh(); });
      on('alSPrev', 'click', togglePA);
      // إعادة ضبط عنصر لقيم القالب الحالي
      document.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => {
        const k = b.dataset.rs, T = fromTpl(tplById(g.tpl), null, g.lang);
        if (k === 'img') { const keep = g.img.data; g.img = Object.assign({}, T.img, { data: keep }); }
        else { const keep = g[k].text; g[k] = Object.assign({}, T[k], { text: keep }); }
        save(); refresh();
      });
      on('alAll', 'click', () => { const n = fromTpl(TPLS[0], f()); n.msg.text = ''; n.pos = 'center'; CFG.follow = n; save(); paintBtn(); refresh(); });
      document.querySelectorAll('.al-sec').forEach(x => x.addEventListener('focusin', () => { const k = x.dataset.sec; if (k === 'img' || k === 'nm' || k === 'msg') { sel = k; document.querySelectorAll('.al-sec').forEach(y => y.classList.toggle('sel', y === x)); } }));
    }
    function paintThumbs() {
      document.querySelectorAll('canvas[data-tp]').forEach(cv_ => {
        const cf = fromTpl(tplById(cv_.dataset.tp), null, f().lang), c = cv_.getContext('2d'), Wc = cv_.width, Hc = cv_.height;
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, Wc, Hc);
        const bgG = c.createLinearGradient(0, 0, Wc, Hc); bgG.addColorStop(0, '#222838'); bgG.addColorStop(1, '#10131a'); c.fillStyle = bgG; c.fillRect(0, 0, Wc, Hc);
        const k = Math.min((Wc - 24) / cf.w, (Hc - 20) / cf.h);
        c.setTransform(k, 0, 0, k, (Wc - cf.w * k) / 2, (Hc - cf.h * k) / 2);
        card(c, 0, 0, cf, TESTN[cf.lang], 1, 900, {});
        c.setTransform(1, 0, 0, 1, 0, 0);
      });
    }
    function refresh() {
      $('alTabs').innerHTML = tabsHtml(); $('alPanel').innerHTML = panel();
      document.querySelectorAll('.al-seg').forEach(b => b.onclick = () => { tab = b.dataset.tab; refresh(); $('alPanel').scrollTop = 0; });
      bindPanel(); paintIcons($('dlgB')); if (tab === 'tpl') paintThumbs();
    }
    function runTest() { clear(); push('follow', testName, true); }

    dlg({
      title: t('alTitle'), body, wide: true,
      onOpen: () => {
        box.classList.add('al-box'); paintIcons($('dlgB'));
        document.querySelectorAll('.al-seg').forEach(b => b.onclick = () => { tab = b.dataset.tab; refresh(); $('alPanel').scrollTop = 0; });
        bindPrev(); bindPanel(); paintThumbs(); paintPrev(); prepAll();
        on_('alTestNm', 'input', e => { const v = e.target.value.trim(); tnCustom = !!v; testName = v.slice(0, 24) || TESTN[f().lang]; });
        on_('alPlay', 'click', runTest);
        dlgClose = () => {
          cancelAnimationFrame(raf); stopPA(); box.classList.remove('al-box');
          if (pvEl) { try { pvEl.pause(); pvEl.removeAttribute('src'); pvEl.load(); } catch (e) {} pvEl = null; pvId = ''; }
          if (curA && curA.test) clear();
          if (committed) { oldIds.forEach(rmFile); }
          else {
            newIds.forEach(rmFile);
            try { CFG = { follow: norm(JSON.parse(orig).follow) }; save(); paintBtn(); prepAll(); } catch (e) {}
          }
        };
      },
      actions: [
        { label: t('cancel') },
        { label: t('alSave'), kind: 'primary', cb: () => { const was = JSON.parse(orig).follow.on; committed = true; save(); paintBtn(); prepAll(); if (was !== CFG.follow.on) { toast(t(CFG.follow.on ? 'alOnToast' : 'alOffToast')); if (!CFG.follow.on) clear(); } } }
      ]
    });
    function on_(id, ev, fn) { const el = $(id); if (el) el.addEventListener(ev, fn); }
  }
  if (btn) btn.onclick = openDialog;

  /* ---------- ربط عام ---------- */
  window.SEAlert = { draw, push, clear, open: openDialog, cfg: () => CFG };
  try { paintIcons(btn || document); paintBtn(); prepAll(); } catch (e) {}
  const _ai = applyI18n;
  applyI18n = function () { _ai(); try { paintBtn(); } catch (e) {} };
})();
