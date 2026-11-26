'use strict';
/* ============================================================
   لوحات Kick (v1.3.0) — نفس لوحة "إدارة البث" في موقع Kick لكن داخل البرنامج:
   الجلسة · موجز النشاط · إجراءات المشرف · إجراءات القناة
   - كل شيء يتحدّث بصمت كل ~2 ثانية: يعتمد على kick.js (الاستطلاع) + أحداث Pusher اللحظية.
     التحديث لا يكتب شيء في الشات ولا يظهر له أي إشعار؛ بس الأرقام والخيارات تتغير مكانها.
   - إجراءات القناة: اللي تغيّره هنا ينرسل لـ Kick، واللي يتغيّر في Kick يظهر هنا خلال ثواني.
   ============================================================ */
(() => {
  Object.assign(IC, {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="M4.9 4.9l14.2 14.2"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'
  });

  /* ---------- i18n ---------- */
  Object.assign(I18N.ar, {
    kchSoonT: 'قريباً', kchSoonS: 'صفحة القناة قيد التجهيز وستتوفر في تحديث قادم. التوقعات متوفرة من زر التوقعات تحت الشات.',
    kTabSession: 'الجلسة', kTabActivity: 'النشاط', kTabMod: 'المشرف', kTabChannel: 'القناة',
    ksPeak: 'أعلى مشاهدين', ksAvg: 'متوسط المشاهدين', ksMpm: 'رسائل / دقيقة', ksChatters: 'المتحدثون', ksMsgs: 'رسائل الشات', ksChart: 'المشاهدون خلال البث',
    ksChartNone: 'يظهر الرسم بعد بدء البث', ksSince: 'منذ بداية البث', ksStarted: 'بدأ البث', ksTitleL: 'عنوان البث', ksCatL: 'التصنيف', ksLangL: 'اللغة', ksTags: 'الوسوم', ksRoom: 'رقم غرفة الشات',
    kxToday: 'اليوم', kxYesterday: 'أمس', kxOther: 'نشاط', kxRaid: 'استضاف قناتك ({n})', kxTip: 'تبرّع {n}', kxPin: 'ثبّت رسالة في الشات', kxSetting: 'غيّر إعدادات الشات',
    kxModOther: 'إجراء إشراف {u}', kxByWho: 'بواسطة {u}', kxReason: 'السبب: {r}',
    kxfAll: 'الكل', kxfFollow: 'المتابعون', kxfSub: 'الاشتراكات', kxfGift: 'الهدايا', kxfOther: 'أخرى', kxfFirst: 'أول رسالة', kxfBan: 'حظر', kxfTimeout: 'تايم أوت', kxfDelete: 'حذف',
    kxcFollow: 'متابع', kxcSub: 'اشتراك', kxcGift: 'هدية', kxcOther: 'أخرى', kxcBan: 'حظر', kxcTimeout: 'تايم أوت', kxcDelete: 'حذف',
    kxLoginNote: 'هذه الصفحة تحتاج تسجيل دخول حسابك على Kick (الإعدادات ← ربط Kick).',
    kxSession: 'الجلسة', kxViewers: 'المشاهدون', kxFollowers: 'المتابعون', kxSubs: 'عدد الاشتراكات', kxTime: 'الوقت المباشر',
    kxLive: 'مباشر', kxOff: 'غير متصل',
    kxActEmpty: 'لا يوجد نشاط بعد. المتابعون الجدد والاشتراكات والهدايا تظهر هنا فور حدوثها.',
    kxModEmpty: 'لا توجد إجراءات بعد. الحذف والحظر والتايم أوت يظهرون هنا.',
    kxModNeed: 'إجراءات المشرف (حذف / تايم أوت / حظر) تحتاج صلاحية إضافية. اضغط "إعادة الربط" ووافق مرة وحدة.',
    kxFollow: 'تابع القناة', kxFollowN: 'متابع جديد', kxSub: 'اشترك في القناة', kxResub: 'جدّد اشتراكه ({n} أشهر)', kxGift: 'أهدى {n} اشتراك',
    kxReward: 'استبدل: {r}', kxKicks: 'أرسل {n} KICKs', kxFirst: 'دردش للتو لأول مرة', kxStart: 'بدأ البث', kxEnd: 'انتهى البث',
    kxDel: 'حذف رسالة', kxDelOf: 'حذف رسالة من {u}', kxBan: 'حظر {u}', kxTimeout: 'تايم أوت {u} · {m}', kxUnban: 'فك حظر {u}',
    kxNow: 'الآن', kxAgo: 'قبل {v}', kxS: 'ثانية', kxM: 'دقيقة', kxH: 'ساعة', kxD: 'يوم',
    kxModDone: 'تم', kxModFail: 'تعذر تنفيذ الإجراء: ', kxModPerm: 'تحتاج صلاحية الإشراف: افتح تبويب المشرف واضغط إعادة الربط.',
    kxDelBtn: 'حذف الرسالة', kxToBtn: 'تايم أوت 10 دقائق', kxBanBtn: 'حظر', kxBanAsk: 'تحظر {u} من القناة؟', kxYes: 'نعم، حظر', kxNo: 'إلغاء',
    kcAccess: 'الوصول إلى الدردشة', kcOpts: 'خيارات الدردشة', kcRestr: 'القيود المفروضة', kcAccAge: 'الحد الأدنى لعمر الحساب', kcBot: 'حماية متقدمة من البوتات',
    kcFol: 'المتابعون فقط', kcSubs: 'للمشتركين فقط', kcEmotes: 'الصور التعبيرية فقط', kcSlow: 'الوضع البطيء', kcWords: 'الكلمات المحظورة',
    kcPopout: 'الإشراف على الدردشة عبر نافذة منبثقة', kcEnable: 'تفعيل', kcOffV: 'معطل', kcOnV: 'مفعل', kcAnyFol: 'كل المتابعين',
    kcMin: 'د', kcHr: 'ساعة', kcDay: 'يوم', kcWeek: 'أسبوع', kcMonth: 'شهر', kcSec: 'ث',
    kcNeedLink: 'اربط حسابك بـ Kick أولاً (الإعدادات ← ربط Kick) لتتحكم بإعدادات الشات.', kcNeedLinkBtn: 'ربط Kick',
    kcErrLogin: 'سجّل دخول حسابك على Kick أولاً (الإعدادات ← ربط Kick ← تسجيل الدخول بحساب Kick).',
    kcErrForbidden: 'Kick رفضت الطلب (غالباً حماية Cloudflare أو صلاحيات). افتح لوحة Kick وغيّره من هناك، وافتح ⓘ تشخيص الشات للتفاصيل.',
    kcErrRejected: 'Kick ما قبلت التغيير من البرنامج (رمز {s}). غيّره من لوحة Kick، وافتح ⓘ تشخيص الشات لإرسال التفاصيل.',
    kcErrWeb: 'تعذر الاتصال بموقع Kick. تأكد من الإنترنت وحاول مرة ثانية.', kcNotApplied: 'Kick ما طبّقت التغيير. جرّب مرة ثانية.',
    kcWordPh: 'أضف كلمة محظورة', kcWordsFail: 'تعذر جلب/تعديل الكلمات المحظورة من البرنامج. استخدم لوحة Kick.', kcNoWords: 'لا توجد كلمات محظورة.',
    kcWebLogin: 'تسجيل دخول موقع Kick',
    ksBarSub: 'أرقام بثك لحظة بلحظة', kxListen: 'يستمع للأحداث مباشرة',
 kchTitle: 'إجراءات القناة', kchSub: 'تحكم كامل بقناتك من مكان واحد', kchOpen: 'الشات مفتوح للجميع', kchPresets: 'إعدادات سريعة',
    kchPNormal: 'عادي', kchPNormalD: 'إيقاف كل القيود', kchPShield: 'حماية', kchPShieldD: 'متابعون 10د + بطيء + بوتات', kchPLock: 'قفل', kchPLockD: 'مشتركون فقط + بطيء', kchPClear: 'مسح الشات', kchPClearD: 'حذف كل الرسائل', kchPDone: 'تم تطبيق الإعداد السريع',
    kchfAcc: 'عمر الحساب {m}', kchfBot: 'حماية البوتات', kchfFol: 'متابعون فقط · {m}', kchfSubs: 'مشتركون فقط', kchfEmo: 'صور تعبيرية فقط', kchfSlow: 'بطيء {s}ث',
    kcChan: 'خيارات القناة', kcView: 'إظهار عدد المشاهدات', kcPred: 'إنشاء توقعات', kcGoal: 'تعيين الأهداف', kcManage: 'إدارة القناة',
    kcViewKick: 'تم تطبيق الإعداد في Kick وفي البرنامج', kcViewLocal: 'طُبّق داخل البرنامج (Kick ما قبلت التغيير من هنا)',
    kgTitle: 'تعيين الهدف', kgType: 'نوع الهدف', kgFol: 'المتابعون', kgSubs: 'الاشتراكات', kgTarget: 'الرقم المستهدف', kgName: 'عنوان الهدف (اختياري)', kgSave: 'حفظ الهدف', kgDel: 'حذف الهدف', kgNeed: 'اكتب رقماً أكبر من الرقم الحالي', kgReached: '🎉 تحقق الهدف!', kgSay: 'إعلان في الشات عند تحقق الهدف', kgChat: '🎉 تحقق هدفنا: {n} {w}! شكراً لكم ❤', kgNote: 'الهدف يُتابَع داخل البرنامج ويتحدّث تلقائياً مع أرقام بثك.',
    kpdModeL: 'نوع التوقع', kpdModeKick: 'توقع Kick الرسمي (يظهر للمشاهدين في Kick)', kpdModeChat: 'توقع بالشات (الناس تكتب p1 / p2) بنتائج حيّة',
    kpdLock: 'قفل التصويت الآن', kpdLocked: 'تم قفل التوقع', kpdPick: 'اختر النتيجة الفائزة:', kpdWinner: 'الفائز: {w}', kpdSRes: 'انتهى', kpdSLocked: 'مقفل',
    kpdHow: 'اكتب p1 أو p2 ... في الشات', kpdTotal: 'المشاركون: {n}', kpdClose: 'إغلاق', kpdBusy: 'في توقع شغّال حالياً. أنهِه أو ألغِه أولاً.',
    kpdKickNote: 'التوقع شغّال في Kick. النتيجة والفائز تحددهم من لوحة Kick.', kpdOkChat: 'بدأ التوقع بالشات',
    kpdAnn: '🔮 توقع: {q} — {o} — اكتب رقم النتيجة مثل p1 ({d} ث)', kpdLockAnn: '🔒 تم قفل التوقع «{q}» — المشاركون: {n}',
    kpdResAnn: '🏆 نتيجة التوقع «{q}»: الفائز {w} — {n} توقعوا صح ({p}%)', kpdCancelAnn: '🚫 تم إلغاء التوقع «{q}»',
    kpdTitle: 'إنشاء توقعات', kpdQ: 'سؤال التوقع', kpdQph: 'مثال: هل نفوز بالمباراة؟', kpdOut: 'النتائج المحتملة (2 إلى 8)', kpdOutPh: 'النتيجة', kpdDur: 'مدة التصويت', kpdStart: 'بدء التوقع', kpdNeed: 'اكتب السؤال ونتيجتين على الأقل', kpdOk: 'بدأ التوقع في Kick', kpdFailT: 'Kick ما قبلت التوقع', kpdAsChat: 'ابدأ كتوقع بالشات', kpdFail: 'Kick ما قبلت التوقع الرسمي من البرنامج، فما أرسلت أي رسالة للشات. تقدر تبدأه كتوقع داخل الشات (الناس تكتب p1 / p2) بنتائج حيّة.', kpdCancel: 'إلغاء التوقع', kpdLeft: 'متبقي {s}', kpdCanceled: 'تم إلغاء التوقع', kpdCanceledLocal: 'أُزيل من البرنامج (تأكد من Kick)',
    kdmStart: 'تجربة العمل', kdmStop: 'إيقاف التجربة', kdmTag: 'وضع التجربة', kdmActStart: 'تجربة', kdmActTag: 'تجربة', kdmModToast: 'تجربة المشرف: تظهر إجراءات وهمية (حذف / تايم أوت / حظر / تثبيت) وما تتأثر بحسابك', kdmActToast2: 'بدأت التجربة: أحداث وهمية متنوعة (متابعين، اشتراكات، هدايا، ...) وما تتأثر بحسابك', kxlDel: 'حذف رسالة', kxlBan: 'حظر دائم', kxlTimeout: 'تايم أوت · {m}', kxlUnban: 'فك الحظر', kxlPin: 'تثبيت رسالة', kxlSetting: 'تغيير إعدادات الشات', kxfPin: 'تثبيت',
    kxClear: 'مسح السجل', kxClearT: 'مسح السجل', kxClearQ: 'سيتم حذف كل الأحداث المعروضة في هذه الصفحة نهائياً. هل تريد المتابعة؟', kxClearOk: 'تم مسح السجل',
    kdmTitle: 'بث تجريبي — هذه أرقام وهمية', kdmCat: 'وضع التجربة', kdmToast: 'بدأت التجربة: كل الأرقام وهمية وما تتأثر بحسابك', kdmStopToast: 'تم إيقاف التجربة', kdmActToast: 'تجربة المتابعين: يصلك متابع وهمي كل بضع ثواني'
  });
  Object.assign(I18N.en, {
    kchSoonT: 'Coming soon', kchSoonS: 'The Channel page is being prepared and will arrive in a future update. Predictions are available from the predictions button under the chat.',
    kTabSession: 'Session', kTabActivity: 'Activity', kTabMod: 'Moderation', kTabChannel: 'Channel',
    ksPeak: 'Peak viewers', ksAvg: 'Avg viewers', ksMpm: 'Messages / min', ksChatters: 'Chatters', ksMsgs: 'Chat messages', ksChart: 'Viewers this stream',
    ksChartNone: 'The chart appears once you are live', ksSince: 'Since stream start', ksStarted: 'Started', ksTitleL: 'Stream title', ksCatL: 'Category', ksLangL: 'Language', ksTags: 'Tags', ksRoom: 'Chatroom ID',
    kxToday: 'Today', kxYesterday: 'Yesterday', kxOther: 'Activity', kxRaid: 'hosted your channel ({n})', kxTip: 'tipped {n}', kxPin: 'Pinned a message', kxSetting: 'Changed chat settings',
    kxModOther: 'Moderation action {u}', kxByWho: 'by {u}', kxReason: 'Reason: {r}',
    kxfAll: 'All', kxfFollow: 'Followers', kxfSub: 'Subs', kxfGift: 'Gifts', kxfOther: 'Other', kxfFirst: 'First chat', kxfBan: 'Bans', kxfTimeout: 'Timeouts', kxfDelete: 'Deletes',
    kxcFollow: 'Followers', kxcSub: 'Subs', kxcGift: 'Gifts', kxcOther: 'Other', kxcBan: 'Bans', kxcTimeout: 'Timeouts', kxcDelete: 'Deletes',
    kxLoginNote: 'This page needs you to sign in to your Kick account (Settings → Kick link).',
    kxSession: 'Session', kxViewers: 'Viewers', kxFollowers: 'Followers', kxSubs: 'Subscriptions', kxTime: 'Live time',
    kxLive: 'Live', kxOff: 'Offline',
    kxActEmpty: 'No activity yet. New followers, subs and gifts show up here as they happen.',
    kxModEmpty: 'No actions yet. Deletes, bans and timeouts show up here.',
    kxModNeed: 'Moderator actions (delete / timeout / ban) need one extra permission. Press "Reconnect" and approve once.',
    kxFollow: 'followed the channel', kxFollowN: 'New follower', kxSub: 'subscribed', kxResub: 'resubscribed ({n} months)', kxGift: 'gifted {n} subs',
    kxReward: 'redeemed: {r}', kxKicks: 'sent {n} KICKs', kxFirst: 'chatted for the first time', kxStart: 'Stream started', kxEnd: 'Stream ended',
    kxDel: 'Deleted a message', kxDelOf: 'Deleted a message from {u}', kxBan: 'Banned {u}', kxTimeout: 'Timed out {u} · {m}', kxUnban: 'Unbanned {u}',
    kxNow: 'now', kxAgo: '{v} ago', kxS: 'sec', kxM: 'min', kxH: 'h', kxD: 'd',
    kxModDone: 'Done', kxModFail: 'Could not do it: ', kxModPerm: 'Moderator permission needed: open the Moderation tab and press Reconnect.',
    kxDelBtn: 'Delete message', kxToBtn: 'Timeout 10 min', kxBanBtn: 'Ban', kxBanAsk: 'Ban {u} from the channel?', kxYes: 'Yes, ban', kxNo: 'Cancel',
    kcAccess: 'Chat access', kcOpts: 'Chat options', kcRestr: 'Restrictions', kcAccAge: 'Minimum account age', kcBot: 'Advanced bot protection',
    kcFol: 'Followers only', kcSubs: 'Subscribers only', kcEmotes: 'Emotes only', kcSlow: 'Slow mode', kcWords: 'Banned words',
    kcPopout: 'Moderate chat in a pop-out window', kcEnable: 'Enabled', kcOffV: 'Off', kcOnV: 'On', kcAnyFol: 'All followers',
    kcMin: 'min', kcHr: 'h', kcDay: 'day', kcWeek: 'week', kcMonth: 'month', kcSec: 's',
    kcNeedLink: 'Connect your Kick account first (Settings → Kick link) to control chat settings.', kcNeedLinkBtn: 'Connect Kick',
    kcErrLogin: 'Sign in to your Kick account first (Settings → Kick link → Sign in with Kick account).',
    kcErrForbidden: 'Kick refused the request (usually Cloudflare or permissions). Open the Kick dashboard and change it there, and open ⓘ chat diagnostics for details.',
    kcErrRejected: 'Kick did not accept the change from the app (code {s}). Change it from the Kick dashboard, and open ⓘ chat diagnostics to share the details.',
    kcErrWeb: 'Could not reach the Kick website. Check the internet and try again.', kcNotApplied: 'Kick did not apply the change. Try again.',
    kcWordPh: 'Add a banned word', kcWordsFail: 'Could not load/edit banned words from the app. Use the Kick dashboard.', kcNoWords: 'No banned words.',
    kcWebLogin: 'Log in to Kick website',
    ksBarSub: 'Your stream numbers, live', kxListen: 'Listening for live events',
 kchTitle: 'Channel actions', kchSub: 'Full control of your channel in one place', kchOpen: 'Chat is open to everyone', kchPresets: 'Quick presets',
    kchPNormal: 'Normal', kchPNormalD: 'Turn off all limits', kchPShield: 'Shield', kchPShieldD: 'Followers 10m + slow + bots', kchPLock: 'Lock', kchPLockD: 'Subs only + slow', kchPClear: 'Clear chat', kchPClearD: 'Delete all messages', kchPDone: 'Preset applied',
    kchfAcc: 'Account age {m}', kchfBot: 'Bot protection', kchfFol: 'Followers only · {m}', kchfSubs: 'Subs only', kchfEmo: 'Emotes only', kchfSlow: 'Slow {s}s',
    kcChan: 'Channel options', kcView: 'Show viewer count', kcPred: 'Create a prediction', kcGoal: 'Set goals', kcManage: 'Manage channel',
    kcViewKick: 'Applied on Kick and in the app', kcViewLocal: 'Applied in the app (Kick did not accept the change from here)',
    kgTitle: 'Set goal', kgType: 'Goal type', kgFol: 'Followers', kgSubs: 'Subscriptions', kgTarget: 'Target number', kgName: 'Goal title (optional)', kgSave: 'Save goal', kgDel: 'Delete goal', kgNeed: 'Enter a number higher than the current one', kgReached: '🎉 Goal reached!', kgSay: 'Announce in chat when reached', kgChat: '🎉 Goal reached: {n} {w}! Thank you all ❤', kgNote: 'The goal is tracked inside the app and updates live with your stream numbers.',
    kpdModeL: 'Prediction type', kpdModeKick: 'Official Kick prediction (shown to viewers on Kick)', kpdModeChat: 'Chat prediction (people type p1 / p2) with live results',
    kpdLock: 'Lock voting now', kpdLocked: 'Prediction locked', kpdPick: 'Pick the winning outcome:', kpdWinner: 'Winner: {w}', kpdSRes: 'Ended', kpdSLocked: 'Locked',
    kpdHow: 'Type p1 or p2 ... in chat', kpdTotal: 'Participants: {n}', kpdClose: 'Close', kpdBusy: 'A prediction is already running. End or cancel it first.',
    kpdKickNote: 'The prediction is running on Kick. Set the result and winner from the Kick dashboard.', kpdOkChat: 'Chat prediction started',
    kpdAnn: '🔮 Prediction: {q} — {o} — type the outcome number like p1 ({d}s)', kpdLockAnn: '🔒 Prediction locked «{q}» — participants: {n}',
    kpdResAnn: '🏆 Prediction result «{q}»: {w} won — {n} guessed right ({p}%)', kpdCancelAnn: '🚫 Prediction cancelled «{q}»',
    kpdTitle: 'Create a prediction', kpdQ: 'Prediction question', kpdQph: 'Example: Will we win the match?', kpdOut: 'Possible outcomes (2 to 8)', kpdOutPh: 'Outcome', kpdDur: 'Voting time', kpdStart: 'Start prediction', kpdNeed: 'Write the question and at least two outcomes', kpdOk: 'Prediction started on Kick', kpdFailT: 'Kick did not accept the prediction', kpdAsChat: 'Start as chat prediction', kpdFail: 'Kick did not accept the official prediction from the app, and nothing was posted in chat. You can start it as a chat prediction instead (people type p1 / p2) with live results.', kpdCancel: 'Cancel prediction', kpdLeft: '{s} left', kpdCanceled: 'Prediction cancelled', kpdCanceledLocal: 'Removed from the app (check Kick)',
    kdmStart: 'Demo mode', kdmStop: 'Stop demo', kdmTag: 'DEMO', kdmActStart: 'Demo', kdmActTag: 'Demo', kdmModToast: 'Moderation demo: fake actions (delete / timeout / ban / pin) that never touch your account', kdmActToast2: 'Demo started: varied fake events (follows, subs, gifts, ...) that never touch your account', kxlDel: 'Deleted a message', kxlBan: 'Permanent ban', kxlTimeout: 'Timeout · {m}', kxlUnban: 'Unbanned', kxlPin: 'Pinned a message', kxlSetting: 'Changed chat settings', kxfPin: 'Pins',
    kxClear: 'Clear log', kxClearT: 'Clear log', kxClearQ: 'All events shown on this page will be permanently deleted. Continue?', kxClearOk: 'Log cleared',
    kdmTitle: 'Demo stream — these numbers are fake', kdmCat: 'Demo mode', kdmToast: 'Demo started: all numbers are fake and never touch your account', kdmStopToast: 'Demo stopped', kdmActToast: 'Follower demo: a fake follower arrives every few seconds'
  });

  const X = { ctx: null };
  window.KX = X;
  const nf = n => (n == null || isNaN(n)) ? '–' : Number(n).toLocaleString('en-US');
  const setTxt = (id, v) => { const e = $(id); if (e && e.textContent !== v) e.textContent = v; };
  const setHtml = (e, h) => { if (e && e.__h !== h) { e.__h = h; e.innerHTML = h; } };
  const cfg = () => (X.ctx && X.ctx.cfg && X.ctx.cfg()) || null;
  const me = () => String((cfg() && cfg().user && (cfg().user.name || cfg().user.slug)) || '').toLowerCase();
  const jget = k => { try { const v = JSON.parse(LS.get(k, '')); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  let saveT = null;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { LS.set('se_kact', JSON.stringify(act.filter(a => !a.demo))); LS.set('se_kmod', JSON.stringify(mod.filter(a => !a.demo))); LS.set('se_kseen', JSON.stringify([...seen].slice(-4000))); } catch (e) {} }, 800); };

  /* ---------- مدة نسبية ---------- */
  function ago(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 5) return t('kxNow');
    let v;
    if (s < 60) v = s + ' ' + t('kxS');
    else if (s < 3600) v = Math.floor(s / 60) + ' ' + t('kxM');
    else if (s < 86400) v = Math.floor(s / 3600) + ' ' + t('kxH');
    else v = Math.floor(s / 86400) + ' ' + t('kxD');
    return t('kxAgo', { v });
  }
  function dur(m) {
    m = parseInt(m, 10) || 0;
    if (m <= 0) return t('kcAnyFol');
    if (m < 60) return m + ' ' + t('kcMin');
    if (m < 1440) return (m / 60) + ' ' + t('kcHr');
    if (m < 10080) return (m / 1440) + ' ' + t('kcDay');
    if (m < 43200) return (m / 10080) + ' ' + t('kcWeek');
    return Math.round(m / 43200) + ' ' + t('kcMonth');
  }

  /* ---------- تفادي التكرار (نفس الحدث ممكن يوصل من Pusher ومن صفحة الجسر) ---------- */
  const evSeen = new Map();
  function once(key) {
    const now = Date.now();
    for (const [k, v] of evSeen) if (now - v > 12000) evSeen.delete(k);
    if (evSeen.has(key)) return false;
    evSeen.set(key, now); return true;
  }

/* ============ مساعدات عرض ============ */
  const clock = ts => { try { return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  function dayLabel(ts) {
    const d = new Date(ts), n = new Date(), d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), n0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    const diff = Math.round((n0 - d0) / 86400000);
    if (diff <= 0) return t('kxToday'); if (diff === 1) return t('kxYesterday');
    try { return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch (e) { return ''; }
  }
  const LIM = 200;

  /* ============ موجز النشاط ============ */
  let act = jget('se_kact'), mod = jget('se_kmod');
  act = act.filter(a => !a.demo); mod = mod.filter(a => !a.demo);   // أي بقايا تجربة قديمة محفوظة تُحذف
  const seen = new Set(jget('se_kseen'));
  const F = { act: 'all', mod: 'all' };
  let fresh = new Set();                                   // الصفوف الجديدة (تأثير ظهور خفيف)
  const ACT_IC = { follow: 'userplus', sub: 'star', gift: 'gift', raid: 'users', reward: 'zap', kicks: 'zap', tip: 'zap', first: 'chat', live: 'radio', end: 'stop', other: 'info' };
  const MOD_IC = { delete: 'trash', ban: 'ban', timeout: 'timer', unban: 'check', setting: 'sliders', pin: 'pin', other: 'shield' };
  function dupAct(o) {
    const u = String(o.user || '').toLowerCase();
    return act.some(a => (o.k && a.k === o.k) || (a.type === o.type && String(a.user || '').toLowerCase() === u && Math.abs((a.ts || 0) - o.ts) < 90000 && (o.type !== 'gift' || (a.n || 1) === (o.n || 1))));
  }
  function dupMod(o) {
    const tg = String(o.target || '').toLowerCase();
    return mod.some(a => (o.k && a.k === o.k) || (a.type === o.type && String(a.target || '').toLowerCase() === tg && Math.abs((a.ts || 0) - o.ts) < 90000));
  }
  function addAct(o) {
    if (o.key && !once('a:' + o.key)) return;
    const it = { type: o.type, user: o.user || '', n: o.n, r: o.r, ts: o.ts || Date.now(), k: o.k || '', x: o.x || '' }; if (o.demo) it.demo = 1;
    if (dupAct(it)) return;
    act.unshift(it); fresh.add(it.ts + '|' + it.type + '|' + it.user);
    if (act.length > LIM) act.length = LIM;
    save(); paintAct();
  }
  function actText(a) {
    switch (a.type) {
      case 'follow': return a.user ? t('kxFollow') : t('kxFollowN');
      case 'sub': return a.n > 1 ? t('kxResub', { n: a.n }) : t('kxSub');
      case 'gift': return t('kxGift', { n: a.n || 1 });
      case 'raid': return t('kxRaid', { n: a.n || '' });
      case 'reward': return t('kxReward', { r: a.r || '' });
      case 'kicks': return t('kxKicks', { n: a.n || '' });
      case 'tip': return t('kxTip', { n: a.n || '' });
      case 'first': return t('kxFirst');
      case 'live': return t('kxStart');
      case 'end': return t('kxEnd');
    }
    return a.x || t('kxOther');
  }
  const AV = ['#53fc18', '#3ea6ff', '#ff6b9a', '#ffb02e', '#a78bfa', '#2dd4bf', '#ff7a59', '#6ee7b7'];
  const avColor = n => { let h = 0; String(n || '?').split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return AV[h % AV.length]; };
  const rowHtml = (type, icon, title, sub, ts, isNew, user, demo) => {
    const av = user ? `<span class="kx-av" style="--av:${avColor(user)}">${esc(String(user).trim().charAt(0).toUpperCase())}<i class="kx-avb" data-t="${esc(type)}">${ic(icon, 10)}</i></span>`
      : `<i class="kx-ic" data-t="${esc(type)}">${ic(icon, 15)}</i>`;
    return `<div class="kx-item${isNew ? ' new' : ''}" data-t="${esc(type)}">${av}<div class="kx-tx"><b>${esc(title)}${demo ? `<span class="kx-dtag">${esc(t('kdmActTag'))}</span>` : ''}</b><small>${esc(sub)}</small></div><span class="kx-ago"><span class="kx-agot" data-ts="${ts}">${esc(ago(ts))}</span><small>${esc(clock(ts))}</small></span></div>`;
  };
  function filtersHtml(list, cur, counts) {
    return list.map(([k, lbl]) => `<button type="button" class="kx-fb${cur === k ? ' on' : ''}" data-f="${k}">${esc(t(lbl))}<i>${counts[k] || 0}</i></button>`).join('');
  }
  function groupHtml(items, rowFn) {
    let out = '', last = '';
    items.forEach(a => { const d = dayLabel(a.ts); if (d !== last) { last = d; out += `<div class="kx-day">${esc(d)}</div>`; } out += rowFn(a); });
    return out;
  }
  const ACT_OTHER = ['raid', 'reward', 'kicks', 'tip', 'live', 'end', 'other'];
  function paintAct() {
    const el = $('kxAct'); if (!el) return;
    const c = { all: 0, follow: 0, sub: 0, gift: 0, other: 0, first: 0 };
    act.forEach(a => { c.all++; if (a.type === 'first') { c.first++; return; } if (a.type === 'follow') c.follow++; else if (a.type === 'sub') c.sub++; else if (a.type === 'gift') c.gift += (a.n || 1); else c.other++; });
    setHtml($('kxActSum'), [['follow', 'kxcFollow', c.follow], ['sub', 'kxcSub', c.sub], ['gift', 'kxcGift', c.gift], ['raid', 'kxcOther', c.other]].map(([ty, lb, n]) => `<div class="kx-sc" data-t="${ty}"><b>${nf(n)}</b><small>${esc(t(lb))}</small></div>`).join(''));
    setHtml($('kxActF'), filtersHtml([['all', 'kxfAll'], ['follow', 'kxfFollow'], ['sub', 'kxfSub'], ['gift', 'kxfGift'], ['other', 'kxfOther'], ['first', 'kxfFirst']], F.act, c));
    const f = F.act;
    const list = act.filter(a => f === 'all' ? true : f === 'other' ? ACT_OTHER.includes(a.type) : a.type === f).sort((a, b) => b.ts - a.ts);
    setHtml(el, list.length ? groupHtml(list, a => rowHtml(a.type, ACT_IC[a.type] || 'info', a.user || actText(a), a.user ? actText(a) : '', a.ts, fresh.has(a.ts + '|' + a.type + '|' + a.user), a.user, a.demo)) : `<div class="k-empty">${esc(t('kxActEmpty'))}</div>`);
    if (fresh.size) setTimeout(() => { fresh = new Set(); }, 800);
  }

  /* ============ إجراءات المشرف ============ */
  function addMod(o) {
    if (o.key && !once('m:' + o.key)) return;
    const it = { type: o.type, actor: o.actor || '', target: o.target || '', m: o.m, ts: o.ts || Date.now(), k: o.k || '', why: o.why || '', msg: o.msg || '' }; if (o.demo) it.demo = 1;
    if (dupMod(it)) return;
    mod.unshift(it); fresh.add(it.ts + '|' + it.type + '|' + it.target);
    if (mod.length > LIM) mod.length = LIM;
    save(); paintMod();
  }
  function modText(a) {
    const u = a.target || '';
    switch (a.type) {
      case 'delete': return u ? t('kxDelOf', { u }) : t('kxDel');
      case 'ban': return t('kxBan', { u });
      case 'timeout': return t('kxTimeout', { u, m: a.m ? dur(a.m) : '' });
      case 'unban': return t('kxUnban', { u });
      case 'pin': return t('kxPin');
      case 'setting': return t('kxSetting');
    }
    return t('kxModOther', { u });
  }
  Object.assign(IC, { pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/>' });
  const MOD_LBL = { delete: 'kxlDel', ban: 'kxlBan', timeout: 'kxlTimeout', unban: 'kxlUnban', pin: 'kxlPin', setting: 'kxlSetting' };
  function modLabel(a) { return MOD_LBL[a.type] ? t(MOD_LBL[a.type], { m: a.m ? dur(a.m) : '' }).replace(/\s*·\s*$/, '') : t('kxModOther', { u: a.target || '' }); }
  function modRow(a, isNew) {
    const who = a.target || a.actor || '', icon = MOD_IC[a.type] || 'shield';
    const av = who ? `<span class="kx-av" style="--av:${avColor(who)}">${esc(String(who).trim().charAt(0).toUpperCase())}<i class="kx-avb" data-t="${esc(a.type)}">${ic(icon, 10)}</i></span>` : `<i class="kx-ic" data-t="${esc(a.type)}">${ic(icon, 15)}</i>`;
    const title = a.target || modLabel(a);
    const meta = [a.target ? `<span class="kx-chip" data-t="${esc(a.type)}">${esc(modLabel(a))}</span>` : '', a.actor ? `<span>${esc(t('kxByWho', { u: a.actor }))}</span>` : '', a.why ? `<span>${esc(t('kxReason', { r: a.why }))}</span>` : ''].filter(Boolean).join('');
    const q = a.msg ? `<q class="kx-q">${esc(a.msg)}</q>` : '';
    return `<div class="kx-item kx-mi${isNew ? ' new' : ''}" data-t="${esc(a.type)}">${av}<div class="kx-tx"><b>${esc(title)}${a.demo ? `<span class="kx-dtag">${esc(t('kdmActTag'))}</span>` : ''}</b>${meta ? `<small class="kx-meta">${meta}</small>` : ''}${q}</div><span class="kx-ago"><span class="kx-agot" data-ts="${a.ts}">${esc(ago(a.ts))}</span><small>${esc(clock(a.ts))}</small></span></div>`;
  }
  function paintMod() {
    const el = $('kxModList'); if (!el) return;
    const c = { all: 0, ban: 0, timeout: 0, delete: 0, pin: 0, other: 0 };
    mod.forEach(a => { c.all++; if (c[a.type] != null && a.type !== 'other') c[a.type]++; if (!['ban', 'timeout', 'delete', 'pin'].includes(a.type)) c.other++; });
    setHtml($('kxModSum'), [['ban', 'kxcBan', c.ban], ['timeout', 'kxcTimeout', c.timeout], ['delete', 'kxcDelete', c.delete], ['pin', 'kxfPin', c.pin]].map(([ty, lb, n]) => `<div class="kx-sc" data-t="${ty}"><b>${nf(n)}</b><small>${esc(t(lb))}</small></div>`).join(''));
    setHtml($('kxModF'), filtersHtml([['all', 'kxfAll'], ['ban', 'kxfBan'], ['timeout', 'kxfTimeout'], ['delete', 'kxfDelete'], ['pin', 'kxfPin'], ['other', 'kxfOther']], F.mod, c));
    const f = F.mod;
    const list = mod.filter(a => f === 'all' ? true : f === 'other' ? !['ban', 'timeout', 'delete', 'pin'].includes(a.type) : a.type === f).sort((a, b) => b.ts - a.ts);
    setHtml(el, list.length ? groupHtml(list, a => modRow(a, fresh.has(a.ts + '|' + a.type + '|' + a.target))) : `<div class="k-empty">${esc(t('kxModEmpty'))}</div>`);
    if (fresh.size) setTimeout(() => { fresh = new Set(); }, 800);
  }
  function paintModNeed() {
    const c = cfg(), need = !c || !c.connected || !c.canBan || !c.canDelete;
    const e = $('kxModNeed'); if (e) e.hidden = !need;
  }
  $('kxModReauth').onclick = () => { if (X.ctx && X.ctx.reauth) X.ctx.reauth(); };
  $('kxActF').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; F.act = b.dataset.f; paintAct(); });
  $('kxModF').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; F.mod = b.dataset.f; paintMod(); });
  function noteLogin(on) {
    if (on && linkedNow()) { on = false; }   // الحساب مربوط = ما نعرض ملاحظة الربط
    ['kxActNote', 'kxModNote'].forEach(id => { const e = $(id); if (!e) return; e.hidden = !on; const sp = e.querySelector('span'); if (sp && on) sp.textContent = t('kxLoginNote'); });
  }

  /* تنفيذ إجراء مشرف من الشات (حذف / تايم أوت / حظر) */
  X.doMod = async function (a) {
    let r; try { r = await api.kickMod(a); } catch (e) { r = { ok: false, code: 'fail', error: String(e && e.message || e) }; }
    if (r && r.ok) {
      const key = a.action === 'delete' ? 'del:' + a.messageId : 'ban:' + String(a.user || '').toLowerCase();
      addMod({ type: a.action, actor: (cfg() && cfg().user && (cfg().user.name || cfg().user.slug)) || '', target: a.user, m: a.minutes, key });
      toast('✔ ' + t('kxModDone'));
      return true;
    }
    if (r && (r.status === 401 || r.status === 403 || r.code === 'auth')) { if (cfg()) { cfg().canBan = false; cfg().canDelete = false; } paintModNeed(); toast('❌ ' + t('kxModPerm'), 7000); }
    else toast('❌ ' + t('kxModFail') + ((r && (r.error || r.code)) || ''), 6000);
    return false;
  };

  /* ============ استقبال بيانات Kick (من صفحات لوحة Kick نفسها + مسارات الموقع) ============
     نلتقط ردود JSON ونحوّل أي عناصر نشاط/إشراف فيها لصيغة موحّدة. التحويل متسامح مع اختلاف أسماء الحقول. */
  const SS = v => (v == null ? '' : String(v));
  const nameOf = o => { if (!o) return ''; if (typeof o === 'string') return o; if (typeof o === 'object') return SS(o.username || o.user_name || o.display_name || o.name || o.slug || ''); return ''; };
  function tsOf(o) {
    for (const k of ['created_at', 'createdAt', 'timestamp', 'time', 'date', 'occurred_at', 'followed_at', 'subscribed_at', 'banned_at', 'updated_at']) {
      const v = o[k]; if (v == null || v === '') continue; let n;
      if (typeof v === 'number') n = v < 1e12 ? v * 1000 : v;
      else { let x = String(v).trim(); if (/^\d{9,13}$/.test(x)) n = x.length <= 10 ? +x * 1000 : +x; else { if (/^\d{4}-\d\d-\d\d \d/.test(x)) x = x.replace(' ', 'T'); if (!/[zZ]|[+-]\d\d:?\d\d$/.test(x)) x += 'Z'; n = Date.parse(x); } }
      if (n && !isNaN(n)) return n;
    }
    return 0;
  }
  function collect(j, out, d) {
    if (!j || d > 5) return;
    if (Array.isArray(j)) { if (j.length && typeof j[0] === 'object' && j[0] && !Array.isArray(j[0])) out.push(j); return; }
    if (typeof j === 'object') Object.keys(j).forEach(k => collect(j[k], out, d + 1));
  }
  function normItem(o, idx) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    const d = (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) ? Object.assign({}, o, o.data) : o;
    const ty = SS(d.type || d.event || d.event_type || d.activity_type || d.action || d.kind || d.name || '').toLowerCase();
    const keys = Object.keys(d).join(',').toLowerCase();
    const actStrong = /follow|subscri|gift|host|raid|reward|kick|tip|donat|resub|renew/.test(ty), actKey = /gifted_usernames|gifter|reward_title|months/.test(keys);
    const modStrong = /ban|timeout|unban|delet|mute|purge|clear|pin|poll|slow|mode|moderat|emote/.test(ty), modKey = /banned_by|unbanned_by|moderator|expires_at|permanent/.test(keys);
    if (/^(message|reply|chat|chatmessage|chat_message|chatmessageevent)$/.test(ty)) return null;
    let ts = tsOf(d), approx = false; const hasTs = !!ts;
    if (!ts) { ts = Date.now() - idx * 1000; approx = true; }
    const id = SS(d.id || d.uuid || d.event_id || '');
    if ((actStrong || actKey) && !(modStrong && !actStrong)) {
      if (!actStrong && !hasTs) return null;
      let at = 'other', n, r = '', user = '';
      if (/gift/.test(ty) || d.gifted_usernames || d.gifter) { at = 'gift'; n = Array.isArray(d.gifted_usernames) ? d.gifted_usernames.length : (parseInt(d.quantity || d.count || d.amount || d.total, 10) || 1); user = SS(d.gifter_username) || nameOf(d.gifter) || nameOf(d.user) || SS(d.username); }
      else if (/resub|renew|subscri/.test(ty) || d.months) { at = 'sub'; n = parseInt(d.months || d.duration || d.length, 10) || 1; user = SS(d.username) || nameOf(d.user) || nameOf(d.subscriber); }
      else if (/host|raid/.test(ty)) { at = 'raid'; n = parseInt(d.viewers || d.viewer_count || d.number_viewers, 10) || 0; user = nameOf(d.host) || nameOf(d.hosted_by) || nameOf(d.channel) || SS(d.username) || nameOf(d.user); }
      else if (/reward/.test(ty) || d.reward_title) { at = 'reward'; r = SS(d.reward_title || d.title); user = SS(d.username) || nameOf(d.user); }
      else if (/kick/.test(ty)) { at = 'kicks'; n = parseInt(d.amount || (d.gift && d.gift.amount), 10) || 0; user = nameOf(d.sender) || SS(d.username) || nameOf(d.user); }
      else if (/tip|donat/.test(ty)) { at = 'tip'; n = SS(d.amount || d.total); user = SS(d.username) || nameOf(d.user) || nameOf(d.sender); }
      else if (/follow/.test(ty)) { at = 'follow'; user = SS(d.username) || nameOf(d.user) || nameOf(d.follower); }
      else return null;
      return { kind: 'act', v: { type: at, user, n, r, ts, k: id ? 'h:' + id : '', x: at === 'other' ? ty : '' }, approx };
    }
    if (modStrong || modKey) {
      let mt = 'other';
      if (/unban/.test(ty) || d.unbanned_by) mt = 'unban';
      else if (/timeout|mute/.test(ty) || (d.duration && d.permanent !== true) || (d.expires_at && d.permanent !== true)) mt = 'timeout';
      else if (/ban/.test(ty) || d.banned_by || d.permanent) mt = 'ban';
      else if (/delet|purge|clear/.test(ty)) mt = 'delete';
      else if (/pin/.test(ty)) mt = 'pin';
      else if (/slow|mode|emote|setting|rule/.test(ty)) mt = 'setting';
      const actor = nameOf(d.banned_by || d.unbanned_by || d.moderator || d.mod || d.actor || d.performed_by || d.deleted_by || d.by);
      const target = nameOf(d.banned_user || d.target || d.target_user || d.victim || d.user || d.username || d.banned_username);
      let m = 0; if (d.expires_at) { const e = Date.parse(SS(d.expires_at).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(SS(d.expires_at)) ? '' : 'Z')); if (e && ts) m = Math.max(1, Math.round((e - ts) / 60000)); } else if (d.duration) m = parseInt(d.duration, 10) || 0;
      if (!hasTs && mt === 'other') return null;
      return { kind: 'mod', v: { type: mt, actor, target, m, ts, why: SS(d.reason || d.description || d.details || ''), k: id ? 'h:' + id : '' }, approx };
    }
    return null;
  }
  const DS = { viewers: null, followers: null, subs: null, startedAt: null, live: null };
  function deepFind(j, names, d) {
    if (!j || typeof j !== 'object' || d > 5) return undefined;
    for (const n of names) if (j[n] != null && typeof j[n] !== 'object') return j[n];
    for (const k of Object.keys(j)) { const r = deepFind(j[k], names, d + 1); if (r !== undefined) return r; }
    return undefined;
  }
  function sessionHints(j, page) {
    if (page !== 'session') return;
    const v = deepFind(j, ['viewer_count', 'viewers', 'current_viewers', 'viewersCount'], 0), f = deepFind(j, ['followers_count', 'followersCount', 'followers'], 0), s = deepFind(j, ['subscribers_count', 'subscriber_count', 'active_subscribers_count', 'subs', 'sub_count'], 0);
    const st = deepFind(j, ['start_time', 'started_at', 'created_at'], 0), lv = deepFind(j, ['is_live', 'isLive', 'live'], 0);
    if (v != null && !isNaN(+v)) DS.viewers = +v; if (f != null && !isNaN(+f)) DS.followers = +f; if (s != null && !isNaN(+s)) DS.subs = +s;
    if (st) DS.startedAt = st; if (lv != null) DS.live = !!lv;
    paintSession();
  }
  function ingest(j, page) {
    if (!j) return;
    sessionHints(j, page);
    const arrs = []; collect(j, arrs, 0);
    let ca = false, cm = false;
    arrs.forEach(arr => arr.slice(0, LIM).forEach((it, i) => {
      const r = normItem(it, i); if (!r) return;
      if (r.kind === 'act') { if (!dupAct(r.v)) { act.push(r.v); ca = true; } }
      else if (!dupMod(r.v)) { mod.push(r.v); cm = true; }
    }));
    if (ca) { act.sort((a, b) => b.ts - a.ts); if (act.length > LIM) act.length = LIM; paintAct(); }
    if (cm) { mod.sort((a, b) => b.ts - a.ts); if (mod.length > LIM) mod.length = LIM; paintMod(); }
    if (ca || cm) save();
  }
  X.dash = m => { try { if (m && m.j) ingest(m.j, m.page); } catch (e) {} };
  X.dashState = m => { if (m && (m.login) && (m.page === 'activity' || m.page === 'mod')) noteLogin(true); else if (m && !m.login && m.page === 'activity') noteLogin(false); };
  const probing = {};
  async function probe(kind) {
    const st = X.ctx && X.ctx.stats && X.ctx.stats(); const slug = (st && st.slug) || lastSlug; if (!slug || probing[kind]) return;
    probing[kind] = true;
    try { const r = await api.kickDashProbe({ slug, kind }); if (r && r.ok) { ingest(r.data, kind); noteLogin(false); } else if (r && r.code === 'webLogin') noteLogin(true); }
    catch (e) {} finally { probing[kind] = false; }
  }
  let curTab = 'chat', tabT = null;
  X.tab = function (tb) {
    curTab = tb; clearInterval(tabT); tabT = null;
    const kinds = tb === 'activity' ? ['activity'] : tb === 'mod' ? ['mod'] : tb === 'session' ? ['live'] : [];
    if (!kinds.length) return;
    const run = () => kinds.forEach(k => probe(k));
    run(); tabT = setInterval(run, 45000);
  };

  /* ============ الجلسة ============ */
  let st0 = null;
  const hms = ms => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return [h, m, x].map(n => String(n).padStart(2, '0')).join(':'); };
  let ses = null; try { ses = JSON.parse(LS.get('se_kses', '')) || null; } catch (e) { ses = null; }
  const msgT = [];                                          // توقيت آخر الرسائل (لحساب رسائل/دقيقة)
  const chSet = new Set((ses && ses.ch) || []);
  const saveSes = () => { try { if (ses) { ses.ch = [...chSet].slice(-3000); LS.set('se_kses', JSON.stringify(ses)); } } catch (e) {} };
  let sesSaveT = null; const saveSesSoon = () => { clearTimeout(sesSaveT); sesSaveT = setTimeout(saveSes, 3000); };
  function sesUpdate(st) {
    if (!st || !st.live) return;
    const v = st.viewers != null ? st.viewers : DS.viewers;
    if (!ses || ses.slug !== st.slug || (st.startedAt && ses.started && ses.started !== st.startedAt)) {
      ses = { slug: st.slug, started: st.startedAt || '', bf: st.followers, bs: st.subs, peak: 0, sum: 0, n: 0, pts: [], msgs: 0 }; chSet.clear();
    }
    if (!ses.started && st.startedAt) ses.started = st.startedAt;
    if (ses.bf == null && st.followers != null) ses.bf = st.followers;
    if (ses.bs == null && st.subs != null) ses.bs = st.subs;
    if (v != null && !isNaN(v)) {
      const now = Date.now(), last = ses.pts[ses.pts.length - 1];
      if (!last || now - last[0] >= 10000) {
        ses.pts.push([now, +v]); if (ses.pts.length > 360) ses.pts.shift();
        ses.sum += +v; ses.n++; if (+v > ses.peak) ses.peak = +v; saveSesSoon();
      }
    }
  }
  const dlt = (el, v, base) => {
    if (!el) return;
    if (v == null || base == null || isNaN(v) || isNaN(base) || v === base) { setTxt(el.id, ''); el.className = ''; return; }
    const d = v - base; setTxt(el.id, (d > 0 ? '+' : '') + nf(d)); el.className = d > 0 ? 'up' : 'down';
  };
  function chartSvg(pts) {
    const W = 300, H = 84, P = 5;
    const grid = [0.25, 0.5, 0.75].map(r => `<line class="g" x1="0" x2="${W}" y1="${(H * r).toFixed(1)}" y2="${(H * r).toFixed(1)}"/>`).join('');
    const defs = '<defs><linearGradient id="ksg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ac-t);stop-opacity:.4"/><stop offset="1" style="stop-color:var(--ac-t);stop-opacity:0"/></linearGradient></defs>';
    if (!pts || pts.length < 2) return defs + grid;
    const vs = pts.map(p => p[1]), mx = Math.max(...vs), mn = Math.min(...vs), span = (mx - mn) || Math.max(1, mx * 0.2);
    const lo = Math.max(0, mn - span * 0.25), hi = mx + span * 0.15, t0 = pts[0][0], t1 = pts[pts.length - 1][0];
    const X_ = tt => P + (W - 2 * P) * ((tt - t0) / Math.max(1, t1 - t0)), Y_ = v => H - P - (H - 2 * P) * ((v - lo) / Math.max(1, hi - lo));
    const line = pts.map((p, i) => (i ? 'L' : 'M') + X_(p[0]).toFixed(1) + ' ' + Y_(p[1]).toFixed(1)).join(' ');
    const area = line + ` L${X_(t1).toFixed(1)} ${H} L${X_(t0).toFixed(1)} ${H} Z`;
    return defs + grid + `<path class="ar" d="${area}"/><path class="ln" d="${line}"/>`;
  }
  /* ---------- تنظيف التجارب: كل ما أنشأته التجربة (أحداث، عدّادات، فلاتر، مفاتيح منع التكرار) يُحذف بالكامل عند الإيقاف ---------- */
  function purgeDemo(kind) {   // kind: 'act' | 'mod'
    const pref = kind === 'mod' ? 'm:mdemo:' : 'a:demo:';
    for (const k of [...evSeen.keys()]) if (k.indexOf(pref) === 0) evSeen.delete(k);
    if (kind === 'mod') { mod = mod.filter(a => !a.demo); F.mod = 'all'; MD.n = 0; MD.last = ''; }
    else { act = act.filter(a => !a.demo); F.act = 'all'; AD.n = 0; AD.last = ''; }
    fresh = new Set();
    save();
    if (kind === 'mod') paintMod(); else paintAct();
  }
  /* ---------- تجربة العمل (أرقام وهمية فقط للعرض — لا تُحفظ ولا تتأثر بحساب Kick) ---------- */
  const DM = { on: false, t: null, st: null, ses: null, ch: new Set(), msgT: [], v: 0, t0: 0 };
  const DEMO_NAMES = ['Sara_Gamer', 'Abu_Khalid', 'NoorKick', 'Mazen77', 'LayaPlays', 'DrifterX', 'Hassan_TV', 'Rana.live', 'ProSniper', 'Tariq_92', 'MoonWalker', 'Dania_K', 'OmarFPS', 'Zain_Official', 'AlphaWolf', 'Yasmin_Art'];
  const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  X.demoOn = () => DM.on;
  X.demoHeader = () => DM.on && DM.st ? { v: DM.st.viewers, f: DM.st.followers } : null;
  function demoTick() {
    if (!DM.on) return;
    const st = DM.st, s = DM.ses;
    DM.v = Math.max(20, DM.v + rnd(-9, 14)); st.viewers = DM.v;
    if (Math.random() < 0.35) st.followers += rnd(1, 2);
    if (Math.random() < 0.15) st.subs += 1;
    const msgs = rnd(2, 9); s.msgs += msgs; for (let i = 0; i < msgs; i++) { DM.ch.add('u' + rnd(1, 140)); DM.msgT.push(Date.now() - rnd(0, 1500)); }
    s.pts.push([Date.now(), DM.v]); if (s.pts.length > 120) s.pts.shift();
    s.sum += DM.v; s.n++; if (DM.v > s.peak) s.peak = DM.v;
    paintSession(); paintDemoHeader();
  }
  function paintDemoHeader() {
    const h = X.demoHeader(); if (!h) return;
    const k = document.querySelector('#dkKick .k-stats'); if (k) k.hidden = false;
    [['kViews', h.v], ['kFollows', h.f]].forEach(([id, v]) => { const e = $(id); if (!e) return; const b = e.querySelector('b'); if (b) b.textContent = nf(v); if (id === 'kViews') e.classList.remove('off'); });
  }
  function demoSet(on) {
    if (on === DM.on) return;
    DM.on = on; clearInterval(DM.t); DM.t = null;
    if (on) {
      const now = Date.now(); DM.v = rnd(140, 260); DM.t0 = now - rnd(25, 70) * 60000;
      DM.st = { live: true, slug: 'demo', viewers: DM.v, followers: rnd(1200, 3400), subs: rnd(60, 240), title: t('kdmTitle'), category: t('kdmCat'), language: 'AR', mature: false, tags: ['Demo'], startedAt: new Date(DM.t0).toISOString() };
      DM.ses = { slug: 'demo', started: DM.st.startedAt, bf: DM.st.followers - rnd(3, 12), bs: DM.st.subs - rnd(0, 3), peak: DM.v, sum: 0, n: 0, pts: [], msgs: rnd(300, 900) };
      DM.ch = new Set(); for (let i = 0; i < rnd(40, 90); i++) DM.ch.add('u' + i);
      DM.msgT = []; for (let i = 0; i < rnd(18, 40); i++) DM.msgT.push(Date.now() - rnd(0, 55000));
      let v = Math.max(30, DM.v - rnd(40, 90)); for (let i = 60; i > 0; i--) { v = Math.max(20, v + rnd(-6, 9)); DM.ses.pts.push([now - i * 10000, v]); DM.ses.sum += v; DM.ses.n++; if (v > DM.ses.peak) DM.ses.peak = v; }
      DM.t = setInterval(demoTick, 2000); toast('🧪 ' + t('kdmToast'), 4500);
    } else { DM.st = null; DM.ses = null; DM.ch = new Set(); DM.msgT = []; DM.v = 0; DM.t0 = 0; toast(t('kdmStopToast')); try { paintGoal(); } catch (e) {} try { if (window.KX && X.ctx && X.ctx.refresh) X.ctx.refresh(true); } catch (e) {} }
    paintSession(); paintDemoBtns(); if (on) paintDemoHeader();
  }
  function paintDemoBtns() {
    const b = $('ksDemo'); if (b) { b.classList.toggle('on', DM.on); const ico = b.querySelector('i'); if (ico) ico.innerHTML = ic(DM.on ? 'stop' : 'play', 14); setTxt('ksDemoT', DM.on ? t('kdmStop') : t('kdmStart')); }
    const b2 = $('kxDemo'); if (b2) { b2.classList.toggle('on', AD.on); const ico = b2.querySelector('i'); if (ico) ico.innerHTML = ic(AD.on ? 'stop' : 'play', 14); setTxt('kxDemoT', AD.on ? t('kdmStop') : t('kdmActStart')); }
    const b3 = $('kxModDemo'); if (b3) { b3.classList.toggle('on', MD.on); const ico = b3.querySelector('i'); if (ico) ico.innerHTML = ic(MD.on ? 'stop' : 'play', 14); setTxt('kxModDemoT', MD.on ? t('kdmStop') : t('kdmActStart')); }
  }
  $('ksDemo').onclick = () => demoSet(!DM.on);

  /* ---------- تجربة النشاط: تجرّب كل أنواع الأحداث (متابع · اشتراك · تجديد · هدايا · استضافة · مكافأة · KICKs · تبرع · أول دردشة) ---------- */
  const AD = { on: false, t: null, n: 0, last: '' };
  const pickName = () => { let nm; do { nm = DEMO_NAMES[rnd(0, DEMO_NAMES.length - 1)] + (Math.random() < 0.5 ? '' : rnd(1, 99)); } while (nm === AD.last); AD.last = nm; return nm; };
  const REWARDS = ['تحدي اليوم', 'Highlight my message', 'اختر الأغنية', 'Sound Alert', 'صوت مضحك'];
  const ACT_SEQ = [
    () => ({ type: 'follow' }), () => ({ type: 'follow' }), () => ({ type: 'sub', n: 1 }), () => ({ type: 'first' }), () => ({ type: 'gift', n: rnd(1, 10) }),
    () => ({ type: 'follow' }), () => ({ type: 'sub', n: rnd(2, 14) }), () => ({ type: 'kicks', n: [100, 250, 500, 1000][rnd(0, 3)] }), () => ({ type: 'reward', r: REWARDS[rnd(0, REWARDS.length - 1)] }),
    () => ({ type: 'raid', n: rnd(15, 400) }), () => ({ type: 'first' }), () => ({ type: 'tip', n: '$' + [2, 5, 10, 20][rnd(0, 3)] }), () => ({ type: 'follow' })
  ];
  function actDemoOne() {
    AD.n++; const o = ACT_SEQ[AD.n % ACT_SEQ.length](), nm = pickName();
    addAct(Object.assign({ user: nm, key: 'demo:' + AD.n + ':' + nm, demo: 1 }, o));
  }
  function actDemoSet(on) {
    if (on === AD.on) return;
    AD.on = on; clearInterval(AD.t); AD.t = null;
    if (on) {
      const now = Date.now();
      for (let i = 0; i < 9; i++) { AD.n++; const o = ACT_SEQ[i](), nm = pickName(); addAct(Object.assign({ user: nm, key: 'demo:' + AD.n + ':' + nm, demo: 1, ts: now - (9 - i) * rnd(20, 70) * 1000 }, o)); }
      AD.t = setInterval(actDemoOne, rnd(2, 4) * 1000); toast('🧪 ' + t('kdmActToast2'), 4500);
    } else { purgeDemo('act'); toast(t('kdmStopToast')); }
    paintDemoBtns();
  }
  $('kxDemo').onclick = () => actDemoSet(!AD.on);

  /* ---------- تجربة المشرف: حذف / تايم أوت / حظر / فك حظر / تثبيت / تغيير إعدادات ---------- */
  const MD = { on: false, t: null, n: 0, last: '' };
  const MODS = ['black5', 'ModAhmad', 'Sultan_Mod', 'Reem.mod', 'Khalid_Admin'];
  const BAD = ['spam spam spam https://bit.ly/xxxx', 'اشتركوا بقناتي بسرعة!!!', 'CAPS LOCK ALL THE TIME !!!!', 'رابط إعلان مخالف', 'رسالة مزعجة متكررة'];
  const WHY = ['سبام', 'ألفاظ مسيئة', 'إعلانات', 'تكرار الرسائل', 'مخالفة القوانين', ''];
  const PINS = ['موعد البث القادم الساعة 8 مساءً', 'لا تنسوا المتابعة والاشتراك ❤', 'قوانين الشات: احترام الجميع'];
  const pk = a => a[rnd(0, a.length - 1)];
  const MOD_SEQ = [
    (u, a) => ({ type: 'delete', target: u, actor: a, msg: pk(BAD) }),
    (u, a) => ({ type: 'timeout', target: u, actor: a, m: [1, 5, 10, 30, 60, 1440][rnd(0, 5)], why: pk(WHY) }),
    (u, a) => ({ type: 'delete', target: u, actor: a, msg: pk(BAD) }),
    (u, a) => ({ type: 'ban', target: u, actor: a, why: pk(WHY.slice(0, 5)) }),
    (u, a) => ({ type: 'pin', target: '', actor: a, msg: pk(PINS) }),
    (u, a) => ({ type: 'unban', target: u, actor: a }),
    (u, a) => ({ type: 'timeout', target: u, actor: a, m: [5, 10, 30][rnd(0, 2)], why: pk(WHY) }),
    (u, a) => ({ type: 'setting', target: '', actor: a })
  ];
  function modDemoOne(i, ts) {
    MD.n++; let u; do { u = pk(DEMO_NAMES) + (Math.random() < 0.5 ? '' : rnd(1, 99)); } while (u === MD.last); MD.last = u;
    const o = MOD_SEQ[(i != null ? i : MD.n) % MOD_SEQ.length](u, pk(MODS));
    addMod(Object.assign({ key: 'mdemo:' + MD.n + ':' + u, demo: 1 }, ts ? { ts } : {}, o));
  }
  function modDemoSet(on) {
    if (on === MD.on) return;
    MD.on = on; clearInterval(MD.t); MD.t = null;
    if (on) {
      const now = Date.now();
      for (let i = 0; i < 8; i++) modDemoOne(i, now - (8 - i) * rnd(25, 80) * 1000);
      MD.t = setInterval(() => modDemoOne(), rnd(3, 5) * 1000); toast('🧪 ' + t('kdmModToast'), 4500);
    } else { purgeDemo('mod'); toast(t('kdmStopToast')); }
    paintDemoBtns();
  }
  $('kxModDemo').onclick = () => modDemoSet(!MD.on);

  function paintSession() {
    const dm = DM.on;
    const st = dm ? DM.st : st0, live = dm ? true : (!!(st && st.live) || (!st && DS.live === true));
    const mine = dm ? DM.ses : (ses && st && ses.slug === st.slug ? ses : null);
    const mT = dm ? DM.msgT : msgT, chN = dm ? DM.ch.size : chSet.size;
    const pill = $('kxStatus');
    if (pill) { pill.classList.toggle('live', live); setTxt('kxStatus', live ? t('kxLive') : t('kxOff')); }
    const tg = $('ksTestTag'); if (tg) { tg.hidden = !dm; setTxt('ksTestTag', t('kdmTag')); }
    const viewers = st && st.viewers != null ? st.viewers : DS.viewers, fol = st && st.followers != null ? st.followers : DS.followers, subs = st && st.subs != null ? st.subs : DS.subs;
    setTxt('kxViewers', viewers != null && (live || viewers > 0) ? nf(viewers) : '–');
    setTxt('kxFollowers', fol != null ? nf(fol) : '–');
    setTxt('kxSubs', subs != null ? nf(subs) : '–');
    dlt($('ksFolD'), fol, mine && live ? mine.bf : null); dlt($('ksSubsD'), subs, mine && live ? mine.bs : null);
    if (mine && live && mine.pts.length) { const ref = mine.pts.find(p => Date.now() - p[0] <= 60000 + 12000 && Date.now() - p[0] >= 50000); dlt($('ksViewersD'), viewers, ref ? ref[1] : null); } else dlt($('ksViewersD'), null, null);
    setTxt('ksPeak', mine && mine.peak ? nf(mine.peak) : '–');
    setTxt('ksAvg', mine && mine.n ? nf(Math.round(mine.sum / mine.n)) : '–');
    const now = Date.now(); while (mT.length && now - mT[0] > 60000) mT.shift();
    setTxt('ksMpm', mine && live ? String(mT.length) : '–');
    setTxt('ksChatters', mine ? nf(chN) : '–');
    setTxt('ksMsgs', mine ? nf(mine.msgs) : '–');
    const pts = mine ? mine.pts : [];
    const cs = $('ksChart'); if (cs && cs.__p !== (pts.length + ':' + (pts[pts.length - 1] || [])[0])) { cs.__p = pts.length + ':' + (pts[pts.length - 1] || [])[0]; cs.innerHTML = chartSvg(pts); }
    setTxt('ksChartNote', pts.length > 1 ? t('ksSince') : t('ksChartNone'));
    const started = (st && st.startedAt) || (mine && mine.started) || DS.startedAt;
    let sd = ''; try { if (started) sd = new Date(started).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) {}
    const rows = [[t('ksTitleL'), (st && st.title) || '–'], [t('ksCatL'), (st && st.category) || '–'], [t('ksStarted'), live && sd ? sd : '–'], [t('ksLangL'), ((st && st.language) || '–') + (st && st.mature ? ' · 18+' : '')], [t('ksTags'), st && st.tags && st.tags.length ? st.tags.join(' · ') : '–'], [t('ksRoom'), dm ? '—' : String((X.ctx && X.ctx.room && X.ctx.room()) || '–')]];
    setHtml($('ksRows'), rows.map(([k, v]) => `<div class="ks-r"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join(''));
    tickTime();
  }
  function tickTime() {
    const st = DM.on ? DM.st : st0, started = (st && st.startedAt) || DS.startedAt;
    setTxt('kxTime', (DM.on || (st && st.live)) && started ? hms(Date.now() - Date.parse(started)) : '–');
  }

  /* ============ إجراءات القناة ============ */
  const DEF = { slow: false, interval: 5, followers: false, followMin: 0, subs: false, emotes: false, account: false, accountMin: 0, bot: false };
  const KEYS = Object.keys(DEF);
  const FOL_OPTS = [0, 1, 5, 10, 15, 30, 60, 180, 360, 720, 1440, 10080, 43200];
  const ACC_OPTS = [5, 10, 30, 60, 1440, 10080, 43200];
  const SLOW_OPTS = [3, 5, 10, 15, 30, 60, 120, 300];
  const CS = { cur: null, pend: {}, words: null };

  function fillSel(id, list, fmt) {
    const e = $(id); if (!e) return;
    const keep = e.value;
    const h = list.map(v => `<option value="${v}">${esc(fmt(v))}</option>`).join('');
    if (e.__h !== h) { e.innerHTML = h; e.__h = h; if (keep) e.value = keep; }
  }
  function fillAllSel() {
    fillSel('kcFolSel', FOL_OPTS, dur);
    fillSel('kcAccSel', ACC_OPTS, dur);
    fillSel('kcSlowSel', SLOW_OPTS, v => v + ' ' + t('kcSec'));
  }
  function effective() {
    const out = Object.assign({}, DEF, CS.cur || {}), now = Date.now();
    KEYS.forEach(k => {
      const p = CS.pend[k]; if (!p) return;
      if (CS.cur && CS.cur[k] === p.v) { delete CS.pend[k]; return; }
      if (now > p.until) { delete CS.pend[k]; if (!CS.warned) { CS.warned = true; toast('❌ ' + t('kcNotApplied'), 5000); } return; }
      out[k] = p.v;
    });
    return out;
  }
  function setChk(id, v) { const e = $(id); if (e && e.checked !== !!v && document.activeElement !== e) e.checked = !!v; }
  function setSel(id, v) {
    const e = $(id); if (!e || document.activeElement === e) return;
    const sv = String(v);
    if (![...e.options].some(o => o.value === sv)) { const o = document.createElement('option'); o.value = sv; o.textContent = id === 'kcSlowSel' ? sv + ' ' + t('kcSec') : dur(v); e.appendChild(o); }
    if (e.value !== sv) e.value = sv;
  }
  const onTxt = (on, extra) => on ? (t('kcOnV') + (extra ? ' · ' + extra : '')) : t('kcOffV');
  function paintChannel() {
    const c = cfg(), linked = !!(c && c.connected) || !!(X.ctx && X.ctx.wl && X.ctx.wl());
    const need = $('kcNeed'); if (need) { need.hidden = linked; setTxt('kcNeedT', t('kcNeedLink')); setTxt('kcNeedBtnT', t('kcNeedLinkBtn')); }
    document.querySelectorAll('#kpChannel input, #kpChannel select').forEach(e => { if (e.id !== 'kcWordIn' && e.id !== 'kcViewOn') e.disabled = !linked; });
    const s = effective();
    setChk('kcAccOn', s.account); setSel('kcAccSel', s.accountMin || ACC_OPTS[0]); setChk('kcBotOn', s.bot);
    setChk('kcFolOn', s.followers); setSel('kcFolSel', s.followMin);
    setChk('kcSubsOn', s.subs); setChk('kcEmoOn', s.emotes);
    setChk('kcSlowOn', s.slow); setSel('kcSlowSel', s.interval || SLOW_OPTS[1]);
    setTxt('kcRestrV', onTxt(s.account || s.bot, s.account ? dur(s.accountMin) : ''));
    setTxt('kcFolV', onTxt(s.followers, s.followers ? dur(s.followMin) : ''));
    setTxt('kcSlowV', onTxt(s.slow, s.slow ? s.interval + ' ' + t('kcSec') : ''));
    setTxt('kcWordsV', CS.words ? String(CS.words.length) : '');
  }
  function chatNote(msg, kind) {
    const n = $('kcNote'), b = $('kcDash');
    n.hidden = !msg; n.textContent = msg || '';
    b.hidden = !kind; b.dataset.kind = kind || '';
    const sp = b.querySelector('span'); if (sp) sp.textContent = t('kWebDash');
  }
  $('kcDash').onclick = () => api.kickOpenWeb($('kcDash').dataset.kind || 'dashboard');
  $('kcNeedBtn').onclick = () => openSettings('kick');
  $('kcPopout').onclick = () => api.kickOpenWeb('popout');
  function chatErr(r) {
    const code = r && r.code;
    if (code === 'webLogin') chatNote(t('kcErrLogin'), 'dashboard');
    else if (code === 'webForbidden') chatNote(t('kcErrForbidden'), 'dashboard');
    else if (code === 'webRejected') chatNote(t('kcErrRejected', { s: r.status || '?' }), 'dashboard');
    else if (code === 'noOwn') chatNote(t('kcNeedLink'), '');
    else chatNote(t('kcErrWeb'), '');
  }
  let chain = Promise.resolve();
  function applyChat(patch) {
    const c = cfg();
    if (!(c && c.connected) && !(X.ctx && X.ctx.wl && X.ctx.wl())) { toast(t('kcNeedLink')); paintChannel(); return; }
    CS.warned = false;
    Object.keys(patch).forEach(k => { CS.pend[k] = { v: patch[k], until: Date.now() + 9000 }; });
    paintChannel(); setTimeout(paintChannel, 9300);
    const full = effective();
    chain = chain.then(async () => {
      let r; try { r = await api.kickSetChat({ patch: full }); } catch (e) { r = { ok: false, code: 'fail' }; }
      if (r && r.ok) { chatNote(''); return; }
      Object.keys(patch).forEach(k => { delete CS.pend[k]; });
      CS.warned = true; paintChannel(); chatErr(r);
    });
  }
  const val = id => parseInt($(id).value, 10) || 0;
  $('kcAccOn').onchange = () => applyChat(Object.assign({ account: $('kcAccOn').checked }, $('kcAccOn').checked ? { accountMin: val('kcAccSel') } : {}));
  $('kcAccSel').onchange = () => applyChat({ account: true, accountMin: val('kcAccSel') });
  $('kcBotOn').onchange = () => applyChat({ bot: $('kcBotOn').checked });
  $('kcFolOn').onchange = () => applyChat(Object.assign({ followers: $('kcFolOn').checked }, $('kcFolOn').checked ? { followMin: val('kcFolSel') } : {}));
  $('kcFolSel').onchange = () => applyChat({ followers: true, followMin: val('kcFolSel') });
  $('kcSubsOn').onchange = () => applyChat({ subs: $('kcSubsOn').checked });
  $('kcEmoOn').onchange = () => applyChat({ emotes: $('kcEmoOn').checked });
  $('kcSlowOn').onchange = () => applyChat(Object.assign({ slow: $('kcSlowOn').checked }, $('kcSlowOn').checked ? { interval: val('kcSlowSel') } : {}));
  $('kcSlowSel').onchange = () => applyChat({ slow: true, interval: val('kcSlowSel') });

  /* القوائم المنسدلة (accordion) */
  document.querySelectorAll('#kpChannel .kc-item > .kc-row').forEach(b => b.onclick = () => {
    const item = b.parentElement, body = item.querySelector('.kc-body');
    const open = body.hidden; body.hidden = !open; item.classList.toggle('open', open);
    if (open && item.id === 'kcWords') loadWords();
  });

  /* الكلمات المحظورة */
  function paintWords() {
    const el = $('kcWordList'); if (!el) return;
    if (!CS.words) { setHtml(el, ''); return; }
    setHtml(el, CS.words.length ? CS.words.map(w => `<span class="kc-chip">${esc(w.word)}<button type="button" data-w="${esc(w.word)}" data-id="${esc(w.id == null ? '' : w.id)}">${ic('x', 11)}</button></span>`).join('') : `<div class="k-empty">${esc(t('kcNoWords'))}</div>`);
    setTxt('kcWordsV', String(CS.words.length));
  }
  async function loadWords() {
    if (!(cfg() && cfg().connected) && !(X.ctx && X.ctx.wl && X.ctx.wl())) return;
    let r; try { r = await api.kickWords({ op: 'list' }); } catch (e) { r = null; }
    if (r && r.ok) { CS.words = r.list || []; paintWords(); chatNote(''); }
    else { CS.words = null; paintWords(); if (r && r.code === 'webLogin') chatErr(r); else chatNote(t('kcWordsFail'), 'dashboard'); }
  }
  $('kcWordAdd').onclick = async () => {
    const w = $('kcWordIn').value.trim(); if (!w) return;
    const r = await api.kickWords({ op: 'add', word: w }).catch(() => null);
    if (r && r.ok) { $('kcWordIn').value = ''; loadWords(); } else if (r && r.code === 'webLogin') chatErr(r); else chatNote(t('kcWordsFail'), 'dashboard');
  };
  $('kcWordIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('kcWordAdd').click(); } });
  $('kcWordList').addEventListener('click', async e => {
    const b = e.target.closest('button[data-w]'); if (!b) return;
    const r = await api.kickWords({ op: 'remove', word: b.dataset.w, id: b.dataset.id || undefined }).catch(() => null);
    if (r && r.ok) loadWords(); else chatNote(t('kcWordsFail'), 'dashboard');
  });

  /* ============ ربط البيانات القادمة من kick.js ============ */
  const normRoom = d => {     // نفس تطبيع main.js لحدث ChatroomUpdatedEvent
    const en = v => (v && typeof v === 'object') ? !!(v.enabled != null ? v.enabled : v.enable) : !!v;
    const num = (...a) => { for (const x of a) { const n = parseInt(x, 10); if (!isNaN(n)) return n; } return 0; };
    const sm = d.slow_mode, fm = d.followers_mode, ac = d.account_age, bp = d.advanced_bot_protection;
    return { slow: en(sm), interval: num(sm && sm.message_interval, d.message_interval), followers: en(fm), followMin: num(fm && fm.min_duration, d.following_min_duration), subs: en(d.subscribers_mode), emotes: en(d.emotes_mode), account: en(ac), accountMin: num(ac && ac.min_duration), bot: en(bp) };
  };
  let lastSlug = '', lastFol = null;
  X.stats = function (st) {
    st0 = st; if (!DM.on) sesUpdate(st);
    if (st && st.slug && st.slug !== lastSlug) {
      if (lastSlug) { stopAllDemos(); act = []; mod = []; CS.cur = null; CS.pend = {}; CS.words = null; paintAct(); paintMod(); paintWords(); }
      lastSlug = st.slug; LS.set('se_kslug', st.slug);
    }
    if (st && st.chat) CS.cur = Object.assign({}, DEF, st.chat);
    if (st && st.followers != null) lastFol = st.followers;
    paintSession(); paintChannel(); paintModNeed();
  };
  X.cfgChanged = function () { paintChannel(); paintModNeed(); };
  X.addMod = addMod;
  X.counts = () => ({ act: act.length, mod: mod.length });
  function stopAllDemos() { try { if (DM.on) demoSet(false); if (AD.on) actDemoSet(false); if (MD.on) modDemoSet(false); } catch (e) {} }
  X.stopDemos = stopAllDemos;
  X.reset = function () { stopAllDemos(); st0 = null; CS.cur = null; CS.pend = {}; paintSession(); paintChannel(); paintModNeed(); try { api.kickDashStop(); } catch (e) {} };
  X.msg = function (d) {
    const nm = String(d && d.sender && d.sender.username || ''); if (!nm) return;
    const k = nm.toLowerCase();
    if (ses && st0 && st0.live && ses.slug === st0.slug) { ses.msgs++; chSet.add(k); msgT.push(Date.now()); saveSesSoon(); }
    if (k === me()) return;
    if (seen.has(k)) return;
    seen.add(k); save();
    addAct({ type: 'first', user: nm, key: '1:' + k });
  };
  X.event = function (name, d) {
    try {
      switch (name) {
        case 'FollowersUpdated': {
          if (d.followed === false) break;
          const n = parseInt(d.followersCount != null ? d.followersCount : d.followers_count, 10);
          const user = d.username || (d.user && d.user.username) || '';
          if (user) addAct({ type: 'follow', user, key: 'f:' + user + ':' + (d.created_at || n) });
          else if (!isNaN(n) && lastFol != null && n > lastFol) addAct({ type: 'follow', user: '', key: 'fn:' + n });
          if (!isNaN(n)) lastFol = n;
          break;
        }
        case 'SubscriptionEvent': addAct({ type: 'sub', user: d.username, n: parseInt(d.months, 10) || 1, key: 's:' + d.username + ':' + (d.months || 1) }); break;
        case 'GiftedSubscriptionsEvent': { const n = Array.isArray(d.gifted_usernames) ? d.gifted_usernames.length : 1; addAct({ type: 'gift', user: d.gifter_username, n, key: 'g:' + d.gifter_username + ':' + n + ':' + (d.gifter_total || '') }); break; }
        case 'RewardRedeemedEvent': addAct({ type: 'reward', user: d.username, r: d.reward_title, key: 'r:' + d.username + ':' + d.reward_title + ':' + (d.user_input || '') }); break;
        case 'KicksGifted': addAct({ type: 'kicks', user: d.sender && d.sender.username, n: d.gift && d.gift.amount, key: 'k:' + (d.sender && d.sender.username) + ':' + (d.gift && d.gift.gift_id) + ':' + (d.message || '') }); break;
        case 'StreamerIsLive': addAct({ type: 'live', key: 'live:' + Math.floor(Date.now() / 60000) }); break;
        case 'StopStreamBroadcast': addAct({ type: 'end', key: 'end:' + Math.floor(Date.now() / 60000) }); break;
        case 'UserBannedEvent': {
          const u = d.user && d.user.username || '', by = d.banned_by && d.banned_by.username || '';
          let m = 0; if (d.expires_at) m = Math.max(1, Math.round((Date.parse(d.expires_at) - Date.now()) / 60000)); else if (d.duration) m = parseInt(d.duration, 10) || 0;
          const perm = d.permanent != null ? !!d.permanent : !d.expires_at;
          addMod({ type: perm ? 'ban' : 'timeout', actor: by, target: u, m, why: String(d.reason || ''), key: 'ban:' + u.toLowerCase() });
          break;
        }
        case 'UserUnbannedEvent': { const u = d.user && d.user.username || '', by = d.unbanned_by && d.unbanned_by.username || ''; addMod({ type: 'unban', actor: by, target: u, key: 'unban:' + u.toLowerCase() }); break; }
        case 'MessageDeletedEvent': {
          const id = String((d.message && d.message.id) || d.id || ''); if (!id) break;
          let who = '', txt = ''; try { const n = document.querySelector('.k-msg[data-id="' + id.replace(/"/g, '') + '"]'); if (n) { who = n.dataset.user || ''; txt = (n.dataset.txt || '').slice(0, 140); } } catch (e) {}
          const by = (d.deleted_by && (d.deleted_by.username || d.deleted_by)) || (d.moderator && d.moderator.username) || '';
          addMod({ type: 'delete', actor: typeof by === 'string' ? by : '', target: who, msg: txt, key: 'del:' + id });
          break;
        }
        case 'RaidEvent': case 'HostEvent': case 'ChannelHosted': addAct({ type: 'raid', user: (d.host && d.host.username) || d.username || d.hosted_by || '', n: parseInt(d.viewers || d.number_viewers, 10) || 0, key: 'raid:' + (d.username || '') + ':' + Math.floor(Date.now() / 60000) }); break;
        case 'PinnedMessageCreated': {
          const pm = d.message || d, pu = (pm.sender && pm.sender.username) || '', pb = (d.pinned_by && d.pinned_by.username) || (d.pinnedBy && d.pinnedBy.username) || '';
          addMod({ type: 'pin', actor: pb, target: pu, msg: String(pm.content || '').slice(0, 140), key: 'pin:' + (pm.id || Math.floor(Date.now() / 60000)) }); break;
        }
        case 'ChatroomUpdatedEvent': case 'ChatroomUpdated': {
          CS.cur = Object.assign({}, DEF, CS.cur || {}, normRoom(d)); paintChannel(); break;
        }
      }
    } catch (e) {}
  };


  /* ============ v1.3.0: إجراءات القناة — الملخص + إعدادات سريعة + خيارات القناة (مشاهدات / أهداف) ============ */
  Object.assign(IC, {
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    poll: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
  });
  const linkedNow = () => { const c = cfg(); return !!(c && c.connected) || !!(X.ctx && X.ctx.wl && X.ctx.wl()); };
  const PRESETS = {
    normal: { slow: false, followers: false, subs: false, emotes: false, account: false, bot: false },
    shield: { followers: true, followMin: 10, slow: true, interval: 5, bot: true },
    lock:   { subs: true, slow: true, interval: 10 }
  };
  function presetMatch(s, p) { return Object.keys(PRESETS[p]).every(k => s[k] === PRESETS[p][k]); }
  function paintChannelExtra() {
    const s = effective();
    const chips = [];
    if (s.account) chips.push(['a', t('kchfAcc', { m: dur(s.accountMin) })]);
    if (s.bot) chips.push(['a', t('kchfBot')]);
    if (s.followers) chips.push(['b', t('kchfFol', { m: dur(s.followMin) })]);
    if (s.subs) chips.push(['c', t('kchfSubs')]);
    if (s.emotes) chips.push(['d', t('kchfEmo')]);
    if (s.slow) chips.push(['e', t('kchfSlow', { s: s.interval })]);
    setHtml($('kcSum'), chips.length ? chips.map(([c, l]) => `<span class="kch-chip" data-c="${c}">${esc(l)}</span>`).join('') : `<span class="kch-chip open">${ic('check', 12)}${esc(t('kchOpen'))}</span>`);
    document.querySelectorAll('#kcPresets [data-p]').forEach(b => { const p = b.dataset.p; b.classList.toggle('on', !!PRESETS[p] && presetMatch(s, p)); b.disabled = !linkedNow(); });
    const vOn = LS.get('se_kviews', '1') !== '0'; setChk('kcViewOn', vOn); document.body.classList.toggle('k-hideviews', !vOn);
    paintGoal();
  }
  document.getElementById('kcPresets').addEventListener('click', async e => {
    const b = e.target.closest('[data-p]'); if (!b || b.disabled) return; const p = b.dataset.p;
    if (p === 'clear') { if (window.KC && KC.mod) { try { await KC.mod({ action: 'clear' }); } catch (x) {} } return; }
    applyChat(Object.assign({}, PRESETS[p])); toast('✔ ' + t('kchPDone'), 2500);
  });
  const _pc = paintChannel; paintChannel = function () { _pc(); try { paintChannelExtra(); } catch (e) {} };

  /* ---- إظهار عدد المشاهدات: يُطبَّق في البرنامج دائماً + محاولة على Kick ---- */
  $('kcViewOn').onchange = async () => {
    const on = $('kcViewOn').checked; LS.set('se_kviews', on ? '1' : '0'); document.body.classList.toggle('k-hideviews', !on);
    if (!linkedNow()) { toast(t('kcViewLocal'), 3500); return; }
    let r; try { r = await api.kickViewerCount({ show: on }); } catch (e) { r = null; }
    toast(r && r.ok ? '✔ ' + t('kcViewKick') : t('kcViewLocal'), 4000);
  };

  $('kcManage').onclick = () => api.kickOpenWeb('dashboard');

  /* ---- الأهداف (تُتابَع داخل البرنامج وتتحدث مع بثك) ---- */
  let GL = null; try { GL = JSON.parse(LS.get('se_kgoal', '')) || null; } catch (e) { GL = null; }
  const saveGoal = () => { try { LS.set('se_kgoal', GL ? JSON.stringify(GL) : ''); } catch (e) {} };
  const curStats = () => (DM.on && DM.st) ? DM.st : st0;
  function paintGoal() {
    const v = $('kcGoalV'), live = $('kcLive'); if (!live) return;
    const st = curStats(); const cur = GL && st ? (GL.type === 'subs' ? st.subs : st.followers) : null;
    if (v) setTxt('kcGoalV', GL ? nf(GL.target) : '');
    if (GL && cur != null && !GL.done && cur >= GL.target) { GL.done = true; saveGoal(); toast(t('kgReached'), 6000); if (GL.say !== false && !(DM.on) && window.KSend && X.ctx && X.ctx.canSend && X.ctx.canSend()) { try { window.KSend(t('kgChat', { n: nf(GL.target), w: t(GL.type === 'subs' ? 'kgSubs' : 'kgFol') }), null).catch(() => {}); } catch (e) {} } }
    X.__goalHtml = GL ? (() => {
      const pct = cur == null ? 0 : Math.max(0, Math.min(100, Math.round(cur / GL.target * 100)));
      return `<div class="kch-goal${GL.done ? ' done' : ''}"><div class="kch-gh"><i>${ic('target', 15)}</i><b>${esc(GL.title || t(GL.type === 'subs' ? 'kgSubs' : 'kgFol'))}</b><button type="button" class="icon-btn" data-g="edit" title="${esc(t('kgTitle'))}">${ic('edit', 13)}</button></div><div class="kch-gbar"><i style="width:${pct}%"></i></div><div class="kch-gn"><span dir="ltr">${cur == null ? '–' : nf(cur)} / ${nf(GL.target)}</span><em>${pct}%</em></div></div>`;
    })() : '';
    paintLive();
  }
  function goalDialog() {
    const st = curStats(), g = GL || { type: 'followers', target: 0, title: '' };
    const body = `<div class="grid2"><label class="f"><span>${esc(t('kgType'))}</span><select id="kgType"><option value="followers" ${g.type === 'followers' ? 'selected' : ''}>${esc(t('kgFol'))}</option><option value="subs" ${g.type === 'subs' ? 'selected' : ''}>${esc(t('kgSubs'))}</option></select></label>
      <label class="f"><span>${esc(t('kgTarget'))}</span><input type="number" id="kgTarget" min="1" max="100000000" value="${g.target || ''}" dir="ltr"></label>
      <label class="f full"><span>${esc(t('kgName'))}</span><input type="text" id="kgName" maxlength="40" value="${esc(g.title || '')}"></label></div>
      <label class="k-toggle" style="margin-top:10px"><input type="checkbox" id="kgSay" ${g.say === false ? '' : 'checked'}><span class="k-sw"></span><b>${esc(t('kgSay'))}</b></label>
      <div class="k-snote" style="margin-top:8px">${esc(t('kgNote'))}</div>`;
    const acts = [{ label: t('cancel') }];
    if (GL) acts.push({ label: t('kgDel'), kind: 'danger', cb: () => { GL = null; saveGoal(); paintGoal(); } });
    acts.push({ label: t('kgSave'), kind: 'primary', cb: () => {
      const type = $('kgType').value, target = parseInt($('kgTarget').value, 10) || 0, cur = st ? (type === 'subs' ? st.subs : st.followers) : 0;
      if (target < 1 || (cur != null && target <= cur)) { toast(t('kgNeed'), 4000); return false; }
      GL = { type, target, title: $('kgName').value.trim(), done: false, say: $('kgSay').checked }; saveGoal(); paintGoal();
    } });
    dlg({ title: t('kgTitle'), body, actions: acts, onOpen: () => $('kgTarget').focus() });
  }
  $('kcGoalBtn').onclick = goalDialog;

  /* الاستطلاع والتوقعات حُذفت من الشات — تبقى بطاقة الهدف فقط */
  function paintLive() { setHtml($('kcLive'), X.__goalHtml || ''); }
  $('kcLive').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b && b.dataset.g === 'edit') goalDialog(); });

  /* ---------- لغة + ساعة داخلية ---------- */
  function lang() { paintDemoBtns(); try { paintChannelExtra(); } catch (e) {} fillAllSel(); paintSession(); paintAct(); paintMod(); paintChannel(); paintModNeed(); $('kcWordIn').placeholder = t('kcWordPh'); }
  X.lang = lang;
  const _applyI18n = applyI18n;
  applyI18n = function () { _applyI18n(); try { lang(); } catch (e) {} };
  setInterval(() => {
    tickTime();
    document.querySelectorAll('.kx-agot[data-ts]').forEach(e => { const v = ago(+e.dataset.ts); if (e.textContent !== v) e.textContent = v; });
  }, 1000);

  try { api.onKickDash && api.onKickDash(m => X.dash(m)); api.onKickDashState && api.onKickDashState(m => X.dashState(m)); } catch (e) {}
  /* ---------- تنظيف بقايا التجارب القديمة (أسماء تجريبية) + مسح يدوي للسجل ---------- */
  (function legacyPurge() {
    const re = new RegExp('^(' + DEMO_NAMES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\d{0,2}$', 'i');
    const isDemo = a => a.demo || re.test(String(a.target || a.user || '')) || (a.actor && MODS.includes(a.actor));
    let n0 = act.length + mod.length;
    if (LS.get('se_kdemo_clean3', '') !== '1') { act = []; mod = []; LS.set('se_kdemo_clean3', '1'); }   // مرة وحدة: تنظيف أي بيانات تجريبية قديمة محفوظة
    act = act.filter(a => !isDemo(a)); mod = mod.filter(a => !isDemo(a));
    save(); paintAct(); paintMod();
  })();
  function clearLog(kind) {
    dlg({ title: t('kxClearT'), body: `<div class="note">${esc(t('kxClearQ'))}</div>`, actions: [{ label: t('cancel') }, { label: t('kxClear'), kind: 'danger', cb: () => {
      if (kind === 'mod') { mod = []; F.mod = 'all'; } else { act = []; F.act = 'all'; }
      fresh = new Set(); evSeen.clear(); save(); if (kind === 'mod') paintMod(); else paintAct(); toast('✔ ' + t('kxClearOk'));
    } }] });
  }
  $('kxModClear').onclick = () => clearLog('mod');
  $('kxActClear').onclick = () => clearLog('act');
  paintIcons(); lang();
})();
