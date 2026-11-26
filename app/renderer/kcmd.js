'use strict';
/* ============================================================
   مساعدات الإشراف الداخلية (KC.mod / KC.errText) — v1.3.0
   أوامر الشات (/) حُذفت بالكامل. هذا الملف يبقى فقط لأن لوحة المشرف تستخدمه.
   ============================================================ */
(() => {
  /* ---------- i18n ---------- */
  Object.assign(I18N.ar, {
    kcHelpT: 'أوامر الشات',
    kcHelpBody: 'اكتب / في خانة الشات وتظهر الأوامر. الأسهم + Tab أو Enter للاختيار.',
    kcgMod: 'الإشراف', kcgChat: 'وضع الشات', kcgStream: 'البث', kcgHelp: 'مساعدة',
    cmdBan: 'حظر مستخدم من القناة', cmdUnban: 'فك حظر مستخدم', cmdTimeout: 'تايم أوت لمستخدم (بالدقائق، أو 30s / 2h / 1d)', cmdUntimeout: 'إلغاء التايم أوت عن مستخدم', cmdClear: 'مسح الشات',
    cmdSlow: 'تشغيل الوضع البطيء (بالثواني)', cmdSlowoff: 'إيقاف الوضع البطيء',
    cmdFollowers: 'المتابعون فقط (مدة اختيارية بالدقائق)', cmdFollowersoff: 'إيقاف وضع المتابعين فقط',
    cmdSubs: 'المشتركون فقط', cmdSubsoff: 'إيقاف وضع المشتركين فقط',
    cmdEmotes: 'الإيموجيات فقط', cmdEmotesoff: 'إيقاف وضع الإيموجيات فقط',
    cmdTitle: 'تغيير عنوان البث', cmdCategory: 'تغيير التصنيف', cmdHelp: 'عرض كل الأوامر',
    kcUnknown: 'أمر غير معروف: {c}. اكتب /help لرؤية الأوامر.', kcUsage: 'الاستخدام: {u}',
    kcDone: 'تم', kcFail: 'فشل: ', kcNoLogin: 'سجّل دخول حسابك على Kick أولاً (الإعدادات ← ربط Kick ← تسجيل الدخول بحساب Kick).',
    kcNeedLinkOnly: 'هذا الأمر يحتاج الربط الرسمي مع Kick (الإعدادات ← ربط Kick).',
    kcCErrForbidden: 'Kick رفضت الطلب (حماية Cloudflare أو الصلاحيات). التفاصيل في ⓘ تشخيص الشات.',
    kcCErrRejected: 'Kick ما قبلت الأمر من البرنامج (رمز {s}). التفاصيل في ⓘ تشخيص الشات.',
    kcCErrWeb: 'تعذر الاتصال بموقع Kick. تأكد من الإنترنت وحاول مرة ثانية.',
    kcBanned: 'تم حظر {u}', kcUnbanned: 'تم فك الحظر عن {u}', kcTimedOut: 'تم تايم أوت {u} لمدة {m}', kcCleared: 'تم مسح الشات', kcDeleted: 'تم حذف الرسالة',
    kcModeOn: 'تم التفعيل', kcModeOff: 'تم الإيقاف',
    kcTitleSet: 'تم تغيير عنوان البث', kcCatSet: 'تم تغيير التصنيف إلى {c}', kcCatNone: 'ما لقيت تصنيف بهذا الاسم',
    kpAdd: 'إضافة خيار', kpSec: 'ثانية', kpMin: 'دقيقة'
  });
  Object.assign(I18N.en, {
    kcHelpT: 'Chat commands',
    kcHelpBody: 'Type / in the chat box to see the commands. Arrows + Tab or Enter to pick.',
    kcgMod: 'Moderation', kcgChat: 'Chat modes', kcgStream: 'Stream', kcgHelp: 'Help',
    cmdBan: 'Ban a user from the channel', cmdUnban: 'Unban a user', cmdTimeout: 'Timeout a user (minutes, or 30s / 2h / 1d)', cmdUntimeout: 'Remove a timeout from a user', cmdClear: 'Clear the chat',
    cmdSlow: 'Turn on slow mode (seconds)', cmdSlowoff: 'Turn off slow mode',
    cmdFollowers: 'Followers-only mode (optional minutes)', cmdFollowersoff: 'Turn off followers-only mode',
    cmdSubs: 'Subscribers-only mode', cmdSubsoff: 'Turn off subscribers-only mode',
    cmdEmotes: 'Emotes-only mode', cmdEmotesoff: 'Turn off emotes-only mode',
    cmdTitle: 'Change the stream title', cmdCategory: 'Change the category', cmdHelp: 'Show all commands',
    kcUnknown: 'Unknown command: {c}. Type /help to see the commands.', kcUsage: 'Usage: {u}',
    kcDone: 'Done', kcFail: 'Failed: ', kcNoLogin: 'Sign in to your Kick account first (Settings → Kick link → Sign in with Kick account).',
    kcNeedLinkOnly: 'This command needs the official Kick link (Settings → Kick link).',
    kcCErrForbidden: 'Kick refused the request (Cloudflare or permissions). See ⓘ chat diagnostics for details.',
    kcCErrRejected: 'Kick did not accept the command from the app (code {s}). See ⓘ chat diagnostics for details.',
    kcCErrWeb: 'Could not reach the Kick website. Check the internet and try again.',
    kcBanned: '{u} was banned', kcUnbanned: '{u} was unbanned', kcTimedOut: '{u} was timed out for {m}', kcCleared: 'Chat cleared', kcDeleted: 'Message deleted',
    kcModeOn: 'Enabled', kcModeOff: 'Disabled',
    kcTitleSet: 'Stream title changed', kcCatSet: 'Category changed to {c}', kcCatNone: 'No category found with that name',
    kpAdd: 'Add option', kpSec: 'sec', kpMin: 'min'
  });

  const KC = { };
  window.KC = KC;
  const ctx = () => (window.KX && KX.ctx) || {};
  const cfg = () => (ctx().cfg && ctx().cfg()) || {};
  const official = () => !!cfg().connected;
  const webOn = () => !!(ctx().wl && ctx().wl());
  const canSend = () => !!(ctx().canSend && ctx().canSend());
  const room = () => (ctx().room && ctx().room()) || 0;
  const me = () => String((ctx().me && ctx().me()) || '').toLowerCase();
  const plainTxt = s => String(s || '').replace(/\[emote:\d+:([^\]]*)\]/g, '$1');
  const say = (ok, msg) => { toast((ok ? '✔ ' : '❌ ') + msg, ok ? 3200 : 6500); if (window.KSys) KSys((ok ? '✔ ' : '✖ ') + msg); };
  const uidOf = name => {
    const k = String(name || '').toLowerCase();
    const n = [...document.querySelectorAll('#kChat .k-msg')].reverse().find(x => String(x.dataset.user || '').toLowerCase() === k);
    return n && n.dataset.uid ? n.dataset.uid : '';
  };
  const fmtMin = m => m >= 1440 ? (m / 1440) + ' ' + t('kxD') : m >= 60 ? (m / 60) + ' ' + t('kxH') : m + ' ' + t('kxM');
  /* "30s" "10" "2h" "1d" "1w" → دقائق */
  function parseDur(x){
    const m = String(x || '').trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d|w)?$/); if (!m) return null;
    const n = parseInt(m[1], 10), u = m[2] || 'm';
    const v = u === 's' ? Math.max(1, Math.ceil(n / 60)) : u === 'm' ? n : u === 'h' ? n * 60 : u === 'd' ? n * 1440 : n * 10080;
    return Math.max(0, Math.min(43200, v));
  }
  function reportErr(r){
    const c = r && r.code;
    if (c === 'webLogin') return say(false, t('kcNoLogin'));
    if (c === 'noOwn') return say(false, t('kcNoLogin'));
    if (c === 'webForbidden') return say(false, t('kcCErrForbidden'));
    if (c === 'webRejected') return say(false, t('kcCErrRejected', { s: r.status || '?' }));
    if (c === 'web') return say(false, t('kcCErrWeb'));
    say(false, t('kcFail') + ((r && (r.error || r.code)) || ''));
  }

  /* نص سبب الفشل (يشمل ما كتبته Kick نفسها إن توفر) */
  KC.errText = function (r) {
    const c = r && r.code, d = r && r.detail ? ' — ' + r.detail : '';
    if (c === 'webLogin') return t('kcNoLogin');
    if (c === 'noOwn' || c === 'noChannel') return t('kcNoLogin');
    if (c === 'webForbidden') return t('kcCErrForbidden') + d;
    if (c === 'webRejected') return t('kcCErrRejected', { s: (r && r.status) || '?' }) + d;
    if (c === 'web') return t('kcCErrWeb');
    return t('kcFail') + ((r && (r.error || r.code)) || '');
  };

  /* ---------- إشراف: رسمي أولاً ثم جلسة الموقع ---------- */
  KC.mod = async function (a) {
    const c = cfg(), act = a.action;
    const uid = a.userId || (a.user ? uidOf(a.user) : '');
    const perm = act === 'delete' ? c.canDelete : c.canBan;
    if (c.connected && perm && (act === 'delete' ? a.messageId : uid)) {
      const ok = window.KX ? await KX.doMod(Object.assign({}, a, { userId: uid })) : false;
      if (ok) return true;
      if (!webOn()) return false;
    }
    if (!webOn() && !c.connected) { say(false, t('kcNoLogin')); return false; }
    let r; try { r = await api.kickCmdWeb({ action: act, user: a.user, minutes: a.minutes, reason: a.reason, messageId: a.messageId, chatroomId: room() }); } catch (e) { r = { ok: false, code: 'fail', error: String(e && e.message || e) }; }
    if (r && r.ok) {
      if (act === 'ban') say(true, t('kcBanned', { u: a.user }));
      else if (act === 'timeout') say(true, t('kcTimedOut', { u: a.user, m: fmtMin(a.minutes || 10) }));
      else if (act === 'unban') say(true, t('kcUnbanned', { u: a.user }));
      else if (act === 'delete') say(true, t('kcDeleted'));
      else if (act === 'clear') say(true, t('kcCleared'));
      return true;
    }
    reportErr(r); return false;
  };

})();
