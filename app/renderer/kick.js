'use strict';
/* ============================================================
   Kick integration (renderer side) — v1.11
   نظام جديد ومبسّط:
   - الشات: يقرأ رسائل Kick لحظياً (Pusher) ويرسل عبر API الرسمي.
       * اللي تكتبه في Kick يظهر هنا مرة وحدة.
       * اللي تكتبه هنا يظهر هنا مرة وحدة وفي Kick مرة وحدة (بدون تكرار).
   - معلومات البث: العنوان + التصنيف (قائمة بحث) + اللغة + محتوى +18 + الوسوم، وزر حفظ يحفظها في Kick.
   - المشاهدين والمتابعين: من main.js (API الرسمي + واجهة الموقع).
   ============================================================ */
(() => {
  // مفتاح Pusher ثابت لكن الـ cluster قد يتغير (خطأ 4001): نأخذ الرابط الحقيقي من صفحة Kick نفسها، وإلا نجرّب الـ clusters بالتتابع
  const PUSHER_KEY = '32cbd69e4b950bf97679';
  const PUSHER_HOSTS = ['ws-us2.pusher.com', 'ws-mt1.pusher.com', 'ws-us3.pusher.com', 'ws-eu.pusher.com', 'ws-ap1.pusher.com', 'ws-ap2.pusher.com', 'ws-ap3.pusher.com', 'ws-ap4.pusher.com', 'ws-sa1.pusher.com'];
  const pusherUrl = h => `wss://${h}/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;
  const POLL_MS = 2000;      // تحديث صامت كل ثانيتين (بدون أي إشعار أو كتابة في الشات)
  const MAX_MSGS = 1500;      // عدد الرسائل الظاهرة (السجل المحفوظ أكبر)
  const LANGS = ['Arabic', 'English', 'Spanish', 'French', 'German', 'Portuguese', 'Turkish', 'Russian', 'Italian', 'Japanese', 'Korean', 'Chinese', 'Hindi', 'Indonesian', 'Polish', 'Dutch', 'Swedish', 'Ukrainian', 'Persian', 'Vietnamese', 'Thai', 'Greek', 'Hebrew', 'Romanian', 'Czech', 'Other'];
  const CAT_SEEDS = ['just chatting', 'irl', 'music', 'gta', 'minecraft', 'valorant', 'fortnite', 'call of duty', 'slots', 'counter-strike'];
  const EMOJIS = '😀 😁 😂 🤣 😊 😍 😘 😎 🤩 🥳 😇 🙂 😉 😋 😜 🤪 🤔 🤭 😴 😮 😱 😭 😢 😡 🤬 🥺 😅 😬 🙄 😏 👍 👎 👏 🙌 🙏 💪 👀 🔥 ✨ ⭐ 💯 ❤️ 💔 💜 💚 🎉 🎁 🏆 🎮 🎵 💀 👑 🚀 ⚡ 🌹 ☕ 🍕'.split(' ');

  /* ---------- icons ---------- */
  Object.assign(IC, {
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    reply: '<polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
    star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>',
    gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"/>'
  });

  /* ---------- i18n ---------- */
  Object.assign(I18N.ar, {
    kDiagT: 'تشخيص الشات وإصلاحه', kDiagOpen: 'فتح نافذة Kick للتحقق', kDiagRestart: 'إعادة تشغيل الشات', kDiagCopy: 'نسخ التقرير', kDiagClose: 'إغلاق',
    kDiagHelp: 'إذا الرسائل ما تظهر: اضغط \"فتح نافذة Kick للتحقق\"، وإذا طلبت Kick التحقق (Cloudflare) أكمله مرة وحدة وانتظر ظهور الشات في النافذة، ثم أغلقها (تتخبأ فقط وتكمل تقرأ الشات) واضغط \"إعادة تشغيل الشات\".',
    kHint: 'الشات ما وصلت له رسائل بعد. اضغط زر ⓘ (تشخيص الشات) تحت الشات لمعرفة السبب وإصلاحه.',
    kStOk: 'يعمل', kStNo: 'لا', kStWait: 'جاري...',
    kChat: 'Kick', kViewers: 'المشاهدين الآن', kFollowers: 'المتابعين', kickTab: 'ربط Kick',
    kStepsT: 'طريقة الربط (مرة وحدة فقط):',
    kStep1: 'افتح kick.com ← Settings ← Developer ← أنشئ تطبيق جديد (Create app).',
    kStep2: 'ضع الـ Redirect URL بالضبط مثل اللي تحت (لازم يتطابق حرف بحرف).',
    kStep3: 'انسخ Client ID و Client Secret والصقهم تحت، بعدين اضغط "حفظ وربط".',
    kOpenDev: 'افتح صفحة المطور في Kick',
    kRedirect: 'رابط إعادة التوجيه (Redirect URL)', kClientId: 'Client ID', kClientSecret: 'Client Secret',
    kChannel: 'اسم القناة أو رابط الشات (اختياري)', kChannelHint: 'تقدر تلصق رابط مثل https://kick.com/popout/اسمك/chat أو اسم القناة فقط. اتركه فاضي لتستخدم قناتك.',
    kConnect: 'حفظ وربط مع Kick', kSaveApply: 'حفظ التغييرات', kDisconnect: 'فصل الحساب',
    kSavedNote: '🔒 بيانات الربط تتحفظ دائماً (AppData\\StreamExtra + نسخة احتياطية) وتبقى كما هي حتى لو بنيت نسخة جديدة من الـ ZIP. تحتاج تدخلها مرة وحدة فقط.',
    kConnectedAs: 'متصل بحساب {n}', kNotConnected: 'غير متصل', kWaitBrowser: 'أكمل الموافقة في المتصفح الذي انفتح...',
    kLinked: '✅ تم ربط Kick', kUnlinked: 'تم فصل الحساب',
    kErrNoApp: 'أدخل Client ID و Client Secret أولاً', kErrRedirect: 'الـ Redirect URL لازم يكون بالشكل: http://localhost:8787/callback',
    kErrPort: 'المنفذ مشغول. غيّر رقمه في الـ Redirect URL (وفي تطبيق المطور بنفس الرقم).',
    kErrTimeout: 'انتهت المهلة. جرّب مرة ثانية.', kErrAuth: 'انتهت صلاحية الربط. أعد الربط من الإعدادات.', kErrBusy: 'عملية ربط شغالة حالياً',
    kRoomLbl: 'رقم غرفة الشات (اختياري)', kRoomHint: 'استخدمه فقط لو الشات ما ظهر. افتح https://kick.com/api/v2/channels/اسم_القناة في المتصفح وانسخ الرقم الذي بعد "chatroom":{"id": ثم الصقه هنا.',
    /* chat */
    kMsgPh: 'أرسل رسالة', kSendLbl: 'الدردشة', kReplyTo: 'ردّ على {n}', kNewMsgs: 'رسائل جديدة', kExpand: 'تكبير / تصغير', kEdit: 'تعديل',
    kNeed: 'اكتب اسم قناتك على Kick (الإعدادات ← ربط Kick ← اسم القناة) وسيظهر الشات هنا مباشرة بدون أي ربط. الربط الكامل فقط لإرسال الرسائل وعدد المشاهدين.', kNeedBtn: 'إعداد الشات',
    kWait: 'جاري الاتصال بالشات...', kOn: 'متصل بالشات ✔ — بانتظار الرسائل',
    kNoRoom2: 'تعذر جلب غرفة الشات من Kick (غالباً حماية Cloudflare). أحاول بطرق بديلة كل ثواني. لو استمر: ضع رقم الغرفة يدوياً في الإعدادات ← ربط Kick.',
    kSendFail: 'تعذر إرسال الرسالة: ', kOffline: 'غير مباشر', kReauth: 'إعادة الربط',
    kAuthLost: 'انتهت صلاحية الربط مع Kick. افتح الإعدادات ← ربط Kick وأعد الربط.',
    kNotSent: 'Kick ما أرسلت الرسالة (ممكن الشات للمتابعين فقط أو أنت مكتوم).', kMention: 'منشن', kReply: 'ردّ', kDeleted: '(محذوفة)',
    kEmotesT: 'إيموجيات القناة', kEmojisT: 'إيموجي', kNoEmotes: 'ما قدرت أجيب إيموجيات القناة الآن.',
    /* stream info */
    kTabChat: 'الدردشة', kTabInfo: 'معلومات البث',
    kBrCf: 'Kick طلبت التحقق (Cloudflare). افتح الإعدادات ← ربط Kick، وسجّل دخول موقع Kick مرة وحدة، ثم أعد تشغيل البرنامج.', kBrFail: 'تعذر فتح صفحة شات Kick. تأكد من الإنترنت واسم القناة.',
    kInfTags: 'الوسوم (Tags)', kInfTagsPh: 'اكتب وسماً واضغط Enter', kInfNoTitle: 'بدون عنوان', kInfViewers: '{n} مشاهد',
    kInfTitle: 'اسم البث', kInfCat: 'التصنيف (Category)', kInfLang: 'اللغة', kInfMature: 'محتوى للبالغين (+18)', kInfSave: 'حفظ في Kick',
    kInfNeed: 'تعديل معلومات البث يحتاج صلاحية إضافية. اضغط "إعادة الربط" ووافق مرة وحدة.',
    kInfSaved: 'تم حفظ معلومات البث في Kick', kInfFail: 'تعذر حفظ معلومات البث: ', kInfBadCat: 'اختر التصنيف من القائمة', kInfNoCat: 'اختر تصنيف',
    kCatSearch: 'ابحث عن تصنيف... (مثلاً IRL)', kCatNone: 'ما فيه نتائج',
    kWebOk: 'تم حفظ اللغة و +18 أيضاً ✔',
    kWebLoginNote: 'انحفظ العنوان والتصنيف على Kick. اللغة ومحتوى +18 ما تنحفظ من حساب المطوّر (Kick ما توفّر لها API رسمي)، غيّرها من لوحة Kick.',
    kWebRejNote: 'انحفظ العنوان والتصنيف على Kick، لكن Kick ما قبلت تغيير اللغة من خارج موقعها (ما فيهم API رسمي). غيّرهم من لوحة Kick.',
    kWebLogin: 'تسجيل دخول موقع Kick', kWebDash: 'فتح لوحة Kick', cancel: 'إلغاء',
    kAutoLogin: 'اربط حساب المطوّر من الإعدادات ← ربط Kick ← خيارات متقدمة ليشتغل كل شي.',
    kWebLoggedOk: 'تم تسجيل دخول حسابك وربطه بالموقع تلقائياً — الأوامر جاهزة',
    kWebLoginHelp: 'أسهل طريقة للإرسال والأوامر: سجّل دخول موقع Kick مرة وحدة من الزر التالي (بدون تطبيق مطوّر). بعد تسجيل الدخول أغلق نافذة Kick وارجع هنا.',
    kNeedLoginSend: 'اربط حساب المطوّر أولاً لتتمكن من الكتابة (الإعدادات ← ربط Kick).',
    kSyncOn: '⇄ متزامن مع Kick · الإرسال عبر {h}', kSyncWait: '⇄ جاري الاتصال بشات Kick... · الإرسال عبر {h}', kSyncApi: 'الربط الرسمي', kSyncWeb: 'حسابك في موقع Kick',
    kSyncReadOnly: 'قراءة فقط · للإرسال اربط حساب المطوّر من ⚙'
  });
  Object.assign(I18N.en, {
    kDiagT: 'Chat diagnostics & fix', kDiagOpen: 'Open Kick window to verify', kDiagRestart: 'Restart chat', kDiagCopy: 'Copy report', kDiagClose: 'Close',
    kDiagHelp: 'If messages do not show: press \"Open Kick window to verify\", complete the Kick (Cloudflare) check once and wait until the chat appears in that window, then close it (it only hides and keeps reading chat) and press \"Restart chat\".',
    kHint: 'No chat messages received yet. Press the ⓘ (chat diagnostics) button under the chat to see why and fix it.',
    kStOk: 'OK', kStNo: 'No', kStWait: 'Working...',
    kChat: 'Kick', kViewers: 'Viewers now', kFollowers: 'Followers', kickTab: 'Kick link',
    kStepsT: 'How to link (one time only):',
    kStep1: 'Open kick.com → Settings → Developer → Create app.',
    kStep2: 'Set the Redirect URL exactly as shown below (it must match character by character).',
    kStep3: 'Copy the Client ID and Client Secret, paste them below, then press "Save & connect".',
    kOpenDev: 'Open Kick developer page',
    kRedirect: 'Redirect URL', kClientId: 'Client ID', kClientSecret: 'Client Secret',
    kChannel: 'Channel name or chat link (optional)', kChannelHint: 'Paste a link like https://kick.com/popout/yourname/chat or just the channel name. Leave empty to use your own channel.',
    kConnect: 'Save & connect to Kick', kSaveApply: 'Save changes', kDisconnect: 'Disconnect account',
    kSavedNote: '🔒 Your link data is always saved (AppData\\StreamExtra + a backup copy) and stays as is even if you build a new version from a new ZIP. You only enter it once.',
    kConnectedAs: 'Connected as {n}', kNotConnected: 'Not connected', kWaitBrowser: 'Finish the approval in the browser that just opened...',
    kLinked: '✅ Kick connected', kUnlinked: 'Account disconnected',
    kErrNoApp: 'Enter the Client ID and Client Secret first', kErrRedirect: 'Redirect URL must look like: http://localhost:8787/callback',
    kErrPort: 'The port is busy. Change its number in the Redirect URL (and in your developer app too).',
    kErrTimeout: 'Timed out. Try again.', kErrAuth: 'The Kick login expired. Reconnect from Settings.', kErrBusy: 'A connection is already in progress',
    kRoomLbl: 'Chat room ID (optional)', kRoomHint: 'Only use it if chat does not show up. Open https://kick.com/api/v2/channels/CHANNEL in your browser, copy the number after "chatroom":{"id": and paste it here.',
    kMsgPh: 'Send a message', kSendLbl: 'Chat', kReplyTo: 'Replying to {n}', kNewMsgs: 'New messages', kExpand: 'Expand / collapse', kEdit: 'Edit',
    kNeed: 'Type your Kick channel name (Settings → Kick link → Channel name) and the chat shows here right away, no login needed. Full linking is only for sending messages and viewer counts.', kNeedBtn: 'Set up chat',
    kWait: 'Connecting to chat...', kOn: 'Connected to chat ✔ — waiting for messages',
    kNoRoom2: 'Could not get the chat room from Kick (usually Cloudflare). Trying other ways every few seconds. If it keeps failing: enter the room ID manually in Settings → Kick link.',
    kSendFail: 'Could not send the message: ', kOffline: 'Offline', kReauth: 'Reconnect',
    kAuthLost: 'The Kick login expired. Open Settings → Kick link and reconnect.',
    kNotSent: 'Kick did not deliver the message (followers-only chat, or you are timed out).', kMention: 'Mention', kReply: 'Reply', kDeleted: '(deleted)',
    kEmotesT: 'Channel emotes', kEmojisT: 'Emoji', kNoEmotes: 'Could not load the channel emotes right now.',
    kTabChat: 'Chat', kTabInfo: 'Stream info',
    kBrCf: 'Kick asked for verification (Cloudflare). Open Settings → Kick link, log in to the Kick website once, then restart the app.', kBrFail: 'Could not open the Kick chat page. Check the internet and the channel name.',
    kInfTags: 'Tags', kInfTagsPh: 'Type a tag and press Enter', kInfNoTitle: 'No title', kInfViewers: '{n} viewers',
    kInfTitle: 'Stream title', kInfCat: 'Category', kInfLang: 'Language', kInfMature: 'Mature content (18+)', kInfSave: 'Save to Kick',
    kInfNeed: 'Editing stream info needs one extra permission. Press "Reconnect" and approve once.',
    kInfSaved: 'Stream info saved to Kick', kInfFail: 'Could not save stream info: ', kInfBadCat: 'Pick the category from the list', kInfNoCat: 'Pick a category',
    kCatSearch: 'Search a category... (e.g. IRL)', kCatNone: 'No results',
    kWebOk: 'Language and 18+ were saved too ✔',
    kWebLoginNote: 'Title and category were saved on Kick. Language and 18+ cannot be saved through the developer account (no official API); change them from the Kick dashboard.',
    kWebRejNote: 'Title and category were saved on Kick, but Kick did not accept the language change from outside its website (there is no official API for it). Change it from the Kick dashboard.',
    kWebLogin: 'Log in to Kick website', kWebDash: 'Open Kick dashboard', cancel: 'Cancel',
    kAutoLogin: 'Link your developer account from Settings → Kick link → Advanced so everything works.',
    kWebLoggedOk: 'Your account is logged in and linked to the website automatically — commands are ready',
    kWebLoginHelp: 'Easiest way to send and use commands: log in to the Kick website once with the button below (no developer app needed). Then close the Kick window and come back here.',
    kNeedLoginSend: 'Link your developer account first to be able to write (Settings → Kick link).',
    kSyncOn: '⇄ Synced with Kick · sending via {h}', kSyncWait: '⇄ Connecting to Kick chat... · sending via {h}', kSyncApi: 'official link', kSyncWeb: 'your Kick website account',
    kSyncReadOnly: 'Read only · to send, link your developer account from ⚙'
  });

  /* ---------- v1.4: شات جديد بتصميم احترافي — نصوص إضافية (تغلب القديمة) ---------- */
  Object.assign(I18N.ar, {
    kSendLbl: 'إرسال', kMsgPh: 'اكتب رسالة للشات...', kYou: 'أنت', kCopy: 'نسخ', kCopied: 'تم نسخ الرسالة', kMention: 'منشن',
    kLoginT: 'اربط حساب المطوّر لتتمكن من الكتابة', kLoginS: 'مرة واحدة فقط، ويبقى الربط محفوظاً بعدها', kLoginBtn: 'ربط الحساب',
    kOnbT: 'شات قناتك على Kick', kOnbS: 'اكتب اسم القناة وسيظهر الشات هنا مباشرة، بدون أي ربط أو مفاتيح.', kOnbPh: 'اسم القناة أو الرابط', kOnbBtn: 'ابدأ الشات', kNeedBtn: 'إعدادات متقدمة',
    kSyncOn: 'متصل · جاهز للإرسال', kSyncWait: 'جاري الاتصال بالشات...', kSyncReadOnly: 'قراءة فقط · للإرسال اربط حساب المطوّر من ⚙',
    kNeedLoginSend: 'اربط حساب المطوّر أولاً لتتمكن من الكتابة (الإعدادات ← ربط Kick).',
    kkChanT: 'القناة', kkChanS: 'قناة Kick التي تريد عرض شاتها', kkSendT: 'الكتابة في الشات', kkSendS: 'تشتغل عبر حساب المطوّر المربوط (الإعدادات ← ربط Kick ← خيارات متقدمة)',
    kkLogged: 'الحساب مربوط ✔', kkNotLogged: 'غير مربوط',
    kChannel: 'اسم القناة أو رابط الشات', kChannelHint: 'اكتب اسم القناة فقط، أو الصق رابط الشات (kick.com/popout/NAME/chat)',
    kAdvT: 'ربط حساب المطوّر (مطلوب للكتابة والإشراف)', kAdvNote: 'يُستخدم لقراءة الإحصائيات والكتابة في الشات والإشراف وتعديل معلومات البث. كل شي في البرنامج يعمل عبر حساب المطوّر هذا فقط (ما في تسجيل دخول Google ولا دخول موقع).',
    kSaveChat: 'حفظ وتشغيل الشات',
    kLoginKick: 'تسجيل الدخول بـ Kick', kLogoutKick: 'تسجيل الخروج / تبديل الحساب',
    kLoginHint: 'يفتح Google Chrome ويسجّل دخولك تلقائياً بحسابك المفتوح في المتصفح، اضغط «سماح» وارجع للبرنامج.',
    kLoginNoApp: 'ما في تطبيق Kick مضبوط بعد. أنشئ تطبيق من صفحة المطوّر ثم الصق Client ID و Secret (مرة وحدة) في الخيارات المتقدمة، أو ضعهم في kick-app.json قبل البناء.'
  });
  Object.assign(I18N.en, {
    kSendLbl: 'Send', kMsgPh: 'Write a message...', kYou: 'You', kCopy: 'Copy', kCopied: 'Message copied', kMention: 'Mention',
    kLoginT: 'Link your developer account to start chatting', kLoginS: 'One time only, the link stays saved afterwards', kLoginBtn: 'Link account',
    kOnbT: 'Your Kick channel chat', kOnbS: 'Type the channel name and the chat shows up right here, with no linking or keys.', kOnbPh: 'Channel name or link', kOnbBtn: 'Start chat', kNeedBtn: 'Advanced settings',
    kSyncOn: 'Connected · ready to send', kSyncWait: 'Connecting to chat...', kSyncReadOnly: 'Read only · to send, link your developer account from ⚙',
    kNeedLoginSend: 'Link your developer account first to be able to write (Settings → Kick link).',
    kkChanT: 'Channel', kkChanS: 'The Kick channel whose chat you want to show', kkSendT: 'Writing in chat', kkSendS: 'Works through the linked developer account (Settings → Kick link → Advanced)',
    kkLogged: 'Account linked ✔', kkNotLogged: 'Not linked',
    kChannel: 'Channel name or chat link', kChannelHint: 'Type just the channel name, or paste the chat link (kick.com/popout/NAME/chat)',
    kAdvT: 'Link developer account (required for writing and moderation)', kAdvNote: 'Used for stats, writing in chat, moderation and editing stream info. Everything in the app works through this developer account only (no Google or website sign-in).',
    kSaveChat: 'Save & start chat',
    kLoginKick: 'Sign in with Kick', kLogoutKick: 'Sign out / switch account',
    kLoginHint: 'Opens Google Chrome and signs you in automatically with the account already open in the browser. Click Allow and return to the app.',
    kLoginNoApp: 'No Kick app is set up yet. Create one on the developer page and paste Client ID & Secret (once) in Advanced options, or put them in kick-app.json before building.'
  });

  /* ---------- v1.3.0: نصوص تسجيل الدخول بحساب Kick (تغلب القديمة) ---------- */
  Object.assign(I18N.ar, {
    kkSendT: 'تسجيل الدخول بحساب Kick', kkSendS: 'سجّل دخول حسابك على موقع Kick (بدون تطبيق مطوّر) لتشتغل الكتابة والأوامر',
    kLoginKick: 'تسجيل الدخول بحساب Kick', kLogoutKick: 'تسجيل الخروج',
    kLoginHint: 'تنفتح نافذة Kick داخل البرنامج: سجّل دخولك بحسابك مرة وحدة وتنغلق لحالها، ويبقى الدخول محفوظاً.',
    kWebOpening: 'جاري فتح نافذة تسجيل الدخول...', kWebOk: 'تم تسجيل الدخول {n}', kWebFail: 'ما تم تسجيل الدخول. جرّب مرة ثانية أو استخدم الطريقة البديلة (لصق session_token).', kWebOut: 'تم تسجيل الخروج',
    kTokT: 'طريقة بديلة: لصق session_token (إذا Google منع الدخول داخل البرنامج)', kTokHelp: 'في متصفحك المسجّل دخول: kick.com ← F12 ← Application ← Cookies ← kick.com ← انسخ قيمة session_token والصقها هنا.', kTokBtn: 'حفظ', kTokBad: 'القيمة غير صالحة.',
    kNeedLoginSend: 'سجّل دخول حسابك على Kick أولاً (الإعدادات ← ربط Kick ← تسجيل الدخول).',
    kSyncReadOnly: 'قراءة فقط · للإرسال سجّل دخولك من ⚙', kkLogged: 'تم تسجيل الدخول ✔', kkNotLogged: 'غير مسجّل',
    kNewStream: '— بدأ بث جديد: تم تصفير الشات —', kNewStreamApp: '— بدأت بث جديد: تم تصفير الشات —', kRestored: '— سجل الشات المحفوظ من البث السابق —',
    kLoginT: 'سجّل دخول حسابك لتتمكن من الكتابة', kLoginBtn: 'تسجيل الدخول',
    kAdvT: 'ربط حساب المطوّر (اختياري)', kAdvNote: 'اختياري. الأوامر والإرسال تشتغل بتسجيل دخول حسابك فوق. ربط المطوّر يضيف الإحصائيات الرسمية والإشراف عبر API.'
  });
  Object.assign(I18N.en, {
    kkSendT: 'Sign in with your Kick account', kkSendS: 'Sign in to your account on the Kick website (no developer app) so chat and commands work',
    kLoginKick: 'Sign in with Kick account', kLogoutKick: 'Sign out',
    kLoginHint: 'A Kick window opens inside the app: sign in to your account once and it closes by itself. The login stays saved.',
    kWebOpening: 'Opening the sign-in window...', kWebOk: 'Signed in {n}', kWebFail: 'Sign-in did not complete. Try again or use the alternative (paste session_token).', kWebOut: 'Signed out',
    kTokT: 'Alternative: paste session_token (if Google blocks sign-in inside the app)', kTokHelp: 'In your normal browser while logged in: kick.com → F12 → Application → Cookies → kick.com → copy the session_token value and paste it here.', kTokBtn: 'Save', kTokBad: 'Invalid value.',
    kNeedLoginSend: 'Sign in to your Kick account first (Settings → Kick link → Sign in).',
    kSyncReadOnly: 'Read only · sign in from ⚙ to send', kkLogged: 'Signed in ✔', kkNotLogged: 'Not signed in',
    kNewStream: '— New stream started: chat was reset —', kNewStreamApp: '— You started a new stream: chat was reset —', kRestored: '— Saved chat log from the previous stream —',
    kLoginT: 'Sign in to your account to chat', kLoginBtn: 'Sign in',
    kAdvT: 'Link developer account (optional)', kAdvNote: 'Optional. Commands and sending work with the account sign-in above. Developer link adds official stats and API moderation.'
  });

  /* ---------- state ---------- */
  const K = {
    cfg: null, stats: null, ws: null, room: 0, chan: 0, gen: 0, retry: 0, retryT: null, poll: null, want: false,
    seen: new Set(), reply: null, warnedRoom: false, busy: false, tab: 'chat', roomT: null,
    dirty: false, selCat: null, cats: new Map(), catT: null, seeds: null,
    wl: false, wu: null, dd: new Map(), pending: [], bridgeSlug: '', bridgeOk: false, emotes: null, emoMap: new Map(), emoLoaded: '', pickerOpen: false, divider: null, newCount: 0
  };
  const nf = n => (n == null || isNaN(n)) ? '–' : Number(n).toLocaleString('en-US');
  const connected = () => !!(K.cfg && K.cfg.connected);
  // v1.3.0: الإرسال بحساب المطوّر الرسمي أو بتسجيل دخول حسابك على موقع Kick
  const canSend = () => connected() || !!K.wl;
  // v1.2: الشات يشتغل بمجرد كتابة اسم القناة (بدون ربط المطوّر). الإرسال/الإحصائيات فقط تحتاج الربط.
  const chatOk = () => !!(K.cfg && (K.cfg.connected || (K.cfg.channel && String(K.cfg.channel).trim())));
  const chatEl = () => $('kChat');
  const meName = () => (K.cfg && K.cfg.user && (K.cfg.user.name || K.cfg.user.slug)) || (K.wu && K.wu.name) || '';
  const meId = () => (K.cfg && K.cfg.user && K.cfg.user.id != null ? K.cfg.user.id : (K.wu && K.wu.id != null ? K.wu.id : null));
  const isOwn = id => { const m = meId(); return m != null && id != null && String(m) === String(id); };

  /* ---------- stats UI ---------- */
  function paintStats(){
    const st = K.stats, on = connected() && st;
    const v = on ? st.viewers : null, f = on ? st.followers : null;
    const set = (id, val) => { const b = $(id).querySelector('b'); if(b) b.textContent = nf(val); };
    set('kViews', v); set('kFollows', f); set('kHdrViews', v); set('kHdrFol', f);
    $('kViews').classList.toggle('off', !(on && st.live));
    $('kViews').title = t('kViewers') + (on && !st.live ? ' · ' + t('kOffline') : '');
    $('kHdrViews').hidden = $('kHdrFol').hidden = !connected();
    { const ks = document.querySelector('#dkKick .k-stats'); if(ks) ks.hidden = !connected(); }
    try{ const dh = window.KX && KX.demoHeader && KX.demoHeader(); if(dh){ set('kViews', dh.v); set('kFollows', dh.f); $('kViews').classList.remove('off'); const ks2 = document.querySelector('#dkKick .k-stats'); if(ks2) ks2.hidden = false; } }catch(e){}
  }
  function setDot(s){ const d = $('kDot'); d.classList.toggle('on', s === 'on'); d.classList.toggle('wait', s === 'wait'); try{ paintSync(); }catch(e){} }

  /* ---------- tabs + expand ---------- */
  const PANE_OF = { chat: 'kpChat', session: 'kpSession', activity: 'kpActivity', mod: 'kpMod', channel: 'kpChannel', info: 'kpInfo' };
  function showTab(n){
    K.tab = n;
    document.querySelectorAll('#kTabs [data-kt]').forEach(b => b.classList.toggle('on', b.dataset.kt === n));
    PANE_OF && Object.keys(PANE_OF).forEach(k => $(PANE_OF[k]).classList.toggle('on', k === n));
    if(n === 'chat'){ const el = chatEl(); el.scrollTop = el.scrollHeight; }
    if(n === 'info') paintInfo();
    if(window.KX){ KX.cfgChanged(); }
  }
  document.querySelectorAll('#kTabs [data-kt]').forEach(b => b.onclick = () => showTab(b.dataset.kt));
  $('kBig').onclick = () => document.body.classList.toggle('k-bigmode');
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.body.classList.contains('k-bigmode') && !K.pickerOpen) document.body.classList.remove('k-bigmode'); });
  $('kGear').onclick = () => openSettings('kick');

  /* ---------- chat rendering ---------- */
  const atBottom = el => el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  function hideNew(){
    K.newCount = 0; $('kNewBtn').hidden = true;
    if(K.divider){ const d = K.divider; K.divider = null; setTimeout(() => d.remove(), 1800); }
  }
  chatEl().addEventListener('scroll', () => { if(atBottom(chatEl())) hideNew(); });
  $('kNewBtn').onclick = () => { const el = chatEl(); el.scrollTop = el.scrollHeight; hideNew(); };

  function pushNode(node, counts){
    const el = chatEl(), stick = atBottom(el);
    el.querySelectorAll('.k-empty').forEach(n => n.remove());
    if(!stick && counts){
      if(!K.divider){ const d = document.createElement('div'); d.className = 'k-newdiv'; d.innerHTML = `<span>${esc(t('kNewMsgs'))}</span>`; el.appendChild(d); K.divider = d; }
      K.newCount++; const b = $('kNewBtn'); b.hidden = false; b.textContent = '↓ ' + t('kNewMsgs') + (K.newCount > 1 ? ' (' + (K.newCount > 99 ? '99+' : K.newCount) + ')' : '');
    }
    el.appendChild(node);
    while(el.children.length > MAX_MSGS) el.removeChild(el.firstChild);
    if(stick) el.scrollTop = el.scrollHeight;
  }
  function sys(text){ const d = document.createElement('div'); d.className = 'k-sys'; d.textContent = text; pushNode(d, false); }
  window.KSys = text => sys(text);
  function showEmpty(){
    const el = chatEl(); el.innerHTML = '';
    const d = document.createElement('div'); d.className = 'k-empty';
    d.innerHTML = `<div class="k-onb"><span class="k-onb-ic">${ic('chat', 26)}</span><b>${esc(t('kOnbT'))}</b><p>${esc(t('kOnbS'))}</p>
      <form class="k-onb-f" id="kOnbForm" autocomplete="off"><input type="text" id="kOnbIn" dir="ltr" spellcheck="false" placeholder="${esc(t('kOnbPh'))}"><button class="k-login-btn" type="submit">${esc(t('kOnbBtn'))}</button></form>
      <button class="k-onb-link" type="button" id="kNeedBtn">${esc(t('kNeedBtn'))}</button></div>`;
    el.appendChild(d);
    $('kNeedBtn').onclick = () => openSettings('kick');
    $('kOnbForm').onsubmit = async e => {
      e.preventDefault();
      const v = $('kOnbIn').value.trim(); if(!v) return;
      try{ K.cfg = await api.kickSave({ channel: v }); }catch(err){ return; }
      fillKick(); renderEnabled(); if(chatOk()) startAll();
    };
  }
  function renderEnabled(){
    const can = canSend(), ready = chatOk();
    $('kMsg').disabled = !can; $('kSendBtn').disabled = !can; $('kEmoBtn').disabled = !can;
    $('kSendForm').hidden = !can;                       // بدون تسجيل دخول: يظهر زر تسجيل الدخول بدل خانة الكتابة
    $('kLogin').hidden = can || !ready;
    paintSync();
    $('kMsg').placeholder = t('kMsgPh');
    const rt = $('kReplyTag'); rt.hidden = !K.reply;
    if(K.reply) $('kReplyT').textContent = t('kReplyTo', { n: K.reply.user });
    const sl = ready ? localSlug() : ''; const ce = $('kChan'); ce.textContent = sl; ce.hidden = !sl;
    if(!ready && !chatEl().querySelector('.k-empty')) showEmpty();
    paintCount();
    try{ paintEmbed(); }catch(e){}
  }
  function paintCount(){
    const n = $('kMsg').value.length, c = $('kCount');
    c.textContent = n ? n + '/500' : ''; c.classList.toggle('warn', n > 440);
  }
  $('kMsg').addEventListener('input', paintCount);
  $('kLoginBtn').onclick = () => openSettings('kick');

  /* ---------- الشات المضمّن: صفحة Kick الرسمية https://kick.com/popout/<اسم الحساب المربوط>/chat ----------
     تظهر مكان قائمة الرسائل مع تغيير الخلفية (تتبع الوضع الليلي/النهاري للبرنامج) وتنسيق شكل الرسائل.
     نظام استقبال الرسائل (Pusher + جسر الصفحة) يبقى شغّال بالخلفية: الأوامر والأحداث والتشخيص وقائمة الرسائل الاحتياطية.
     إذا تعذّر فتح الصفحة المضمّنة نرجع تلقائياً لقائمة الرسائل الداخلية. */
  K.emb = { wv: null, slug: '', key: null, ok: true };
  const embedSlug = () => String((K.cfg && K.cfg.user && K.cfg.user.slug) || '').toLowerCase() || localSlug();
  function embedCss(){
    const wrap = document.querySelector('.k-chatwrap');
    const bg = (wrap && getComputedStyle(wrap).backgroundColor) || '#0c0c0e';
    const txt = (getComputedStyle(document.documentElement).getPropertyValue('--txt') || '#f4f4f5').trim();
    const light = document.documentElement.dataset.theme === 'light';
    return `
html{color-scheme:${light ? 'light' : 'dark'}!important}
html,body,*:has([data-chat-entry]){background:${bg}!important;background-color:${bg}!important}
body{color:${txt}!important}
[data-chat-entry]{background:transparent!important;margin:0!important;padding:3px 8px!important;border-radius:6px!important;font-size:13px!important;line-height:1.55!important;word-break:break-word!important;overflow-wrap:anywhere!important}
[data-chat-entry]:hover{background:rgba(127,127,127,.14)!important}
[data-chat-entry] .chat-entry-username,[data-chat-entry] [class*="chat-entry-username"]{font-weight:800!important}
[data-chat-entry] .chat-entry-content,[data-chat-entry] [class*="chat-entry-content"]{color:${txt}!important}
[data-chat-entry] img{vertical-align:middle!important}
::-webkit-scrollbar{width:9px}::-webkit-scrollbar-thumb{background:rgba(127,127,127,.4);border-radius:8px}::-webkit-scrollbar-track{background:transparent}`;
  }
  async function embedStyle(){
    const wv = K.emb.wv; if(!wv) return;
    try{
      if(K.emb.key){ try{ await wv.removeInsertedCSS(K.emb.key); }catch(e){} K.emb.key = null; }
      K.emb.key = await wv.insertCSS(embedCss());
    }catch(e){}
  }
  new MutationObserver(() => setTimeout(embedStyle, 60)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  function paintEmbed(){        // v1.4: الشات يُرسم بالكامل داخل البرنامج بتصميم خاص، فلا نعرض صفحة Kick نفسها
    const wrap = document.querySelector('.k-chatwrap'), box = $('kEmbed');
    if(K.emb.wv && box){ box.innerHTML = ''; K.emb.wv = null; K.emb.slug = ''; K.emb.key = null; }
    if(box) box.hidden = true; if(wrap) wrap.classList.remove('has-embed');
  }

  const BADGE_ICON = { broadcaster: 'radio', moderator: 'shield', vip: 'star', og: 'star', founder: 'zap', verified: 'check', sub_gifter: 'gift' };
  function badgesHtml(list){
    return (Array.isArray(list) ? list : []).map(b => {
      if(!b || !b.type) return '';
      const ty = String(b.type).replace(/[^a-z_]/gi, '');
      if(ty === 'subscriber'){
        const n = parseInt(b.count, 10);
        return `<span class="k-bd k-bd-sub" title="${esc(b.text || 'Subscriber')}">${n > 0 ? n : ic('star', 11)}</span>`;
      }
      return BADGE_ICON[ty] ? `<span class="k-bd k-bd-${ty}" title="${esc(b.text || ty)}">${ic(BADGE_ICON[ty], 11)}</span>` : '';
    }).join('');
  }
  function contentHtml(text){
    const re = /\[emote:(\d+):([^\]]*)\]/g; let out = '', last = 0, m;
    while((m = re.exec(text))){
      out += esc(text.slice(last, m.index));
      out += `<img class="k-emo" src="https://files.kick.com/emotes/${m[1]}/fullsize" alt="${esc(m[2])}" title="${esc(m[2])}" onerror="this.replaceWith(document.createTextNode(this.alt))">`;
      last = re.lastIndex;
    }
    return out + esc(text.slice(last));
  }
  const plain = s => String(s || '').replace(/\[emote:\d+:([^\]]*)\]/g, '$1');

  /* ---- الشات الجديد: مصدر واحد + منع التكرار برقم الرسالة ----
     كل رسالة لها id من Kick. نفس الرسالة قد تصل من أكثر من قناة (Pusher مباشر + الجسر) فنعرضها مرة واحدة فقط.
     رسالتك المرسلة من البرنامج: نعرضها فوراً بنفس الـ id اللي رجّعته Kick، فلما توصل النسخة الأصلية تُتجاهل (ما تتكرر). */
  const msgKey = d => {
    if(d.id) return 'i' + d.id;
    const who = (d.sender && d.sender.username || '').toLowerCase();
    return 'c' + who + '|' + plain(d.content) + '|' + (d.created_at || '');
  };
  function claimPending(d){           // رسالتك أرسلتها من هنا ولم نعرف رقمها → النسخة الأصلية تحل محل المؤقتة
    const me = meName().toLowerCase(), who = String(d.sender && d.sender.username || '').toLowerCase();
    if(me && who !== me) return;                 // اسمك معروف: نطابق الاسم + النص. غير معروف: النص فقط (خلال 20 ثانية)
    const pl = plain(d.content), now = Date.now();
    K.pending = K.pending.filter(p => now - p.t < 20000);
    const i = K.pending.findIndex(p => p.text === pl);
    if(i >= 0){ const p = K.pending.splice(i, 1)[0]; if(p.node && p.node.parentNode) p.node.remove(); }
  }
  // لون ثابت للاسم لو Kick ما أرسلت لوناً + وقت الرسالة + نسخ النص
  function hueOf(name){ let h = 0; for(const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'hsl(' + (h % 360) + ' 68% 60%)'; }
  function timeOf(iso){
    let dt = iso ? new Date(iso) : new Date(); if(isNaN(dt.getTime())) dt = new Date();
    return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  function copyText(txt){
    const done = () => toast('✔ ' + t('kCopied'), 1800);
    try{ navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done)); }catch(e){ fallbackCopy(txt, done); }
  }
  function fallbackCopy(txt, done){
    try{ const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done(); }catch(e){}
  }
  /* ---------- أرشيف الشات: يُحفظ من بداية البث حتى نهايته ويبقى بعد إيقاف البث وإعادة تشغيل البرنامج، ويُصفَّر عند بدء بث جديد ---------- */
  const LOG_MAX = 3000, LOG_KEY = 'se_kchatlog', SESS_KEY = 'se_ksess';
  K.log = []; K.logSlug = ''; K.lastReset = 0; let logT = null;
  const slim = d => ({ id: d.id, type: d.type, created_at: d.created_at, content: d.content, metadata: d.metadata && d.metadata.original_sender ? { original_sender: { username: d.metadata.original_sender.username }, original_message: { content: d.metadata.original_message && d.metadata.original_message.content } } : undefined,
    sender: { id: d.sender.id, username: d.sender.username, profile_picture: d.sender.profile_picture || d.sender.profile_pic, identity: d.sender.identity ? { color: d.sender.identity.color, badges: d.sender.identity.badges } : undefined } });
  function saveLog(){
    clearTimeout(logT);
    logT = setTimeout(() => { try{ LS.set(LOG_KEY, JSON.stringify({ slug: K.logSlug, list: K.log })); }catch(e){ try{ K.log = K.log.slice(-800); LS.set(LOG_KEY, JSON.stringify({ slug: K.logSlug, list: K.log })); }catch(x){} } }, 1500);
  }
  function logMsg(d){
    try{ K.log.push(slim(d)); if(K.log.length > LOG_MAX) K.log.splice(0, K.log.length - LOG_MAX); saveLog(); }catch(e){}
  }
  function restoreLog(){
    let o = null; try{ o = JSON.parse(LS.get(LOG_KEY, '')); }catch(e){}
    const sl = localSlug();
    if(!o || !Array.isArray(o.list) || !o.list.length || (sl && o.slug && o.slug !== sl)){ K.log = []; K.logSlug = sl; return 0; }
    K.log = o.list.slice(-LOG_MAX); K.logSlug = o.slug || sl;
    K.log.forEach(m => { try{ addMsg(Object.assign({ __restore: 1 }, m)); }catch(e){} });
    return K.log.length;
  }
  function resetChat(reason){
    K.log = []; K.logSlug = localSlug(); K.lastReset = Date.now(); K.seen.clear(); K.pending = []; K.newCount = 0; K.divider = null;
    try{ LS.set(LOG_KEY, JSON.stringify({ slug: K.logSlug, list: [] })); }catch(e){}
    const el = chatEl(); if(el) el.innerHTML = ''; const b = $('kNewBtn'); if(b) b.hidden = true;
    if(K.want) sys(t(reason === 'app' ? 'kNewStreamApp' : 'kNewStream'));
  }
  window.KChatReset = resetChat;
  /* بث جديد على Kick = بداية جلسة جديدة (live + startedAt مختلف) */
  function checkSession(st){
    try{
      if(!st || !st.live || !st.startedAt) return;
      const id = (st.slug || '') + '|' + st.startedAt, prev = LS.get(SESS_KEY, '');
      if(prev === id) return;
      LS.set(SESS_KEY, id);
      if(prev && prev.split('|')[0] === (st.slug || '') && Date.now() - K.lastReset > 600000) resetChat('kick');
      else if(prev && prev.split('|')[0] !== (st.slug || '')) resetChat('kick');
    }catch(e){}
  }
  K.drops = { nosender: 0, seen: 0, dup: 0 }; K.evl = [];
  function addMsg(d, local){
    const rs = !!(d && d.__restore);
    if(!d || !d.sender){ K.drops.nosender++; return; }
    const key = msgKey(d);
    if(K.seen.has(key)){ K.drops.seen++; return; }
    K.seen.add(key); if(K.seen.size > 4000) K.seen.delete(K.seen.values().next().value);
    const id = d.id ? String(d.id) : '';
    if(!rs){   // نفس الرسالة من مصدرين (Pusher / صفحة Kick): نعرضها مرة وحدة. العدّ لكل مصدر يسمح بتكرار نفس النص فعلاً (مثلاً j ثم j)
      const src = d.__dom ? 'd' : 'p', now = Date.now(), ck = String(d.sender.username || '').toLowerCase() + '|' + plain(d.content);
      for(const [k, v] of K.dd) if(now - v.t > 20000) K.dd.delete(k);
      const e = K.dd.get(ck) || { t: now, d: 0, p: 0 };
      e.t = now; e[src]++; K.dd.set(ck, e);
      const other = src === 'd' ? e.p : e.d;
      if(e[src] <= other){ K.seen.add(key); K.drops.dup++; return; }
    }
    if(!local && !rs){
      claimPending(d);
      const me = meName().toLowerCase();
      if(me && String(d.sender.username || '').toLowerCase() === me){ K.lastOwn = (K.lastOwn || []).filter(x => Date.now() - x.t < 8000); K.lastOwn.push({ text: plain(d.content), t: Date.now() }); }
    }
    const name = d.sender.username || '?';
    const idn = d.sender.identity || {};
    const color = /^#[0-9a-f]{3,8}$/i.test(idn.color || '') ? idn.color : hueOf(name);
    const txt = plain(d.content);
    const me = meName().toLowerCase();
    const own = local || (me && name.toLowerCase() === me) || isOwn(d.sender.id);
    const mention = !own && !!me && txt.toLowerCase().includes('@' + me);
    let reply = '';
    if(d.type === 'reply' && d.metadata && d.metadata.original_sender){
      const os = d.metadata.original_sender.username || '', oc = (d.metadata.original_message && d.metadata.original_message.content) || '';
      reply = `<div class="k-rep">${ic('reply', 11)}<b>${esc(os)}</b><span>${esc(plain(oc))}</span></div>`;
    }
    const div = document.createElement('div');
    div.className = 'k-msg' + (own ? ' k-own' : '') + (mention ? ' k-mention' : '');
    div.dataset.id = id; div.dataset.user = name; div.dataset.txt = txt; if(d.sender.id != null) div.dataset.uid = String(d.sender.id);
    div.style.setProperty('--c', color);
    const acts = `<span class="k-acts"><button class="k-rb" type="button" data-ma="reply" title="${esc(t('kReply'))}">${ic('reply', 13)}</button><button class="k-rb" type="button" data-ma="at" title="${esc(t('kMention'))}">${ic('at', 13)}</button><button class="k-rb" type="button" data-ma="copy" title="${esc(t('kCopy'))}">${ic('copy', 13)}</button>${id ? modBtns(d, id) : ''}</span>`;
    div.innerHTML = `${reply}<div class="k-row"><span class="k-avw"><b>${esc(Array.from(name)[0] ? Array.from(name)[0].toUpperCase() : '?')}</b></span><div class="k-main"><div class="k-line">${badgesHtml(idn.badges)}<span class="k-u" title="${esc(t('kMention'))}">${esc(name)}</span><time class="k-time" dir="ltr">${esc(timeOf(d.created_at))}</time></div><div class="k-t">${contentHtml(String(d.content || ''))}</div></div></div>${acts}`;
    pushNode(div, !local && !rs);
    { const pp = d.sender.profile_picture || d.sender.profile_pic; if(pp) paintAv(div, pp); else wantAvatar(d.sender.id, div); }
    if(!local && !rs && window.KX) KX.msg(d);
    if(!rs) logMsg(d);
    return div;
  }
  /* صورة الحساب: من الرسالة لو موجودة، وإلا من API الرسمي (دفعات صغيرة + تخزين مؤقت). لو غير متوفرة ما تظهر شي. */
  K.av = new Map(); K.avq = new Set(); K.avT = null;
  function paintAv(node, url){
    if(!url || !/^https:\/\//i.test(String(url)) || node.querySelector('.k-av')) return;
    const box = node.querySelector('.k-avw'); if(!box) return;
    const im = document.createElement('img'); im.className = 'k-av'; im.alt = ''; im.referrerPolicy = 'no-referrer'; im.loading = 'lazy';
    im.onerror = () => im.remove(); im.src = url; box.appendChild(im);
  }
  function wantAvatar(id, node){
    if(id == null || !connected()) return; id = String(id);
    const u = K.av.get(id); if(u !== undefined){ if(u) paintAv(node, u); return; }
    K.avq.add(id); clearTimeout(K.avT); K.avT = setTimeout(flushAv, 500);
  }
  async function flushAv(){
    const ids = Array.from(K.avq).slice(0, 50); ids.forEach(i => K.avq.delete(i));
    if(!ids.length || !connected()) return;
    let r = null; try{ r = await api.kickAvatars(ids); }catch(e){ return; }
    if(!r || !r.ok) return;
    ids.forEach(i => K.av.set(i, (r.avatars && r.avatars[i]) || ''));
    chatEl().querySelectorAll('.k-msg').forEach(n => { const u = n.dataset.uid && K.av.get(n.dataset.uid); if(u) paintAv(n, u); });
    if(K.avq.size) K.avT = setTimeout(flushAv, 500);
  }
  // أزرار المشرف تظهر عند التمرير على الرسالة (لو الصلاحية موجودة ولو الرسالة مو لك)
  function modBtns(d, id){
    const c = K.cfg || {}; if(!canSend() || isOwn(d.sender.id)) return '';
    let h = '';
    if(!c.connected || c.canDelete) h += `<button class="k-rb k-mb" type="button" data-ma="del" title="${esc(t('kxDelBtn'))}">${ic('trash', 13)}</button>`;
    if(!c.connected || (c.canBan && d.sender.id != null)){
      h += `<button class="k-rb k-mb" type="button" data-ma="to" title="${esc(t('kxToBtn'))}">${ic('timer', 13)}</button>`;
      h += `<button class="k-rb k-mb" type="button" data-ma="ban" title="${esc(t('kxBanBtn'))}">${ic('ban', 13)}</button>`;
    }
    return h;
  }
  function markDeleted(id){
    if(!id) return;
    chatEl().querySelectorAll('.k-msg').forEach(n => { if(n.dataset.id === String(id)) n.classList.add('del'); });
  }
  function mentionUser(name){
    if(!canSend()){ toast(t('kNeedLoginSend'), 4000); return; }
    const inp = $('kMsg'); inp.value = (inp.value ? inp.value.replace(/\s*$/, ' ') : '') + '@' + name + ' '; inp.focus(); paintCount();
  }
  chatEl().addEventListener('click', e => {
    const m = e.target.closest('.k-msg'); if(!m) return;
    const mb = e.target.closest('[data-ma]'), act = mb && mb.dataset.ma;
    if(act === 'copy'){ copyText(m.dataset.txt || ''); return; }               // النسخ والمنشن يشتغلون حتى بدون تسجيل دخول
    if(act === 'at'){ mentionUser(m.dataset.user); return; }
    if(!canSend()){ if(mb || e.target.closest('.k-u')) toast(t('kNeedLoginSend'), 4000); return; }
    if(act === 'reply' && m.dataset.id){ setReply({ id: m.dataset.id, user: m.dataset.user, uid: m.dataset.uid }); return; }
    if(mb && (window.KC || window.KX) && ['del', 'to', 'ban'].includes(act)){
      const user = m.dataset.user, uid = m.dataset.uid, mid = m.dataset.id;
      const doMod = a => (window.KC ? KC.mod(a) : KX.doMod(a));
      if(act === 'del'){ doMod({ action: 'delete', messageId: mid, user }).then(ok => { if(ok) markDeleted(mid); }); }
      else if(act === 'to'){ doMod({ action: 'timeout', userId: uid, minutes: 10, user }); }
      else {
        dlg({ title: t('kxBanBtn'), body: `<div>${esc(t('kxBanAsk', { u: user }))}</div>`, actions: [
          { label: t('kxYes'), kind: 'danger', cb: () => { doMod({ action: 'ban', userId: uid, user }); return true; } },
          { label: t('kxNo') }
        ] });
      }
      return;
    }
    if(e.target.closest('.k-u')) mentionUser(m.dataset.user);                  // الضغط على الاسم = منشن
  });
  function setReply(r){ K.reply = r; renderEnabled(); $('kMsg').focus(); }
  $('kReplyX').onclick = () => { K.reply = null; renderEnabled(); };
  $('kMsg').addEventListener('keydown', e => { if(e.key === 'Escape' && K.reply){ K.reply = null; renderEnabled(); } });

  /* ---------- emotes + emoji picker ---------- */
  function insertAtCursor(txt){
    const inp = $('kMsg'), a = inp.selectionStart == null ? inp.value.length : inp.selectionStart, b = inp.selectionEnd == null ? a : inp.selectionEnd;
    const before = inp.value.slice(0, a), after = inp.value.slice(b);
    const pre = before && !/\s$/.test(before) ? ' ' : '';
    inp.value = before + pre + txt + ' ' + after;
    const pos = (before + pre + txt + ' ').length; inp.focus(); try{ inp.setSelectionRange(pos, pos); }catch(e){}
  }
  async function loadEmotes(){
    const slug = (K.stats && K.stats.slug) || '';
    if(!slug || K.emoLoaded === slug) return;
    K.emoLoaded = slug;
    let r; try{ r = await api.kickEmotes(slug); }catch(e){ r = null; }
    if(!r || !r.ok){ K.emoLoaded = ''; return; }
    K.emotes = r.groups; K.emoMap = new Map();
    r.groups.forEach(g => g.emotes.forEach(x => { if(!K.emoMap.has(x.name)) K.emoMap.set(x.name, x.id); }));
    paintEmoRow(); if(K.pickerOpen) paintPicker();
  }
  const emoImg = x => `<button type="button" class="k-eb" data-emo="${esc(x.name)}" title="${esc(x.name)}"><img src="https://files.kick.com/emotes/${x.id}/fullsize" alt="${esc(x.name)}" loading="lazy"></button>`;
  function paintEmoRow(){
    const all = []; (K.emotes || []).forEach(g => g.emotes.forEach(x => all.push(x)));
    $('kEmoRow').innerHTML = all.slice(0, 11).map(emoImg).join('');
  }
  function paintPicker(){
    const groups = (K.emotes || []).map(g => `<div class="k-pg"><div class="k-pt">${esc(g.name)}</div><div class="k-pgrid">${g.emotes.map(emoImg).join('')}</div></div>`).join('');
    const emo = `<div class="k-pg"><div class="k-pt">${esc(t('kEmojisT'))}</div><div class="k-pgrid">${EMOJIS.map(e => `<button type="button" class="k-eb k-ex" data-emo="${e}">${e}</button>`).join('')}</div></div>`;
    $('kPicker').innerHTML = (groups || `<div class="k-pt">${esc(t('kNoEmotes'))}</div>`) + emo;
  }
  function togglePicker(force){
    K.pickerOpen = force != null ? force : !K.pickerOpen;
    $('kPicker').hidden = !K.pickerOpen;
    if(K.pickerOpen){ paintPicker(); loadEmotes(); }
  }
  $('kEmoBtn').onclick = e => { e.stopPropagation(); togglePicker(); };
  document.addEventListener('click', e => { if(K.pickerOpen && !e.target.closest('#kPicker') && !e.target.closest('#kEmoBtn')) togglePicker(false); });
  $('kPicker').addEventListener('click', e => { const b = e.target.closest('[data-emo]'); if(b) insertAtCursor(b.dataset.emo); });
  $('kEmoRow').addEventListener('click', e => { const b = e.target.closest('[data-emo]'); if(b) insertAtCursor(b.dataset.emo); });

  /* ---------- send ---------- */
  function errText(r){
    if(!r) return '';
    if(r.code === 'auth') return t('kErrAuth');
    if(r.code === 'net') return 'offline';
    return r.error || r.code || '';
  }
  // أسماء الإيموجيات المعروفة تتحول لصيغة Kick [emote:id:name] وقت الإرسال
  const toKickText = txt => txt.replace(/\S+/g, w => K.emoMap.has(w) ? `[emote:${K.emoMap.get(w)}:${w}]` : w);
  /* إرسال رسالة للشات عبر API الرسمي (حساب المطوّر) */
  async function sendChat(kt, reply){
    if(!canSend()) return { ok: false, code: 'webLogin' };
    try{ return await api.kickSend({ text: kt, broadcasterId: K.stats && K.stats.userId, replyTo: reply && reply.id, chatroomId: K.room || 0 }); }
    catch(err){ return { ok: false, code: 'fail', error: String(err && err.message || err) }; }
  }
  window.KSend = (text, reply) => sendChat(toKickText(text), reply);
  $('kSendForm').onsubmit = async e => {
    e.preventDefault();
    const text = $('kMsg').value.trim(); if(!text || !canSend() || K.sending) return;
    const reply = K.reply; K.sending = true; $('kSendBtn').disabled = true;
    $('kMsg').value = ''; K.reply = null; renderEnabled(); togglePicker(false);
    const kt = toKickText(text);
    const r = await sendChat(kt, reply);
    K.sending = false; $('kSendBtn').disabled = !canSend();
    if(!r.ok){
      toast(r.code === 'webLogin' ? t('kNeedLoginSend') : (t('kSendFail') + errText(r)), 5000); $('kMsg').value = text;
      if(r.code === 'auth' && !K.wl) onAuthLost();
      return;
    }
    if(r.sent === false){ toast(t('kNotSent'), 6000); return; }
    showMine(kt, r.id, reply);
  };
  // رسالتك تظهر فوراً مرة وحدة. لو Kick رجّعت رقم الرسالة نسجله (فالنسخة الأصلية لا تتكرر)،
  // وإذا لا، نعرضها كمؤقتة وتُستبدل بالأصلية أول ما توصل.
  function showMine(kt, id, reply){
    const d = { id: id || '', content: kt, type: 'message', created_at: '', sender: { id: meId(), username: meName() || t('kYou'), identity: { color: '', badges: [] } } };
    if(reply && reply.id) d.type = 'message';
    if(!id && (K.lastOwn || []).some(x => x.text === plain(kt) && Date.now() - x.t < 8000)) return;   // الأصلية وصلت قبل رد الإرسال
    const node = addMsg(d, true);
    if(!id && node){ node.classList.add('k-echo'); K.pending.push({ text: plain(kt), t: Date.now(), node }); }
    const el = chatEl(); el.scrollTop = el.scrollHeight; hideNew();
  }

  /* ---------- stream info (view + edit + save to Kick) ---------- */
  const langFB = () => LS.get('se_klang', '');
  const matFB = () => LS.get('se_kmature', '');
  const curLang = () => (K.stats && K.stats.language) || langFB() || '';
  const curMat = () => (K.stats && K.stats.mature != null) ? !!K.stats.mature : (matFB() === '1');
  function thumbHtml(name, thumb){
    const ch = esc((name || '?').trim().charAt(0).toUpperCase());
    return `<b>${ch}</b>` + (thumb ? `<img src="${esc(thumb)}" alt="" onerror="this.style.display='none'">` : '');
  }
  function setThumb(el, name, thumb){ el.innerHTML = thumbHtml(name, thumb); }
  async function catThumb(name){
    if(!name) return '';
    const k = name.toLowerCase(), c = K.cats.get(k);
    if(c && c.thumb !== undefined) return c.thumb;
    try{
      const r = await api.kickCategories(name);
      if(r && r.ok){ r.list.forEach(x => K.cats.set(String(x.name).toLowerCase(), x)); }
    }catch(e){}
    const c2 = K.cats.get(k); return c2 ? c2.thumb : '';
  }
  function paintInfo(){
    const on = connected(), st = K.stats;
    $('kInfNeed').hidden = !(on && K.cfg && !K.cfg.canWrite);
    ['kInfTitleIn', 'kInfLangIn', 'kInfMatIn', 'kCatBtn', 'kInfSave', 'kInfTagsIn'].forEach(id => { $(id).disabled = !on; });
    paintInfoPrev();
    if(K.dirty) return;                       // لا نكتب فوق شي المستخدم يعدله الآن
    const act = document.activeElement;
    if(act && $('kInfForm').contains(act) && /^(INPUT|SELECT)$/.test(act.tagName)) return;
    const sig = [st && st.title, st && st.category, curLang(), curMat(), on, st && (st.tags || []).join(',')].join('|');
    if(sig === K.infoSig) return;             // ما تغيّر شي: لا نعيد رسم الحقول (التحديث صامت)
    K.infoSig = sig;
    fillInfoForm();
  }
  /* بطاقة معاينة معلومات البث (نفس اللي يشوفه المشاهدين) + محرر الوسوم */
  K.tags = [];
  function paintTags(){
    $('kTagsChips').innerHTML = K.tags.map((tg, i) => `<span class="kc-chip">${esc(tg)}<button type="button" data-ti="${i}">${ic('x', 11)}</button></span>`).join('');
  }
  function addTag(v){
    v = String(v || '').replace(/^#/, '').trim().slice(0, 30); if(!v) return;
    if(K.tags.length >= 10 || K.tags.some(x => x.toLowerCase() === v.toLowerCase())){ $('kInfTagsIn').value = ''; return; }
    K.tags.push(v); K.dirty = true; $('kInfTagsIn').value = ''; paintTags();
  }
  $('kInfTagsIn').addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ','){ e.preventDefault(); addTag($('kInfTagsIn').value); }
    else if(e.key === 'Backspace' && !$('kInfTagsIn').value && K.tags.length){ K.tags.pop(); K.dirty = true; paintTags(); }
  });
  $('kInfTagsIn').addEventListener('blur', () => addTag($('kInfTagsIn').value));
  $('kTagsChips').addEventListener('click', e => { const b = e.target.closest('button[data-ti]'); if(!b) return; K.tags.splice(parseInt(b.dataset.ti, 10), 1); K.dirty = true; paintTags(); });
  $('kTagsBox').addEventListener('click', e => { if(!e.target.closest('button')) $('kInfTagsIn').focus(); });
  function paintInfoPrev(){
    if(!$('kInfPrev')) return;   // v1.3.0: بطاقة المعاينة العلوية حُذفت من صفحة معلومات البث
    const st = K.stats || {}, live = !!st.live;
    const pill = $('kipStatus'); pill.classList.toggle('live', live); pill.textContent = live ? t('kxLive') : t('kxOff');
    $('kipViewers').textContent = live && st.viewers != null ? t('kInfViewers', { n: Number(st.viewers).toLocaleString('en-US') }) : '';
    const title = st.title || '', cat = st.category || '';
    $('kipTitle').textContent = title || t('kInfNoTitle');
    $('kipCat').textContent = cat || t('kInfNoCat');
    const th = cat ? ((K.cats.get(cat.toLowerCase()) || {}).thumb || '') : '';
    const sg = cat + '|' + th; if($('kipThumb').__sg !== sg){ $('kipThumb').__sg = sg; setThumb($('kipThumb'), cat || '?', th); if(cat && !th) catThumb(cat).then(x => { if(x){ const sg2 = cat + '|' + x; $('kipThumb').__sg = sg2; setThumb($('kipThumb'), cat, x); } }); }
    const chips = [];
    if(curLang()) chips.push(`<span class="ks-chip">${esc(curLang())}</span>`);
    if(curMat()) chips.push(`<span class="ks-chip mat">18+</span>`);
    (st.tags || []).forEach(tg => chips.push(`<span class="ks-chip tag">${esc(tg)}</span>`));
    const h = chips.join(''); if($('kipChips').__h !== h){ $('kipChips').__h = h; $('kipChips').innerHTML = h; }
  }
  function fillLangSelect(){
    const sel = $('kInfLangIn'), cur = curLang();
    const list = LANGS.slice(); if(cur && !list.includes(cur)) list.unshift(cur);
    sel.innerHTML = `<option value="">–</option>` + list.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
    sel.value = cur || '';
  }
  function fillInfoForm(){
    const st = K.stats || {};
    $('kInfTitleIn').value = st.title || '';
    fillLangSelect();
    $('kInfMatIn').checked = curMat();
    K.tags = (st.tags || []).slice(0, 10); paintTags();
    const nm = st.category || '';
    K.selCat = nm ? { id: st.categoryId || (K.cats.get(nm.toLowerCase()) || {}).id || null, name: nm, thumb: (K.cats.get(nm.toLowerCase()) || {}).thumb || '' } : null;
    paintSelCat();
    if(K.selCat && !K.selCat.thumb) catThumb(K.selCat.name).then(th => { if(K.selCat && th){ K.selCat.thumb = th; paintSelCat(); } });
  }
  $('kInfTitleIn').addEventListener('input', () => { K.dirty = true; });
  $('kInfLangIn').addEventListener('change', () => { K.dirty = true; });
  $('kInfMatIn').addEventListener('change', () => { K.dirty = true; });
  $('kInfReauth').onclick = () => reauth();

  function paintSelCat(){
    const c = K.selCat;
    $('kCatName').textContent = c ? c.name : t('kInfNoCat');
    setThumb($('kCatThumb'), c ? c.name : '?', c ? c.thumb : '');
  }
  function renderCatItems(list){
    const el = $('kCatItems');
    if(!list.length){ el.innerHTML = `<div class="k-empty">${esc(t('kCatNone'))}</div>`; return; }
    el.innerHTML = list.map(c => `<button type="button" class="k-mi" data-cid="${esc(c.id)}"><span class="ki-thumb">${thumbHtml(c.name, c.thumb)}</span><span>${esc(c.name)}</span></button>`).join('');
  }
  async function searchCats(q){
    if(!q){
      if(!K.seeds){
        const rs = await Promise.all(CAT_SEEDS.map(s => api.kickCategories(s).catch(() => null)));
        const seen = new Set(), out = [];
        rs.forEach(r => { if(r && r.ok) r.list.slice(0, 3).forEach(c => { if(!seen.has(c.id)){ seen.add(c.id); out.push(c); K.cats.set(String(c.name).toLowerCase(), c); } }); });
        K.seeds = out;
      }
      renderCatItems(K.seeds); return;
    }
    const r = await api.kickCategories(q);
    if($('kCatSearch').value.trim() !== q) return;
    if(!r || !r.ok){ renderCatItems([]); return; }
    r.list.forEach(c => K.cats.set(String(c.name).toLowerCase(), c));
    renderCatItems(r.list);
  }
  function openCatMenu(){
    $('kCatList').hidden = false; $('kCatSearch').value = ''; $('kCatSearch').placeholder = t('kCatSearch'); $('kCatSearch').focus();
    searchCats('');
  }
  function closeCatMenu(){ $('kCatList').hidden = true; }
  $('kCatBtn').onclick = () => { $('kCatList').hidden ? openCatMenu() : closeCatMenu(); };
  $('kCatSearch').addEventListener('input', () => { clearTimeout(K.catT); const q = $('kCatSearch').value.trim(); K.catT = setTimeout(() => searchCats(q), 300); });
  $('kCatItems').addEventListener('click', e => {
    const b = e.target.closest('[data-cid]'); if(!b) return;
    const name = b.querySelector('span:last-child').textContent;
    const c = K.cats.get(name.toLowerCase());
    K.selCat = { id: parseInt(b.dataset.cid, 10), name, thumb: c ? c.thumb : '' };
    K.dirty = true; paintSelCat(); closeCatMenu();
  });
  document.addEventListener('click', e => { if(!$('kCatList').hidden && !e.target.closest('#kCatMenu')) closeCatMenu(); });

  let _alAt = 0;
  window.KAutoLogin = function(force){     // بدل ما نفتح نافذة Kick فجأة: نوديك لمركز تسجيل الدخول في الإعدادات
    if(Date.now() - _alAt < (force ? 3000 : 900000)) return; _alAt = Date.now();
    toast('🔐 ' + t('kAutoLogin'), 6000); if(!connected()) openSettings('kick');
  };
  function infoNote(msg, showLogin, showDash){
    if(showLogin) showLogin = false;      // ما في تسجيل دخول موقع: نعرض الملاحظة + زر لوحة Kick فقط
    const n = $('kInfNote'); n.hidden = !msg; n.textContent = msg || '';
    const b = $('kWebLogin'); b.hidden = !(showLogin || showDash);
    b.dataset.kind = showLogin ? 'login' : 'dashboard';
    b.querySelector('span').textContent = t(showLogin ? 'kWebLogin' : 'kWebDash');
  }
  $('kWebLogin').onclick = () => api.kickOpenWeb($('kWebLogin').dataset.kind);
  $('kInfForm').onsubmit = async e => {
    e.preventDefault();
    if(!connected()) return;
    const st = K.stats || {};
    const title = $('kInfTitleIn').value.trim();
    const lang = $('kInfLangIn').value;
    const catChanged = K.selCat && String(K.selCat.name).toLowerCase() !== String(st.category || '').toLowerCase();
    if(catChanged && !K.selCat.id){ toast(t('kInfBadCat'), 5000); return; }
    const req = { title, categoryId: catChanged ? K.selCat.id : null };
    if(lang && lang !== curLang()) req.language = lang;
    const mature = $('kInfMatIn').checked; if(mature !== curMat()) req.mature = mature;
    addTag($('kInfTagsIn').value);
    if(K.tags.join('\u0001') !== (st.tags || []).join('\u0001')) req.tags = K.tags.slice();
    infoNote('');
    $('kInfSave').disabled = true;
    try{
      const r = await api.kickSetInfo(req);
      if(r && r.ok){
        if(lang) LS.set('se_klang', lang); LS.set('se_kmature', mature ? '1' : '0');
        K.dirty = false;
        if(req.language === undefined && req.mature === undefined){ toast('✔ ' + t('kInfSaved')); }
        else if(r.web === true){ toast('✔ ' + t('kInfSaved') + ' — ' + t('kWebOk'), 5000); }
        else { toast('✔ ' + t('kInfSaved'), 4000); infoNote(t(r.web === 'webLogin' ? 'kWebLoginNote' : 'kWebRejNote'), r.web === 'webLogin', r.web !== 'webLogin'); K.dirty = true; }
        refresh(true);
      }
      else if(r && (r.status === 401 || r.status === 403 || r.code === 'auth')){ if(K.cfg) K.cfg.canWrite = false; paintInfo(); toast('❌ ' + t('kInfNeed'), 7000); }
      else toast('❌ ' + t('kInfFail') + errText(r), 6000);
    } finally { $('kInfSave').disabled = !connected(); }
  };

  async function reauth(){
    if(K.busy) return; K.busy = true;
    try{
      toast(t('kWaitBrowser'), 8000);
      const r = await api.kickConnect();
      if(r.ok){ K.cfg = r.config; toast(t('kLinked')); fillKick(); paintInfo(); startAll(); }
      else{ toast('❌ ' + connectError(r.error), 7000); K.cfg = await api.kickConfig(); }
    } finally { K.busy = false; }
  }

  /* ---------- Pusher websocket (قراءة الشات لحظياً) ---------- */
  function closeChat(){
    clearTimeout(K.retryT); K.retryAt = 0; K.gen++;
    if(K.ws){ K.ws.onclose = null; K.ws.onmessage = null; try{ K.ws.close(); }catch(e){} K.ws = null; }
    setDot('off');
  }
  function scheduleRetry(){
    clearTimeout(K.retryT);
    const d = Math.min(30000, 1500 * Math.pow(2, Math.min(K.retry++, 5)));
    K.retryAt = Date.now() + d;
    K.retryT = setTimeout(() => { if(K.want && chatOk()) openChat(K.room, K.chan, true); }, d);
  }
  function openChat(room, chan, isRetry){
    if(!room) return;
    if(!isRetry && K.ws && K.room === room && K.ws.readyState <= 1) return;
    closeChat();
    if(K.room !== room){ if(K.logSlug && K.logRoom && K.logRoom !== room){ resetChat('kick'); } K.logRoom = room; K.pending = []; }
    K.room = room; K.chan = chan || 0; K.want = true;
    const gen = ++K.gen; setDot('wait');
    const url = K.pusherUrl || LS.get('se_kpurl', '') || pusherUrl(PUSHER_HOSTS[(K.ci || 0) % PUSHER_HOSTS.length]);
    let ws; try{ ws = new WebSocket(url); }catch(e){ scheduleRetry(); return; }
    K.ws = ws; K.wsUrl = url;
    K.lastAct = Date.now();
    ws.onmessage = ev => { if(gen === K.gen){ K.lastAct = Date.now(); onPusher(ev.data, ws); } };
    ws.onclose = ev => {
      K.lastClose = ev ? (ev.code + ' ' + (ev.reason || '')) : ''; if(gen !== K.gen) return; K.ws = null; setDot(K.bridgeOk ? 'on' : 'off');
      if(ev && ev.code >= 4000 && ev.code < 4100 && ev.code !== 4200){      // 4001 = الـ cluster/المفتاح غلط → نجرّب التالي
        if(K.wsUrl === LS.get('se_kpurl', '')) LS.set('se_kpurl', '');
        if(K.wsUrl === K.pusherUrl) K.pusherUrl = '';
        K.ci = ((K.ci || 0) + 1) % PUSHER_HOSTS.length; K.retry = 0; clearTimeout(K.retryT);
        K.badN = (K.badN || 0) + 1;
        // Kick تستخدم الآن Centrifugo: Pusher القديم ما عاد يشتغل، فبعد ما نجرّب كل الـ clusters نهدّي المحاولات (الشات يوصل عبر صفحة Kick)
        const dl = (K.badN % PUSHER_HOSTS.length === 0) ? (K.bridgeOk ? 600000 : 30000) : 600;
        K.retryAt = Date.now() + dl;
        K.retryT = setTimeout(() => { if(K.want && chatOk()) openChat(K.room, K.chan, true); }, dl); return;
      }
      scheduleRetry();
    };
    ws.onerror = () => {};
  }
  // مراقبة الاتصال: Pusher يرسل ping كل فترة، فإذا ما وصلنا أي شي أطول من المهلة نعتبر الاتصال ميتاً ونعيد الاتصال تلقائياً
  setInterval(() => {
    const ws = K.ws; if(!K.want || !ws || ws.readyState !== 1) return;
    if(Date.now() - (K.lastAct || 0) > ((K.actTimeout || 120) + 30) * 1000){
      K.lastClose = 'watchdog: no data'; try{ ws.close(); }catch(e){}
    }
  }, 15000);
  const wsSend = (ws, o) => { try{ ws.send(JSON.stringify(o)); }catch(e){} };
  const sub = (ws, channel) => wsSend(ws, { event: 'pusher:subscribe', data: { auth: '', channel } });
  /* v1.3.0: Kick انتقلت من Pusher إلى Centrifugo. الإطار صار: {"push":{"channel":"chatrooms.<id>.v2","pub":{"data":{"event":"App\\Events\\ChatMessageEvent","data":"{...}"}}}}
     نفكّ هذا الغلاف (وقد يجي أكثر من إطار في رسالة وحدة مفصولة بسطر جديد) ونمرّر لكل واحد {event, data, channel} بنفس صيغة Pusher القديمة. */
  const BARE_EV = { ChatMessage: 'ChatMessageEvent', MessageDeleted: 'MessageDeletedEvent', UserBanned: 'UserBannedEvent', UserUnbanned: 'UserUnbannedEvent', Subscription: 'SubscriptionEvent', GiftedSubscriptions: 'GiftedSubscriptionsEvent', RewardRedeemed: 'RewardRedeemedEvent' };
  function unwrapFrame(o, out){
    if(!o || typeof o !== 'object') return;
    if(Array.isArray(o)){ o.forEach(x => unwrapFrame(x, out)); return; }
    const pu = o.push || o;
    const pub = pu.pub || pu.message || null;
    if(pub && typeof pub === 'object' && pub.data !== undefined){
      let dd = pub.data; if(typeof dd === 'string'){ try{ dd = JSON.parse(dd); }catch(e){ return; } }
      const ch = pu.channel || o.channel || '';
      if(dd && typeof dd === 'object'){
        if(dd.event !== undefined) out.push({ event: dd.event, data: dd.data, channel: ch });
        else if(dd.sender && dd.content != null) out.push({ event: 'App\\Events\\ChatMessageEvent', data: dd, channel: ch });
      }
      return;
    }
    if(o.event !== undefined){ out.push(o); return; }
    if(pu.subscribe || pu.connect) return;          // ردود Centrifugo على الاشتراك/الاتصال (ما فيها رسائل)
  }
  function onPusher(raw, ws){
    const list = [];
    let m; try{ m = JSON.parse(raw); unwrapFrame(m, list); }
    catch(e){ String(raw).split('\n').forEach(line => { line = line.trim(); if(!line) return; try{ unwrapFrame(JSON.parse(line), list); }catch(_){} }); }
    list.forEach(x => { try{ onPusherMsg(x, ws); }catch(e){} });
  }
  function onPusherMsg(m, ws){
    const ev = m.event;
    if(ev === 'pusher:connection_established'){
      if(!ws) return;
      K.retry = 0; if(K.wsUrl) LS.set('se_kpurl', K.wsUrl);               // نحفظ الرابط الشغال للمرات القادمة
      try{ const cd = typeof m.data === 'string' ? JSON.parse(m.data) : m.data; K.actTimeout = Math.max(30, parseInt(cd && cd.activity_timeout, 10) || 120); }catch(e){ K.actTimeout = 120; }
      sub(ws, 'chatrooms.' + K.room + '.v2');
      sub(ws, 'chatrooms.' + K.room);
      sub(ws, 'chatroom_' + K.room);          // احتياطي: لو Kick غيّرت اسم القناة، الرسائل المكررة تُتجاهل حسب الـ id
      if(K.chan){ sub(ws, 'channel.' + K.chan); sub(ws, 'channel_' + K.chan); }
      return;
    }
    if(ev === 'pusher:error' || ev === 'pusher_internal:subscription_error'){ try{ K.lastErr = JSON.stringify(m.data).slice(0, 140); }catch(e){} return; }
    if(ev === 'pusher:ping'){ if(ws) wsSend(ws, { event: 'pusher:pong', data: {} }); return; }
    if(ev === 'pusher_internal:subscription_succeeded'){
      if(String(m.channel || '').startsWith('chatrooms.')){ setDot('on'); if(!chatEl().querySelector('.k-msg')) sys(t('kOn')); }
      return;
    }
    let d = m.data; if(typeof d === 'string'){ try{ d = JSON.parse(d); }catch(e){ return; } }
    if(!d || typeof d !== 'object') return;
    let name = String(ev || '').replace(/^App\\Events\\/, ''); if(BARE_EV[name]) name = BARE_EV[name];
    K.evl.push(name.slice(0, 40) + (m.channel ? '@' + String(m.channel).slice(0, 28) : '')); if(K.evl.length > 8) K.evl.shift();
    switch(name){
      case 'ChatMessageEvent': addMsg(d); break;
      case 'MessageDeletedEvent': markDeleted((d.message && d.message.id) || d.id); if(window.KX) KX.event(name, d); break;
      case 'FollowersUpdated': {
        const n = parseInt(d.followersCount != null ? d.followersCount : d.followers_count, 10);
        if(!isNaN(n) && K.stats){ K.stats.followers = n; paintStats(); if(window.KX) KX.stats(K.stats); }
        if(window.KX) KX.event(name, d);
        break;
      }
      case 'StreamerIsLive': case 'StopStreamBroadcast': refresh(true); if(window.KX) KX.event(name, d); break;
      default:
        if(d.sender && d.content != null && d.id != null && !/Delete|Ban|Pin|Poll/i.test(name)){ addMsg(d); break; }   // اسم حدث جديد لرسالة شات
        if(window.KX) KX.event(name, d);
    }
  }

  /* ---------- جسر الشات: رسائل الصفحة الرسمية تصل من main.js (احتياطي يعمل بدون رقم غرفة) ---------- */
  api.onKickFrame(raw => {
    if(!chatOk()) return; const first = !K.bridgeOk; K.bridgeOk = true; if(first) paintSync();
    onPusher(raw, null);
    if(!$('kDot').classList.contains('on')){ setDot('on'); if(!chatEl().querySelector('.k-msg')) sys(t('kOn')); }
  });
  const domMsg = m => {
    if(!chatOk() || !m || !m.text) return; if(!K.bridgeOk){ K.bridgeOk = true; paintSync(); }
    addMsg({ __dom: true, id: m.id ? 'dom' + m.id : '', content: m.text, type: 'message', sender: { username: m.user || '?', id: null, identity: { color: m.color || '' } } });
  };
  window.KDom = domMsg;      // v1.3.0: قارئ صفحة الشات الرسمية (kdash.js) يمرر الرسائل هنا
  api.onKickDom(domMsg);
  let bstateShown = '';
  api.onBridgeState(m => {
    if(!chatOk() || !m || bstateShown === m.s) return;
    if(m.s === 'cf') { bstateShown = 'cf'; sys(t('kBrCf')); }
    else if(m.s === 'fail') { bstateShown = 'fail'; sys(t('kBrFail')); }
  });
  function startBridge(slug){
    if(!slug || K.bridgeSlug === slug) return;
    K.bridgeSlug = slug; api.kickBridge(slug).catch(() => {});
  }

  window.KUI = { setThumb, catThumb };       // مساعدات صور التصنيف تستعملها لوحة الجلسة (kpanel.js)

  /* ---------- polling ---------- */
  function onAuthLost(){
    if(K.cfg) K.cfg.connected = false;
    stopAll(); paintStats(); renderEnabled(); fillKick(); paintInfo(); if(window.KX) KX.reset();
    toast(t('kAuthLost'), 6000);
  }
  function stopAll(){
    clearInterval(K.poll); clearTimeout(K.roomT); K.poll = null; K.want = false; closeChat();
    K.bridgeSlug = ''; K.bridgeOk = false; try{ api.kickBridge(null); }catch(e){} K.stats = null; K.reply = null; K.emoLoaded = '';
  }
  async function refresh(force){
    if(!chatOk()) return;
    if(K.inflight && !force) return;          // الطلب السابق ما خلّص: ننتظره (بدون تراكم)
    K.inflight = true;
    let st; try{ st = await api.kickStats(!!force); }catch(e){ K.inflight = false; return; }
    K.inflight = false;
    if(!chatOk()) return;
    if(!st || !st.ok){ if(st && st.code === 'auth' && connected()) onAuthLost(); return; }   // 'net' = انقطاع مؤقت، نكمل بصمت
    K.stats = st; checkSession(st); paintStats(); if(window.KX) KX.stats(st);
    startBridge(st.slug);
    paintInfo();
    loadEmotes();
    if(st.chatroomId){
      K.warnedRoom = false; clearTimeout(K.roomT);
      if(K.room !== st.chatroomId || (!K.ws && Date.now() >= (K.retryAt || 0))) openChat(st.chatroomId, st.channelId);
    } else {
      if(!K.warnedRoom && !K.bridgeOk){ K.warnedRoom = true; sys(t('kNoRoom2')); }
      clearTimeout(K.roomT); K.roomT = setTimeout(() => refresh(true), 12000);   // نعيد المحاولة بسرعة لين نلاقي الغرفة
    }
  }
  /* v1.3.0: ما في جلسة موقع Kick؛ كل شي عبر حساب المطوّر */
  async function webRefresh(force){
    const was = K.wl;
    try{
      const r = await api.kickWebState(!!force);
      K.wl = !!(r && r.login); K.wu = (r && r.user) || null;
    }catch(e){ K.wl = false; K.wu = null; }
    if(was !== K.wl){ try{ renderEnabled(); paintSync(); setConn(); if(window.KX && KX.cfgChanged) KX.cfgChanged(); }catch(e){} }
  }
  function paintSync(){
    const el = $('kSync'); if(!el) return;
    const how = canSend();
    const rd = chatOk() ? !!(K.ws && K.ws.readyState === 1 || K.bridgeOk) : false;
    el.classList.toggle('ok', !!(how && rd)); el.classList.toggle('warn', !how && chatOk() || (how && !rd));
    const txt = !chatOk() ? '' : (!rd ? t('kSyncWait') : (how ? t('kSyncOn') : t('kSyncReadOnly')));
    el.innerHTML = txt ? '<i></i>' + esc(txt) : '';
    el.hidden = !txt;
    const pill = $('kkWebPill'); if(pill){ const lg = connected() || !!K.wl; pill.textContent = t(lg ? 'kkLogged' : 'kkNotLogged'); pill.classList.toggle('ok', lg); }
  }
  setInterval(() => { webRefresh(false); paintSync(); }, 20000);
  // اسم القناة محلياً (بدون انتظار main.js): نبدأ قارئ صفحة Kick فوراً بدل انتظار جلب بيانات القناة (قد يأخذ دقيقة لو Cloudflare تمنع)
  function localSlug(){
    let x = String((K.cfg && K.cfg.channel) || '').trim().replace(/^https?:\/\//i, '').replace(/^(www\.)?kick\.com\/?/i, '').replace(/[?#].*$/, '');
    const p = x.split('/').filter(Boolean); if(p[0] && /^(popout|video|videos|dashboard|categories)$/i.test(p[0])) p.shift();
    let s = (p[0] || '').toLowerCase();
    if(!/^[a-z0-9_\-]+$/.test(s)) s = '';
    return s || String((K.cfg && K.cfg.user && K.cfg.user.slug) || '').toLowerCase();
  }
  // رقم الغرفة وصل من صفحة Kick نفسها → نفتح Pusher المباشر فوراً
  api.onKickWsUrl && api.onKickWsUrl(u => {
    if(!u) return; K.pusherUrl = u; LS.set('se_kpurl', u);
    if(K.want && chatOk() && K.room && !(K.ws && K.ws.readyState <= 1)) openChat(K.room, K.chan, true);
  });
  api.onKickRoom(m => {
    if(!chatOk() || !m || !m.room || m.slug !== localSlug()) return;
    if(K.room !== m.room || (!K.ws && Date.now() >= (K.retryAt || 0))) openChat(m.room, K.chan || (K.stats && K.stats.channelId) || 0);
  });
  function startAll(){
    stopAll(); webRefresh(true); K.want = true; K.warnedRoom = false; K.room = 0;
    chatEl().innerHTML = ''; K.seen.clear(); const nRest = restoreLog(); sys(t(nRest ? 'kRestored' : 'kWait')); renderEnabled(); paintStats();
    { const sl = localSlug(); if(sl) startBridge(sl); }
    refresh(true); armHint();
    K.poll = setInterval(() => refresh(false), POLL_MS);
  }

  /* ---------- settings pane (ربط Kick) ---------- */
  function setConn(){
    const ok = connected();
    $('kConn').classList.toggle('ok', ok);
    $('kConnT').textContent = ok ? t('kConnectedAs', { n: (K.cfg.user && K.cfg.user.name) || (K.cfg.user && K.cfg.user.slug) || '' }) : t('kNotConnected');
    const devFilled = !!($('kClientId').value.trim() && ($('kClientSecret').value.trim() || (K.cfg && K.cfg.hasSecret)));
    $('kConnectT').textContent = ok ? t('kSaveApply') : (devFilled ? t('kConnect') : t('kSaveChat'));
    $('kDiscBtn').hidden = !ok;
    $('kSteps').hidden = ok;
    { const lg = !!K.wl; const lb = $('kLoginKickT'); if(lb) lb.textContent = lg ? t('kLogoutKick') + (meName() ? ' (' + meName() + ')' : '') : t('kLoginKick'); const h = $('kLoginHint'); if(h) h.hidden = lg; const tk = $('kTokBox'); if(tk) tk.hidden = lg; }
  }
  function fillKick(){
    if(!K.cfg) return;
    $('kRedirect').value = K.cfg.redirectUri || 'http://localhost:8787/callback';
    $('kClientId').value = K.cfg.clientId || '';
    $('kClientSecret').value = ''; $('kClientSecret').placeholder = K.cfg.hasSecret ? '••••••••••••' : '';
    $('kChannelIn').value = K.cfg.channel || '';
    $('kRoomIn').value = K.cfg.chatroomId || '';
    setConn(); try{ paintSync(); }catch(e){} if(window.KX) KX.cfgChanged();
  }
  function connectError(code){
    const map = { NO_APP: 'kErrNoApp', BAD_REDIRECT: 'kErrRedirect', PORT_BUSY: 'kErrPort', TIMEOUT: 'kErrTimeout', busy: 'kErrBusy' };
    return map[code] ? t(map[code]) : String(code || '');
  }
  ['kClientId', 'kClientSecret'].forEach(id => $(id).addEventListener('input', () => { try{ setConn(); }catch(e){} }));
  $('kSecEye').onclick = () => { const k = $('kClientSecret'); k.type = k.type === 'password' ? 'text' : 'password'; };
  $('kOpenDev').onclick = () => api.kickOpenDev();
  $('kConnectBtn').onclick = async () => {
    if(K.busy) return;
    const was = K.cfg || {};
    const form = { clientId: $('kClientId').value, clientSecret: $('kClientSecret').value, redirectUri: $('kRedirect').value, channel: $('kChannelIn').value, chatroomId: $('kRoomIn').value };
    K.busy = true; $('kConnectBtn').disabled = true;
    try{
      K.cfg = await api.kickSave(form);
      if(K.cfg.connected && K.cfg.clientId === was.clientId){
        toast(t('saved')); fillKick(); startAll(); return;       // بس تغيير إعدادات، بدون إعادة تسجيل دخول
      }
      if(!K.cfg.clientId || !K.cfg.hasSecret){
        if(K.cfg.channel){ toast(t('saved')); fillKick(); renderEnabled(); startAll(); return; }   // وضع الشات فقط
        toast(t('kErrNoApp'), 5000); fillKick(); return;
      }
      toast(t('kWaitBrowser'), 8000);
      const r = await api.kickConnect();
      if(r.ok){ K.cfg = r.config; toast(t('kLinked')); fillKick(); startAll(); }
      else{ toast('❌ ' + connectError(r.error), 7000); K.cfg = await api.kickConfig(); fillKick(); }
    } finally { K.busy = false; $('kConnectBtn').disabled = false; }
  };
  /* v1.3.0: تسجيل دخول حسابك على موقع Kick (يفتح نافذة Kick، سجّل دخولك مرة وحدة وتنغلق لحالها) */
  async function afterWebLogin(){
    await webRefresh(true);
    try{ K.cfg = await api.kickConfig(); }catch(e){}
    fillKick(); renderEnabled(); paintInfo(); startAll();
    toast(K.wl ? '✔ ' + t('kWebOk', { n: meName() }) : t('kWebFail'), 5000);
  }
  $('kLoginKick').onclick = async () => {
    if(K.busy) return;
    K.busy = true; $('kLoginKick').disabled = true;
    try{
      if(K.wl){
        await api.kickWebLogout(); await webRefresh(true);
        K.cfg = await api.kickConfig(); fillKick(); renderEnabled(); paintInfo(); toast(t('kWebOut'));
        return;
      }
      toast(t('kWebOpening'), 6000);
      const r = await api.kickWebLogin();
      if(r && r.ok) await afterWebLogin();
      else if(r && r.code !== 'busy') toast(t('kWebFail'), 6000);
    } finally { K.busy = false; $('kLoginKick').disabled = false; try{ setConn(); }catch(e){} }
  };
  $('kTokBtn').onclick = async () => {
    const v = $('kTokIn').value.trim(); if(!v) return;
    const r = await api.kickWebToken(v);
    if(r && r.ok){ $('kTokIn').value = ''; await afterWebLogin(); } else toast(t('kTokBad'), 5000);
  };
  $('kDiscBtn').onclick = async () => {
    K.cfg = await api.kickDisconnect(); stopAll(); paintStats(); showEmpty(); renderEnabled(); fillKick(); paintInfo(); if(window.KX) KX.reset(); toast(t('kUnlinked'));
  };


  /* ---------- تشخيص الشات ---------- */
  async function diagData(){
    let d = {}; try{ d = await api.kickDiag(); }catch(e){}
    d.ws = !!(K.ws && K.ws.readyState === 1); d.shown = chatEl().querySelectorAll('.k-msg').length; d.roomRenderer = K.room || 0; d.wsClose = K.lastClose || ''; d.wsErr = K.lastErr || ''; d.rx = K.evl.slice(); d.drops = Object.assign({}, K.drops);
    return d;
  }
  const mark = ok => ok ? '✅' : '❌';
  function diagHtml(d){
    const row = (k, v, ok) => `<div class="dg-r"><span>${esc(k)}</span><b dir="ltr">${ok == null ? '' : mark(ok) + ' '}${esc(v)}</b></div>`;
    return `<div class="dg">` +
      row('Channel', d.slug || '–', !!d.slug) +
      row('Chat room ID', d.room || '–', !!d.room) +
      row('Pusher WebSocket (legacy)', d.ws ? t('kStOk') : (K.bridgeOk ? 'n/a (Centrifugo via page)' : t('kStNo')), d.ws || !!K.bridgeOk) +
      row('Kick page reader', d.bridgeOn ? (d.loading ? t('kStWait') : (d.cf ? 'Cloudflare ✋' : (d.title || t('kStOk')))) : t('kStNo'), d.bridgeOn && !d.cf) +
      row('Chat frames', (d.chat || 0) + (d.hook ? ' (hook ' + d.hook + ')' : ''), (d.chat || 0) > 0) +
      (d.wsClose ? row('WS close', d.wsClose) : '') +
      row('Page messages', d.dom || 0, (d.dom || 0) > 0) +
      row('API poll', (d.apiOk || 0) + ' ok · ' + (d.api || 0) + ' msgs', (d.apiOk || 0) > 0) +
      row('Page entries (DOM)', (d.probe && d.probe.entries) != null ? d.probe.entries : '–', d.probe && d.probe.entries > 0) +
      (Array.isArray(d.pageWs) && d.pageWs.length ? d.pageWs.map(u => row('Page WS', String(u).replace(/^wss:\/\//, '').slice(0, 70))).join('') : '') +
      (Array.isArray(d.fl) ? d.fl.map(f => row('Frame ' + f.s, f.x.slice(0, 90))).join('') : '') +
      (Array.isArray(d.rx) && d.rx.length ? row('App received', d.rx.slice(-4).join(' · ')) : '') +
      row('App dropped', JSON.stringify(d.drops || {})) +
      (d.wsUrl ? row('Kick WS', d.wsUrl.replace(/^wss:\/\//, '')) : '') +
      row('Shown in app', d.shown || 0, (d.shown || 0) > 0) +
      (Array.isArray(d.kw) && d.kw.length ? d.kw.map(x => row('Kick web ' + (x.tag || ''), x.status + ' ' + (x.note || ''), x.status >= 200 && x.status < 300)).join('') : '') +
      row('Dash windows', (d.dashWins || []).join(', ') || '–', (d.dashWins || []).length > 0) +
      (window.KX && KX.counts ? row('Panels data', 'activity ' + KX.counts().act + ' · mod ' + KX.counts().mod) : '') +
      (Array.isArray(d.dash) && d.dash.length ? d.dash.map(x => row('Dash ' + (x.page || ''), x.status + ' ' + (x.note || ''), x.status >= 200 && x.status < 400)).join('') : '') +
      `</div><div class="note">${esc(t('kDiagHelp'))}</div>`;
  }
  async function openDiag(){
    const d = await diagData(), rep = () => JSON.stringify(d, null, 1);
    dlg({ title: t('kDiagT'), body: diagHtml(d), actions: [
      { label: t('kDiagOpen'), kind: 'primary', cb: () => { api.kickBridgeShow((K.stats && K.stats.slug) || d.slug || ''); return false; } },
      { label: t('kDiagRestart'), cb: async () => { await api.kickChatRestart(); startAll(); return true; } },
      { label: t('kDiagCopy'), cb: () => { try{ navigator.clipboard.writeText(rep()); toast('✔'); }catch(e){} return false; } },
      { label: t('kDiagClose') }
    ] });
  }
  $('kDiag').onclick = openDiag;
  let hintT = null;
  function armHint(){ clearTimeout(hintT); hintT = setTimeout(() => { if(chatOk() && !chatEl().querySelector('.k-msg')) sys(t('kHint')); }, 25000); }

  /* ---------- hooks into the app ---------- */
  const _applyI18n = applyI18n;
  applyI18n = function(){ _applyI18n(); try{ kLang(); }catch(e){} };
  const _mTab = mTab;
  mTab = function(n){ _mTab(n); if(n === 'kick') fillKick(); };
  function kLang(){ if(window.KX) KX.lang(); renderEnabled(); setConn(); paintStats(); paintInfo(); if(!$('kCatList').hidden) $('kCatSearch').placeholder = t('kCatSearch'); }

  /* ---------- ربط لوحات Kick (kpanel.js) ---------- */
  if(window.KX) KX.ctx = { cfg: () => K.cfg, stats: () => K.stats, reauth: () => reauth(), refresh: f => refresh(!!f), canSend, wl: () => !!K.wl, room: () => K.room || (K.stats && K.stats.chatroomId) || 0, me: meName };

  /* ---------- init ---------- */
  paintIcons(); applyI18n();
  paintStats(); renderEnabled(); paintInfo();
  api.kickConfig().then(c => {
    K.cfg = c; fillKick(); renderEnabled(); paintStats(); paintInfo();
    if(c.connected || (c.channel && String(c.channel).trim())) startAll();
    webRefresh(true);
  }).catch(() => {});
})();
