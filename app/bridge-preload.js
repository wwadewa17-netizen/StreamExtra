'use strict';
/* يعمل داخل نافذة قراءة شات Kick المخفية قبل ما تشتغل سكربتات Kick:
   نلفّ WebSocket عشان ننسخ رسائل الشات التي تصل للصفحة نفسها (أضمن من قراءة عناصر الصفحة). */
const { webFrame } = require('electron');
try {
  webFrame.executeJavaScript(`(function(){
    if (window.__seHook) return; window.__seHook = 1; window.__seWS = []; window.__seWSn = 0; window.__seWSurl = [];
    const O = window.WebSocket;
    function W(u, p){
      const ws = (p === undefined) ? new O(u) : new O(u, p);
      try {
        try { window.__seWSurl.push(String(u).slice(0, 140)); if (window.__seWSurl.length > 5) window.__seWSurl.shift(); } catch (e) {}
        ws.addEventListener('message', function(ev){
          try {
            const d = ev.data; if (typeof d !== 'string') return;
            window.__seWSn++;
            if (d.length < 200000 && /ChatMessage|MessageDeleted|UserBanned|UserUnbanned|FollowersUpdated|ChatroomUpdated|SubscriptionEvent|GiftedSubscriptions|RewardRedeemed|KicksGifted|StreamerIsLive|StopStreamBroadcast|"sender"/.test(d)) { window.__seWS.push(d); if (window.__seWS.length > 500) window.__seWS.shift(); }
          } catch (e) {}
        });
      } catch (e) {}
      return ws;
    }
    W.prototype = O.prototype;
    ['CONNECTING','OPEN','CLOSING','CLOSED'].forEach(function(k){ W[k] = O[k]; });
    window.WebSocket = W;
  })();`).catch(() => {});
} catch (e) {}
