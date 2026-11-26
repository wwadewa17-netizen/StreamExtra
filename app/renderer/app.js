'use strict';
const $ = id => document.getElementById(id);
const cv = $('cv'), ctxMain = cv.getContext('2d'); let ctx = ctxMain;
const LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : v; }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} } };
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CW = 1280, CH = 720;

/* ================= Icons ================= */
const IC = {
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
  eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18 18 0 0 1 5.1-5.9M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  up:'<path d="M12 19V5M5 12l7-7 7 7"/>', down:'<path d="M12 5v14M19 12l-7 7-7-7"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  text:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  shape:'<rect x="3" y="5" width="18" height="14" rx="3"/>',
  camera:'<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  video:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>',
  monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  window:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  play:'<path d="M6 4l14 8-14 8z" fill="currentColor"/>', pause:'<path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/>',
  stop:'<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>', check:'<path d="M20 6L9 17l-5-5"/>',
  volume:'<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  volumeoff:'<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/>',
  film:'<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 8h5M2 16h5M17 8h5M17 16h5"/>',
  layers:'<path d="M12 2l10 6-10 6L2 8z"/><path d="M2 14l10 6 10-6"/>',
  sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  palette:'<circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="16" cy="10" r="1.2"/>',
  radio:'<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  unlink:'<path d="M18.8 13.2l1.7-1.7a5 5 0 0 0-7-7l-1.7 1.7M5.2 10.8l-1.7 1.7a5 5 0 0 0 7 7l1.7-1.7M2 2l20 20"/>',
  upload:'<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  maximize:'<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  center:'<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',
  desk:'<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21h8M12 16v5"/><path d="M9.5 8.5a3.5 3.5 0 0 1 0 3M12 7a6 6 0 0 1 0 6"/>',
  chev:'<path d="M9 6l6 6-6 6"/>',
  chevl:'<path d="M15 6l-6 6 6 6"/>',
  keyboard:'<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  headphones:'<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  shuffle:'<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  micoff:'<path d="M1 1l22 22"/><path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.8"/><path d="M17 16.9A7 7 0 0 1 5 11M19 11a7 7 0 0 1-.1 1.2M12 18v4M8 22h8"/>'
};
const ICON_OF = { text:'text', image:'image', video:'video', audio:'music', screen:'monitor', window:'window', cam:'camera', rect:'shape', mic:'mic', deskaudio:'desk', siteaudio:'globe' };
const LIVE = new Set(['mic', 'deskaudio', 'siteaudio']);
const noVisual = it => it.type === 'audio' || LIVE.has(it.type);
const ic = (n, s) => `<svg viewBox="0 0 24 24"${s ? ` style="width:${s}px;height:${s}px"` : ''}>${IC[n] || ''}</svg>`;
function paintIcons(root){ (root || document).querySelectorAll('i[data-ic]').forEach(el => { el.innerHTML = ic(el.dataset.ic); }); }

/* ================= i18n ================= */
const I18N = {
  ar: {
    settings:'الإعدادات', scenes:'المشاهد', sources:'العناصر', mixer:'خلاط الصوت', controls:'التحكم', preview:'المعاينة', props:'الخصائص', general:'عام', streaming:'البث', streamRecTab:'إعدادات البث', controlsTab:'التحكم',
    addScene:'إنشاء مشهد', delScene:'حذف المشهد', dupScene:'تكرار المشهد', renameScene:'إعادة تسمية المشهد', moveUp:'أعلى', moveDown:'أسفل',
    addSource:'إضافة عنصر', delSource:'حذف العنصر', forward:'للأمام', back:'للخلف',
    newSceneTitle:'مشهد جديد', sceneName:'اسم المشهد', create:'إنشاء', cancel:'إلغاء', save:'حفظ', ok:'موافق', newSceneName:'مشهد', copyOf:'نسخة', welcomeScene:'مشهد الترحيب', welcomeText:'مرحبا',
    confirmDelScene:'حذف المشهد "{n}" بكل عناصره؟', lastScene:'لازم يبقى مشهد واحد على الأقل', del:'حذف',
    text:'نص', image:'صورة', video:'فيديو', audio:'صوت مدمج', screen:'شاشة كاملة', window:'نافذة أو لعبة', cam:'كاميرا', rect:'شكل',
    mic:'صوت المايك', deskaudio:'صوت سطح المكتب', siteaudio:'التطبيقات المفتوحة',
    image_d:'من جهازك أو من رابط', video_d:'ملف أو رابط (يدعم يوتيوب)', audio_d:'ملف صوت أو رابط يوتيوب', screen_d:'التقاط الشاشة كاملة', window_d:'التقاط نافذة برنامج أو لعبة', text_d:'عنوان أو كلمات', cam_d:'كاميرا الويب', rect_d:'مستطيل ملوّن',
    mic_d:'تحكم بمستواه واختر نوع المايك', deskaudio_d:'كل صوت الجهاز يسمعه المشاهدون', siteaudio_d:'يوتيوب، فيسبوك، ديسكورد... تحكم بصوت كل تطبيق',
    grpVisual:'المرئيات', grpAudio:'مصادر الصوت',
    test:'تجربة', testStop:'إيقاف التجربة', testListening:'جاري الاستماع...', testOk:'✓ تم رصد صوت، المصدر يعمل', testNone:'لا يوجد صوت حتى الآن، شغّل شيئاً وراقب المؤشر',
    liveOpts:'إعدادات الصوت المباشر', liveFail:'تعذر التقاط الصوت', micDevice:'نوع المايك (الجهاز)', defaultMic:'الجهاز الافتراضي', micEcho:'إلغاء الصدى', micNoise:'تقليل الضوضاء', micAgc:'تحكم تلقائي بالمستوى',
    micNote:'التجربة تشغّل المايك على سماعاتك. استخدم سماعات الرأس لتفادي الصدى.',
    deskNote:'يلتقط كل صوت الجهاز ويصل للمشاهدين. أثناء تشغيله يتوقف سماع الخلاط على السماعات تلقائياً لمنع الصدى (البث لا يتأثر).',
    siteNote:'يفتح الموقع في نافذة خاصة وصوتها يصل للبث. سجّل الدخول وشغّل المحتوى من تلك النافذة.',
    siteUrl:'رابط الموقع', addSiteTitle:'إضافة صوت موقع', siteHint:'مثال: https://www.youtube.com أو أي موقع فيه صوت', openSite:'فتح النافذة / إعادة الاتصال', siteClosed:'تم إغلاق نافذة الموقع',
    addImage:'إضافة صورة', addVideo:'إضافة فيديو', addAudio:'إضافة صوت', fromDevice:'من الجهاز', fromLink:'من رابط', chooseFile:'اختر ملف', dropHere:'أو اسحب الملف وأفلته هنا', add:'إضافة',
    linkPh:'https://...', hintAudio:'الصق رابط يوتيوب أو رابط مباشر لملف صوت (mp3, m4a, wav ...)', hintVideo:'الصق رابط يوتيوب أو رابط مباشر لملف فيديو (mp4, webm ...)', hintImage:'الصق رابط مباشر للصورة (png, jpg, gif, webp ...)',
    downloading:'جاري التحميل...', loading:'جاري التحميل...',
    eBadUrl:'الرابط غير صالح', eNoYt:'ملف yt-dlp.exe غير موجود، لازم لتشغيل روابط يوتيوب. أعد تشغيل Build_StreamExtra.cmd', eHttp:'تعذر فتح الرابط (خطأ ', eType:'الرابط مش من النوع المطلوب', eBig:'الملف كبير جداً (الحد 400MB)', eFail:'فشل التحميل: ', eEmptyUrl:'اكتب الرابط أولاً',
    pickScreen:'اختر الشاشة', pickWindow:'اختر النافذة', noSources:'ما في مصادر متاحة', changeSource:'تغيير المصدر', camTitle:'إضافة كاميرا', camChecking:'جاري التحقق من الكاميرا...', camFound:'تم العثور على {n} كاميرا', camPick:'اختر الكاميرا:', camOk:'موافق',
    camNone:'ما فيه كاميرا متصلة بالكمبيوتر', camNoneHelp:'وصّل الكاميرا (USB) أو فعّلها، وتأكد أنها تظهر في إعدادات ويندوز، ثم اضغط "إعادة التحقق".',
    camDenied:'ويندوز يمنع البرنامج من استخدام الكاميرا. افتح: الإعدادات ← الخصوصية والأمان ← الكاميرا، وفعّل الوصول لتطبيقات سطح المكتب.',
    camBusy:'الكاميرا مستخدمة من برنامج آخر (مثل Zoom أو OBS). أغلقه ثم اضغط "إعادة التحقق".', camRecheck:'إعادة التحقق', camLost:'انفصلت الكاميرا',
    camDefault:'الكاميرا الافتراضية', camDevice:'الكاميرا', camShape:'الشكل', shapeRect:'مربع', shapeRound:'مربع بحواف دائرية', shapeCircle:'دائرة', keepRatio:'قفل النسبة عند التكبير والتصغير',
    camCheckBtn:'تحقق / تغيير الكاميرا', camNote:'اسحب أي زاوية في المعاينة لتكبير أو تصغير الكاميرا. اضغط Shift أثناء السحب لقفل النسبة مؤقتاً. ',
    capFail:'تعذر التقاط المصدر، اختره من جديد من الخصائص',
    itemOpts:'خيارات العنصر', sceneProps:'خصائص المشهد', name:'الاسم', background:'الخلفية', color1:'اللون الأول', color2:'اللون الثاني', presets:'ألوان جاهزة',
    content:'النص', font:'الخط', size:'حجم الخط', weight:'سماكة الخط', color:'اللون', align:'المحاذاة', left:'يسار', center:'وسط', right:'يمين', regular:'عادي', semibold:'متوسط', bold:'عريض',
    glow:'توهج', glowColor:'لون التوهج', stroke:'سماكة الحدود', strokeColor:'لون الحدود', fill:'لون التعبئة', radius:'استدارة الزوايا',
    fit:'ملاءمة', contain:'احتواء', cover:'تغطية', stretch:'تمديد', mirror:'عكس الكاميرا',
    layout:'المكان والحجم', posX:'X', posY:'Y', w:'العرض', h:'الارتفاع', opacity:'الشفافية', layer:'الترتيب', fitScreen:'ملء الشاشة', centerIt:'توسيط',
    timing:'التوقيت', autoHide:'إخفاء تلقائي بعد (ثواني، 0 = بدون)', hideEnd:'إخفاء عند انتهاء الفيديو',
    soundOpts:'إعدادات الصوت', volume:'الصوت', loop:'تكرار', auto:'تشغيل تلقائي عند دخول المشهد', linkTo:'ربط الصوت بعنصر', noLink:'— بدون ربط —', unlink:'فك الربط',
    linkNote:'الصوت مربوط: بيشتغل مع ظهور العنصر وبيتوقف لما تخفيه. اضغط ▶ بجانب العنصر ليظهر مع الصوت.',
    linkedToast:'تم الربط ✓ العنصر صار مخفي، اضغط ▶ بجانبه ليظهر مع الصوت', unlinkedToast:'تم فك الربط',
    hide:'إخفاء', show:'إظهار', lock:'قفل', unlock:'فتح القفل', showWithSound:'إظهار مع الصوت', hideAndStop:'إخفاء وإيقاف الصوت',
    noItems:'المشهد فاضي.\nاضغط + لإضافة صورة أو فيديو أو صوت أو شاشة.', noAudio:'ما في مصادر صوت بهالمشهد.\nأضف صوت أو فيديو من زر +', master:'الصوت الرئيسي', monitor:'سماع على السماعات', mute:'كتم', unmute:'إلغاء الكتم', play:'تشغيل', pause:'إيقاف',
    hotkeys:'مفاتيح 1-9 للتنقل بين المشاهد\nDelete حذف · الأسهم تحرك العنصر',
    rename:'إعادة تسمية', dupItem:'تكرار', transform:'التحويل', toFront:'إلى أعلى الكل', toBack:'إلى أسفل الكل', sourceName:'اسم العنصر', renameSource:'إعادة تسمية العنصر', confirmDelItem:'حذف العنصر "{n}"؟',
    appearance:'المظهر', themeLight:'نهاري', themeDark:'ليلي', guides:'خطوط الإرشاد',
    streamBar:'البث', localBar:'أنا', streamBarFull:'صوت البث (ما يسمعه المشاهدون)', localBarFull:'صوتي أنا (سماعاتي فقط)', audioSettings:'إعدادات الصوت',
    streamNote:'هذا المستوى هو الذي يصل للمشاهدين.', localNote:'يتحكم بما تسمعه أنت فقط، والبث يبقى كما هو.', micLocalNote:'لسماع صوتك في سماعتك. الأفضل سماعات رأس لتفادي الصدى.',
    tryLocal:'تجربة عندي فقط', tryStop:'إيقاف التجربة', tryNote:'تسمعها أنت فقط ولا تصل للبث.', tryBusy:'المصدر شغال حالياً في البث، أوقفه أولاً لتجربته.',
    monOffNote:'سماعاتك مكتومة (زر السماعة في الصوت الرئيسي) أو صوت سطح المكتب شغال، فلن تسمع شيئاً.', resetVol:'إعادة الضبط',
    ctrlQuick:'تحكم سريع', ctrlScene:'تبديل المشهد', prevScene:'المشهد السابق', nextScene:'المشهد التالي', micLive:'المايك يعمل', micMuted:'المايك مكتوم', micAdd:'إضافة مايك',
    transition:'الانتقال', tr_none:'بدون', tr_fade:'تلاشي', tr_slide:'انزلاق', tr_push:'دفع', tr_zoom:'تكبير', tr_wipe:'مسح', tr_dip:'عبر الأسود',
    trType:'نوع الانتقال بين المشاهد', trDur:'مدة الانتقال', trNote:'يظهر الانتقال في المعاينة وفي البث عند التبديل بين المشاهد (بالضغط أو بالاختصارات). والصوت أيضاً يتبدّل بنعومة إلى مستويات المشهد الجديد.',
    audioTab:'الصوت', audioRouteT:'صوت التطبيقات المفتوحة', audioRoute:'تمرير صوت نوافذ التطبيقات عبر الخلاط (موصى به)',
    audioRouteNote:'عند التفعيل يُكتم صوت نافذة التطبيق على جهازك ويُعاد تشغيله من البرنامج، فتخفضه أو ترفعه عندك (شريط «أنا») بشكل منفصل عن المشاهدين (شريط «البث»). إذا لم تسمع شيئاً أو لم يسمع المشاهدون، أوقف هذا الخيار.',
    audioSceneT:'مستويات الصوت لكل مشهد', audioSceneNote:'كل مشهد يحفظ مستويات صوته الخاصة (البث وأنا) لكل مصدر وللصوت الرئيسي. اضبط المشهد 1 مثلاً، ثم انتقل إلى المشهد 2 واضبطه بشكل مختلف، وسيتبدّل الصوت تلقائياً عند الانتقال.',
    perScene:'مستويات الصوت محفوظة لهذا المشهد',
    appsTitle:'التطبيقات المفتوحة', appsPh:'اكتب رابط الموقع، مثل youtube.com', appsOpen:'فتح وإضافة', appsQuick:'تطبيقات سريعة', appsList:'النوافذ المفتوحة الآن',
    appsEmpty:'لا توجد تطبيقات مفتوحة.\nافتح يوتيوب أو أي موقع من الأعلى.', appsAdd:'إضافة للخلاط', appsAdded:'مضاف ✓', appsShow:'إظهار النافذة', appsClose:'إغلاق', appsPlaying:'يُشغّل صوتاً',
    appsNote:'تُفتح الصفحات داخل Stream Extra لتتحكم بصوتها: شريط «البث» للمشاهدين وشريط «أنا» لك فقط، ولكل مشهد مستوياته. البرامج المفتوحة خارج Stream Extra (مثل متصفحك) لا يمكن فصل صوتها، لذلك افتح الصفحة من هنا بدلاً منها.',
    appsAddedToast:'أُضيف ✓ تحكم بصوته من الخلاط', hkPlainWarn:'تنبيه: مفتاح بدون Ctrl/Alt سيُحجز في كل النظام ما دام خيار «تعمل في الخلفية» مفعلاً.',
    hkTitle:'الاختصارات', hkHint:'أضف اختصاراً لتبديل مشهد، أو بدء/إيقاف البث، أو فتح/إغلاق المايك. اضغط على المربع ثم اضغط أي زر في الكيبورد (Esc إلغاء · Backspace حذف).',
    hkGlobal:'تعمل حتى والبرنامج في الخلفية (أثناء اللعب)', hkAdd:'إضافة اختصار', hkPress:'اضغط المفاتيح...', hkEmpty:'لا توجد اختصارات بعد.',
    hkDup:'هذا الاختصار مستخدم لإجراء آخر', hkNeedMod:'استخدم Ctrl أو Alt أو Shift مع المفتاح، أو مفاتيح F1-F24', hkFail:'تعذر تسجيل الاختصار (مستخدم في برنامج آخر): ',
    hkScene:'مشهد: ', hkStart:'بدء البث', hkStop:'إيقاف البث', hkToggle:'بدء / إيقاف البث', hkMicOn:'فتح المايك', hkMicOff:'إغلاق المايك', hkMicToggle:'فتح / إغلاق المايك', hkNext:'المشهد التالي', hkPrev:'المشهد السابق',
    hkDeleted:'(محذوف)', hkClear:'حذف الاختصار', hkNoKey:'اضغط لتحديد الاختصار', micOnToast:'🎤 المايك يعمل', micOffToast:'🔇 المايك مكتوم', noMic:'أضف مصدر مايك أولاً', alreadyLive:'البث شغال أصلاً', notLive:'لا يوجد بث شغال',
    language:'اللغة', platform:'منصة البث', soon:'قريباً', streamUrl:'رابط البث (Stream URL)', streamKey:'مفتاح البث (Stream Key)', keyHint:'بتلاقيهم في Kick ← Creator Dashboard ← Stream Settings. انسخ الرابط والمفتاح والصقهم هون.',
    bitrate:'جودة البث (Bitrate)', brL:'منخفض (إنترنت ضعيف)', brN:'عادي', brG:'جيد (موصى به)', brH:'عالي', brV:'عالي جداً', micOn:'تشغيل المايكروفون أثناء البث', saved:'✅ تم الحفظ على جهازك', saveFail:'❌ فشل الحفظ: ',
    startStream:'ابدأ البث', stopStream:'إيقاف البث', status:'الحالة', ready:'جاهز', connecting:'جاري الاتصال بـ Kick...', liveOn:'🔴 البث شغال على Kick', stoppedMsg:'تم إيقاف البث',
    setKickFirst:'اضبط رابط ومفتاح Kick من الإعدادات أولاً', micFail:'تعذر تشغيل المايكروفون، رح يكمل البث بدون صوت', errPrefix:'❌ خطأ: ',
    kickReady:'Kick · جاهز', kickNotSet:'Kick · غير مضبوط', kickLive:'Kick · مباشر',
    mAlready:'البث شغال أصلاً', mNeedKey:'لازم تدخل رابط البث ومفتاح البث من الإعدادات', mNoFf:'ملف ffmpeg.exe غير موجود. أعد تشغيل Build_StreamExtra.cmd', mFfFail:'تعذر تشغيل ffmpeg', mFfErr:'خطأ ffmpeg', mDisc:'انقطع الاتصال مع Kick. تأكد من الرابط والمفتاح.'
  },
  en: {
    settings:'Settings', scenes:'Scenes', sources:'Sources', mixer:'Audio Mixer', controls:'Controls', preview:'Preview', props:'Properties', general:'General', streaming:'Streaming', streamRecTab:'Stream settings', controlsTab:'Controls',
    addScene:'Create scene', delScene:'Delete scene', dupScene:'Duplicate scene', renameScene:'Rename scene', moveUp:'Up', moveDown:'Down',
    addSource:'Add source', delSource:'Remove source', forward:'Bring forward', back:'Send backward',
    newSceneTitle:'New scene', sceneName:'Scene name', create:'Create', cancel:'Cancel', save:'Save', ok:'OK', newSceneName:'Scene', copyOf:'Copy', welcomeScene:'Welcome scene', welcomeText:'Welcome',
    confirmDelScene:'Delete scene "{n}" and all its sources?', lastScene:'At least one scene must remain', del:'Delete',
    text:'Text', image:'Image', video:'Video', audio:'Built-in audio', screen:'Full screen', window:'Window or game', cam:'Camera', rect:'Shape',
    mic:'Microphone', deskaudio:'Desktop audio', siteaudio:'Open apps',
    image_d:'From your device or a link', video_d:'File or link (YouTube supported)', audio_d:'Audio file or YouTube link', screen_d:'Capture the whole screen', window_d:'Capture an app window or game', text_d:'Title or words', cam_d:'Webcam', rect_d:'Colored rectangle',
    mic_d:'Adjust its level and choose the mic', deskaudio_d:'Everything your PC plays, heard by viewers', siteaudio_d:'YouTube, Facebook, Discord... control each app\'s sound',
    grpVisual:'Visual', grpAudio:'Audio sources',
    test:'Test', testStop:'Stop test', testListening:'Listening...', testOk:'✓ Sound detected, the source works', testNone:'No sound yet, play something and watch the meter',
    liveOpts:'Live audio settings', liveFail:'Could not capture the audio', micDevice:'Microphone (device)', defaultMic:'Default device', micEcho:'Echo cancellation', micNoise:'Noise suppression', micAgc:'Automatic gain control',
    micNote:'Testing plays the mic on your speakers. Use headphones to avoid echo.',
    deskNote:'Captures all PC audio and sends it to viewers. While it is on, the mixer stops playing on your speakers to avoid echo (the stream is not affected).',
    siteNote:'Opens the site in its own window and sends that window\'s sound to the stream. Sign in and play from that window.',
    siteUrl:'Site link', addSiteTitle:'Add site audio', siteHint:'Example: https://www.youtube.com or any site with sound', openSite:'Open window / reconnect', siteClosed:'The site window was closed',
    addImage:'Add image', addVideo:'Add video', addAudio:'Add audio', fromDevice:'From device', fromLink:'From link', chooseFile:'Choose a file', dropHere:'or drag & drop it here', add:'Add',
    linkPh:'https://...', hintAudio:'Paste a YouTube link or a direct audio file link (mp3, m4a, wav ...)', hintVideo:'Paste a YouTube link or a direct video file link (mp4, webm ...)', hintImage:'Paste a direct image link (png, jpg, gif, webp ...)',
    downloading:'Downloading...', loading:'Loading...',
    eBadUrl:'Invalid link', eNoYt:'yt-dlp.exe is missing (needed for YouTube links). Run Build_StreamExtra.cmd again', eHttp:'Could not open the link (error ', eType:'The link is not the expected type', eBig:'File is too large (400MB max)', eFail:'Download failed: ', eEmptyUrl:'Enter a link first',
    pickScreen:'Choose a screen', pickWindow:'Choose a window', noSources:'No sources available', changeSource:'Change source', camTitle:'Add camera', camChecking:'Checking for a camera...', camFound:'{n} camera(s) found', camPick:'Choose a camera:', camOk:'OK',
    camNone:'No camera is connected to this computer', camNoneHelp:'Plug in the camera (USB) or enable it, make sure it shows in Windows settings, then press "Check again".',
    camDenied:'Windows blocks the app from using the camera. Open: Settings > Privacy & security > Camera and allow desktop apps.',
    camBusy:'The camera is in use by another app (Zoom, OBS...). Close it, then press "Check again".', camRecheck:'Check again', camLost:'Camera disconnected',
    camDefault:'Default camera', camDevice:'Camera', camShape:'Shape', shapeRect:'Square', shapeRound:'Rounded square', shapeCircle:'Circle', keepRatio:'Lock the aspect ratio when resizing',
    camCheckBtn:'Check / change camera', camNote:'Drag any corner in the preview to make the camera bigger or smaller. Hold Shift while dragging to lock the ratio temporarily. ',
    capFail:'Could not capture the source, pick it again from Properties',
    itemOpts:'Source options', sceneProps:'Scene properties', name:'Name', background:'Background', color1:'Color 1', color2:'Color 2', presets:'Presets',
    content:'Text', font:'Font', size:'Font size', weight:'Font weight', color:'Color', align:'Align', left:'Left', center:'Center', right:'Right', regular:'Regular', semibold:'Semibold', bold:'Bold',
    glow:'Glow', glowColor:'Glow color', stroke:'Outline width', strokeColor:'Outline color', fill:'Fill color', radius:'Corner radius',
    fit:'Fit', contain:'Contain', cover:'Cover', stretch:'Stretch', mirror:'Mirror camera',
    layout:'Position & size', posX:'X', posY:'Y', w:'Width', h:'Height', opacity:'Opacity', layer:'Order', fitScreen:'Fit to screen', centerIt:'Center',
    timing:'Timing', autoHide:'Auto-hide after (seconds, 0 = never)', hideEnd:'Hide when the video ends',
    soundOpts:'Sound settings', volume:'Volume', loop:'Loop', auto:'Autoplay when the scene opens', linkTo:'Link sound to a source', noLink:'— No link —', unlink:'Unlink',
    linkNote:'Linked: the sound plays when the source is shown and stops when hidden. Press ▶ next to the source to show it with the sound.',
    linkedToast:'Linked ✓ the source is now hidden, press ▶ next to it to show it with the sound', unlinkedToast:'Unlinked',
    hide:'Hide', show:'Show', lock:'Lock', unlock:'Unlock', showWithSound:'Show with sound', hideAndStop:'Hide and stop sound',
    noItems:'This scene is empty.\nPress + to add an image, video, audio or screen.', noAudio:'No audio sources in this scene.\nAdd audio or video with the + button', master:'Master', monitor:'Hear on speakers', mute:'Mute', unmute:'Unmute', play:'Play', pause:'Pause',
    hotkeys:'Keys 1-9 switch scenes\nDelete removes · Arrows nudge',
    rename:'Rename', dupItem:'Duplicate', transform:'Transform', toFront:'Bring to front', toBack:'Send to back', sourceName:'Source name', renameSource:'Rename source', confirmDelItem:'Remove "{n}"?',
    appearance:'Appearance', themeLight:'Light', themeDark:'Dark', guides:'Guides',
    streamBar:'Stream', localBar:'Me', streamBarFull:'Stream volume (what viewers hear)', localBarFull:'My volume (my headphones only)', audioSettings:'Audio settings',
    streamNote:'This level is what reaches your viewers.', localNote:'Controls only what you hear. The stream stays unchanged.', micLocalNote:'Hear your own voice in your headphones. Use headphones to avoid echo.',
    tryLocal:'Try it (only me)', tryStop:'Stop trying', tryNote:'Only you hear it, it does not reach the stream.', tryBusy:'This source is playing on the stream right now, stop it first to try it.',
    monOffNote:'Your speakers are muted (speaker button in Master) or desktop audio is on, so you will hear nothing.', resetVol:'Reset',
    ctrlQuick:'Quick controls', ctrlScene:'Switch scene', prevScene:'Previous scene', nextScene:'Next scene', micLive:'Mic is on', micMuted:'Mic is muted', micAdd:'Add microphone',
    transition:'Transition', tr_none:'None', tr_fade:'Fade', tr_slide:'Slide', tr_push:'Push', tr_zoom:'Zoom', tr_wipe:'Wipe', tr_dip:'Dip to black',
    trType:'Scene transition type', trDur:'Transition duration', trNote:'The transition plays in the preview and on the stream when you switch scenes (by click or hotkey). Audio also fades smoothly to the new scene\'s levels.',
    audioTab:'Audio', audioRouteT:'Open apps audio', audioRoute:'Route app windows through the mixer (recommended)',
    audioRouteNote:'When on, the app window is muted on your PC and replayed by Stream Extra, so you can lower or raise it for yourself (the Me bar) separately from viewers (the Stream bar). If you hear nothing, or viewers hear nothing, turn this off.',
    audioSceneT:'Volumes per scene', audioSceneNote:'Each scene keeps its own volume levels (Stream and Me) for every source and for the master. Set Scene 1, then switch to Scene 2 and set it differently; the sound changes automatically when you switch.',
    perScene:'Volumes are saved for this scene',
    appsTitle:'Open apps', appsPh:'Type a site link, e.g. youtube.com', appsOpen:'Open & add', appsQuick:'Quick apps', appsList:'Windows open now',
    appsEmpty:'No apps are open.\nOpen YouTube or any site above.', appsAdd:'Add to mixer', appsAdded:'Added ✓', appsShow:'Show window', appsClose:'Close', appsPlaying:'Playing sound',
    appsNote:'Pages open inside Stream Extra so you can control their sound: the Stream bar is for viewers, the Me bar is for you only, and every scene keeps its own levels. Programs opened outside Stream Extra (like your own browser) cannot be separated, so open the page from here instead.',
    appsAddedToast:'Added ✓ control its volume from the mixer', hkPlainWarn:'Heads up: a key without Ctrl/Alt is reserved system-wide while "Work even in the background" is on.',
    hkTitle:'Hotkeys', hkHint:'Add a hotkey to switch a scene, start/stop the stream, or turn the mic on/off. Click the box, then press any key on your keyboard (Esc cancels · Backspace clears).',
    hkGlobal:'Work even in the background (while gaming)', hkAdd:'Add hotkey', hkPress:'Press the keys...', hkEmpty:'No hotkeys yet.',
    hkDup:'This hotkey is already used by another action', hkNeedMod:'Use Ctrl, Alt or Shift with the key, or F1-F24', hkFail:'Could not register the hotkey (used by another app): ',
    hkScene:'Scene: ', hkStart:'Start stream', hkStop:'Stop stream', hkToggle:'Start / stop stream', hkMicOn:'Mic on', hkMicOff:'Mic off', hkMicToggle:'Mic on / off', hkNext:'Next scene', hkPrev:'Previous scene',
    hkDeleted:'(deleted)', hkClear:'Remove hotkey', hkNoKey:'Click to set hotkey', micOnToast:'🎤 Mic is on', micOffToast:'🔇 Mic is muted', noMic:'Add a microphone source first', alreadyLive:'Stream is already running', notLive:'No stream is running',
    language:'Language', platform:'Streaming platform', soon:'soon', streamUrl:'Stream URL', streamKey:'Stream Key', keyHint:'Find them in Kick → Creator Dashboard → Stream Settings. Copy the URL and key and paste them here.',
    bitrate:'Stream quality (Bitrate)', brL:'Low (weak internet)', brN:'Normal', brG:'Good (recommended)', brH:'High', brV:'Very high', micOn:'Enable microphone while streaming', saved:'✅ Saved on your device', saveFail:'❌ Save failed: ',
    startStream:'Start Stream', stopStream:'Stop Stream', status:'Status', ready:'Ready', connecting:'Connecting to Kick...', liveOn:'🔴 Live on Kick', stoppedMsg:'Stream stopped',
    setKickFirst:'Set your Kick URL and Stream Key in Settings first', micFail:'Could not start the microphone, streaming continues without it', errPrefix:'❌ Error: ',
    kickReady:'Kick · Ready', kickNotSet:'Kick · Not set', kickLive:'Kick · Live',
    mAlready:'Stream is already running', mNeedKey:'Enter the Stream URL and Stream Key in Settings', mNoFf:'ffmpeg.exe not found. Run Build_StreamExtra.cmd again', mFfFail:'Could not start ffmpeg', mFfErr:'ffmpeg error', mDisc:'Connection to Kick lost. Check the URL and key.'
  }
};
Object.assign(I18N.ar, { undoDone: 'تم التراجع', redoDone: 'تمت الإعادة', undoNone: 'لا يوجد شي للتراجع عنه', redoNone: 'لا يوجد شي لإعادته' });
Object.assign(I18N.en, { undoDone: 'Undone', redoDone: 'Redone', undoNone: 'Nothing to undo', redoNone: 'Nothing to redo' });
Object.assign(I18N.ar, { delayL: 'التأخير', delayTip: 'تأخير البث من البرنامج حتى سيرفر Kick (تجميع + ترميز + شبكة). مشغّل Kick عند المشاهد يضيف عليه حسب وضع Kick.' });
Object.assign(I18N.en, { delayL: 'Delay', delayTip: 'Stream delay from the app to the Kick server (buffering + encoding + network). Kick\'s own player adds more on the viewer side.' });
let lang = LS.get('se_lang', 'ar');
const t = (k, o) => { let s = (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; if(o) for(const x in o) s = s.replace('{' + x + '}', o[x]); return s; };
const MAIN_MAP = [['البث شغال أصلاً','mAlready'],['لازم تدخل رابط','mNeedKey'],['ملف ffmpeg.exe غير موجود','mNoFf'],['تعذر تشغيل ffmpeg','mFfFail'],['خطأ ffmpeg','mFfErr'],['انقطع الاتصال مع Kick','mDisc']];
function tm(msg){ // يترجم رسائل main.js العربية للإنجليزي فقط
  if(!msg || lang === 'ar') return msg;
  for(const [a, k] of MAIN_MAP){ if(msg.startsWith(a)){ let tail = ''; if(k === 'mFfFail' || k === 'mFfErr'){ const i = msg.indexOf(':'); tail = i >= 0 ? msg.slice(i) : ''; } else { const n = msg.indexOf('\n'); tail = n >= 0 ? msg.slice(n) : ''; } return t(k) + tail; } }
  return msg;
}

/* ================= Persistence (assets in IndexedDB) ================= */
let dbp;
const db = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('streamextra', 1); r.onupgradeneeded = () => r.result.createObjectStore('assets'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
async function idb(mode, fn){ const d = await db(); return new Promise((res, rej) => { const tx = d.transaction('assets', mode); const rq = fn(tx.objectStore('assets')); tx.oncomplete = () => res(rq && rq.result); tx.onerror = () => rej(tx.error); }); }
const idbPut = (k, v) => idb('readwrite', s => s.put(v, k));
const idbGet = k => idb('readonly', s => s.get(k));
const idbDel = k => idb('readwrite', s => s.delete(k));
const idbKeys = () => idb('readonly', s => s.getAllKeys());

/* ================= Scene model ================= */
let S = { scenes: [], current: null };
let sel = null;
const cur = () => S.scenes.find(s => s.id === S.current) || S.scenes[0];
const selItem = () => { const sc = cur(); return sc && sel ? sc.items.find(i => i.id === sel) : null; };
let _pt; const persist = () => { clearTimeout(_pt); _pt = setTimeout(saveScenes, 300); };
function saveScenes(){ LS.set('se_scenes', JSON.stringify(S)); try{ histCommit(); }catch(e){} }
window.addEventListener('beforeunload', saveScenes);
/* ================= Undo / Redo (Ctrl+Z / Ctrl+Shift+Z) =================
   لقطات للمشاهد (بدون المشهد الحالي، فتبديل المشهد ما يُحسب خطوة). كل تغيير يمرّ على persist() يصير خطوة وحدة. */
const HIST = { undo:[], redo:[], cur:null, max:100, busy:false };
const histSnap = () => JSON.stringify(S.scenes);
function histCommit(){
  if(HIST.busy) return;
  const s = histSnap();
  if(HIST.cur === null){ HIST.cur = s; return; }
  if(s === HIST.cur) return;
  HIST.undo.push(HIST.cur); if(HIST.undo.length > HIST.max) HIST.undo.shift();
  HIST.cur = s; HIST.redo.length = 0;
}
function histFlush(){ clearTimeout(_pt); saveScenes(); }
function histUsedAssets(){   // الملفات المستخدمة في خطوات التراجع/الإعادة (حتى لا تنحذف من التخزين وتضيع عند التراجع)
  const used = new Set(), re = /"assetId":"([^"]+)"/g;
  [HIST.cur].concat(HIST.undo, HIST.redo).forEach(j => { if(!j) return; let m; re.lastIndex = 0; while((m = re.exec(j))) used.add(m[1]); });
  return used;
}
function histApply(snap){
  HIST.busy = true;
  try{
    const scenes = JSON.parse(snap), keepId = S.current;
    const oldItems = []; S.scenes.forEach(sc => sc.items.forEach(i => oldItems.push(i)));
    scenes.forEach(sc => { sc.bg = sc.bg || ['#0a0305', '#4a0814']; sc.items = (sc.items || []).filter(i => TYPE_DEF[i.type]).map(i => mkItem(i.type, i)); });
    const keep = new Set(); scenes.forEach(sc => sc.items.forEach(i => keep.add(i.id)));
    oldItems.forEach(it => { if(!keep.has(it.id)){ stopCap(it.id); clearHide(it.id); dropMedia(it); endTest(it.id); liveFail.delete(it.id); } });
    S.scenes = scenes;
    if(!S.scenes.some(s => s.id === keepId)) S.current = S.scenes[0].id; else S.current = keepId;
    if(sel && !cur().items.some(i => i.id === sel)) sel = null;
    S.scenes.forEach(sc => sc.items.forEach(i => { if(i.type === 'image') loadImg(i.assetId); }));
    HIST.cur = histSnap();   // اللقطة بعد التطبيع (نفس ترتيب الحقول) حتى لا تُحسب خطوة جديدة بالغلط
    enterScene(cur()); syncLive(); pruneSites(); renderAll();
    LS.set('se_scenes', JSON.stringify(S));
  } finally { HIST.busy = false; }
}
function undo(){
  histFlush();
  if(!HIST.undo.length){ toast(t('undoNone'), 1400); return; }
  HIST.redo.push(HIST.cur); histApply(HIST.undo.pop()); toast('↶ ' + t('undoDone'), 1200);
}
function redo(){
  histFlush();
  if(!HIST.redo.length){ toast(t('redoNone'), 1400); return; }
  HIST.undo.push(HIST.cur); histApply(HIST.redo.pop()); toast('↷ ' + t('redoDone'), 1200);
}


const RATIO = new Set(['image', 'video', 'screen', 'window', 'cam']);
const CAPT = new Set(['screen', 'window', 'cam']);
const keepR = it => RATIO.has(it.type) && !(it.type === 'cam' && it.keep === false);   // الكاميرا: قفل النسبة اختياري
const TYPE_DEF = {
  text:{ w:700, h:160, text:'Text', size:72, weight:700, family:'Segoe UI', color:'#ffffff', align:'center', glow:false, glowColor:'#ff2a3a', stroke:0, strokeColor:'#000000', dur:0 },
  rect:{ w:360, h:220, fill:'#d41b2c', radius:18, dur:0 },
  image:{ w:640, h:360, assetId:'', fit:'contain', dur:0 },
  video:{ w:640, h:360, assetId:'', fit:'contain', loop:false, hideEnd:false, vol:100, muted:false, lvol:100, lmuted:false, dur:0 },
  audio:{ w:0, h:0, assetId:'', vol:100, loop:false, auto:false, muted:false, lvol:100, lmuted:false, link:null },
  screen:{ w:1280, h:720, srcId:'', srcName:'', fit:'contain', dur:0 },
  window:{ w:960, h:540, srcId:'', srcName:'', fit:'contain', dur:0 },
  cam:{ w:640, h:360, mirror:false, fit:'cover', dur:0, deviceId:'', deviceName:'', shape:'rect', keep:true },
  mic:{ w:0, h:0, vol:100, muted:false, lvol:0, lmuted:false, deviceId:'', deviceName:'', echo:true, noise:true, agc:false },
  deskaudio:{ w:0, h:0, vol:100, muted:false },
  siteaudio:{ w:0, h:0, vol:100, muted:false, lvol:100, lmuted:false, url:'' }
};
function mkItem(type, o){ return Object.assign({ id:uid(), type, name:'', x:0, y:0, w:300, h:200, opacity:100, visible:true, locked:false }, TYPE_DEF[type], o || {}); }
function mkScene(name){ return { id:uid(), name, bg:['#0a0305', '#4a0814'], items:[] }; }
function defaultScenes(){
  const sc = mkScene(t('welcomeScene'));
  return { scenes:[sc], current:sc.id };
}
function loadScenes(){
  try{
    const d = JSON.parse(LS.get('se_scenes', 'null'));
    if(d && Array.isArray(d.scenes) && d.scenes.length){
      d.scenes.forEach(sc => {
        sc.bg = sc.bg || ['#0a0305', '#4a0814'];
        sc.items = (sc.items || []).filter(i => TYPE_DEF[i.type]).map(i => mkItem(i.type, i));
        if(Array.isArray(sc.sounds)){ // ترحيل صوتيات النسخة القديمة إلى عناصر صوت
          sc.sounds.forEach(sn => sc.items.push(mkItem('audio', { name:sn.name, assetId:sn.assetId, vol:sn.vol == null ? 100 : sn.vol, loop:!!sn.loop, auto:!!sn.auto })));
        }
        delete sc.sounds; delete sc.vol;
      });
      if(!d.scenes.some(s => s.id === d.current)) d.current = d.scenes[0].id;
      return d;
    }
  }catch(e){}
  return defaultScenes();
}

/* ================= Runtime assets ================= */
const imgs = {}, streams = {}, media = {}, mediaR = {}, playing = {}, prevWant = {}, hideTimers = {}, capFailed = new Set();
const liveCaps = {}, liveR = {}, testing = {}, testHit = {}, liveFail = new Set();
let micDevices = [], camDevices = [];
async function loadImg(id){
  if(!id || id in imgs) return; imgs[id] = null;
  try{ const b = await idbGet(id); if(!b){ delete imgs[id]; return; } const im = new Image(); im.src = URL.createObjectURL(b); imgs[id] = im; }catch(e){ delete imgs[id]; }
}

/* ---- camera / screen / window capture ---- */
const camErr = e => { const n = e && e.name || ''; return n === 'NotAllowedError' || n === 'SecurityError' ? 'denied' : n === 'NotReadableError' || n === 'AbortError' || n === 'TrackStartError' ? 'busy' : n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError' ? 'none' : 'fail'; };
const capDim = () => { const d = window.SQ ? SQ.dims(settings.res) : [CW, CH]; return [Math.max(1280, Math.min(d[0], 3840)), Math.max(720, Math.min(d[1], 2160))]; };   // الكاميرا والشاشة تُلتقط بدقة البث (حتى 4K) ما دام الجهاز يدعمها
async function openCam(deviceId, hi){
  const cd = capDim(), base = hi ? { width:{ ideal:cd[0] }, height:{ ideal:cd[1] }, frameRate:{ ideal:settings.fps === 60 ? 60 : 30 } } : {};
  if(deviceId){ try{ return await navigator.mediaDevices.getUserMedia({ video:Object.assign({ deviceId:{ exact:deviceId } }, base), audio:false }); }catch(e){ if(camErr(e) === 'denied' || camErr(e) === 'busy') throw e; } }   // الجهاز المحدد غير موجود: نجرّب أي كاميرا
  return await navigator.mediaDevices.getUserMedia({ video:Object.assign({}, base), audio:false });
}
async function ensureStream(it){
  if(streams[it.id] || capFailed.has(it.id)) return;
  if(it.type !== 'cam' && !it.srcId) return;
  const entry = { video:document.createElement('video'), stream:null, key:capKeyNow() }; streams[it.id] = entry;
  try{
    let st;
    if(it.type === 'cam') st = await openCam(it.deviceId, true);
    else st = await navigator.mediaDevices.getUserMedia({ audio:false, video:{ mandatory:{ chromeMediaSource:'desktop', chromeMediaSourceId:it.srcId, maxWidth:Math.max(1920, capDim()[0]), maxHeight:Math.max(1080, capDim()[1]), maxFrameRate:60 } } });
    if(streams[it.id] !== entry){ st.getTracks().forEach(x => x.stop()); return; }
    entry.stream = st; entry.video.srcObject = st; entry.video.muted = true; await entry.video.play();
    const vt = st.getVideoTracks()[0];
    if(vt){
      if(it.type === 'cam'){   // نثبّت الجهاز الفعلي + نظبط نسبة المربع على نسبة الكاميرا الحقيقية أول مرة
        const dv = (vt.getSettings && vt.getSettings().deviceId) || ''; if(dv && it.deviceId !== dv){ it.deviceId = dv; if(!it.deviceName || it.deviceName === t('cam')) it.deviceName = vt.label || it.deviceName; persist(); }
        if(!it.ratioSet && entry.video.videoWidth){ it.ratioSet = true; const r = entry.video.videoWidth / entry.video.videoHeight; if(isFinite(r) && r > 0.3 && r < 4){ const cx = it.x + it.w / 2, cy = it.y + it.h / 2; it.h = Math.round(it.w / r); it.x = Math.round(cx - it.w / 2); it.y = Math.round(cy - it.h / 2); updateSel(); syncGeom(); persist(); } }
      }
      vt.addEventListener('ended', () => { if(streams[it.id] === entry){ stopCap(it.id); if(it.type === 'cam'){ capFailed.add(it.id); toast(t('camLost') + ' — ' + (it.name || ''), 5000); } } });
    }
  }catch(e){
    if(streams[it.id] === entry) delete streams[it.id]; capFailed.add(it.id);
    if(it.type === 'cam'){ const k = camErr(e); toast(t(k === 'denied' ? 'camDenied' : k === 'busy' ? 'camBusy' : k === 'none' ? 'camNone' : 'capFail') + ' — ' + (it.name || ''), 6000); }
    else toast(t('capFail') + ' — ' + (it.name || ''));
  }
}
function stopCap(id){ const c = streams[id]; if(!c) return; delete streams[id]; if(c.stream) c.stream.getTracks().forEach(x => x.stop()); }
function syncCaps(){
  const want = new Set();
  cur().items.forEach(i => { if(CAPT.has(i.type) && i.visible){ want.add(i.id); ensureStream(i); } });
  Object.keys(streams).forEach(id => { if(!want.has(id)) stopCap(id); });
  syncLive();
}

/* ================= Canvas rendering (يتحدث كل 33ms عشان البث ما يوقف) ================= */
function rr(x, y, w, h, r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else ctx.rect(x, y, w, h); }
let frames = 0;
/* يرسم المشهد على قماش المعاينة (1280×720) أو — عند تمرير target — مباشرةً بدقة البث الحقيقية (k = نسبة التكبير).
   الإحداثيات تبقى منطقية 1280×720 والتكبير يتم بالـ transform، فيصير النص والأشكال حادّة والصور/الفيديو/الكاميرا/الشاشة تُرسم بتفاصيلها الأصلية. */
let drawK = 1;
function drawScene(target, k){
  if(target){ const prev = ctx; ctx = target; drawK = k; try{ target.setTransform(k, 0, 0, k, 0, 0); drawSceneBody(false); } finally { ctx = prev; drawK = 1; target.setTransform(1, 0, 0, 1, 0, 0); } return; }
  drawSceneBody(true);
}
function drawSceneBody(count){
  const w = CW, h = CH, sc = cur(); if(!sc) return; if(count) frames++;
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, sc.bg[0]); g.addColorStop(1, sc.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for(const it of sc.items){
    if(!it.visible || noVisual(it)) continue;
    ctx.save(); ctx.globalAlpha = clamp(it.opacity / 100, 0, 1);
    try{
      if(it.type === 'text'){
        ctx.font = `${it.weight} ${it.size}px "${it.family}", "Segoe UI", Tahoma, Arial`; ctx.fillStyle = it.color; ctx.textBaseline = 'middle';
        ctx.direction = /[֐-ࣿ]/.test(it.text) ? 'rtl' : 'ltr'; ctx.textAlign = it.align;
        const lines = String(it.text).split('\n'), lh = it.size * 1.2, y0 = it.y + it.h / 2 - (lines.length * lh) / 2 + lh / 2;
        const x = it.align === 'center' ? it.x + it.w / 2 : it.align === 'left' ? it.x : it.x + it.w;
        if(it.stroke > 0){ ctx.lineWidth = it.stroke * 2; ctx.strokeStyle = it.strokeColor; ctx.lineJoin = 'round'; lines.forEach((ln, i) => ctx.strokeText(ln, x, y0 + i * lh)); }
        if(it.glow){ ctx.shadowColor = it.glowColor; ctx.shadowBlur = 40 * drawK; }
        lines.forEach((ln, i) => ctx.fillText(ln, x, y0 + i * lh));
      } else if(it.type === 'rect'){
        ctx.fillStyle = it.fill; rr(it.x, it.y, it.w, it.h, it.radius); ctx.fill();
      } else if(it.type === 'image'){
        const im = imgs[it.assetId]; if(im && im.complete && im.naturalWidth) blit(im, im.naturalWidth, im.naturalHeight, it, it.fit);
      } else if(it.type === 'video'){
        const m = mediaR[it.id]; if(m && m.el.readyState >= 2 && m.el.videoWidth) blit(m.el, m.el.videoWidth, m.el.videoHeight, it, it.fit);
      } else if(CAPT.has(it.type)){
        const c = streams[it.id]; if(c && c.stream && c.video.videoWidth){
          if(it.type === 'cam' && it.shape && it.shape !== 'rect'){ rr(it.x, it.y, it.w, it.h, it.shape === 'circle' ? 1e5 : Math.min(it.w, it.h) * 0.14); ctx.clip(); }
          if(it.mirror){ ctx.translate(it.x * 2 + it.w, 0); ctx.scale(-1, 1); }
          blit(c.video, c.video.videoWidth, c.video.videoHeight, it, it.fit || 'cover');
        }
      }
    }catch(e){}
    ctx.restore();
  }
}
function blit(src, sw, sh, it, fit){
  if(fit === 'stretch'){ ctx.drawImage(src, it.x, it.y, it.w, it.h); return; }
  const k = fit === 'cover' ? Math.max(it.w / sw, it.h / sh) : Math.min(it.w / sw, it.h / sh), dw = sw * k, dh = sh * k;
  ctx.beginPath(); ctx.rect(it.x, it.y, it.w, it.h); ctx.clip();
  ctx.drawImage(src, it.x + (it.w - dw) / 2, it.y + (it.h - dh) / 2, dw, dh);
}
/* ================= Scene transitions (تظهر في المعاينة وفي البث لأنها تُرسم على نفس الكانفس) ================= */
const TRS = ['none', 'fade', 'slide', 'push', 'zoom', 'wipe', 'dip'];
let trCfg = { type:LS.get('se_tr', 'fade'), dur:parseInt(LS.get('se_trdur', '500'), 10) };
if(!TRS.includes(trCfg.type)) trCfg.type = 'fade'; if(!(trCfg.dur >= 100 && trCfg.dur <= 3000)) trCfg.dur = 500;
const snapCv = document.createElement('canvas'), nxtCv = document.createElement('canvas');
snapCv.width = nxtCv.width = CW; snapCv.height = nxtCv.height = CH;
const snapCtx = snapCv.getContext('2d'), nxtCtx = nxtCv.getContext('2d');
let trans = null;
function startTransition(dir){
  if(trCfg.type === 'none' || !trCfg.dur) return;
  try{ snapCtx.drawImage(cv, 0, 0); }catch(e){ return; } // آخر إطار من المشهد القديم
  trans = { t0:performance.now(), dur:trCfg.dur, type:trCfg.type, dir:dir || 1 };
}
function renderFrame(){
  drawScene();
  if(!trans) return;
  const W = cv.width, H = cv.height, p = clamp((performance.now() - trans.t0) / trans.dur, 0, 1);
  const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, d = trans.dir;
  try{ nxtCtx.drawImage(cv, 0, 0); }catch(err){ trans = null; return; } // إطار المشهد الجديد
  ctx.save(); ctx.globalAlpha = 1;
  switch(trans.type){
    case 'fade': ctx.drawImage(snapCv, 0, 0); ctx.globalAlpha = e; ctx.drawImage(nxtCv, 0, 0); break;
    case 'slide': ctx.drawImage(snapCv, 0, 0); ctx.drawImage(nxtCv, (1 - e) * W * d, 0); break;
    case 'push': ctx.drawImage(snapCv, -e * W * d, 0); ctx.drawImage(nxtCv, (1 - e) * W * d, 0); break;
    case 'zoom': { ctx.drawImage(snapCv, 0, 0); ctx.globalAlpha = e; const k = 1.3 - .3 * e; ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.drawImage(nxtCv, -W / 2, -H / 2); break; }
    case 'wipe': ctx.drawImage(snapCv, 0, 0); ctx.beginPath(); if(d > 0) ctx.rect(0, 0, W * e, H); else ctx.rect(W * (1 - e), 0, W * e, H); ctx.clip(); ctx.drawImage(nxtCv, 0, 0); break;
    case 'dip': if(p < .5){ ctx.drawImage(snapCv, 0, 0); ctx.globalAlpha = p * 2; } else { ctx.drawImage(nxtCv, 0, 0); ctx.globalAlpha = (1 - p) * 2; } ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); break;
    default: break;
  }
  ctx.restore();
  if(p >= 1) trans = null;
}
/* حلقة الرسم: 33ms عادي (30fps) وتتسارع لـ ~16ms عند بث 60fps. outHook = رسم القماش الناتج بدقة البث (720p→4K) بعد كل إطار */
let frameMs = 33, outHook = null;
(function loop(){ const t0 = performance.now(); try{ renderFrame(); if(outHook) outHook(); }catch(e){} setTimeout(loop, Math.max(1, frameMs - (performance.now() - t0))); })();
setInterval(() => { $('fps').textContent = frames + ' fps'; frames = 0; }, 1000);
/* مؤشر التأخير (من main.js كل ثانية أثناء البث) */
function setDelay(p){
  const v = p && p.sec != null ? p.sec.toFixed(1) + ' s' : '—';
  $('delayV').textContent = v;
  $('delay').title = t('delayTip') + (p && p.rtt != null ? ' · RTT ' + p.rtt + ' ms' : '');
}
api.onDelay(setDelay);

/* ================= Audio engine (mixer) =================
   كل صوت وفيديو في المشهد الحالي يمر على الخلاط ← يروح للبث + السماعات.
   الصوت المربوط بعنصر: يشتغل مع ظهور العنصر ويتوقف مع إخفائه. */
let mixer = null, monitorOn = LS.get('se_monitor', '1') === '1', masterVol = parseInt(LS.get('se_master', '100'), 10);
if(!(masterVol >= 0 && masterVol <= 100)) masterVol = 100;
let lmaster = parseInt(LS.get('se_lmaster', '100'), 10); if(!(lmaster >= 0 && lmaster <= 100)) lmaster = 100;
const LEG_M = masterVol, LEG_L = lmaster; // قيم قديمة تُستخدم للمشاهد التي لم تحفظ مستوى رئيسي بعد
let routeApps = LS.get('se_routeapps', '1') === '1';
function rampG(p, v){ try{ p.cancelScheduledValues(0); p.setTargetAtTime(v, mixer ? mixer.ctx.currentTime : 0, 0.04); }catch(e){ try{ p.value = v; }catch(e2){} } }
function loadSceneMaster(){ // الصوت الرئيسي (البث + أنا) محفوظ لكل مشهد
  const sc = cur(); if(!sc) return;
  masterVol = sc.mv == null ? LEG_M : sc.mv; lmaster = sc.lmv == null ? LEG_L : sc.lmv;
  if(mixer){ rampG(mixer.master.gain, masterVol / 100); rampG(mixer.live.gain, masterVol / 100); rampG(mixer.lm.gain, lmaster / 100); }
}
function getMixer(){
  if(mixer) return mixer;
  const c = new AudioContext({ sampleRate:48000, latencyHint:'interactive' }), master = c.createGain(), dest = c.createMediaStreamDestination(), mon = c.createGain(), lm = c.createGain(), an = c.createAnalyser(), lan = c.createAnalyser(), live = c.createGain();
  an.fftSize = 512; lan.fftSize = 512; master.gain.value = masterVol / 100; live.gain.value = masterVol / 100; lm.gain.value = lmaster / 100;
  master.connect(dest); master.connect(an); // مسار البث فقط
  mon.connect(lm); lm.connect(c.destination); lm.connect(lan); mon.gain.value = monitorOn ? 1 : 0; // مسار سماعاتي: لكل مصدر مستوى خاص ولا يؤثر على البث
  live.connect(dest); live.connect(an); // مصادر الصوت المباشر (مايك/سطح المكتب/موقع) للبث
  return (mixer = { ctx:c, master, dest, mon, lm, an, lan, live });
}
document.addEventListener('pointerdown', () => { if(mixer && mixer.ctx.state === 'suspended') mixer.ctx.resume(); }, true);

const parentOf = (it, sc) => it.type === 'audio' && it.link ? (sc || cur()).items.find(x => x.id === it.link && x.type !== 'audio') : null;
const childrenOf = (it, sc) => (sc || cur()).items.filter(x => x.type === 'audio' && x.link === it.id);
const trial = {}; // تجربة عندي فقط (لا تصل للبث)
function wantPlay(it, sc, real){
  if(sc !== cur()) return false;
  if(trial[it.id] && !real) return true;
  if(!it.visible) return false;
  if(it.type === 'video') return true;
  const p = parentOf(it, sc); return p ? p.visible : !!playing[it.id];
}
const lvolOf = it => it.lvol == null ? (it.type === 'mic' ? 0 : 100) : it.lvol;
const localGain = it => it.lmuted ? 0 : clamp(lvolOf(it) / 100, 0, 1);
function applyVol(it){
  const sv = clamp((it.vol == null ? 100 : it.vol) / 100, 0, 2), off = it.muted || trial[it.id];
  const m = mediaR[it.id]; if(m){ rampG(m.g.gain, off ? 0 : Math.min(sv, 1)); rampG(m.lg.gain, localGain(it)); }
  const l = liveR[it.id]; if(l){ rampG(l.g.gain, off || (testing[it.id] && !it.visible) ? 0 : sv); if(l.lg) rampG(l.lg.gain, testing[it.id] ? 0 : localGain(it)); }
}
function ensureMedia(it){
  if(media[it.id]) return media[it.id];
  return (media[it.id] = (async () => {
    const b = await idbGet(it.assetId); if(!b){ delete media[it.id]; return null; }
    const m = getMixer(), el = it.type === 'video' ? document.createElement('video') : new Audio();
    el.preload = 'auto'; el.src = URL.createObjectURL(b); el.loop = !!it.loop; if(it.type === 'video') el.playsInline = true;
    const src = m.ctx.createMediaElementSource(el), g = m.ctx.createGain(), an = m.ctx.createAnalyser(), lg = m.ctx.createGain(), lan = m.ctx.createAnalyser(); an.fftSize = 512; lan.fftSize = 512;
    src.connect(g); g.connect(m.master); g.connect(an); // البث
    src.connect(lg); lg.connect(m.mon); lg.connect(lan); // سماعاتي
    ['play', 'pause'].forEach(ev => el.addEventListener(ev, () => renderMixerSoon()));
    el.addEventListener('ended', () => onEnded(it));
    g.gain.value = 0; lg.gain.value = 0; // يبدأ من الصفر ثم يرتفع بنعومة إلى مستوى هذا المشهد
    const r = { el, g, an, lg, lan, src }; mediaR[it.id] = r; applyVol(it); return r;
  })());
}
function onEnded(it){
  if(trial[it.id]){ delete trial[it.id]; applyVol(it); refreshGear(); }
  if(it.type === 'video' && it.hideEnd && !it.loop) setVisible(it, false);
  else if(it.type === 'audio' && !parentOf(it)) playing[it.id] = false;
  renderMixerSoon();
}
let _rc = false, _rcAgain = false;
async function reconcile(){
  if(_rc){ _rcAgain = true; return; } _rc = true;
  try{ do{ _rcAgain = false; await reconcileOnce(); }while(_rcAgain); } finally { _rc = false; }
}
async function reconcileOnce(){
  for(const sc of S.scenes){
    for(const it of sc.items){
      if(it.type !== 'audio' && it.type !== 'video') continue;
      const want = wantPlay(it, sc), was = !!prevWant[it.id]; prevWant[it.id] = want;
      if(!want){
        const m = mediaR[it.id];
        if(m){ if(!m.el.paused) m.el.pause(); if(sc !== cur()){ try{ m.el.currentTime = 0; }catch(e){} } }
        continue;
      }
      const m = await ensureMedia(it); if(!m) continue;
      applyVol(it); m.el.loop = !!it.loop;
      if(!was && (it.type === 'video' || parentOf(it, sc) || m.el.ended)){ try{ m.el.currentTime = 0; }catch(e){} }
      if(m.el.paused && !m.el.ended){ try{ await m.el.play(); }catch(e){} }
    }
  }
  renderMixerSoon();
}
function dropMedia(it){
  delete playing[it.id]; delete prevWant[it.id]; delete trial[it.id];
  const p = media[it.id]; delete media[it.id]; delete mediaR[it.id];
  if(p) p.then(r => { if(!r) return; r.el.pause(); try{ r.src.disconnect(); r.g.disconnect(); r.an.disconnect(); r.lg.disconnect(); r.lan.disconnect(); }catch(e){} URL.revokeObjectURL(r.el.src); });
}
async function gcAssets(){
  try{
    const used = histUsedAssets(); S.scenes.forEach(s => s.items.forEach(i => i.assetId && used.add(i.assetId)));
    for(const k of await idbKeys()){ if(!used.has(k)){ await idbDel(k); if(imgs[k]){ URL.revokeObjectURL(imgs[k].src); delete imgs[k]; } } }
  }catch(e){}
}

/* ================= Live audio sources: mic / desktop audio / site audio =================
   كل مصدر يلتقط الصوت ويمرره على الخلاط (live bus) فيصل للبث. التجربة تفتح الالتقاط مؤقتاً وتعرض المؤشر. */
const liveKey = it => it.type === 'mic' ? `mic:${it.deviceId || ''}:${+!!it.echo}${+!!it.noise}${+!!it.agc}` : it.type === 'deskaudio' ? 'desk' : `site:${it.url || ''}`;
function dropVideoTracks(st){ st.getVideoTracks().forEach(x => { x.stop(); st.removeTrack(x); }); return st; }
async function openLive(it){
  if(it.type === 'mic'){
    const a = { echoCancellation:!!it.echo, noiseSuppression:!!it.noise, autoGainControl:!!it.agc };
    if(it.deviceId) a.deviceId = { exact:it.deviceId };
    try{ return await navigator.mediaDevices.getUserMedia({ audio:a, video:false }); }
    catch(e){ if(!it.deviceId) throw e; delete a.deviceId; return await navigator.mediaDevices.getUserMedia({ audio:a, video:false }); } // الجهاز المحدد غير متوفر: الافتراضي
  }
  if(it.type === 'deskaudio'){
    let st = null;
    try{ st = await navigator.mediaDevices.getDisplayMedia({ video:true, audio:{ suppressLocalAudioPlayback:true } }); }catch(e){ st = null; }
    if(!st || !st.getAudioTracks().length){
      if(st) st.getTracks().forEach(x => x.stop());
      st = await navigator.mediaDevices.getUserMedia({ audio:{ mandatory:{ chromeMediaSource:'desktop' } }, video:{ mandatory:{ chromeMediaSource:'desktop' } } });
    }
    dropVideoTracks(st); if(!st.getAudioTracks().length) throw new Error('no audio track'); return st;
  }
  const r = await api.siteOpen({ url:it.url }); if(!r || !r.ok) throw new Error((r && r.error) || 'site');
  const c = { chromeMediaSource:'tab', chromeMediaSourceId:r.mediaId };
  const st = await navigator.mediaDevices.getUserMedia({ audio:{ mandatory:c }, video:{ mandatory:c } });
  dropVideoTracks(st); if(!st.getAudioTracks().length) throw new Error('no audio track'); return st;
}
function dropLiveCap(key){
  const e = liveCaps[key]; if(!e) return; delete liveCaps[key];
  if(e.stream) e.stream.getTracks().forEach(x => x.stop());
  if(e.src) try{ e.src.disconnect(); }catch(err){}
  if(key.startsWith('site:')){ try{ api.siteMute({ url:key.slice(5), muted:false }); }catch(err){} } // بدون التقاط: النافذة تشتغل بصوتها الطبيعي
}
function ensureLiveCap(key, it){
  if(liveCaps[key]) return liveCaps[key].p;
  const e = { stream:null, src:null, p:null }; liveCaps[key] = e;
  e.p = (async () => {
    try{
      const st = await openLive(it);
      if(liveCaps[key] !== e){ st.getTracks().forEach(x => x.stop()); return null; }
      e.stream = st; e.src = getMixer().ctx.createMediaStreamSource(st);
      st.getAudioTracks().forEach(tr => tr.addEventListener('ended', () => { if(liveCaps[key] === e){ dropLiveCap(key); Object.keys(liveR).forEach(id => { if(liveR[id].key === key) teardownLive(id); }); renderMixerSoon(); } }));
      return e;
    }catch(err){ if(liveCaps[key] === e) delete liveCaps[key]; throw err; }
  })();
  return e.p;
}
function teardownLive(id){
  const r = liveR[id]; if(!r) return; delete liveR[id];
  try{ r.g.disconnect(); r.an.disconnect(); r.mg.disconnect(); r.tan.disconnect(); if(r.lg){ r.lg.disconnect(); r.lan.disconnect(); } }catch(e){}
}
const monGate = () => monitorOn && !Object.values(liveR).some(r => r.key === 'desk');
function applyMon(){ if(!mixer) return; mixer.mon.gain.value = monGate() ? 1 : 0; }
async function loadMics(){
  try{ const d = await navigator.mediaDevices.enumerateDevices(); micDevices = d.filter(x => x.kind === 'audioinput' && x.deviceId !== 'default' && x.deviceId !== 'communications'); }catch(e){}
  const it = selItem(); if(it && it.type === 'mic' && $('drawer').classList.contains('open') && !document.activeElement.matches('#tabProps input,#tabProps select')) renderProps();
}
if(navigator.mediaDevices) navigator.mediaDevices.addEventListener('devicechange', loadMics);
let _sl = false, _slAgain = false;
async function syncLive(){
  if(_sl){ _slAgain = true; return; } _sl = true;
  try{ do{ _slAgain = false; await syncLiveOnce(); }while(_slAgain); } finally { _sl = false; }
}
async function syncLiveOnce(){
  const sc = cur(), want = new Map();
  sc.items.forEach(it => { if(LIVE.has(it.type) && (it.visible || testing[it.id])) want.set(it.id, it); });
  Object.keys(testing).forEach(id => { if(!sc.items.some(x => x.id === id)){ delete testing[id]; delete testHit[id]; } });
  for(const id of Object.keys(liveR)){ const it = want.get(id); if(!it || liveR[id].key !== liveKey(it)) teardownLive(id); }
  for(const [id, it] of want){
    if(liveR[id] || liveFail.has(id)) continue;
    const key = liveKey(it);
    try{
      const m = getMixer(); if(m.ctx.state === 'suspended') m.ctx.resume();
      const cap = await ensureLiveCap(key, it); if(!cap) continue;
      const still = cur().items.find(x => x.id === id); if(!still || !(still.visible || testing[id]) || liveKey(still) !== key) continue;
      const g = m.ctx.createGain(), an = m.ctx.createAnalyser(), mg = m.ctx.createGain(), tan = m.ctx.createAnalyser(); an.fftSize = 512; tan.fftSize = 512; mg.gain.value = 0; g.gain.value = 0;
      cap.src.connect(g); g.connect(m.live); g.connect(an);
      cap.src.connect(mg); mg.connect(tan);   // مسار التجربة: صوت المايك الخام مباشرة (مستقل عن الكتم/المستوى) ولا يوصَّل بالسماعات إلا أثناء التجربة (applyTestRoute)
      let lg = null, lan = null;
      if(it.type === 'mic' || (it.type === 'siteaudio' && routeApps)){ lg = m.ctx.createGain(); lg.gain.value = 0; lan = m.ctx.createAnalyser(); lan.fftSize = 512; cap.src.connect(lg); lg.connect(m.mon); lg.connect(lan); } // سماع المايك / التطبيق في سماعتي
      liveR[id] = { g, an, mg, tan, lg, lan, key, tOn:false }; applyVol(it); applyTestRoute(id);
      if(it.type === 'siteaudio'){ try{ api.siteMute({ url:it.url, muted:routeApps }); }catch(e){} } // نكتم النافذة محلياً لأن صوتها يرجع من الخلاط
      if(it.type === 'mic') loadMics();
    }catch(err){
      liveFail.add(id); delete testing[id];
      toast('❌ ' + t('liveFail') + ' — ' + (it.name || t(it.type)) + (err && err.message ? ' (' + err.message + ')' : ''), 6000);
      renderProps();
    }
  }
  const used = new Set(Object.values(liveR).map(r => r.key));
  Object.keys(liveCaps).forEach(k => { if(!used.has(k)) dropLiveCap(k); });
  for(const id of Object.keys(liveR)){ const it = sc.items.find(x => x.id === id); applyTestRoute(id); if(it) applyVol(it); }
  applyMon(); renderMixerSoon();
}
/* ---- تجربة الصوت ----
   تشغيل: تسمع صوتك مباشرة في سماعاتك (بدون أي تأثير على البث إذا العنصر مخفي).
   إيقاف: القطع فوري ومتزامن (نفصل مسار السماعات في نفس اللحظة ولا ننتظر فتح/إغلاق الالتقاط).
   وتتوقف التجربة تلقائياً عند: إغلاق نافذة الصوت، تغيير المشهد، فتح الإعدادات، تجربة مصدر ثاني، أو بعد 60 ثانية (حتى لا يبقى صوتك شغّال بدون ما تنتبه). */
const testTimers = {};
function applyTestRoute(id){
  const r = liveR[id]; if(!r || !mixer) return;
  const it = cur().items.find(x => x.id === id), on = !!(it && it.type === 'mic' && testing[id]);
  if(on === !!r.tOn) return; r.tOn = on;
  try{ r.mg.gain.cancelScheduledValues(0); r.mg.gain.value = on ? 1 : 0; }catch(e){}
  try{ if(on) r.mg.connect(mixer.ctx.destination); else r.mg.disconnect(mixer.ctx.destination); }catch(e){}
}
function endTest(id){
  clearTimeout(testTimers[id]); delete testTimers[id]; delete testing[id]; delete testHit[id];
  applyTestRoute(id);
  const it = cur().items.find(x => x.id === id); if(it) applyVol(it);
}
function stopAllTests(){
  const ids = Object.keys(testing); if(!ids.length) return;
  ids.forEach(endTest); syncLive(); renderMixer(); renderProps();
}
function toggleTest(it){
  if(testing[it.id]){ endTest(it.id); }
  else {
    stopAllTests();   // تجربة واحدة بنفس الوقت (تجنّب الصدى بين مايكين)
    testing[it.id] = true; delete testHit[it.id]; liveFail.delete(it.id); applyTestRoute(it.id);
    testTimers[it.id] = setTimeout(() => { if(testing[it.id]){ endTest(it.id); syncLive(); renderMixer(); renderProps(); toast(t('testAutoStop'), 3500); } }, 60000);
  }
  syncLive(); renderMixer(); renderProps();
}
const testText = id => { if(!testing[id]) return ''; const it = cur().items.find(x => x.id === id); return t(testHit[id] ? (it && it.type === 'mic' ? 'testOkMic' : 'testOk') : (it && it.type === 'mic' ? 'testListenMic' : 'testListening')); };
function pruneSites(){
  const urls = []; S.scenes.forEach(sc => sc.items.forEach(i => { if(i.type === 'siteaudio' && i.url) urls.push(i.url); }));
  try{ api.siteClean(urls); }catch(e){}
}
function normUrl(v){ v = String(v || '').trim(); if(!v) return ''; if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = 'https://' + v; try{ const u = new URL(v); return /^https?:$/.test(u.protocol) ? u.toString() : ''; }catch(e){ return ''; } }
if(window.api && api.onSiteClosed) api.onSiteClosed(url => {
  S.scenes.forEach(sc => sc.items.forEach(i => { if(i.type === 'siteaudio' && i.url === url){ dropLiveCap('site:' + url); teardownLive(i.id); liveFail.add(i.id); } }));
  toast(t('siteClosed')); renderMixerSoon(); renderProps();
});

/* ================= Scene actions ================= */
function clearHide(id){ if(hideTimers[id]){ clearTimeout(hideTimers[id]); delete hideTimers[id]; } }
function enterScene(sc){
  sc.items.forEach(i => { if(i.type === 'audio' && !parentOf(i, sc)) playing[i.id] = !!i.auto; });
  syncCaps(); reconcile();
}
function switchScene(id){
  if(id === S.current || !S.scenes.some(s => s.id === id)) return;
  stopAllTests(); const old = cur(); old.items.forEach(i => { playing[i.id] = false; clearHide(i.id); delete testing[i.id]; delete testHit[i.id]; delete trial[i.id]; });
  startTransition(S.scenes.findIndex(x => x.id === id) > S.scenes.indexOf(old) ? 1 : -1);
  S.current = id; sel = null; loadSceneMaster(); enterScene(cur()); renderAll(); persist();
}
function createScene(name){
  const sc = mkScene(name), prev = cur(); sc.mv = masterVol; sc.lmv = lmaster;
  if(prev) prev.items.filter(i => LIVE.has(i.type)).forEach(i => { const c = mkItem(i.type, JSON.parse(JSON.stringify(i))); c.id = uid(); sc.items.push(c); }); // المايك وصوت الجهاز يكملوا بالمشهد الجديد
  S.scenes.push(sc); switchScene(sc.id); persist();
}
function dupScene(){
  const src = cur(), sc = JSON.parse(JSON.stringify(src)), map = {}; sc.id = uid(); sc.name = `${src.name} (${t('copyOf')})`;
  sc.items.forEach(i => { const n = uid(); map[i.id] = n; i.id = n; });
  sc.items.forEach(i => { if(i.link) i.link = map[i.link] || null; });
  S.scenes.splice(S.scenes.indexOf(src) + 1, 0, sc); switchScene(sc.id); persist();
}
function delScene(){
  if(S.scenes.length < 2){ toast(t('lastScene')); return; }
  const sc = cur();
  dlg({ title:t('delScene'), body:`<p class="note" style="font-size:14px">${esc(t('confirmDelScene', { n:sc.name }))}</p>`,
    actions:[{ label:t('cancel') }, { label:t('del'), kind:'danger', cb:() => {
      const i = S.scenes.indexOf(sc); sc.items.forEach(it => { stopCap(it.id); dropMedia(it); clearHide(it.id); });
      S.scenes.splice(i, 1); S.current = S.scenes[Math.min(i, S.scenes.length - 1)].id; sel = null;
      loadSceneMaster(); enterScene(cur()); renderAll(); persist(); gcAssets(); pruneSites();
    } }] });
}
function moveScene(d){ const a = S.scenes, i = a.indexOf(cur()), j = i + d; if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; renderScenes(); persist(); }
function askName(title, val, okLabel, cb, label){
  dlg({ title, body:`<label class="lbl">${t(label || 'sceneName')}</label><input type="text" id="dlgIn" maxlength="40" value="${esc(val)}" spellcheck="false">`,
    actions:[{ label:t('cancel') }, { label:okLabel, kind:'primary', cb:() => { const v = $('dlgIn').value.trim(); if(!v){ $('dlgIn').focus(); return false; } cb(v); } }],
    onOpen:() => { const i = $('dlgIn'); i.focus(); i.select(); i.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); $('dlgA').querySelector('.primary').click(); } }; } });
}

/* ---- sources ---- */
function addItem(type, o){
  const it = mkItem(type, o); it.name = it.name || `${t(type)} ${cur().items.filter(x => x.type === type).length + 1}`;
  if(!noVisual(it) && !('x' in (o || {}))){ it.x = Math.round((CW - it.w) / 2); it.y = Math.round((CH - it.h) / 2); }
  cur().items.push(it); sel = it.id;
  if(type === 'audio') playing[it.id] = true;
  syncCaps(); reconcile(); renderSources(); renderProps(); renderMixer(); updateSel(); persist();
  return it;
}
function removeItem(id){
  const sc = cur(), i = sc.items.findIndex(x => x.id === id); if(i < 0) return;
  const it = sc.items[i]; stopCap(id); clearHide(id); dropMedia(it);
  sc.items.forEach(x => { if(x.link === id){ x.link = null; playing[x.id] = false; } });
  sc.items.splice(i, 1); if(sel === id) sel = null; endTest(id); liveFail.delete(id);
  syncLive(); pruneSites(); reconcile(); renderSources(); renderProps(); renderMixer(); updateSel(); persist(); gcAssets();
}
function moveLayer(id, d){
  const a = cur().items, i = a.findIndex(x => x.id === id); if(i < 0) return;
  let j = i + d; while(j >= 0 && j < a.length && noVisual(a[j])) j += d;
  if(j < 0 || j >= a.length) return;
  const [x] = a.splice(i, 1); a.splice(j, 0, x); renderSources(); persist();
}
function moveLayerEdge(id, front){
  const a = cur().items, i = a.findIndex(x => x.id === id); if(i < 0) return;
  const [x] = a.splice(i, 1); if(front) a.push(x); else a.unshift(x); renderSources(); persist();
}
function dupItem(id){
  const sc = cur(), src = sc.items.find(x => x.id === id); if(!src) return;
  const c = mkItem(src.type, JSON.parse(JSON.stringify(src))); c.id = uid(); c.name = `${src.name} (${t('copyOf')})`;
  if(!noVisual(c)){ c.x = clamp(c.x + 30, 0, CW - 40); c.y = clamp(c.y + 30, 0, CH - 40); }
  sc.items.splice(sc.items.indexOf(src) + 1, 0, c); sel = c.id; playing[c.id] = false;
  syncCaps(); reconcile(); renderSources(); renderProps(); renderMixer(); updateSel(); persist();
}
function renameItem(id){
  const it = cur().items.find(x => x.id === id); if(!it) return;
  askName(t('renameSource'), it.name, t('save'), v => { it.name = v; renderSources(); renderMixerSoon(); renderProps(); persist(); }, 'sourceName');
}
function confirmRemoveItem(id){
  const it = cur().items.find(x => x.id === id); if(!it) return;
  dlg({ title:t('delSource'), body:`<p class="note" style="font-size:14px">${esc(t('confirmDelItem', { n:it.name }))}</p>`,
    actions:[{ label:t('cancel') }, { label:t('del'), kind:'danger', cb:() => removeItem(id) }] });
}
function select(id){
  if(sel === id) return; sel = id;
  document.querySelectorAll('#srcList .src').forEach(r => r.classList.toggle('on', r.dataset.id === id)); // بدون إعادة رسم عشان الدبل-كليك يشتغل
  renderProps(); updateSel();
}
function setVisible(it, v){
  it.visible = !!v; clearHide(it.id); capFailed.delete(it.id);
  if(it.visible && it.dur > 0) hideTimers[it.id] = setTimeout(() => { delete hideTimers[it.id]; setVisible(it, false); }, it.dur * 1000);
  syncCaps(); reconcile(); renderSources(); renderMixer(); persist();
}
function linkTo(a, pid){
  const sc = cur(), p = pid ? sc.items.find(x => x.id === pid && x.type !== 'audio') : null;
  a.link = p ? p.id : null; playing[a.id] = false;
  if(p){ if(p.visible) setVisible(p, false); toast(t('linkedToast'), 4800); } else if(pid === null) toast(t('unlinkedToast'));
  reconcile(); renderSources(); renderMixer(); renderProps(); persist();
}
function fitItem(it){
  if(RATIO.has(it.type)){ const k = Math.min(CW / it.w, CH / it.h); it.w = Math.round(it.w * k); it.h = Math.round(it.h * k); }
  else { it.w = CW; it.h = CH; }
  it.x = Math.round((CW - it.w) / 2); it.y = Math.round((CH - it.h) / 2);
}

/* ================= Rendering UI ================= */
function renderScenes(){
  if(cur()) $('pvScene').textContent = cur().name;
  $('sceneList').innerHTML = S.scenes.map((sc, i) => `<div class="scene ${sc.id === S.current ? 'on' : ''}" data-id="${sc.id}"><span class="thumb" style="background:linear-gradient(135deg,${esc(sc.bg[0])},${esc(sc.bg[1])})"></span><span class="nm">${esc(sc.name)}</span>${i < 9 ? `<kbd>${i + 1}</kbd>` : ''}</div>`).join('');
}
function srcRow(it, nested){
  const sc = cur(), kids = !nested && childrenOf(it, sc).length > 0, audio = it.type === 'audio', nv = noVisual(it);
  return `<div class="src ${it.id === sel ? 'on' : ''} ${it.visible ? '' : 'off'} ${nested ? 'nested' : ''} ${audio ? 'is-audio' : ''}" data-id="${it.id}" ${audio ? 'draggable="true"' : ''}>
    ${nested ? `<span class="lnk">${ic('link', 13)}</span>` : ''}<span class="ico">${ic(ICON_OF[it.type], 16)}</span><span class="nm">${esc(it.name)}</span>
    ${kids ? `<button class="icon-btn trig ${it.visible ? 'on' : ''}" data-a="vis" title="${t(it.visible ? 'hideAndStop' : 'showWithSound')}">${ic(it.visible ? 'stop' : 'play', 13)}</button>` : ''}
    <button class="icon-btn" data-a="vis" title="${t(it.visible ? 'hide' : 'show')}">${ic(it.visible ? 'eye' : 'eyeoff')}</button>
    ${nv ? '' : `<button class="icon-btn ${it.locked ? 'on' : ''}" data-a="lock" title="${t(it.locked ? 'unlock' : 'lock')}">${ic(it.locked ? 'lock' : 'unlock')}</button>`}</div>`;
}
function renderSources(){
  const sc = cur(), rows = [];
  sc.items.slice().reverse().forEach(it => {
    if(it.type === 'audio' && parentOf(it, sc)) return;
    rows.push(srcRow(it, false));
    if(it.type !== 'audio') childrenOf(it, sc).forEach(k => rows.push(srcRow(k, true)));
  });
  $('srcList').innerHTML = rows.length ? rows.join('') : `<div class="empty">${esc(t('noItems'))}</div>`;
}
const num = (k, l, v) => `<label class="f"><span>${t(l)}</span><input type="number" data-k="${k}" value="${Math.round(v)}"></label>`;
const rng = (k, l, v, a, b) => `<label class="f full"><span>${t(l)}</span><div class="rg"><input type="range" data-k="${k}" min="${a}" max="${b}" value="${v}"><output>${Math.round(v)}</output></div></label>`;
const col = (k, l, v) => `<label class="f"><span>${t(l)}</span><input type="color" data-k="${k}" value="${esc(v)}"></label>`;
const selOpt = (k, l, v, o, raw) => `<label class="f"><span>${t(l)}</span><select data-k="${k}">${o.map(([a, b]) => `<option value="${esc(a)}" ${String(v) === String(a) ? 'selected' : ''}>${raw ? esc(b) : t(b)}</option>`).join('')}</select></label>`;
const chk = (k, l, v) => `<label class="chk"><input type="checkbox" data-k="${k}" ${v ? 'checked' : ''}> <span>${t(l)}</span></label>`;
const PRESETS = [['#0a0305','#4a0814'],['#12050a','#7a0f24'],['#1a0507','#a31224'],['#0b1020','#1b3a8a'],['#0d0a1f','#4b1d8f'],['#06140d','#0f5a30'],['#101114','#2a2d35'],['#ff512f','#dd2476']];
const FONTS = ['Segoe UI', 'Arial', 'Tahoma', 'Verdana', 'Impact', 'Georgia', 'Times New Roman', 'Courier New', 'Consolas'];
function renderProps(){
  const it = selItem(), sc = cur(), el = $('tabProps');
  $('drawerTitle').textContent = it ? (it.name || t(it.type)) : t('sceneProps');
  if(!it){
    el.innerHTML = `<div class="sub">${t('sceneProps')}</div>
      <label class="f"><span>${t('name')}</span><input type="text" data-s="name" value="${esc(sc.name)}"></label>
      <div class="sub">${t('background')}</div>
      <div class="grid2"><label class="f"><span>${t('color1')}</span><input type="color" data-s="bg0" value="${esc(sc.bg[0])}"></label><label class="f"><span>${t('color2')}</span><input type="color" data-s="bg1" value="${esc(sc.bg[1])}"></label></div>
      <div class="sub">${t('presets')}</div>
      <div class="presets">${PRESETS.map((p, i) => `<button data-preset="${i}" style="background:linear-gradient(135deg,${p[0]},${p[1]})"></button>`).join('')}</div>
      <div class="btn-row"><button class="sbtn" data-act="dupScene">${ic('copy')}${t('dupScene')}</button><button class="sbtn danger" data-act="delScene">${ic('trash')}${t('del')}</button></div>`;
    return;
  }
  let h = `<div class="sub">${t('itemOpts')}</div><label class="f"><span>${t('name')}</span><input type="text" data-k="name" value="${esc(it.name)}"></label>`;
  if(it.type === 'text') h += `<label class="f full" style="margin-top:8px"><span>${t('content')}</span><textarea data-k="text" rows="3">${esc(it.text)}</textarea></label>
    <div class="grid2" style="margin-top:8px">${selOpt('family', 'font', it.family, FONTS.map(f => [f, f]), true)}${num('size', 'size', it.size)}${selOpt('weight', 'weight', it.weight, [[400, 'regular'], [600, 'semibold'], [800, 'bold']])}${selOpt('align', 'align', it.align, [['left', 'left'], ['center', 'center'], ['right', 'right']])}${col('color', 'color', it.color)}${num('stroke', 'stroke', it.stroke)}${col('strokeColor', 'strokeColor', it.strokeColor)}</div>
    ${chk('glow', 'glow', it.glow)}<div class="grid2" style="margin-top:8px">${col('glowColor', 'glowColor', it.glowColor)}</div>`;
  if(it.type === 'rect') h += `<div class="grid2" style="margin-top:8px">${col('fill', 'fill', it.fill)}${num('radius', 'radius', it.radius)}</div>`;
  if(['image', 'video', 'screen', 'window'].includes(it.type)) h += `<div class="grid2" style="margin-top:8px">${selOpt('fit', 'fit', it.fit, [['contain', 'contain'], ['cover', 'cover'], ['stretch', 'stretch']])}</div>`;
  if(it.type === 'cam'){
    const opts = [['', t('camDefault')]].concat(camDevices.map(d => [d.deviceId, d.label || t('cam')]));
    if(it.deviceId && !opts.some(o => o[0] === it.deviceId)) opts.push([it.deviceId, it.deviceName || it.deviceId]);
    h += `<div class="grid2" style="margin-top:8px">${selOpt('deviceId', 'camDevice', it.deviceId || '', opts, true).replace('<label class="f">', '<label class="f full">')}${selOpt('fit', 'fit', it.fit, [['cover', 'cover'], ['contain', 'contain'], ['stretch', 'stretch']])}${selOpt('shape', 'camShape', it.shape || 'rect', [['rect', 'shapeRect'], ['round', 'shapeRound'], ['circle', 'shapeCircle']])}</div>${chk('mirror', 'mirror', it.mirror)}${chk('keep', 'keepRatio', it.keep !== false)}<div class="btn-row" style="margin-top:10px"><button class="sbtn" data-act="changeSrc">${ic('camera')}${t('camCheckBtn')}</button></div><div class="note">${t('camNote')}</div>`;
  }
  if(it.type === 'screen' || it.type === 'window') h += `<div class="btn-row" style="margin-top:10px"><button class="sbtn" data-act="changeSrc">${ic(ICON_OF[it.type])}${t('changeSource')}</button></div>`;
  if(it.type === 'video' || it.type === 'audio'){
    h += `<div class="sub">${t('soundOpts')}</div><div class="grid2">${rng('vol', 'volume', it.vol, 0, 100)}</div>${chk('loop', 'loop', it.loop)}`;
    if(it.type === 'video') h += chk('hideEnd', 'hideEnd', it.hideEnd);
  }
  if(it.type === 'audio'){
    const parents = sc.items.filter(x => x.type !== 'audio' && x.id !== it.id);
    h += `<div class="grid2" style="margin-top:10px">${selOpt('link', 'linkTo', it.link || '', [['', t('noLink')]].concat(parents.map(p => [p.id, p.name])), true).replace('<label class="f">', '<label class="f full">')}</div>`;
    if(it.link) h += `<div class="note">${t('linkNote')}</div>`; else h += chk('auto', 'auto', it.auto);
  }
  if(LIVE.has(it.type)){
    h += `<div class="sub">${t('liveOpts')}</div>`;
    if(it.type === 'mic'){
      const opts = [['', t('defaultMic')]].concat(micDevices.map(d => [d.deviceId, d.label || 'Microphone']));
      if(it.deviceId && !opts.some(o => o[0] === it.deviceId)) opts.push([it.deviceId, it.deviceName || it.deviceId]);
      h += `<div class="grid2">${selOpt('deviceId', 'micDevice', it.deviceId || '', opts, true).replace('<label class="f">', '<label class="f full">')}</div>${chk('echo', 'micEcho', it.echo)}${chk('noise', 'micNoise', it.noise)}${chk('agc', 'micAgc', it.agc)}<div class="note">${t('micNote')}</div>`;
    } else if(it.type === 'deskaudio'){
      h += `<div class="note">${t('deskNote')}</div>`;
    } else {
      h += `<label class="f full"><span>${t('siteUrl')}</span><input type="url" class="ltr" data-k="url" value="${esc(it.url)}" placeholder="https://..." spellcheck="false"></label><div class="btn-row" style="margin-top:8px"><button class="sbtn" data-act="openSite">${ic('globe')}${t('openSite')}</button></div><div class="note">${t('siteNote')}</div>`;
    }
    h += `<div class="grid2" style="margin-top:10px">${rng('vol', 'volume', it.vol, 0, 200)}</div>
      <div class="testbox"><button class="sbtn ${testing[it.id] ? 'on' : ''}" data-act="test">${ic(testing[it.id] ? 'stop' : 'play')}${t(testing[it.id] ? 'testStop' : 'test')}</button><div class="meter big"><i data-m="${it.id}"></i></div></div><div class="tst" data-tst="${it.id}">${esc(testText(it.id))}</div>`;
  }
  if(!noVisual(it)){
    h += `<div class="sub">${t('layout')}</div><div class="grid2">${num('x', 'posX', it.x)}${num('y', 'posY', it.y)}${num('w', 'w', it.w)}${num('h', 'h', it.h)}${rng('opacity', 'opacity', it.opacity, 0, 100)}</div>
      <div class="btn-row"><button class="sbtn" data-act="fitScr">${ic('maximize')}${t('fitScreen')}</button><button class="sbtn" data-act="centerIt">${ic('center')}${t('centerIt')}</button></div>
      <div class="sub">${t('timing')}</div><div class="grid2">${num('dur', 'autoHide', it.dur || 0).replace('<label class="f">', '<label class="f full">')}</div>
      <div class="sub">${t('layer')}</div><div class="btn-row" style="margin-top:0"><button class="sbtn" data-act="fwd">${ic('up')}${t('forward')}</button><button class="sbtn" data-act="bwd">${ic('down')}${t('back')}</button></div>`;
  }
  h += `<div class="btn-row"><button class="sbtn danger" data-act="delItem">${ic('trash')}${t('del')}</button></div>`;
  el.innerHTML = h;
}
function syncGeom(){ const it = selItem(); if(!it) return; ['x', 'y', 'w', 'h'].forEach(k => { const e = $('tabProps').querySelector(`[data-k="${k}"]`); if(e && document.activeElement !== e) e.value = Math.round(it[k]); }); }

/* ---- mixer: كل مصدر له شريطان: البث (للمشاهدين) + أنا (سماعاتي فقط) ---- */
let _rm; const renderMixerSoon = () => { clearTimeout(_rm); _rm = setTimeout(renderMixer, 40); };
function mxBar(kind, id, v, max, muted, act){
  const s = kind === 's';
  return `<div class="mbar ${s ? '' : 'loc'}"><span class="mb-l" title="${esc(t(s ? 'streamBarFull' : 'localBarFull'))}">${ic(s ? 'radio' : 'headphones', 13)}<span>${t(s ? 'streamBar' : 'localBar')}</span></span><div class="mb-c"><div class="meter"><i ${s ? 'data-m' : 'data-ml'}="${id}"></i></div><input type="range" ${s ? 'data-mv' : 'data-lv'}="${id}" min="0" max="${max}" value="${Math.round(v)}"></div><output>${Math.round(v)}</output>${act ? `<button class="icon-btn ${muted ? 'on' : ''}" data-a="${act}" title="${t(muted ? 'unmute' : 'mute')}">${ic(muted ? 'volumeoff' : 'volume', 14)}</button>` : '<i class="sp-b"></i>'}</div>`;
}
const hasLocal = it => it.type === 'audio' || it.type === 'video' || it.type === 'mic' || (it.type === 'siteaudio' && routeApps);
function renderMixer(){
  const sc = cur(), list = sc.items.filter(i => i.type === 'audio' || i.type === 'video' || LIVE.has(i.type));
  let h = list.map(it => {
    const lv = LIVE.has(it.type), on = lv ? !!liveR[it.id] : wantPlay(it, sc), p = parentOf(it, sc), standalone = it.type === 'audio' && !p;
    const btn = lv ? `<button class="tbtn ${testing[it.id] ? 'on' : ''}" data-a="test" title="${t(testing[it.id] ? 'testStop' : 'test')}">${ic(testing[it.id] ? 'stop' : 'play', 11)}<span>${t(testing[it.id] ? 'testStop' : 'test')}</span></button>` : standalone ? `<button class="icon-btn" data-a="play" title="${t(on ? 'pause' : 'play')}">${ic(on ? 'pause' : 'play', 14)}</button>`
      : `<button class="icon-btn trig" data-a="trig" title="${t((p || it).visible ? 'hideAndStop' : 'showWithSound')}">${ic((p || it).visible ? 'stop' : 'play', 14)}</button>`;
    return `<div class="mx ${on ? 'playing' : ''} ${it.visible ? '' : 'off'}" data-id="${it.id}"><div class="mx-top"><span class="ico">${ic(ICON_OF[it.type], 15)}</span><span class="nm">${esc(it.name)}</span>${p ? `<span class="lnk" title="${esc(p.name)}">${ic('link', 13)}</span>` : ''}${btn}${it.type === 'siteaudio' ? `<button class="icon-btn" data-a="show" title="${t('appsShow')}">${ic('window', 14)}</button>` : ''}<button class="icon-btn gear" data-a="gear" title="${t('audioSettings')}">${ic('sliders', 15)}</button></div>
      ${mxBar('s', it.id, it.vol, lv ? 200 : 100, it.muted, 'mute')}${hasLocal(it) ? mxBar('l', it.id, lvolOf(it), 100, it.lmuted, 'lmute') : ''}</div>`;
  }).join('');
  if(!list.length) h = `<div class="empty">${esc(t('noAudio'))}</div>`;
  $('mixMaster').innerHTML = `<div class="mx-top"><span class="ico">${ic('volume', 15)}</span><span class="nm">${t('master')}</span></div>${mxBar('s', 'master', masterVol, 100, false, null)}${mxBar('l', 'master', lmaster, 100, !monitorOn, 'mon')}`;
  const sy = $('mixList').scrollTop; $('mixList').innerHTML = h; $('mixList').scrollTop = sy;
  const chip = $('mxScene'); if(chip) chip.textContent = '🎬 ' + sc.name;
  renderMicBtn();
}
const _mbuf = new Float32Array(512);
setInterval(() => {
  const gate = monGate();
  document.querySelectorAll('[data-m],[data-ml]').forEach(el => {
    const loc = el.dataset.ml !== undefined, id = loc ? el.dataset.ml : el.dataset.m; let an = null, v = 0;
    if(id === 'master') an = mixer && (loc ? mixer.lan : mixer.an);
    else if(loc) an = (mediaR[id] && mediaR[id].lan) || (liveR[id] && liveR[id].lan);
    else an = (testing[id] && liveR[id] && liveR[id].tan) || (mediaR[id] && mediaR[id].an) || (liveR[id] && liveR[id].an);
    if(an && !(loc && id !== 'master' && !gate)){ an.getFloatTimeDomainData(_mbuf); let q = 0; for(let i = 0; i < _mbuf.length; i++) q += _mbuf[i] * _mbuf[i]; const rms = Math.sqrt(q / _mbuf.length); v = rms > 0 ? clamp((20 * Math.log10(rms) + 60) / 60, 0, 1) : 0; }
    el._v = Math.max(v, (el._v || 0) * 0.82); el.style.transform = `scaleX(${el._v.toFixed(3)})`;
    if(!loc && testing[id] && !testHit[id] && v > 0.25){ testHit[id] = true; document.querySelectorAll(`[data-tst="${id}"]`).forEach(x => x.textContent = testText(id)); }
  });
}, 55);

/* ---- volume helpers + audio settings dialog (gear) ---- */
function setVol(it, kind, v){
  v = Math.round(v); if(kind === 's') it.vol = v; else it.lvol = v; applyVol(it);
  document.querySelectorAll(`[${kind === 's' ? 'data-mv' : 'data-lv'}="${it.id}"]`).forEach(o => { if(+o.value !== v) o.value = v; const b = o.closest('.mbar'), out = b && b.querySelector('output'); if(out) out.textContent = v; });
  if(kind === 's' && sel === it.id){ const o = $('tabProps').querySelector('[data-k="vol"]'); if(o && document.activeElement !== o){ o.value = v; if(o.nextElementSibling) o.nextElementSibling.textContent = v; } }
  persist();
}
function onVolInput(e){
  const el = e.target, sk = el.dataset.mv, lk = el.dataset.lv, k = sk || lk; if(!k) return; const v = Math.round(+el.value);
  const b = el.closest('.mbar'), out = b && b.querySelector('output'); if(out) out.textContent = v;
  if(k === 'master'){
    const mm = getMixer();
    const sc = cur();
    if(sk){ masterVol = v; sc.mv = v; rampG(mm.master.gain, v / 100); rampG(mm.live.gain, v / 100); }
    else { lmaster = v; sc.lmv = v; rampG(mm.lm.gain, v / 100); }
    persist(); return;
  }
  const it = cur().items.find(i => i.id === k); if(it) setVol(it, sk ? 's' : 'l', v);
}
function toggleTrial(it){
  if(trial[it.id]) delete trial[it.id]; else { if(wantPlay(it, cur(), true)) return; trial[it.id] = true; }
  applyVol(it); reconcile();
}
let gearId = null;
function gearBody(it){
  const lv = LIVE.has(it.type), media = it.type === 'audio' || it.type === 'video', max = lv ? 200 : 100;
  let h = `<div class="g-sec"><b>${t('streamBarFull')}</b><small>${t('streamNote')}</small>${mxBar('s', it.id, it.vol, max, it.muted, 'mute')}</div>`;
  if(hasLocal(it)) h += `<div class="g-sec loc"><b>${t('localBarFull')}</b><small>${t(it.type === 'mic' ? 'micLocalNote' : 'localNote')}</small>${mxBar('l', it.id, lvolOf(it), 100, it.lmuted, 'lmute')}${monGate() ? '' : `<small class="warn">${t('monOffNote')}</small>`}</div>`;
  if(media){ const busy = wantPlay(it, cur(), true); h += `<div class="g-try"><button class="sbtn ${trial[it.id] ? 'on' : ''}" data-a="trial" ${busy ? 'disabled' : ''}>${ic(trial[it.id] ? 'stop' : 'play')}<span>${t(trial[it.id] ? 'tryStop' : 'tryLocal')}</span></button><small>${t(busy ? 'tryBusy' : 'tryNote')}</small></div>`; }
  if(lv) h += `<div class="testbox"><button class="sbtn ${testing[it.id] ? 'on' : ''}" data-a="test">${ic(testing[it.id] ? 'stop' : 'play')}${t(testing[it.id] ? 'testStop' : 'test')}</button><div class="meter big"><i data-m="${it.id}"></i></div></div><div class="tst" data-tst="${it.id}">${esc(testText(it.id))}</div>`;
  h += `<div class="btn-row"><button class="sbtn" data-a="reset">${ic('center')}${t('resetVol')}</button>${it.type === 'siteaudio' ? `<button class="sbtn" data-a="show">${ic('window')}${t('appsShow')}</button>` : ''}</div>`;
  return h;
}
function fillGear(it){ $('dlgB').innerHTML = gearBody(it); }
function refreshGear(){ if(!gearId) return; const it = cur().items.find(x => x.id === gearId); if(it) fillGear(it); }
function gearDialog(id){
  const it = cur().items.find(x => x.id === id); if(!it) return;
  dlg({ title:`${it.name || t(it.type)} · ${t('audioSettings')}`, body:gearBody(it), actions:[{ label:t('ok'), kind:'primary' }],
    onOpen:() => { gearId = id; dlgClose = () => { gearId = null; stopAllTests(); Object.keys(trial).forEach(k => { delete trial[k]; const x = cur().items.find(i => i.id === k); if(x) applyVol(x); }); reconcile(); renderMixerSoon(); }; } });
}
$('dlgB').addEventListener('click', e => {
  if(!gearId) return; const b = e.target.closest('[data-a]'); if(!b || b.disabled) return;
  const it = cur().items.find(x => x.id === gearId); if(!it) return; const a = b.dataset.a;
  if(a === 'mute') it.muted = !it.muted; else if(a === 'lmute') it.lmuted = !it.lmuted;
  else if(a === 'trial') toggleTrial(it); else if(a === 'test') toggleTest(it);
  else if(a === 'show'){ showApp(it); return; }
  else if(a === 'reset'){ it.vol = 100; it.lvol = it.type === 'mic' ? 0 : 100; it.muted = false; it.lmuted = false; }
  else return;
  applyVol(it); renderMixer(); fillGear(it); persist();
});

function renderAll(){ renderScenes(); renderSources(); renderProps(); renderMixer(); updateSel(); }

/* ================= Dialogs & menus ================= */
let dlgActions = [];
let dlgClose = null;
function runDlgClose(){ const f = dlgClose; dlgClose = null; if(f) f(); }
function dlg({ title, body, actions, wide, onOpen }){
  runDlgClose();
  $('dlgT').textContent = title; $('dlgB').innerHTML = body; dlgActions = actions || [];
  $('dlgA').innerHTML = dlgActions.map((a, i) => `<button class="dbtn ${a.kind || ''}" data-di="${i}">${esc(a.label)}</button>`).join('');
  $('dlgBox').classList.toggle('wide', !!wide); $('dlg').classList.add('open');
  const dg = $('dlgA').querySelector('.danger'); if(dg) dg.focus();
  if(onOpen) onOpen();
}
function closeDlg(){ runDlgClose(); $('dlg').classList.remove('open'); }
$('dlgA').addEventListener('click', e => { const b = e.target.closest('[data-di]'); if(!b) return; const a = dlgActions[+b.dataset.di]; if(a && a.cb && a.cb() === false) return; closeDlg(); });
$('dlgX').onclick = closeDlg;
$('dlg').onmousedown = e => { if(e.target === $('dlg')) closeDlg(); };

/* ================= Context menu (OBS-style right-click) ================= */
let ctxEl = null, ctxActs = [], ctxSkip = false, lastDock = 'sources';
function cmHtml(items){
  return items.map(it => {
    if(it.sep) return '<div class="cm-sep"></div>';
    const idx = ctxActs.push(it) - 1;
    return `<div class="cm-i ${it.danger ? 'danger' : ''} ${it.disabled ? 'dis' : ''} ${it.sub ? 'has-sub' : ''}" data-ci="${idx}"><span class="cm-ic">${it.icon ? ic(it.icon, 15) : ''}</span><span class="cm-l">${esc(it.label)}</span>${it.key ? `<kbd>${esc(it.key)}</kbd>` : ''}${it.sub ? `<span class="cm-ar">${ic('chev', 12)}</span><div class="cm cm-sub">${cmHtml(it.sub)}</div>` : ''}</div>`;
  }).join('');
}
function closeCtx(){ if(ctxEl){ ctxEl.remove(); ctxEl = null; ctxActs = []; } }
function openSub(it){
  const sub = it.querySelector(':scope > .cm-sub'); if(!sub) return;
  it.parentElement.querySelectorAll(':scope > .cm-i.open').forEach(x => { if(x !== it) x.classList.remove('open'); });
  it.classList.add('open'); sub.classList.remove('flip', 'up');
  let r = sub.getBoundingClientRect();
  if(r.right > innerWidth - 4 || r.left < 4){ sub.classList.add('flip'); r = sub.getBoundingClientRect(); }
  if(r.bottom > innerHeight - 4) sub.classList.add('up');
}
function ctxMenu(x, y, items, anchor){
  closeCtx(); ctxActs = [];
  const m = document.createElement('div'); m.className = 'cm'; m._anchor = anchor || null;
  m.innerHTML = cmHtml(items); document.body.appendChild(m); ctxEl = m;
  const w = m.offsetWidth, h = m.offsetHeight; let left = x, top = y;
  if(anchor){ const r = anchor.getBoundingClientRect(); left = document.documentElement.dir === 'rtl' ? r.right - w : r.left; top = r.top - h - 4; if(top < 8) top = r.bottom + 4; }
  m.style.left = clamp(left, 6, innerWidth - w - 6) + 'px'; m.style.top = clamp(top, 6, innerHeight - h - 6) + 'px';
  m.addEventListener('contextmenu', e => e.preventDefault());
  m.addEventListener('mouseover', e => {
    const it = e.target.closest('.cm-i'); if(!it) return;
    m.querySelectorAll('.cm-i.hot').forEach(x => x.classList.remove('hot'));
    if(it.classList.contains('has-sub')) openSub(it);
    else it.parentElement.querySelectorAll(':scope > .cm-i.open').forEach(x => x.classList.remove('open'));
  });
  m.addEventListener('click', e => {
    const it = e.target.closest('.cm-i'); if(!it) return; const a = ctxActs[+it.dataset.ci];
    if(!a || a.disabled || a.sub) return; closeCtx(); if(a.run) a.run();
  });
}
function ctxKey(e){
  if(!ctxEl) return false; const k = e.key, rtl = document.documentElement.dir === 'rtl';
  if(k === 'Escape'){ closeCtx(); return true; }
  const hot = ctxEl.querySelector('.cm-i.hot'), level = hot ? hot.parentElement : ctxEl;
  const list = [...level.children].filter(c => c.classList.contains('cm-i') && !c.classList.contains('dis'));
  const setHot = x => { ctxEl.querySelectorAll('.cm-i.hot').forEach(h => h.classList.remove('hot')); if(x) x.classList.add('hot'); };
  if(k === 'ArrowDown' || k === 'ArrowUp'){
    if(!list.length) return true; let i = hot ? list.indexOf(hot) : -1;
    i = k === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length; setHot(list[i]);
    list[i].parentElement.querySelectorAll(':scope > .cm-i.open').forEach(x => x.classList.remove('open')); return true;
  }
  const into = rtl ? 'ArrowLeft' : 'ArrowRight', out = rtl ? 'ArrowRight' : 'ArrowLeft';
  if((k === into || k === 'Enter') && hot && hot.classList.contains('has-sub')){ openSub(hot); setHot(hot.querySelector(':scope > .cm-sub > .cm-i:not(.dis)')); return true; }
  if(k === out && hot && level !== ctxEl){ const p = level.parentElement; p.classList.remove('open'); setHot(p); return true; }
  if(k === 'Enter' && hot){ hot.click(); return true; }
  return false;
}
window.addEventListener('keydown', e => { if(ctxKey(e)){ e.preventDefault(); e.stopImmediatePropagation(); } }, true);
document.addEventListener('mousedown', e => {
  if(ctxEl && !ctxEl.contains(e.target)){ ctxSkip = !!(ctxEl._anchor && ctxEl._anchor.contains(e.target)); closeCtx(); }
  else if(!ctxEl) ctxSkip = false;
}, true);
window.addEventListener('blur', closeCtx); window.addEventListener('resize', closeCtx);
window.addEventListener('wheel', e => { if(ctxEl && !ctxEl.contains(e.target)) closeCtx(); }, { passive:true, capture:true });
document.addEventListener('contextmenu', e => e.preventDefault());

const ADD_VISUAL = ['text', 'video', 'image', 'cam', 'screen', 'window'], ADD_AUDIO = ['deskaudio', 'siteaudio', 'mic', 'audio'], ADD_TYPES = ADD_VISUAL.concat(ADD_AUDIO);
function addKind(k){
  if(k === 'image' || k === 'video' || k === 'audio') mediaDialog(k);
  else if(k === 'cam') cameraDialog();
  else if(k === 'screen' || k === 'window') captureDialog(k);
  else if(k === 'siteaudio') appsDialog();
  else addItem(k);
}
const addItems = () => ADD_VISUAL.map(k => ({ label:t(k), icon:ICON_OF[k], run:() => addKind(k) })).concat([{ sep:1 }], ADD_AUDIO.map(k => ({ label:t(k), icon:ICON_OF[k], run:() => addKind(k) })));
function addDialog(){
  const card = k => `<button class="addc" data-k="${k}"><span class="ai">${ic(ICON_OF[k])}</span><span><b>${esc(t(k))}</b><small>${esc(t(k + '_d'))}</small></span></button>`;
  dlg({ title:t('addSource'), wide:true, body:`<div class="agroup">${t('grpVisual')}</div><div class="addgrid">${ADD_VISUAL.map(card).join('')}</div><div class="agroup">${t('grpAudio')}</div><div class="addgrid">${ADD_AUDIO.map(card).join('')}</div>`, actions:[{ label:t('cancel') }],
    onOpen:() => { $('dlgB').onclick = e => { const b = e.target.closest('.addc'); if(!b) return; closeDlg(); addKind(b.dataset.k); }; } });
}
/* ================= التطبيقات المفتوحة (Open apps) ================= */
const APP_PRESETS = [['YouTube', 'https://www.youtube.com'], ['Facebook', 'https://www.facebook.com'], ['Google', 'https://www.google.com'], ['Discord', 'https://discord.com/app'], ['Twitch', 'https://www.twitch.tv'], ['Spotify', 'https://open.spotify.com']];
let appsOpen = false, appsCache = [];
const hostOf = u => { try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return String(u); } };
const sameUrl = (a, b) => normUrl(a) === normUrl(b);
const appsHave = url => cur().items.some(i => i.type === 'siteaudio' && sameUrl(i.url, url));
function addApp(url, name){
  const u = normUrl(url); if(!u){ toast(t('eBadUrl')); return false; }
  const nm = String(name || hostOf(u)).slice(0, 34);
  S.scenes.forEach(sc => { if(sc !== cur() && !sc.items.some(i => i.type === 'siteaudio' && sameUrl(i.url, u))) sc.items.push(mkItem('siteaudio', { url:u, name:nm })); }); // كل مشهد له مستويات صوت خاصة بالتطبيق
  if(!appsHave(u)) addItem('siteaudio', { url:u, name:nm }); else persist();
  toast(t('appsAddedToast'), 2600); return true;
}
async function showApp(it){
  const u = normUrl(it.url); if(!u) return; let r = null;
  try{ r = await api.siteShow({ url:u }); }catch(e){}
  if(!r || !r.ok){ liveFail.delete(it.id); dropLiveCap('site:' + u); teardownLive(it.id); it.visible = true; syncLive(); renderSources(); } // النافذة مغلقة: نعيد فتحها
}
function renderApps(){
  const el = $('apList'); if(!el) return;
  el.innerHTML = appsCache.length ? appsCache.map((a, i) => {
    const added = appsHave(a.url);
    return `<div class="ap-row" data-i="${i}"><span class="ap-ico">${ic('globe')}</span><div class="ap-info"><b>${esc(a.title || hostOf(a.url))}</b><small>${esc(hostOf(a.url))}${a.audible ? `<span class="ap-eq" title="${esc(t('appsPlaying'))}"><i></i><i></i><i></i></span>` : ''}</small></div>
      <div class="ap-acts"><button class="sbtn ${added ? 'on' : ''}" data-ap="add" ${added ? 'disabled' : ''}>${esc(t(added ? 'appsAdded' : 'appsAdd'))}</button><button class="icon-btn" data-ap="show" title="${esc(t('appsShow'))}">${ic('window')}</button><button class="icon-btn" data-ap="close" title="${esc(t('appsClose'))}">${ic('x')}</button></div></div>`;
  }).join('') : `<div class="empty">${esc(t('appsEmpty'))}</div>`;
}
async function appsDialog(){
  appsOpen = true;
  dlg({ title:t('appsTitle'), wide:true,
    body:`<div class="ap-add"><input type="url" class="ltr" id="apIn" placeholder="${esc(t('appsPh'))}" spellcheck="false"><button class="sbtn on" id="apGo">${ic('plus')}${esc(t('appsOpen'))}</button></div>
      <div class="sub">${esc(t('appsQuick'))}</div><div class="ap-chips">${APP_PRESETS.map((p, i) => `<button class="ap-chip" data-ap="preset" data-p="${i}">${ic('globe')}${esc(p[0])}</button>`).join('')}</div>
      <div class="sub">${esc(t('appsList'))}</div><div class="ap-list" id="apList"></div><div class="note ap-note">${esc(t('appsNote'))}</div>`,
    actions:[{ label:t('ok'), kind:'primary' }],
    onOpen:() => {
      dlgClose = () => { appsOpen = false; };
      const refresh = async () => { try{ appsCache = await api.appsList() || []; }catch(e){} renderApps(); };
      const go = () => { const v = $('apIn').value.trim(); if(!v){ toast(t('eEmptyUrl')); return; } if(addApp(v)){ $('apIn').value = ''; setTimeout(refresh, 1500); } };
      $('apGo').onclick = go; $('apIn').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); go(); } };
      $('dlgB').onclick = async e => {
        const b = e.target.closest('[data-ap]'); if(!b || b.disabled) return; const act = b.dataset.ap;
        if(act === 'preset'){ const p = APP_PRESETS[+b.dataset.p]; if(addApp(p[1], p[0])) setTimeout(refresh, 1500); return; }
        const row = b.closest('.ap-row'), a = row && appsCache[+row.dataset.i]; if(!a) return;
        if(act === 'add'){ addApp(a.url, a.title || hostOf(a.url)); renderApps(); }
        else if(act === 'show') api.siteShow({ url:a.url });
        else if(act === 'close'){
          await api.siteClose({ url:a.url });
          S.scenes.forEach(sc => sc.items.forEach(i => { if(i.type === 'siteaudio' && sameUrl(i.url, a.url)){ liveFail.add(i.id); if(sc === cur()) teardownLive(i.id); } }));
          dropLiveCap('site:' + a.url); appsCache = appsCache.filter(x => x !== a); renderApps(); renderMixerSoon();
        }
      };
      renderApps(); refresh(); $('apIn').focus();
    } });
}
if(window.api && api.onApps) api.onApps(list => { appsCache = Array.isArray(list) ? list : []; if(appsOpen) renderApps(); });
function itemMenu(it){
  const audio = noVisual(it);
  return [
    { label:t('props'), icon:'sliders', run:openDrawer },
    { sep:1 },
    { label:t('rename'), icon:'edit', key:'F2', run:() => renameItem(it.id) },
    { label:t('dupItem'), icon:'copy', key:'Ctrl+D', run:() => dupItem(it.id) },
    { sep:1 },
    { label:t(it.visible ? 'hide' : 'show'), icon:it.visible ? 'eyeoff' : 'eye', run:() => setVisible(it, !it.visible) },
    audio ? null : { label:t(it.locked ? 'unlock' : 'lock'), icon:it.locked ? 'unlock' : 'lock', run:() => { it.locked = !it.locked; renderSources(); persist(); } },
    audio && it.link ? { label:t('unlink'), icon:'unlink', run:() => linkTo(it, null) } : null,
    audio ? null : { label:t('layer'), icon:'layers', sub:[
      { label:t('forward'), icon:'up', run:() => moveLayer(it.id, 1) },
      { label:t('back'), icon:'down', run:() => moveLayer(it.id, -1) },
      { sep:1 },
      { label:t('toFront'), icon:'up', run:() => moveLayerEdge(it.id, true) },
      { label:t('toBack'), icon:'down', run:() => moveLayerEdge(it.id, false) } ] },
    audio ? null : { label:t('transform'), icon:'maximize', sub:[
      { label:t('fitScreen'), icon:'maximize', run:() => { fitItem(it); syncGeom(); updateSel(); persist(); } },
      { label:t('centerIt'), icon:'center', run:() => { it.x = Math.round((CW - it.w) / 2); it.y = Math.round((CH - it.h) / 2); syncGeom(); updateSel(); persist(); } } ] },
    { sep:1 },
    { label:t('del'), icon:'trash', key:'Del', danger:true, run:() => confirmRemoveItem(it.id) }
  ].filter(Boolean);
}
function sceneMenu(sc){
  const i = S.scenes.indexOf(sc);
  return [
    { label:t('sceneProps'), icon:'sliders', run:() => { select(null); openDrawer(); } },
    { sep:1 },
    { label:t('rename'), icon:'edit', key:'F2', run:renameDlg },
    { label:t('dupScene'), icon:'copy', key:'Ctrl+D', run:dupScene },
    { sep:1 },
    { label:t('moveUp'), icon:'up', disabled:i <= 0, run:() => moveScene(-1) },
    { label:t('moveDown'), icon:'down', disabled:i >= S.scenes.length - 1, run:() => moveScene(1) },
    { sep:1 },
    { label:t('delScene'), icon:'trash', key:'Del', danger:true, run:delScene }
  ];
}
$('addSrc').onclick = () => { if(ctxSkip){ ctxSkip = false; return; } addDialog(); };

/* ---- media (file / link) ---- */
const ACCEPT = { image:'image/', video:'video/', audio:'audio/' };
function videoSize(blob){ return new Promise(res => { const v = document.createElement('video'), u = URL.createObjectURL(blob); v.preload = 'metadata'; v.onloadedmetadata = () => { res([v.videoWidth || 640, v.videoHeight || 360]); URL.revokeObjectURL(u); }; v.onerror = () => { res([640, 360]); URL.revokeObjectURL(u); }; v.src = u; }); }
async function addFromBlob(kind, blob, name){
  const id = uid(); name = (name || t(kind)).replace(/\.[^.]+$/, '');
  try{ await idbPut(id, blob); }catch(e){ return null; }
  if(kind === 'image'){
    await loadImg(id); const im = imgs[id];
    await new Promise(r => { if(!im || im.complete) r(); else { im.onload = r; im.onerror = r; } });
    const nw = (im && im.naturalWidth) || 640, nh = (im && im.naturalHeight) || 360, k = Math.min(1, 900 / nw, 560 / nh);
    return addItem('image', { assetId:id, name, w:Math.round(nw * k), h:Math.round(nh * k) });
  }
  if(kind === 'video'){
    const [nw, nh] = await videoSize(blob), k = Math.min(1, 960 / nw, 540 / nh);
    return addItem('video', { assetId:id, name, w:Math.round(nw * k), h:Math.round(nh * k) });
  }
  return addItem('audio', { assetId:id, name });
}
async function addFiles(kind, files){
  const list = Array.from(files || []).filter(f => (f.type || '').startsWith(ACCEPT[kind]) || !f.type);
  if(!list.length) return false;
  for(const f of list) await addFromBlob(kind, f, f.name);
  return true;
}
function fetchError(r){
  const m = { badUrl:t('eBadUrl'), noYtdlp:t('eNoYt'), type:t('eType'), big:t('eBig') };
  if(r.code === 'http') return t('eHttp') + r.detail + ')';
  return m[r.code] || (t('eFail') + (r.detail || ''));
}
function mediaDialog(kind){
  const title = { image:'addImage', video:'addVideo', audio:'addAudio' }[kind], hint = { image:'hintImage', video:'hintVideo', audio:'hintAudio' }[kind];
  dlg({ title:t(title), body:`<div class="mtabs"><button class="on" data-mt="dev">${ic('upload')}${t('fromDevice')}</button><button data-mt="lnk">${ic('globe')}${t('fromLink')}</button></div>
    <div id="mtDev"><div class="dropz" id="dropZ">${ic('upload')}<b>${t('chooseFile')}</b><small>${t('dropHere')}</small></div></div>
    <div id="mtLnk" style="display:none"><label class="lbl">${t('fromLink')}</label><input type="url" class="ltr" id="lnkIn" placeholder="${t('linkPh')}" spellcheck="false"><div class="hint">${t(hint)}</div></div>`,
    actions:[{ label:t('cancel') }, { label:t('add'), kind:'primary', cb:null }],
    onOpen:() => {
      const addBtn = $('dlgA').querySelector('.primary'); addBtn.style.display = 'none';
      const setTab = n => { document.querySelectorAll('.mtabs button').forEach(b => b.classList.toggle('on', b.dataset.mt === n)); $('mtDev').style.display = n === 'dev' ? '' : 'none'; $('mtLnk').style.display = n === 'lnk' ? '' : 'none'; addBtn.style.display = n === 'lnk' ? '' : 'none'; if(n === 'lnk') $('lnkIn').focus(); };
      document.querySelectorAll('.mtabs button').forEach(b => b.onclick = () => setTab(b.dataset.mt));
      const pick = () => { const fi = document.createElement('input'); fi.type = 'file'; fi.accept = ACCEPT[kind] + '*'; fi.multiple = true; fi.onchange = async () => { if(await addFiles(kind, fi.files)) closeDlg(); }; fi.click(); };
      const dz = $('dropZ'); dz.onclick = pick;
      dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over');
      dz.ondrop = async e => { e.preventDefault(); dz.classList.remove('over'); if(await addFiles(kind, e.dataTransfer.files)) closeDlg(); };
      const go = async () => {
        const url = $('lnkIn').value.trim(); if(!url){ toast(t('eEmptyUrl')); return; }
        addBtn.disabled = true; addBtn.textContent = t('downloading');
        let r; try{ r = await api.fetchMedia({ url, kind }); }catch(e){ r = { ok:false, code:'fail', detail:e.message }; }
        if(!r.ok){ addBtn.disabled = false; addBtn.textContent = t('add'); toast('❌ ' + fetchError(r), 6000); return; }
        await addFromBlob(kind, new Blob([r.data], { type:r.mime }), r.name); closeDlg();
      };
      addBtn.onclick = e => { e.stopPropagation(); go(); };
      $('lnkIn').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); go(); } };
    } });
}


/* ---- الكاميرا: تحقق من وجود كاميرا + معاينة حيّة + موافق ---- */
async function scanCams(){
  // نطلب الإذن مرة (بدونه Windows يخفي أسماء الكاميرات) ثم نقرأ القائمة
  let err = '';
  try{ const st = await navigator.mediaDevices.getUserMedia({ video:true, audio:false }); st.getTracks().forEach(x => x.stop()); }catch(e){ err = camErr(e); }
  let list = []; try{ list = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput' && d.deviceId); }catch(e){}
  camDevices = list;
  if(list.length && err === 'none') err = '';
  return { list, err: list.length ? (err === 'denied' || err === 'busy' ? err : '') : (err && err !== 'fail' ? err : 'none') };
}
async function cameraDialog(replaceId){
  const prevs = [];
  const stopPrevs = () => { prevs.splice(0).forEach(p => { try{ p.st.getTracks().forEach(x => x.stop()); }catch(e){} }); };
  let chosen = null;
  const paint = async () => {
    stopPrevs(); chosen = null; setOk(false);
    $('dlgB').innerHTML = `<div class="cam-st wait">${esc(t('camChecking'))}</div>`;
    const r = await scanCams(); if(!$('dlg').classList.contains('open') || !$('dlgB').querySelector('.cam-st')) return;
    if(!r.list.length){
      const msg = r.err === 'denied' ? t('camDenied') : r.err === 'busy' ? t('camBusy') : t('camNone');
      $('dlgB').innerHTML = `<div class="cam-st bad">✖ ${esc(msg)}</div><div class="note">${esc(t('camNoneHelp'))}</div><div class="btn-row"><button class="sbtn" data-cam="re">${ic('camera')}${esc(t('camRecheck'))}</button></div>`;
      setOk(false); return;
    }
    const cur0 = replaceId && cur().items.find(i => i.id === replaceId);
    chosen = (cur0 && r.list.find(d => d.deviceId === cur0.deviceId)) || r.list[0];
    $('dlgB').innerHTML = `<div class="cam-st ok">✔ ${esc(t('camFound', { n:r.list.length }))}</div><div class="sub">${esc(t('camPick'))}</div><div class="cam-grid">${r.list.map((d, i) => `<button type="button" class="cam-card ${d.deviceId === chosen.deviceId ? 'on' : ''}" data-ci="${i}"><video muted playsinline></video><span>${esc(d.label || (t('cam') + ' ' + (i + 1)))}</span></button>`).join('')}</div>${r.err ? `<div class="note">${esc(t(r.err === 'busy' ? 'camBusy' : 'camDenied'))}</div>` : ''}<div class="btn-row"><button class="sbtn" data-cam="re">${ic('camera')}${esc(t('camRecheck'))}</button></div>`;
    setOk(true);
    $('dlgB').querySelectorAll('.cam-card').forEach(async (card, i) => {
      try{ const st = await navigator.mediaDevices.getUserMedia({ video:{ deviceId:{ exact:r.list[i].deviceId }, width:{ ideal:640 }, height:{ ideal:360 } }, audio:false }); const v = card.querySelector('video'); if(!card.isConnected){ st.getTracks().forEach(x => x.stop()); return; } prevs.push({ st }); v.srcObject = st; v.play().catch(() => {}); }
      catch(e){ card.classList.add('nopv'); }
    });
  };
  const setOk = on => { const b = $('dlgA').querySelector('.primary'); if(b) b.disabled = !on; };
  dlg({ title:t('camTitle'), wide:true, body:'', actions:[{ label:t('cancel') }, { label:t('camOk'), kind:'primary', cb:() => {
      if(!chosen) return false;
      const ex = replaceId && cur().items.find(i => i.id === replaceId);
      if(ex){ stopCap(ex.id); capFailed.delete(ex.id); ex.deviceId = chosen.deviceId; ex.deviceName = chosen.label || ''; ex.ratioSet = false; syncCaps(); persist(); renderProps(); renderSources(); }
      else addItem('cam', { deviceId:chosen.deviceId, deviceName:chosen.label || '', name:chosen.label || t('cam') });
    } }],
    onOpen:() => {
      dlgClose = stopPrevs;
      $('dlgB').onclick = e => {
        if(e.target.closest('[data-cam="re"]')){ paint(); return; }
        const c = e.target.closest('.cam-card'); if(!c) return;
        chosen = camDevices[+c.dataset.ci]; $('dlgB').querySelectorAll('.cam-card').forEach(x => x.classList.toggle('on', x === c));
      };
      paint();
    } });
}
if(navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', () => {   // كاميرا انوصلت/انفصلت
  navigator.mediaDevices.enumerateDevices().then(d => { camDevices = d.filter(x => x.kind === 'videoinput' && x.deviceId); }).catch(() => {});
  let any = false; S.scenes.forEach(sc => sc.items.forEach(i => { if(i.type === 'cam' && capFailed.has(i.id)){ capFailed.delete(i.id); any = true; } }));
  if(any) syncCaps();
});

/* ---- screen / window capture ---- */
async function captureDialog(type, replaceId){
  dlg({ title:t(type === 'screen' ? 'pickScreen' : 'pickWindow'), wide:true, body:`<div class="cap-grid" id="capG"><div class="empty">${t('loading')}</div></div>`, actions:[{ label:t('cancel') }] });
  let list = []; try{ list = await api.listCapture(type) || []; }catch(e){}
  const g = $('capG'); if(!g) return;
  g.innerHTML = list.length ? list.map((s, i) => `<button class="cap" data-ci="${i}"><img src="${esc(s.thumb)}" alt=""><span>${esc(s.name)}</span></button>`).join('') : `<div class="empty">${t('noSources')}</div>`;
  g.onclick = e => {
    const b = e.target.closest('.cap'); if(!b) return; const s = list[+b.dataset.ci]; closeDlg();
    const ex = replaceId && cur().items.find(i => i.id === replaceId);
    if(ex){ stopCap(ex.id); capFailed.delete(ex.id); ex.srcId = s.id; ex.srcName = s.name; syncCaps(); persist(); }
    else addItem(type, { srcId:s.id, srcName:s.name, name:s.name });
  };
}

/* منع Electron من فتح الملفات لو انفلتت بالغلط خارج منطقة الإفلات */
['dragover', 'drop'].forEach(ev => window.addEventListener(ev, e => { if(e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault(); }));

/* ================= Events: lists & drawer ================= */
$('sceneList').addEventListener('click', e => { const r = e.target.closest('.scene'); if(r) switchScene(r.dataset.id); });
$('sceneList').addEventListener('dblclick', e => { const r = e.target.closest('.scene'); if(r){ switchScene(r.dataset.id); renameDlg(); } });
function renameDlg(){ const sc = cur(); askName(t('renameScene'), sc.name, t('save'), v => { sc.name = v; renderScenes(); renderProps(); persist(); }); }
const addSceneDlg = () => askName(t('newSceneTitle'), `${t('newSceneName')} ${S.scenes.length + 1}`, t('create'), createScene);
$('addScene').onclick = addSceneDlg;
$('scDel').onclick = delScene;
$('scUp').onclick = () => moveScene(-1); $('scDown').onclick = () => moveScene(1);
$('srcDel').onclick = () => { const it = selItem(); if(it) confirmRemoveItem(it.id); };
$('srcUp').onclick = () => { const it = selItem(); if(it) moveLayer(it.id, 1); };
$('srcDown').onclick = () => { const it = selItem(); if(it) moveLayer(it.id, -1); };
const openDrawer = () => { $('drawer').classList.add('open'); renderProps(); };
const closeDrawer = () => $('drawer').classList.remove('open');
$('openProps').onclick = () => $('drawer').classList.contains('open') ? closeDrawer() : openDrawer();
$('srcProps').onclick = openDrawer; $('closeDrawer').onclick = closeDrawer;

$('srcList').addEventListener('click', e => {
  const r = e.target.closest('.src'); if(!r) return; const it = cur().items.find(i => i.id === r.dataset.id); if(!it) return;
  const a = e.target.closest('button'), act = a && a.dataset.a;
  if(act === 'vis') setVisible(it, !it.visible);
  else if(act === 'lock'){ it.locked = !it.locked; renderSources(); persist(); }
  else select(it.id);
});
$('srcList').addEventListener('dblclick', e => { const r = e.target.closest('.src'); if(r && !e.target.closest('button')){ select(r.dataset.id); openDrawer(); } });
$('dkScenes').addEventListener('pointerdown', () => { lastDock = 'scenes'; }, true);
$('dkSources').addEventListener('pointerdown', () => { lastDock = 'sources'; }, true);
$('sceneList').addEventListener('contextmenu', e => {
  e.preventDefault(); lastDock = 'scenes'; const r = e.target.closest('.scene');
  if(r){ switchScene(r.dataset.id); ctxMenu(e.clientX, e.clientY, sceneMenu(cur())); }
  else ctxMenu(e.clientX, e.clientY, [{ label:t('addScene'), icon:'plus', run:addSceneDlg }]);
});
$('srcList').addEventListener('contextmenu', e => {
  e.preventDefault(); lastDock = 'sources'; const r = e.target.closest('.src'), it = r && cur().items.find(i => i.id === r.dataset.id);
  if(it){ select(it.id); ctxMenu(e.clientX, e.clientY, itemMenu(it)); }
  else ctxMenu(e.clientX, e.clientY, [{ label:t('addSource'), icon:'plus', sub:addItems() }]);
});
/* drag an audio row onto an image/video/... row to link them */
let dragId = null;
$('srcList').addEventListener('dragstart', e => { const r = e.target.closest('.src.is-audio'); if(!r){ e.preventDefault(); return; } dragId = r.dataset.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); r.classList.add('dragging'); });
$('srcList').addEventListener('dragover', e => {
  if(!dragId) return; const r = e.target.closest('.src'); document.querySelectorAll('#srcList .drop').forEach(x => x.classList.remove('drop')); $('srcList').classList.remove('unlink-zone');
  if(r && !r.classList.contains('is-audio')){ e.preventDefault(); r.classList.add('drop'); } else if(!r){ e.preventDefault(); $('srcList').classList.add('unlink-zone'); }
});
$('srcList').addEventListener('drop', e => {
  if(!dragId) return; e.preventDefault(); const a = cur().items.find(i => i.id === dragId), r = e.target.closest('.src');
  if(a){ if(r && !r.classList.contains('is-audio')) linkTo(a, r.dataset.id); else if(!r && a.link) linkTo(a, null); }
  dragEnd();
});
function dragEnd(){ dragId = null; document.querySelectorAll('#srcList .drop,#srcList .dragging').forEach(x => x.classList.remove('drop', 'dragging')); $('srcList').classList.remove('unlink-zone'); }
$('srcList').addEventListener('dragend', dragEnd);

$('tabProps').addEventListener('input', e => {
  const el = e.target, sc = cur();
  if(el.dataset.s){ const k = el.dataset.s; if(k === 'name') sc.name = el.value; else sc.bg[k === 'bg0' ? 0 : 1] = el.value; renderScenes(); persist(); return; }
  const k = el.dataset.k, it = selItem(); if(!k || !it) return;
  let v = el.type === 'checkbox' ? el.checked : (el.type === 'number' || el.type === 'range') ? (parseFloat(el.value) || 0) : el.value;
  if(el.tagName === 'SELECT' && k === 'weight') v = parseInt(v, 10);
  if(k === 'link'){ linkTo(it, v || null); return; }
  if(k === 'w' || k === 'h') v = Math.max(10, v);
  if(k === 'dur') v = Math.max(0, v);
  it[k] = v; if(el.type === 'range' && el.nextElementSibling) el.nextElementSibling.textContent = Math.round(v);
  if(k === 'name'){ $('drawerTitle').textContent = v || t(it.type); renderSources(); renderMixerSoon(); }
  if(k === 'vol'){ setVol(it, 's', v); }
  if(k === 'loop'){ const m = mediaR[it.id]; if(m) m.el.loop = !!v; }
  if(k === 'deviceId'){ it.deviceName = el.selectedOptions[0] ? el.selectedOptions[0].textContent : ''; }
  if(it.type === 'cam' && k === 'deviceId'){ stopCap(it.id); capFailed.delete(it.id); it.ratioSet = false; syncCaps(); }
  if(it.type === 'mic' && ['deviceId', 'echo', 'noise', 'agc'].includes(k)){ liveFail.delete(it.id); syncLive(); }
  updateSel(); persist();
});
$('tabProps').addEventListener('click', e => {
  const p = e.target.closest('[data-preset]'); if(p){ const sc = cur(); sc.bg = PRESETS[+p.dataset.preset].slice(); renderScenes(); renderProps(); persist(); return; }
  const a = e.target.closest('[data-act]'); if(!a) return; const act = a.dataset.act, it = selItem();
  if(act === 'dupScene') dupScene(); else if(act === 'delScene') delScene();
  else if(!it) return;
  else if(act === 'fwd') moveLayer(it.id, 1); else if(act === 'bwd') moveLayer(it.id, -1); else if(act === 'delItem') confirmRemoveItem(it.id);
  else if(act === 'fitScr'){ fitItem(it); syncGeom(); updateSel(); persist(); }
  else if(act === 'centerIt'){ it.x = Math.round((CW - it.w) / 2); it.y = Math.round((CH - it.h) / 2); syncGeom(); updateSel(); persist(); }
  else if(act === 'changeSrc'){ if(it.type === 'cam') cameraDialog(it.id); else captureDialog(it.type, it.id); }
  else if(act === 'test') toggleTest(it);
  else if(act === 'openSite'){ const u = normUrl(it.url); if(!u){ toast(t('eBadUrl')); return; } it.url = u; liveFail.delete(it.id); if(!it.visible) it.visible = true; dropLiveCap('site:' + u); teardownLive(it.id); renderSources(); renderProps(); syncLive(); persist(); }
});
$('dkMixer').addEventListener('click', e => {
  const a = e.target.closest('[data-a]'); if(!a) return; const act = a.dataset.a;
  if(act === 'mon'){ monitorOn = !monitorOn; LS.set('se_monitor', monitorOn ? '1' : '0'); getMixer(); applyMon(); renderMixer(); return; }
  const row = a.closest('[data-id]'), it = row && cur().items.find(i => i.id === row.dataset.id); if(!it) return;
  if(act === 'mute'){ it.muted = !it.muted; applyVol(it); renderMixer(); persist(); }
  else if(act === 'lmute'){ it.lmuted = !it.lmuted; applyVol(it); renderMixer(); persist(); }
  else if(act === 'gear') gearDialog(it.id);
  else if(act === 'play'){ playing[it.id] = !wantPlay(it, cur()); reconcile(); }
  else if(act === 'trig'){ const p = parentOf(it) || it; setVisible(p, !p.visible); }
  else if(act === 'test') toggleTest(it);
  else if(act === 'show') showApp(it);
});
$('dkMixer').addEventListener('input', onVolInput);
$('dlgB').addEventListener('input', onVolInput);

/* ================= Preview: select / move / resize ================= */
function fitPreview(){
  const r = $('stage').getBoundingClientRect(); let w = r.width - 24, h = w * 9 / 16; if(h > r.height - 24){ h = r.height - 24; w = h * 16 / 9; }
  $('pv').style.width = Math.max(100, w) + 'px'; $('pv').style.height = Math.max(56, h) + 'px';
}
new ResizeObserver(fitPreview).observe($('stage')); fitPreview();
function updateSel(){
  const it = selItem(), el = $('sel'); if(!it || noVisual(it)){ el.hidden = true; return; }
  el.hidden = false; el.classList.toggle('keep', keepR(it));
  el.style.left = it.x / 12.8 + '%'; el.style.top = it.y / 7.2 + '%'; el.style.width = it.w / 12.8 + '%'; el.style.height = it.h / 7.2 + '%';
}
const toCanvas = e => { const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) * CW / r.width, y:(e.clientY - r.top) * CH / r.height, k:CW / r.width }; };
let drag = null;
$('pv').addEventListener('pointerdown', e => {
  if(e.button !== 0) return; lastDock = 'sources';
  const p = toCanvas(e), hd = e.target.dataset && e.target.dataset.h; let it;
  if(hd){ it = selItem(); if(!it) return; drag = { mode:'resize', hd, p, o:{ x:it.x, y:it.y, w:it.w, h:it.h }, it }; }
  else {
    it = hitItem(p, true);
    if(!it){ if(sel) select(null); return; }
    if(sel !== it.id) select(it.id);
    drag = { mode:'move', p, o:{ x:it.x, y:it.y }, it };
  }
  e.preventDefault();
});
function hitItem(p, skipLocked){
  const items = cur().items;
  for(let i = items.length - 1; i >= 0; i--){ const c = items[i]; if(!noVisual(c) && c.visible && !(skipLocked && c.locked) && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) return c; }
  return null;
}
$('pv').addEventListener('contextmenu', e => {
  e.preventDefault(); lastDock = 'sources'; const it = hitItem(toCanvas(e), false);
  if(it){ select(it.id); ctxMenu(e.clientX, e.clientY, itemMenu(it)); }
  else ctxMenu(e.clientX, e.clientY, [{ label:t('addSource'), icon:'plus', sub:addItems() }, { sep:1 }, { label:t('sceneProps'), icon:'sliders', run:() => { select(null); openDrawer(); } }]);
});
$('pv').addEventListener('dblclick', e => { if(selItem() && !(e.target.dataset && e.target.dataset.h)) openDrawer(); });
window.addEventListener('pointermove', e => {
  if(!drag) return; const p = toCanvas(e), dx = p.x - drag.p.x, dy = p.y - drag.p.y, it = drag.it, o = drag.o;
  if(drag.mode === 'move'){
    let nx = Math.round(o.x + dx), ny = Math.round(o.y + dy), th = 7 * p.k;
    for(const c of [0, (CW - it.w) / 2, CW - it.w]) if(Math.abs(nx - c) < th) nx = Math.round(c);
    for(const c of [0, (CH - it.h) / 2, CH - it.h]) if(Math.abs(ny - c) < th) ny = Math.round(c);
    it.x = nx; it.y = ny;
  } else {
    const hd = drag.hd, keep = keepR(it) || (RATIO.has(it.type) && e.shiftKey), ratio = o.w / o.h;
    let nw = o.w, nh = o.h;
    if(hd.includes('e')) nw = o.w + dx; if(hd.includes('w')) nw = o.w - dx;
    if(hd.includes('s')) nh = o.h + dy; if(hd.includes('n')) nh = o.h - dy;
    nw = Math.max(20, nw); nh = Math.max(20, nh); if(keep) nh = nw / ratio;
    it.w = Math.round(nw); it.h = Math.round(nh);
    it.x = hd.includes('w') ? Math.round(o.x + o.w - it.w) : o.x; it.y = hd.includes('n') ? Math.round(o.y + o.h - it.h) : o.y;
  }
  updateSel(); syncGeom();
});
window.addEventListener('pointerup', () => { if(drag){ drag = null; persist(); } });
window.addEventListener('keydown', e => {
  if(e.key === 'Escape'){ closeCtx(); closeDlg(); $('ov').classList.remove('open'); return; }
  if(document.querySelector('.overlay.open')) return;
  if((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyZ' || e.code === 'KeyY')){   // e.code يشتغل مع أي لغة كيبورد (عربي/إنجليزي)
    const te = e.target, ty = te && te.tagName === 'INPUT' ? String(te.type || 'text').toLowerCase() : '';
    const typing = (te && (te.tagName === 'TEXTAREA' || te.isContentEditable)) || (ty && !['checkbox', 'radio', 'range', 'button', 'color', 'file'].includes(ty));
    if(!typing && !drag){ e.preventDefault(); if(e.code === 'KeyY' || e.shiftKey) redo(); else undo(); }
    return;
  }
  const tg = e.target.tagName; if(tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
  const it = selItem();
  if(e.key === 'Delete'){ if(lastDock === 'scenes') delScene(); else if(it) confirmRemoveItem(it.id); return; }
  if(e.key === 'F2'){ e.preventDefault(); if(lastDock === 'scenes') renameDlg(); else if(it) renameItem(it.id); return; }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd'){ e.preventDefault(); if(lastDock === 'scenes') dupScene(); else if(it) dupItem(it.id); return; }
  if(it && !noVisual(it) && !it.locked && e.key.startsWith('Arrow')){ const s = e.shiftKey ? 10 : 1; if(e.key === 'ArrowLeft') it.x -= s; if(e.key === 'ArrowRight') it.x += s; if(e.key === 'ArrowUp') it.y -= s; if(e.key === 'ArrowDown') it.y += s; updateSel(); syncGeom(); persist(); e.preventDefault(); return; }
  if(/^[1-9]$/.test(e.key) && S.scenes[+e.key - 1]) switchScene(S.scenes[+e.key - 1].id);
});

/* ================= Settings & language ================= */
let settings = { kickUrl:'', kickKey:'', mic:false, bitrate:3500, res:720, fps:30, enc:'veryfast', rc:'cbr', kf:2, ll:1, abr:128, ach:2 };
function toast(msg, ms = 3500){ const el = $('toast'); el.textContent = msg; el.style.display = 'block'; clearTimeout(el._t); el._t = setTimeout(() => el.style.display = 'none', ms); }
function fillForm(){ $('kUrl').value = settings.kickUrl; $('kKey').value = settings.kickKey; $('bitrate').value = String(settings.bitrate); }
function buildBitrate(){ if(window.SQ) return SQ.buildBitrate(); const v = $('bitrate').value || String(settings.bitrate); $('bitrate').innerHTML = [[1500, 'brL'], [2500, 'brN'], [3500, 'brG'], [4500, 'brH'], [6000, 'brV']].map(([n, k]) => `<option value="${n}">${n} kbps - ${t(k)}</option>`).join(''); $('bitrate').value = v; }
function applyLook(){
  const d = document.documentElement; d.lang = lang; d.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
}
function applyI18n(){
  document.querySelectorAll('[data-i]').forEach(el => el.textContent = t(el.dataset.i));
  document.querySelectorAll('[data-tt]').forEach(el => el.title = t(el.dataset.tt));
  buildBitrate(); renderGo(); renderStatus(); renderChip(); renderMicBtn(); renderHk(); renderTrUi(); $('stTitle').textContent = t(MT[curTab]);
  if(window.onSettingsPage) window.onSettingsPage(curTab);
}
$('langSeg').onclick = e => { const b = e.target.closest('[data-lang]'); if(!b) return; lang = b.dataset.lang; LS.set('se_lang', lang); applyLook(); applyI18n(); renderAll(); };
let theme = LS.get('se_theme', 'dark'); if(theme !== 'light') theme = 'dark';   // dark | light
function resolvedTheme(){ return theme; }
function applyTheme(animate){
  const root = document.documentElement;
  if(animate){ root.classList.add('theme-anim'); clearTimeout(applyTheme._t); applyTheme._t = setTimeout(() => root.classList.remove('theme-anim'), 350); }
  root.dataset.theme = resolvedTheme();
  document.querySelectorAll('#themeSeg [data-th]').forEach(b => b.classList.toggle('on', b.dataset.th === theme));
}
$('themeSeg').onclick = e => { const b = e.target.closest('[data-th]'); if(!b) return; theme = b.dataset.th; LS.set('se_theme', theme); applyTheme(true); };

let guides = LS.get('se_guides', '0') === '1';
function applyGuides(){ document.body.classList.toggle('guides', guides); $('guidesBtn').classList.toggle('on', guides); }
$('guidesBtn').onclick = () => { guides = !guides; LS.set('se_guides', guides ? '1' : '0'); applyGuides(); };

const DOCK_DEF = 290; let dockH = parseInt(LS.get('se_dockh', String(DOCK_DEF)), 10); if(!(dockH >= 140 && dockH <= 700)) dockH = DOCK_DEF;
function applyDock(){ document.documentElement.style.setProperty('--dock-h', dockH + 'px'); }
(() => {
  const sp = $('split');
  sp.addEventListener('pointerdown', e => {
    e.preventDefault(); const y0 = e.clientY, h0 = dockH; sp.setPointerCapture(e.pointerId); sp.classList.add('drag');
    sp.onpointermove = ev => { dockH = clamp(h0 - (ev.clientY - y0), 140, Math.max(160, Math.round(innerHeight * 0.6))); applyDock(); };
    sp.onpointerup = () => { sp.onpointermove = null; sp.onpointerup = null; sp.classList.remove('drag'); LS.set('se_dockh', String(Math.round(dockH))); };
  });
  sp.addEventListener('dblclick', () => { dockH = DOCK_DEF; applyDock(); LS.set('se_dockh', String(DOCK_DEF)); });
})();

/* صفحات الإعدادات: لكل قسم صفحة كاملة (الأزرار على اليمين). العناوين والأوصاف في settings.js */
const MT = { general:'general', video:'stVideo', encoder:'stEncoder', audio:'audioTab', network:'stNetwork', review:'stReview', kick:'kickTab', hotkeys:'hkTitle', transitions:'transition', updates:'updTab' };
const PANES = { general:'mGeneral', video:'mVideo', encoder:'mEncoder', audio:'mAudio', network:'mNetwork', review:'mReview', kick:'mKick', hotkeys:'mHotkeys', transitions:'mTransitions', updates:'mUpdates' };
const TAB_ALIAS = { streaming:'kick', dest:'kick', recording:'video', controls:'hotkeys' };   // أسماء الصفحات القديمة
let curTab = 'general';
function openSettings(tab){ document.body.classList.remove('k-bigmode'); fillForm(); $('hkGlobal').checked = hkGlobal; $('routeApps').checked = routeApps; mTab(tab || curTab || 'general'); $('ov').classList.add('open'); stopAllTests(); }
function closeSettingsModal(){ if(hkRec) stopRec(); $('ov').classList.remove('open'); }
function mTab(n){
  n = TAB_ALIAS[n] || n;
  if(!PANES[n]) n = 'general'; curTab = n;
  document.querySelectorAll('#mTabs button').forEach(b => b.classList.toggle('on', b.dataset.mtab === n));
  Object.keys(PANES).forEach(k => $(PANES[k]).classList.toggle('on', k === n));
  $('stTitle').textContent = t(MT[n]);
  if(hkRec && n !== 'hotkeys') stopRec(); if(n === 'hotkeys') renderHk();
  $('stScroll').scrollTop = 0;
  if(window.onSettingsPage) window.onSettingsPage(n);
}
document.querySelectorAll('#mTabs button').forEach(b => b.onclick = () => mTab(b.dataset.mtab));
$('routeApps').onchange = () => {
  routeApps = $('routeApps').checked; LS.set('se_routeapps', routeApps ? '1' : '0');
  Object.keys(liveR).forEach(id => { const it = cur().items.find(x => x.id === id); if(it && it.type === 'siteaudio') teardownLive(id); });
  Object.keys(liveCaps).forEach(k => { if(k.startsWith('site:')){ try{ api.siteMute({ url:k.slice(5), muted:routeApps }); }catch(e){} } });
  syncLive(); renderMixer();
};
/* ---- transitions UI ---- */
function renderTrUi(){
  $('trGrid').innerHTML = TRS.map(k => `<button class="tr-card ${trCfg.type === k ? 'on' : ''}" data-tr="${k}"><span class="tr-ic ${k}"></span>${esc(t('tr_' + k))}</button>`).join('');
  $('trDur').value = trCfg.dur; $('trDurO').textContent = (trCfg.dur / 1000).toFixed(2) + ' s';
  $('trQuick').innerHTML = TRS.map(k => `<option value="${k}" ${trCfg.type === k ? 'selected' : ''}>${esc(t('tr_' + k))}</option>`).join('');
}
function setTr(k){ if(!TRS.includes(k)) return; trCfg.type = k; LS.set('se_tr', k); renderTrUi(); }
$('trGrid').onclick = e => { const b = e.target.closest('[data-tr]'); if(b) setTr(b.dataset.tr); };
$('trQuick').onchange = e => setTr(e.target.value);
$('trDur').oninput = e => { trCfg.dur = +e.target.value; LS.set('se_trdur', String(trCfg.dur)); $('trDurO').textContent = (trCfg.dur / 1000).toFixed(2) + ' s'; };
$('openSettings').onclick = () => openSettings();
$('closeSettings').onclick = closeSettingsModal;
$('ov').onmousedown = e => { if(e.target === $('ov')) closeSettingsModal(); };
$('eye').onclick = () => { const k = $('kKey'); k.type = k.type === 'password' ? 'text' : 'password'; };
const collectSettings = () => ({ kickUrl:$('kUrl').value.trim(), kickKey:$('kKey').value.trim(), mic:false, bitrate:parseInt($('bitrate').value, 10), res:parseInt($('resSel').value, 10) || 720, fps:parseInt($('fpsSel').value, 10) === 60 ? 60 : 30, enc:$('encSel').value || 'veryfast', rc:$('rcSel').value === 'vbr' ? 'vbr' : 'cbr', kf:parseInt($('kfSel').value, 10) || 2, ll:$('llSel').value === '0' ? 0 : 1, abr:parseInt($('abrSel').value, 10) || 128, ach:$('achSel').value === '1' ? 1 : 2 });
$('saveBtn').onclick = async () => {
  settings = collectSettings();
  const r = await api.saveSettings(settings);
  if(r.ok){ toast(t('saved')); $('ov').classList.remove('open'); renderChip(); } else toast(t('saveFail') + r.error);
};

/* ================= Streaming (نظام البث والربط مع Kick: نفس المنطق الأصلي بدون تغيير) ================= */
let rec = null, outStream = null, outCv = null, audioCtx = null, micStream = null, live = false, tInt = null, t0 = 0, busy = false;
let statusState = { k:'ready', raw:'' };
function setStatus(k){ statusState = { k, raw:'' }; renderStatus(); }
function setStatusRaw(txt){ statusState = { k:'', raw:txt }; renderStatus(); }
function renderStatus(){ const x = statusState.k ? t(statusState.k) : statusState.raw; $('status').textContent = x; $('cpStatus').textContent = x; }
const setTimer = x => { $('timer').textContent = x; $('cpTimer').textContent = x; };
function renderGo(){ $('go').innerHTML = live ? ic('stop', 18) + `<span>${t('stopStream')}</span>` : ic('play', 18) + `<span>${t('startStream')}</span>`; }
function renderChip(){
  const c = $('kickChip'); c.classList.toggle('live', document.body.classList.contains('live')); c.classList.toggle('ready', !document.body.classList.contains('live') && !!(settings.kickUrl && settings.kickKey));
  $('kickChipT').textContent = document.body.classList.contains('live') ? t('kickLive') : (settings.kickUrl && settings.kickKey ? t('kickReady') : t('kickNotSet'));
}
function fmt(s){ return [s / 3600 | 0, (s / 60 | 0) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':'); }

async function buildAudio(){
  audioCtx = new AudioContext({ sampleRate:48000 });
  const dest = audioCtx.createMediaStreamDestination();
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  gain.gain.value = 0; osc.connect(gain); gain.connect(dest); osc.start(); // مسار صوت صامت دايماً
  try{ const m = getMixer(); if(m.ctx.state === 'suspended') m.ctx.resume(); audioCtx.createMediaStreamSource(m.dest.stream).connect(dest); }catch(e){} // صوت الخلاط (الصوتيات والفيديوهات)
  return dest.stream.getAudioTracks()[0];
}

/* الكاميرا والشاشة تُعاد فتحها بدقة البث الجديدة إذا تغيّرت الدقة */
const capKeyNow = () => capDim().join('x') + '@' + (settings.fps === 60 ? 60 : 30);
function refreshCaps(){ let changed = false; Object.keys(streams).forEach(id => { if(streams[id].key !== capKeyNow()){ stopCap(id); changed = true; } }); if(changed){ capFailed.clear(); syncCaps(); } }
function cleanup(){
  try{ if(rec && rec.state !== 'inactive') rec.stop(); }catch(e){}
  rec = null; outHook = null; outCv = null; frameMs = 33;
  if(outStream){ outStream.getTracks().forEach(x => x.stop()); outStream = null; }
  if(micStream){ micStream.getTracks().forEach(x => x.stop()); micStream = null; }
  if(audioCtx){ audioCtx.close().catch(() => {}); audioCtx = null; }
  clearInterval(tInt); live = false; busy = false;
  document.body.classList.remove('live'); setDelay(null);
  renderGo(); $('go').disabled = false; setTimer('00:00:00'); renderChip();
}

async function startStream(){
  if(!settings.kickUrl || !settings.kickKey){
    toast(t('setKickFirst')); openSettings('streaming'); return;
  }
  busy = true; $('go').disabled = true; setStatus('connecting');
  const r = await api.startStream(settings);
  if(!r.ok){ setStatus('ready'); toast('❌ ' + tm(r.error)); busy = false; $('go').disabled = false; return; }
  try{
    const audio = await buildAudio();
    const fps = settings.fps === 60 ? 60 : 30, dim = window.SQ ? SQ.dims(settings.res) : [CW, CH];
    frameMs = Math.round(1000 / fps);
    let srcCv = cv;
    if(dim[0] !== cv.width || dim[1] !== cv.height){     // دقة بث أعلى (1080p / 2K / 4K): نرسم المشهد من جديد بدقة البث نفسها (مش تكبير لصورة 720p)
      outCv = document.createElement('canvas'); outCv.width = dim[0]; outCv.height = dim[1];
      const oc = outCv.getContext('2d', { alpha:false }); oc.imageSmoothingEnabled = true; oc.imageSmoothingQuality = 'high';
      const k = dim[0] / CW;
      outHook = () => { try{ if(trans) oc.drawImage(cv, 0, 0, dim[0], dim[1]); else drawScene(oc, k); }catch(e){} };   // أثناء الانتقال بين المشاهد فقط (نصف ثانية) نستخدم إطار الانتقال المكبّر
      outHook(); srcCv = outCv;
    }
    if(window.SQ) SQ.onStart({ res:settings.res, fps, bitrate:settings.bitrate, dim, native:srcCv !== cv });
    try{ refreshCaps(); }catch(e){}
    outStream = srcCv.captureStream(fps);
    if(audio) outStream.addTrack(audio);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm';
    rec = new MediaRecorder(outStream, { mimeType:mime, videoBitsPerSecond:window.SQ ? SQ.vbps(settings.bitrate, dim) : 5000000, audioBitsPerSecond:192000 });
    rec.ondataavailable = async e => { if(e.data && e.data.size > 0) api.sendChunk(await e.data.arrayBuffer()); };
    rec.start(250);
    live = true; renderGo(); $('go').disabled = false;
  }catch(e){
    await api.stopStream(); cleanup(); setStatus('ready'); toast(t('errPrefix') + e.message);
  }
}
async function stopStream(){ await api.stopStream(); cleanup(); setStatus('stoppedMsg'); }

$('go').onclick = () => { if(busy && !live) return; live ? stopStream() : startStream(); };

api.onStatus(p => {
  if(p.state === 'live'){
    document.body.classList.add('live'); setStatus('liveOn'); t0 = Date.now(); renderChip();
    try{ if(window.KChatReset) KChatReset('app'); }catch(e){}
    clearInterval(tInt); tInt = setInterval(() => setTimer(fmt((Date.now() - t0) / 1000 | 0)), 500);
  } else if(p.state === 'stopped' || p.state === 'error'){
    if(live || busy){ cleanup(); }
    const m = tm(p.message);
    if(m) setStatusRaw('⚠ ' + m); else setStatus('stoppedMsg');
    if(m) toast(m, 6000);
  }
});

/* ================= Mic quick control ================= */
const micItems = () => S.scenes.flatMap(sc => sc.items.filter(i => i.type === 'mic'));
const micMuted = () => { const l = micItems(); return l.length > 0 && l.every(i => i.muted); };
function setMic(on){
  const l = micItems(); if(!l.length){ toast(t('noMic')); return; }
  l.forEach(i => { i.muted = !on; applyVol(i); }); renderMixer(); persist(); toast(t(on ? 'micOnToast' : 'micOffToast'), 1800);
}
function renderMicBtn(){
  const b = $('micBtn'); if(!b) return; const l = micItems(), m = micMuted();
  b.classList.toggle('mic-on', l.length > 0 && !m); b.classList.toggle('mic-off', m);
  b.querySelector('i').innerHTML = ic(m ? 'micoff' : 'mic'); $('micBtnT').textContent = !l.length ? t('micAdd') : t(m ? 'micMuted' : 'micLive');
}

/* ================= Hotkeys (اختصارات: تبديل مشهد / بدء وإيقاف البث / المايك) ================= */
let hotkeys = []; try{ hotkeys = JSON.parse(LS.get('se_hotkeys', '[]')) || []; }catch(e){ hotkeys = []; }
hotkeys = hotkeys.filter(h => h && typeof h.id === 'string' && typeof h.action === 'string');
let hkGlobal = LS.get('se_hkglobal', '1') === '1', hkRec = null, lastFire = { id:'', ts:0 };
const saveHk = () => LS.set('se_hotkeys', JSON.stringify(hotkeys));
function keyName(c){
  if(/^Key[A-Z]$/.test(c)) return c.slice(3);
  if(/^Digit\d$/.test(c)) return c.slice(5);
  if(/^F([1-9]|1\d|2[0-4])$/.test(c)) return c;
  if(/^Numpad\d$/.test(c)) return 'num' + c.slice(6);
  const m = { ArrowUp:'Up', ArrowDown:'Down', ArrowLeft:'Left', ArrowRight:'Right', Space:'Space', Enter:'Enter', Tab:'Tab', Backspace:'Backspace', Delete:'Delete', Insert:'Insert', Home:'Home', End:'End', PageUp:'PageUp', PageDown:'PageDown', Minus:'-', Equal:'=', Comma:',', Period:'.', Slash:'/', Semicolon:';', Quote:"'", Backquote:'`', BracketLeft:'[', BracketRight:']', Backslash:'\\', NumpadAdd:'numadd', NumpadSubtract:'numsub', NumpadMultiply:'nummult', NumpadDivide:'numdiv', NumpadDecimal:'numdec' };
  return m[c] || '';
}
function comboOf(e){
  const k = keyName(e.code); if(!k) return '';
  const m = []; if(e.ctrlKey) m.push('Ctrl'); if(e.altKey) m.push('Alt'); if(e.shiftKey) m.push('Shift'); if(e.metaKey) m.push('Super');
  return m.concat(k).join('+');
}
const isPlain = c => { const p = c.split('+'), k = p[p.length - 1]; return p.length === 1 && !/^F\d+$/.test(k); }; // أي زر مسموح، ونحذّر فقط من المفاتيح العادية
const keysHtml = c => c.split('+').map(k => `<kbd>${esc(k)}</kbd>`).join('');
async function applyHotkeys(){
  if(!window.api || !api.setHotkeys) return;
  const list = hkGlobal && !hkRec ? hotkeys.filter(h => h.combo).map(h => ({ id:h.id, combo:h.combo })) : [];
  try{
    const r = await api.setHotkeys(list);
    if(r && r.failed && r.failed.length){ const n = r.failed.map(id => hotkeys.find(h => h.id === id)).filter(Boolean).map(h => h.combo).join(', '); if(n) toast('⚠ ' + t('hkFail') + n, 6500); }
  }catch(e){}
}
const HK_BASE = [['start', 'hkStart'], ['stop', 'hkStop'], ['toggle', 'hkToggle'], ['micOn', 'hkMicOn'], ['micOff', 'hkMicOff'], ['micToggle', 'hkMicToggle'], ['next', 'hkNext'], ['prev', 'hkPrev']];
function actionLabel(a){
  if(a.startsWith('scene:')){ const sc = S.scenes.find(x => x.id === a.slice(6)); return t('hkScene') + (sc ? sc.name : t('hkDeleted')); }
  const b = HK_BASE.find(x => x[0] === a); return b ? t(b[1]) : a;
}
const hkActions = () => HK_BASE.slice(0, 3).map(([v, k]) => [v, t(k)]).concat(S.scenes.map(sc => ['scene:' + sc.id, t('hkScene') + sc.name]), HK_BASE.slice(3).map(([v, k]) => [v, t(k)]));
function renderCpHk(){
  const el = $('cpHk'); if(!el) return; const l = hotkeys.filter(h => h.combo);
  el.innerHTML = l.length ? l.map(h => `<div class="cp-hk-i"><span>${esc(actionLabel(h.action))}</span><span class="keys">${keysHtml(h.combo)}</span></div>`).join('') : `<div class="cp-hk-none">${esc(t('hkEmpty'))}</div>`;
}
function renderHk(){
  const el = $('hkList'); if(!el) return;
  el.innerHTML = hotkeys.length ? hotkeys.map(h => {
    const opts = hkActions(); if(!opts.some(o => o[0] === h.action)) opts.push([h.action, actionLabel(h.action)]);
    const rec = hkRec === h.id;
    return `<div class="hk-row" data-id="${esc(h.id)}"><select data-hk="action">${opts.map(([v, l]) => `<option value="${esc(v)}" ${v === h.action ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select><button class="hk-key ${rec ? 'rec' : ''} ${h.combo ? '' : 'empty'}" data-hk="rec">${rec ? esc(t('hkPress')) : (h.combo ? keysHtml(h.combo) : esc(t('hkNoKey')))}</button><button class="icon-btn" data-hk="del" title="${esc(t('hkClear'))}">${ic('trash', 15)}</button></div>`;
  }).join('') : `<div class="empty">${esc(t('hkEmpty'))}</div>`;
  renderCpHk();
}
function startRec(id){ hkRec = id; renderHk(); applyHotkeys(); }
function stopRec(){ hkRec = null; renderHk(); applyHotkeys(); }
$('hkAdd').onclick = () => { const h = { id:uid(), action:'toggle', combo:'' }; hotkeys.push(h); saveHk(); startRec(h.id); };
$('hkList').addEventListener('change', e => { const r = e.target.closest('.hk-row'), h = r && hotkeys.find(x => x.id === r.dataset.id); if(h && e.target.dataset.hk === 'action'){ h.action = e.target.value; saveHk(); renderCpHk(); } });
$('hkList').addEventListener('click', e => {
  const b = e.target.closest('[data-hk]'), r = e.target.closest('.hk-row'); if(!b || !r) return; const id = r.dataset.id;
  if(b.dataset.hk === 'rec') startRec(id);
  else if(b.dataset.hk === 'del'){ hotkeys = hotkeys.filter(x => x.id !== id); saveHk(); if(hkRec === id) hkRec = null; renderHk(); applyHotkeys(); }
});
$('hkGlobal').onchange = () => { hkGlobal = $('hkGlobal').checked; LS.set('se_hkglobal', hkGlobal ? '1' : '0'); applyHotkeys(); };
window.addEventListener('keydown', e => { // تسجيل اختصار جديد
  if(!hkRec) return; e.preventDefault(); e.stopImmediatePropagation();
  if(['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
  if(e.key === 'Escape'){ stopRec(); return; }
  const h = hotkeys.find(x => x.id === hkRec); if(!h){ stopRec(); return; }
  if((e.key === 'Backspace' || e.key === 'Delete') && !e.ctrlKey && !e.altKey && !e.shiftKey){ h.combo = ''; saveHk(); stopRec(); return; }
  const c = comboOf(e); if(!c) return;
  if(hotkeys.some(x => x !== h && x.combo === c)){ toast(t('hkDup')); return; }
  h.combo = c; saveHk(); stopRec();
  if(hkGlobal && isPlain(c)) toast(t('hkPlainWarn'), 5200);
}, true);
window.addEventListener('keydown', e => { // تنفيذ الاختصار والبرنامج في المقدمة
  if(hkRec || e.repeat) return; const c = comboOf(e); if(!c) return;
  const h = hotkeys.find(x => x.combo === c); if(!h) return;
  const tg = e.target && e.target.tagName; // المفتاح العادي لا ينفذ أثناء الكتابة في خانة أو عند فتح نافذة
  if(isPlain(c) && (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || document.querySelector('.overlay.open'))) return;
  e.preventDefault(); e.stopImmediatePropagation(); fireHotkey(h.id);
}, true);
function runAction(a){
  if(a.startsWith('scene:')){ const id = a.slice(6); if(S.scenes.some(s => s.id === id)) switchScene(id); return; }
  if(a === 'start'){ if(live || busy) toast(t('alreadyLive')); else startStream(); }
  else if(a === 'stop'){ if(live) stopStream(); else toast(t('notLive')); }
  else if(a === 'toggle'){ if(busy && !live) return; live ? stopStream() : startStream(); }
  else if(a === 'micOn') setMic(true); else if(a === 'micOff') setMic(false); else if(a === 'micToggle') setMic(micMuted());
  else if(a === 'next' || a === 'prev'){ const n = S.scenes.length, i = S.scenes.indexOf(cur()); switchScene(S.scenes[(i + (a === 'next' ? 1 : -1) + n) % n].id); }
}
function fireHotkey(id){
  const now = Date.now(); if(lastFire.id === id && now - lastFire.ts < 250) return; lastFire = { id, ts:now };
  const h = hotkeys.find(x => x.id === id); if(!h) return; runAction(h.action);
  if(h.action.startsWith('scene:') || h.action === 'next' || h.action === 'prev') toast('🎬 ' + cur().name, 1500);
}
if(window.api && api.onHotkey) api.onHotkey(id => fireHotkey(id));

/* ================= Init ================= */
paintIcons();
S = loadScenes(); HIST.cur = histSnap(); loadSceneMaster();
applyTheme(); applyGuides(); applyDock();
applyLook(); applyI18n(); renderAll();
S.scenes.forEach(sc => sc.items.forEach(i => { if(i.type === 'image') loadImg(i.assetId); }));
enterScene(cur()); setStatus('ready');
api.loadSettings().then(s => { settings = s; renderChip(); });
applyHotkeys();
