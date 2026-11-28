const { app, BrowserWindow, ipcMain, Menu, session, desktopCapturer, net, globalShortcut, shell, dialog } = require('electron');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const tcp = require('net');

// البيانات تتحفظ في AppData ثابت - ما بتتأثر بتغيير نسخة البرنامج
app.setName('StreamExtra');
const dataDir = path.join(app.getPath('appData'), 'StreamExtra');
try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
app.setPath('userData', dataDir);
const settingsFile = path.join(dataDir, 'settings.json');

/* ---------- حفظ دائم: AppData + نسخة .bak + نسخة احتياطية خارج AppData + استرجاع من المجلدات القديمة ---------- */
const mirrorDir = path.join(process.env.LOCALAPPDATA || os.homedir(), 'StreamExtra-Backup');
const legacyDirs = ['stream-extra', 'Stream Extra', 'streamextra', 'StreamExtra-Studio']
  .map(n => path.join(app.getPath('appData'), n)).filter(d => d !== dataDir);
function readJsonFile(f) {
  try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j && typeof j === 'object' ? j : null; } catch (e) { return null; }
}
function loadPersist(name) {
  const main = path.join(dataDir, name);
  const cands = [main, main + '.bak', path.join(mirrorDir, name), ...legacyDirs.map(d => path.join(d, name))];
  for (const f of cands) {
    const j = readJsonFile(f);
    if (j) return { data: j, restored: f !== main };
  }
  return { data: null, restored: false };
}
function savePersist(name, obj) {
  const json = JSON.stringify(obj, null, 2);
  const main = path.join(dataDir, name);
  try {
    if (readJsonFile(main)) { try { fs.copyFileSync(main, main + '.bak'); } catch (e) {} }
    const tmp = main + '.tmp';
    fs.writeFileSync(tmp, json);
    fs.renameSync(tmp, main);
  } catch (e) {}
  try { fs.mkdirSync(mirrorDir, { recursive: true }); fs.writeFileSync(path.join(mirrorDir, name), json); } catch (e) {}
}

const defaults = { kickUrl: '', kickKey: '', mic: false, bitrate: 3500, res: 720, fps: 30, enc: 'veryfast', rc: 'cbr', kf: 2, ll: 1, abr: 128, ach: 2 };

function loadSettings() {
  const r = loadPersist('settings.json');
  const s = { ...defaults, ...(r.data || {}) };
  if (r.restored) savePersist('settings.json', s);
  return s;
}
function saveSettings(s) {
  savePersist('settings.json', { ...defaults, ...s });
}

let win = null;
let ff = null;
let isLive = false;

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function ffmpegPath() {
  return path.join(process.resourcesPath, 'ffmpeg.exe');
}

/* ---------- قياس تأخير البث (من البرنامج حتى سيرفر Kick) ----------
   التأخير = نصف ثانية تقريباً لتجميع المقاطع + تراكم ffmpeg (الوقت الحقيقي - وقت الفيديو الخارج) + زمن الاتصال بسيرفر Kick (RTT).
   ما يشمل مشغّل Kick عند المشاهد (يختلف حسب وضع Kick: منخفض التأخير أو عادي). */
const SLICE_SEC = 0.25;
let delay = { first: 0, outSec: 0, rtt: null, ema: null, timer: null, rttTimer: null, host: '', port: 0 };
function stopDelay() {
  clearInterval(delay.timer); clearInterval(delay.rttTimer);
  delay = { first: 0, outSec: 0, rtt: null, ema: null, timer: null, rttTimer: null, host: '', port: 0 };
  send('stream:delay', { sec: null });
}
function measureRtt() {
  if (!delay.host) return;
  const t0 = Date.now();
  const sock = tcp.connect({ host: delay.host, port: delay.port, timeout: 4000 });
  const fin = (ok) => { try { sock.destroy(); } catch (e) {} if (ok) delay.rtt = Date.now() - t0; };
  sock.once('connect', () => fin(true));
  sock.once('timeout', () => fin(false));
  sock.once('error', () => fin(false));
}
function startDelay(url) {
  clearInterval(delay.timer); clearInterval(delay.rttTimer);   // لا نصفّر delay.first: أول مقطع وصل قبل ما يبدأ ffmpeg يطلع الفريمات
  try {
    const u = new URL(url.replace(/^rtmps?:/i, (m) => m.toLowerCase() === 'rtmps:' ? 'https:' : 'http:'));
    delay.host = u.hostname; delay.port = parseInt(u.port, 10) || (/^rtmps/i.test(url) ? 443 : 1935);
  } catch (e) {}
  measureRtt();
  delay.rttTimer = setInterval(measureRtt, 8000);
  delay.timer = setInterval(() => {
    if (!delay.first || !delay.outSec) return;
    const elapsed = (Date.now() - delay.first) / 1000;
    const backlog = Math.max(0, elapsed - delay.outSec);
    const raw = SLICE_SEC + backlog + (delay.rtt != null ? delay.rtt / 1000 : 0);
    delay.ema = delay.ema == null ? raw : delay.ema * 0.7 + raw * 0.3;
    send('stream:delay', { sec: Math.round(delay.ema * 10) / 10, rtt: delay.rtt });
  }, 1000);
}


/* ---------- إصلاح رابط البث تلقائياً (v1.4) ----------
   سبب مشكلة "IO error: End of file": رابط Kick لازم يكون rtmps://xxxx.global-contribute.live-video.net:443/app
   ولما ينحط الرابط بدون /app (أو المفتاح لازق فيه) السيرفر يسكّر الاتصال فوراً.
   هون نصلح الرابط والمفتاح لحالهم بدون ما المستخدم يعمل شي. */
function normalizeIngest(rawUrl, rawKey) {
  const clean = (x) => String(x || '').replace(/[\s\u200b-\u200f\u202a-\u202e\ufeff]+/g, '');
  let url = clean(rawUrl), key = clean(rawKey).replace(/^\/+/, '');
  if (!url) return { url: '', key };
  if (!/^rtmps?:\/\//i.test(url)) url = 'rtmps://' + url.replace(/^\/+/, '');
  const m = /^(rtmps?):\/\/([^\/:?#]+)(?::(\d+))?(\/[^?#]*)?/i.exec(url);
  if (!m) return { url: url.replace(/\/+$/, ''), key };
  const proto = m[1].toLowerCase(), host = m[2], isIvs = /live-video\.net$/i.test(host);
  let port = m[3] || '';
  let segs = (m[4] || '').split('/').filter(Boolean);
  if (isIvs) {
    if (!port && proto === 'rtmps') port = '443';
    if (segs[0] && segs[0].toLowerCase() !== 'app') { if (!key) key = segs.join('/'); segs = ['app']; }          // المفتاح لازق مكان /app
    else if (segs[0] && segs.length > 1) { if (!key) key = segs.slice(1).join('/'); segs = ['app']; }         // المفتاح لازق بعد /app
    else segs = ['app'];
  }
  return { url: proto + '://' + host + (port ? ':' + port : '') + (segs.length ? '/' + segs.join('/') : ''), key };
}

function startFfmpeg(s) {
  if (ff) return { ok: false, error: 'البث شغال أصلاً' };
  const norm = normalizeIngest(s.kickUrl, s.kickKey);
  const url = norm.url, key = norm.key;
  if (!url || !key) return { ok: false, error: 'لازم تدخل رابط البث ومفتاح البث من الإعدادات' };
  const target = url + '/' + key;
  const SQ_DIM = { 720: [1280, 720], 1080: [1920, 1080], 1440: [2560, 1440], 2160: [3840, 2160] };
  const res = SQ_DIM[parseInt(s.res, 10)] ? parseInt(s.res, 10) : 720;
  const [vw, vh] = SQ_DIM[res];
  const br = Math.min(40000, Math.max(800, parseInt(s.bitrate, 10) || 3500));
  const fps = parseInt(s.fps, 10) === 60 ? 60 : 30;
  const enc = ['ultrafast', 'superfast', 'veryfast', 'faster'].includes(s.enc) ? s.enc : 'veryfast';
  const abr = [96, 128, 160, 192, 256].includes(parseInt(s.abr, 10)) ? parseInt(s.abr, 10) : 128;
  const ach = parseInt(s.ach, 10) === 1 ? 1 : 2;
  const kf = Math.min(4, Math.max(1, parseInt(s.kf, 10) || 2));
  const cbr = s.rc !== 'vbr';
  const lowLat = parseInt(s.ll, 10) !== 0;

  const args = [
    '-hide_banner', '-loglevel', 'info',
    '-fflags', '+genpts',
    '-i', 'pipe:0',
    '-vf', 'scale=' + vw + ':' + vh + ':flags=lanczos,setsar=1,format=yuv420p',   // المتصفح يرسل الفيديو بنفس دقة البث أصلاً، فالـ scale هنا مجرد ضمان (لا تكبير)
    '-c:v', 'libx264', '-preset', enc, ...(lowLat ? ['-tune', 'zerolatency'] : []), '-profile:v', 'high', '-level', (res >= 2160 ? (fps === 60 ? '5.2' : '5.1') : res >= 1440 ? '5.1' : (fps === 60 && res >= 1080) ? '4.2' : '4.1'),
    '-pix_fmt', 'yuv420p', '-r', String(fps), '-g', String(fps * kf), '-keyint_min', String(fps * kf), '-sc_threshold', '0',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-b:v', br + 'k', '-maxrate', br + 'k', '-bufsize', (cbr ? br : br * 2) + 'k',
    ...(cbr ? ['-minrate', br + 'k', '-x264-params', 'nal-hrd=cbr:force-cfr=1'] : []),
    '-c:a', 'aac', '-b:a', abr + 'k', '-ar', '48000', '-ac', String(ach),
    '-f', 'flv', target
  ];

  let started = false;
  let lastLines = [];
  if (!fs.existsSync(ffmpegPath())) {
    return { ok: false, error: 'ملف ffmpeg.exe غير موجود. أعد تشغيل Build_StreamExtra.cmd' };
  }
  try {
    ff = spawn(ffmpegPath(), args, { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
  } catch (e) {
    ff = null;
    return { ok: false, error: 'تعذر تشغيل ffmpeg: ' + e.message };
  }
  isLive = true; stopDelay();
  ff.stdin.on('error', () => {});
  const meas = { inW: 0, inH: 0, outW: 0, outH: 0, codec: '', outFps: 0, fps: 0, kbps: 0, drop: 0, dup: 0, speed: 0, frames: 0, want: { w: vw, h: vh, fps, br } };
  let hdr = '', lastStat = 0;
  const sendStats = (force) => {
    const now = Date.now(); if (!force && now - lastStat < 900) return; lastStat = now;
    send('stream:stats', { ...meas });
  };
  ff.stderr.on('data', (d) => {
    const txt = d.toString();
    /* قياسات حقيقية من ffmpeg: دقة الدخل والخرج الفعلية، الإطارات المشفّرة فعلياً، البت ريت الفعلي والإطارات المتساقطة */
    if (hdr.length < 8000 && !meas.outW) {
      hdr += txt;
      const inM = /Input #0[\s\S]*?Stream #0:0[^\n]*?Video:[^\n]*?(\d{3,5})x(\d{3,5})/.exec(hdr);
      if (inM) { meas.inW = +inM[1]; meas.inH = +inM[2]; meas.inMis = (meas.inW !== vw || meas.inH !== vh); }   // الصورة الداخلة أقل/مختلفة عن المطلوب → الخرج مكبّر وليس بدقة حقيقية
      const outL = /Output #0[\s\S]*?Stream #0:0[^\n]*?Video:([^\n]*)/.exec(hdr);
      if (outL) {
        const ln = outL[1], sz = /(\d{3,5})x(\d{3,5})/.exec(ln), cd = /^\s*(\w+)/.exec(ln), fp = /([\d.]+)\s*fps/.exec(ln);
        if (sz) { meas.outW = +sz[1]; meas.outH = +sz[2]; meas.codec = cd ? cd[1] : ''; if (fp) meas.outFps = parseFloat(fp[1]); sendStats(true); }
      }
    }
    const pm = /frame=\s*(\d+)\s+fps=\s*([\d.]+)[^\r\n]*?bitrate=\s*([\d.]+)kbits\/s(?:[^\r\n]*?dup=(\d+))?(?:[^\r\n]*?drop=(\d+))?(?:[^\r\n]*?speed=\s*([\d.]+)x)?/g;
    let pmm, pl = null; while ((pmm = pm.exec(txt))) pl = pmm;
    if (pl) { meas.frames = +pl[1]; meas.fps = parseFloat(pl[2]); meas.kbps = parseFloat(pl[3]); meas.dup = +(pl[4] || 0); meas.drop = +(pl[5] || 0); meas.speed = parseFloat(pl[6] || 0); sendStats(false); }
    const tm = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/g; let mt, last = null;
    while ((mt = tm.exec(txt))) last = mt;
    if (last) delay.outSec = (+last[1]) * 3600 + (+last[2]) * 60 + parseFloat(last[3]);
    txt.split(/\r|\n/).filter(l => l && !/^\s*frame=/.test(l) && !/Last message repeated/i.test(l)).forEach(l => { lastLines.push(l.trim()); if (lastLines.length > 12) lastLines.shift(); });
    if (!started && /frame=\s*\d+/.test(txt)) {
      started = true;
      send('stream:status', { state: 'live' });
      startDelay(url);
    }
  });
  ff.on('error', (e) => {
    send('stream:status', { state: 'error', message: 'خطأ ffmpeg: ' + e.message });
  });
  ff.on('close', (code) => {
    const wasLive = isLive;
    ff = null; isLive = false; stopDelay();
    if (wasLive) {
      send('stream:status', {
        state: 'stopped',
        message: code === 0 || code === null ? '' : (() => {
          const errs = lastLines.filter(l => /error|fail|refused|reset|timed? ?out|denied|invalid|unable|could not|end of file|forbidden|unauthori/i.test(l) && !/^Conversion failed/i.test(l));
          const shown = (errs.length ? errs : lastLines.filter(l => !/^Conversion failed/i.test(l))).slice(-2).join('\n');
          const eof = /end of file|input\/output|connection reset|broken pipe/i.test(shown);
          return 'انقطع الاتصال مع Kick.' + (eof ? '\nKick سكّر الاتصال: غالباً مفتاح البث غلط/قديم أو في بث ثاني شغال بنفس المفتاح. جدّد المفتاح من Kick (Creator Dashboard ← Stream) والصقه من جديد.' : '\nتأكد من الرابط والمفتاح.') + '\n' + shown;
        })()
      });
    }
  });
  return { ok: true };
}

function stopFfmpeg() {
  if (!ff) return;
  const p = ff;
  isLive = false; stopDelay();
  try { p.stdin.end(); } catch (e) {}
  setTimeout(() => { try { p.kill(); } catch (e) {} }, 1500);
  send('stream:status', { state: 'stopped', message: '' });
}

ipcMain.handle('settings:load', () => loadSettings());
ipcMain.handle('settings:save', (_e, s) => { try { saveSettings({ ...s }); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });
ipcMain.handle('stream:start', (_e, s) => startFfmpeg(s));
ipcMain.on('stream:chunk', (_e, buf) => {
  if (ff && ff.stdin.writable) { if (!delay.first) delay.first = Date.now(); try { ff.stdin.write(Buffer.from(buf)); } catch (e) {} }
});
ipcMain.handle('stream:stop', () => { stopFfmpeg(); return { ok: true }; });

/* ============ التقاط الشاشة / النافذة ============ */
ipcMain.handle('capture:list', async (_e, type) => {
  try {
    const types = type === 'window' ? ['window'] : ['screen'];
    const list = await desktopCapturer.getSources({ types, thumbnailSize: { width: 360, height: 202 }, fetchWindowIcons: false });
    return list.map(s => ({ id: s.id, name: s.name, thumb: s.thumbnail.toDataURL() }));
  } catch (e) { return []; }
});

/* ============ تحميل صوت/فيديو/صورة من رابط (يوتيوب عبر yt-dlp) ============ */
const MIME = {
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/mp4', '.webm': 'video/webm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml'
};
const MAX_BYTES = 400 * 1024 * 1024;
const isYouTube = (u) => /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i.test(u.hostname);
const ytdlpPath = () => path.join(process.resourcesPath, 'yt-dlp.exe');

/* v2.6: اختيار أفضل ملف ناتج + تنظيف الصوت بـ ffmpeg حتى يكون m4a (AAC) قياسياً يشتغل 100% في المشغّل
   (ملفات يوتيوب الخام تكون أحياناً DASH مجزّأة أو webm ولا تعطي صوتاً مع الصورة). */
const MEDIA_EXT = new Set(['.m4a', '.mp3', '.aac', '.wav', '.ogg', '.opus', '.flac', '.mp4', '.m4v', '.mov', '.webm', '.mkv']);
function pickMediaFile(dir) {
  let best = null;
  for (const f of fs.readdirSync(dir)) {
    const ext = path.extname(f).toLowerCase();
    if (!MEDIA_EXT.has(ext) || /\.(part|ytdl|temp)\b/i.test(f) || f.startsWith('_clean')) continue;
    let sz = 0; try { sz = fs.statSync(path.join(dir, f)).size; } catch (e) { continue; }
    if (!best || sz > best.sz) best = { f, sz };
  }
  return best && best.f;
}
function runFfmpegQuick(args, ms) {
  return new Promise((resolve) => {
    let p, tm;
    try { p = spawn(ffmpegPath(), args, { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore'] }); } catch (e) { return resolve(false); }
    tm = setTimeout(() => { try { p.kill(); } catch (e) {} resolve(false); }, ms);
    p.on('error', () => { clearTimeout(tm); resolve(false); });
    p.on('close', (c) => { clearTimeout(tm); resolve(c === 0); });
  });
}
async function cleanAudioFile(dir, f) {
  try {
    if (!fs.existsSync(ffmpegPath())) return f;
    const inp = path.join(dir, f), out = path.join(dir, '_clean.m4a'), ext = path.extname(f).toLowerCase();
    const base = ['-y', '-v', 'error', '-i', inp, '-vn', '-map', '0:a:0'];
    let ok = false;
    if (ext === '.m4a' || ext === '.mp4' || ext === '.aac') ok = await runFfmpegQuick(base.concat(['-c:a', 'copy', '-movflags', '+faststart', '-f', 'mp4', out]), 90000);
    if (!ok) { try { fs.rmSync(out, { force: true }); } catch (e) {} ok = await runFfmpegQuick(base.concat(['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-f', 'mp4', out]), 180000); }
    if (ok && fs.existsSync(out) && fs.statSync(out).size > 2048) return '_clean.m4a';
  } catch (e) {}
  return f;
}

function runYtdlp(url, kind) {
  return new Promise((resolve) => {
    const exe = ytdlpPath();
    if (!fs.existsSync(exe)) return resolve({ ok: false, code: 'noYtdlp' });
    let tmp;
    try { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'streamextra-')); }
    catch (e) { return resolve({ ok: false, code: 'fail', detail: e.message }); }
    const done = (r) => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} resolve(r); };
    const fmt = kind === 'audio' ? 'bestaudio[ext=m4a]/bestaudio/best' : 'best[ext=mp4][height<=720]/best[height<=720]/best';
    const args = ['--no-playlist', '--no-progress', '--no-warnings', '--no-mtime', '--windows-filenames', '--retries', '3', '--fragment-retries', '3', '--socket-timeout', '20', '-f', fmt, '-o', path.join(tmp, '%(title).80s.%(ext)s'), '--', url];
    let err = '', finished = false, p;
    try { p = spawn(exe, args, { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] }); }
    catch (e) { return done({ ok: false, code: 'fail', detail: e.message }); }
    const timer = setTimeout(() => { try { p.kill(); } catch (e) {} }, 240000);
    p.stderr.on('data', (d) => { err = (err + d.toString()).slice(-600); });
    p.on('error', (e) => { if (finished) return; finished = true; clearTimeout(timer); done({ ok: false, code: 'fail', detail: e.message }); });
    p.on('close', async () => {
      if (finished) return; finished = true; clearTimeout(timer);
      try {
        const orig = pickMediaFile(tmp);
        if (!orig) return done({ ok: false, code: 'fail', detail: err.trim().split(/\r?\n/).pop() });
        const use = kind === 'audio' ? await cleanAudioFile(tmp, orig) : orig, ext = path.extname(use).toLowerCase();
        const data = fs.readFileSync(path.join(tmp, use));
        done({ ok: true, name: path.basename(orig, path.extname(orig)), mime: MIME[ext] || (kind === 'audio' ? 'audio/mp4' : 'video/mp4'), data });
      } catch (e) { done({ ok: false, code: 'fail', detail: e.message }); }
    });
  });
}

ipcMain.handle('media:fetch', async (_e, req) => {
  try {
    const kind = req && ['audio', 'video', 'image'].includes(req.kind) ? req.kind : null;
    let u;
    try { u = new URL(String(req && req.url || '').trim()); } catch (e) { return { ok: false, code: 'badUrl' }; }
    if (!kind || !/^https?:$/.test(u.protocol)) return { ok: false, code: 'badUrl' };
    if (isYouTube(u)) {
      if (kind === 'image') return { ok: false, code: 'type' };
      return await runYtdlp(u.toString(), kind);
    }
    const res = await net.fetch(u.toString(), { redirect: 'follow' });
    if (!res.ok) return { ok: false, code: 'http', detail: String(res.status) };
    const len = parseInt(res.headers.get('content-length') || '0', 10);
    if (len > MAX_BYTES) return { ok: false, code: 'big' };
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = path.extname(u.pathname).toLowerCase();
    const mime = ct.startsWith(kind + '/') ? ct : (MIME[ext] && MIME[ext].startsWith(kind + '/') ? MIME[ext] : '');
    if (!mime) return { ok: false, code: 'type' };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) return { ok: false, code: 'big' };
    let name = decodeURIComponent(path.basename(u.pathname) || '').replace(/\.[^.]+$/, '') || u.hostname;
    return { ok: true, name, mime, data: buf };
  } catch (e) { return { ok: false, code: 'fail', detail: e.message }; }
});

/* ============ صوت موقع: نافذة خاصة بالموقع، صوتها يُلتقط ويروح للبث ============ */
const sites = new Map(); // url -> BrowserWindow
function normSite(u) { try { const x = new URL(String(u || '').trim()); return /^https?:$/.test(x.protocol) ? x.toString() : null; } catch (e) { return null; } }
ipcMain.handle('site:open', async (_e, req) => {
  try {
    const url = normSite(req && req.url);
    if (!url) return { ok: false, error: 'bad url' };
    let sw = sites.get(url);
    if (!sw || sw.isDestroyed()) {
      sw = new BrowserWindow({
        width: 1100, height: 720, title: 'Stream Extra · ' + url, backgroundColor: '#0a0a0b',
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: { partition: 'persist:streamextra-sites', contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
      });
      sw.setMenuBarVisibility(false);
      sites.set(url, sw);
      sw.on('closed', () => { if (sites.get(url) === sw) sites.delete(url); if (!sw._pruned) send('site:closed', url); });
      try { await sw.loadURL(url); } catch (e) { /* التحويلات قد ترمي ERR_ABORTED، نكمل */ }
    } else {
      sw.show();
    }
    if (sw.isDestroyed()) return { ok: false, error: 'closed' };
    const mediaId = sw.webContents.getMediaSourceId(win.webContents);
    return { ok: true, mediaId };
  } catch (e) { return { ok: false, error: e.message }; }
});
/* ---- التطبيقات المفتوحة: قائمة النوافذ + إظهار / إغلاق / كتم صوتها المحلي (الصوت يرجع عبر الخلاط) ---- */
function appsSnapshot() {
  const out = [];
  for (const [u, w] of sites) {
    if (!w || w.isDestroyed()) continue;
    let audible = false;
    try { audible = w.webContents.isCurrentlyAudible(); } catch (e) {}
    out.push({ url: u, title: w.getTitle() || '', audible });
  }
  return out;
}
let lastApps = '';
setInterval(() => {
  const s = JSON.stringify(appsSnapshot());
  if (s !== lastApps) { lastApps = s; send('apps:update', JSON.parse(s)); }
}, 700);
ipcMain.handle('apps:list', () => appsSnapshot());
ipcMain.handle('site:show', (_e, req) => {
  const w = sites.get(normSite(req && req.url));
  if (!w || w.isDestroyed()) return { ok: false };
  if (w.isMinimized()) w.restore();
  w.show(); w.focus();
  return { ok: true };
});
ipcMain.handle('site:close', (_e, req) => {
  const w = sites.get(normSite(req && req.url));
  if (w && !w.isDestroyed()) { w._pruned = true; try { w.close(); } catch (e) {} }
  return { ok: true };
});
ipcMain.handle('site:mute', (_e, req) => {
  const w = sites.get(normSite(req && req.url));
  if (!w || w.isDestroyed()) return { ok: false };
  try { w.webContents.setAudioMuted(!!(req && req.muted)); } catch (e) { return { ok: false }; }
  return { ok: true };
});

/* ---- v2.5: مستوى صوت ويندوز (لزر «أنا» في صوت سطح المكتب) ----
   التقاط صوت سطح المكتب (loopback) يأخذ الصوت قبل مستوى سماعات ويندوز، فخفض مستوى ويندوز يخفض ما تسمعه أنت فقط
   ويبقى البث عالياً. نستعمل عملية PowerShell واحدة تبقى مفتوحة (IAudioEndpointVolume) حتى يكون التحريك سلساً. */
const SYSVOL_PS = `$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int RegisterControlChangeNotify(IntPtr p);
  int UnregisterControlChangeNotify(IntPtr p);
  int GetChannelCount(out uint c);
  int SetMasterVolumeLevel(float l, ref Guid g);
  int SetMasterVolumeLevelScalar(float l, ref Guid g);
  int GetMasterVolumeLevel(out float l);
  int GetMasterVolumeLevelScalar(out float l);
  int SetChannelVolumeLevel(uint n, float l, ref Guid g);
  int SetChannelVolumeLevelScalar(uint n, float l, ref Guid g);
  int GetChannelVolumeLevel(uint n, out float l);
  int GetChannelVolumeLevelScalar(uint n, out float l);
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool m, ref Guid g);
  int GetMute([MarshalAs(UnmanagedType.Bool)] out bool m);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref Guid id, uint ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o); }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int EnumAudioEndpoints(int f, int s, out IntPtr d); int GetDefaultAudioEndpoint(int f, int r, out IMMDevice d); }
[ComImport, Guid("BCDE0395-E52F-49B9-9E41-9C1E3E4C0D4D")] class MMDeviceEnumeratorCom { }
public static class SysVol {
  static IAudioEndpointVolume Ep() {
    var en = (IMMDeviceEnumerator)new MMDeviceEnumeratorCom();
    IMMDevice dev; en.GetDefaultAudioEndpoint(0, 1, out dev);
    Guid iid = typeof(IAudioEndpointVolume).GUID; object o; dev.Activate(ref iid, 23, IntPtr.Zero, out o);
    return (IAudioEndpointVolume)o;
  }
  public static int Get() { float v; Ep().GetMasterVolumeLevelScalar(out v); return (int)Math.Round(v * 100); }
  public static void Set(int p) { Guid g = Guid.Empty; Ep().SetMasterVolumeLevelScalar(Math.Max(0, Math.Min(100, p)) / 100f, ref g); }
}
'@
[Console]::Out.WriteLine('READY'); [Console]::Out.Flush()
while (($line = [Console]::In.ReadLine()) -ne $null) {
  try {
    $p = $line.Trim().Split(' ')
    if ($p[0] -eq 'set') { [SysVol]::Set([int]$p[1]) }
    [Console]::Out.WriteLine('OK ' + [SysVol]::Get())
  } catch { [Console]::Out.WriteLine('ERR') }
  [Console]::Out.Flush()
}
`;
const sysvol = { proc: null, ready: null, buf: '', q: [], dead: false };
function sysvolStart() {
  if (process.platform !== 'win32' || sysvol.dead) return null;
  if (sysvol.ready) return sysvol.ready;
  sysvol.ready = new Promise((resolve) => {
    try {
      const f = path.join(app.getPath('userData'), 'sysvol.ps1');
      fs.writeFileSync(f, SYSVOL_PS.replace(/\r?\n/g, '\r\n'), 'utf8');
      const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
      const pr = spawn(ps, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
      sysvol.proc = pr;
      let up = false;
      const fail = () => { if (!up) { up = true; sysvol.dead = true; resolve(false); } sysvol.q.splice(0).forEach(r => r(null)); sysvol.proc = null; sysvol.ready = null; };
      pr.on('error', fail); pr.on('exit', fail);
      pr.stdout.setEncoding('utf8');
      pr.stdout.on('data', (d) => {
        sysvol.buf += d; let i;
        while ((i = sysvol.buf.indexOf('\n')) >= 0) {
          const line = sysvol.buf.slice(0, i).trim(); sysvol.buf = sysvol.buf.slice(i + 1);
          if (line === 'READY') { if (!up) { up = true; resolve(true); } continue; }
          const r = sysvol.q.shift(); if (r) r(line);
        }
      });
      setTimeout(() => { if (!up) { up = true; sysvol.dead = true; resolve(false); try { pr.kill(); } catch (e) {} } }, 20000);
    } catch (e) { sysvol.dead = true; resolve(false); }
  });
  return sysvol.ready;
}
async function sysvolCmd(cmd) {
  const ok = await sysvolStart(); if (!ok || !sysvol.proc) return null;
  return new Promise((resolve) => {
    let done = false; const fin = (v) => { if (!done) { done = true; resolve(v); } };
    sysvol.q.push(fin); setTimeout(() => fin(null), 5000);
    try { sysvol.proc.stdin.write(cmd + '\n'); } catch (e) { fin(null); }
  });
}
const sysvolRes = (line) => { const m = /^OK (\d+)/.exec(line || ''); return m ? { ok: true, vol: +m[1] } : { ok: false }; };
ipcMain.handle('sysvol:get', async () => sysvolRes(await sysvolCmd('get')));
ipcMain.handle('sysvol:set', async (_e, req) => { const v = Math.max(0, Math.min(100, Math.round(Number(req && req.v)))); if (!isFinite(v)) return { ok: false }; return sysvolRes(await sysvolCmd('set ' + v)); });

ipcMain.on('site:clean', (_e, urls) => {
  const keep = new Set((Array.isArray(urls) ? urls : []).map(normSite).filter(Boolean));
  for (const [u, w] of sites) { if (!keep.has(u)) { sites.delete(u); w._pruned = true; try { if (!w.isDestroyed()) w.destroy(); } catch (e) {} } }
});

/* ============ اختصارات عامة (تشتغل حتى والبرنامج في الخلفية أثناء اللعب) ============ */
ipcMain.handle('hotkeys:set', (_e, list) => {
  const failed = [];
  try { globalShortcut.unregisterAll(); } catch (e) {}
  for (const h of (Array.isArray(list) ? list : [])) {
    if (!h || typeof h.id !== 'string' || typeof h.combo !== 'string' || !h.combo) continue;
    try {
      const ok = globalShortcut.register(h.combo, () => send('hotkey:fire', h.id));
      if (!ok) failed.push(h.id);
    } catch (e) { failed.push(h.id); }
  }
  return { failed };
});


/* ============ ربط Kick عبر نظام المطور (OAuth 2.1 + PKCE) ============
   - تسجيل الدخول: https://id.kick.com/oauth  (يفتح المتصفح، والكود يرجع لسيرفر محلي مؤقت)
   - المشاهدين: API الرسمي  GET /public/v1/channels
   - إرسال رسائل الشات: API الرسمي  POST /public/v1/chat  (صلاحية chat:write)
   - المتابعين + رقم غرفة الشات: كيك ما بتعطيهم بالـ API الرسمي، فبنجيبهم من واجهة الموقع kick.com/api/v2
   - قراءة الشات لحظياً: Pusher (من الواجهة، ملف renderer/kick.js)
*/
const kickFile = path.join(dataDir, 'kick.json');
const KICK_ID = 'https://id.kick.com';
const KICK_API = 'https://api.kick.com/public/v1';
const KICK_SCOPES_BASE = 'user:read channel:read chat:write';
const KICK_SCOPES_WRITE = KICK_SCOPES_BASE + ' channel:write';
const KICK_SCOPES_FULL = KICK_SCOPES_WRITE + ' moderation:ban moderation:chat_message:manage';
const KICK_DEFAULT_REDIRECT = 'http://localhost:8787/callback';

/* تطبيق Kick المدمج: ضع Client ID و Client Secret مرة وحدة في app/kick-app.json (تطبيقك من kick.com/settings/developer)
   فيصير زر «تسجيل الدخول بـ Kick» يشتغل لأي مستخدم بدون أي إعدادات. */
function loadBuiltinApp() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'kick-app.json'), 'utf8'));
    return { clientId: String(j.clientId || '').trim(), clientSecret: String(j.clientSecret || '').trim(), redirectUri: String(j.redirectUri || '').trim() || KICK_DEFAULT_REDIRECT };
  } catch (e) { return { clientId: '', clientSecret: '', redirectUri: KICK_DEFAULT_REDIRECT }; }
}
const KICK_BUILTIN = loadBuiltinApp();

/* فتح رابط الدخول في Google Chrome (حيث حسابك مسجّل دخول أصلاً)، وإذا Chrome غير موجود يفتح متصفح النظام */
function findChrome() {
  const c = [];
  if (process.platform === 'win32') {
    for (const b of [process.env.LOCALAPPDATA, process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
      if (b) c.push(path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium');
  }
  return c.find(f => { try { return fs.existsSync(f); } catch (e) { return false; } }) || '';
}
async function openInChrome(url) {
  const chrome = findChrome();
  if (chrome) {
    try {
      const ch = spawn(chrome, [url], { detached: true, stdio: 'ignore' });
      ch.on('error', () => { shell.openExternal(url).catch(() => {}); });
      ch.unref();
      return true;
    } catch (e) {}
  }
  await shell.openExternal(url);
  return false;
}

/* ---------- Kick: استخراج اسم القناة من أي رابط/اسم (kick.com/popout/اسم/chat أو kick.com/اسم أو اسم) ---------- */
function parseSlug(v) {
  let x = String(v || '').trim();
  if (!x) return '';
  x = x.replace(/^https?:\/\//i, '').replace(/^(www\.)?kick\.com\/?/i, '').replace(/[?#].*$/, '');
  const parts = x.split('/').filter(Boolean);
  if (parts[0] && /^(popout|video|videos|dashboard|categories)$/i.test(parts[0])) parts.shift();
  const s = (parts[0] || '').toLowerCase();
  return /^[a-z0-9_\-]+$/i.test(s) ? s : '';
}

const WEB_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let kick = { clientId: '', clientSecret: '', redirectUri: KICK_DEFAULT_REDIRECT, channel: '', tokens: null, user: null, web: {} };
{
  const r = loadPersist('kick.json');
  if (r.data) { kick = { ...kick, ...r.data }; if (r.restored) savePersist('kick.json', kick); }
}
if (KICK_BUILTIN.clientId && KICK_BUILTIN.clientSecret && (!kick.clientId || !kick.clientSecret)) {
  kick.clientId = KICK_BUILTIN.clientId; kick.clientSecret = KICK_BUILTIN.clientSecret; kick.redirectUri = KICK_BUILTIN.redirectUri;
  kick.tokens = null; kick.user = null;
}
function saveKick() { savePersist('kick.json', kick); }
const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const kickPublic = () => {
  const sc = (kick.tokens && kick.tokens.scope) || '';
  return {
    clientId: kick.clientId, hasSecret: !!kick.clientSecret, hasApp: !!(kick.clientId && kick.clientSecret), builtIn: !!(KICK_BUILTIN.clientId && kick.clientId === KICK_BUILTIN.clientId), redirectUri: kick.redirectUri || KICK_DEFAULT_REDIRECT, channel: kick.channel || '',
    connected: !!(kick.tokens && kick.tokens.refresh_token), user: kick.user || null,
    canBan: /(^|\s)moderation:ban(\s|$)/.test(sc), canDelete: /(^|\s)moderation:chat_message:manage(\s|$)/.test(sc),
    canWrite: /(^|\s)channel:write(\s|$)/.test(sc), chatroomId: kick.chatroomManual ? String(kick.chatroomManual) : ''
  };
};

async function kickToken(params) {
  const body = new URLSearchParams(params).toString();
  const res = await net.fetch(KICK_ID + '/oauth/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body });
  let j = null; try { j = await res.json(); } catch (e) {}
  if (!res.ok || !j || !j.access_token) throw Object.assign(new Error((j && (j.error_description || j.error || j.message)) || ('HTTP ' + res.status)), { status: res.status });
  return j;
}
function storeTokens(j, requestedScope) {
  kick.tokens = {
    access_token: j.access_token,
    refresh_token: j.refresh_token || (kick.tokens && kick.tokens.refresh_token) || '',
    expires_at: Date.now() + (parseInt(j.expires_in, 10) || 3600) * 1000,
    scope: j.scope ? String(j.scope).replace(/,/g, ' ') : (requestedScope || (kick.tokens && kick.tokens.scope) || '')
  };
  saveKick();
}
let refreshing = null;
async function kickRefresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      if (!kick.tokens || !kick.tokens.refresh_token) throw new Error('no refresh token');
      let j;
      try {
        j = await kickToken({ grant_type: 'refresh_token', refresh_token: kick.tokens.refresh_token, client_id: kick.clientId, client_secret: kick.clientSecret });
      } catch (e) {
        if (e && (e.status === 400 || e.status === 401 || e.status === 403)) throw Object.assign(new Error('login expired'), { code: 'auth' });
        throw Object.assign(new Error('network'), { code: 'net' });   // انقطاع نت مؤقت: لا نفصل الحساب
      }
      storeTokens(j);
    } finally { refreshing = null; }
  })();
  return refreshing;
}
async function kickApi(method, pathAndQuery, body, retried) {
  if (!kick.tokens) throw Object.assign(new Error('not connected'), { code: 'auth' });
  if (Date.now() > kick.tokens.expires_at - 60000) {
    try { await kickRefresh(); } catch (e) { throw e && e.code ? e : Object.assign(new Error('login expired'), { code: 'auth' }); }
  }
  const res = await net.fetch(KICK_API + pathAndQuery, {
    method,
    headers: { authorization: 'Bearer ' + kick.tokens.access_token, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401 && !retried) {
    try { await kickRefresh(); } catch (e) { throw e && e.code ? e : Object.assign(new Error('login expired'), { code: 'auth' }); }
    return kickApi(method, pathAndQuery, body, true);
  }
  let j = null; try { j = await res.json(); } catch (e) {}
  if (!res.ok) throw Object.assign(new Error((j && (j.message || j.error)) || ('HTTP ' + res.status)), { code: res.status === 401 ? 'auth' : 'http', status: res.status });
  return j;
}

/* ---- تسجيل الدخول: متصفح النظام + سيرفر محلي يستقبل الكود ---- */
let authBusy = false;
function waitForCode(redirect, state) {
  let cancelFn = null;
  const pr = new Promise((resolve, reject) => {
    const servers = [];
    let done = false, timer = null;
    const finish = (err, code) => {
      if (done) return; done = true; clearTimeout(timer);
      servers.forEach(sv => { try { sv.close(); } catch (e) {} });
      err ? reject(err) : resolve(code);
    };
    cancelFn = () => finish(new Error('CANCELLED'));
    const handler = (req, res) => {
      try {
        const u = new URL(req.url, 'http://localhost');
        if (u.pathname !== redirect.pathname) { res.writeHead(404); res.end(); return; }
        const err = u.searchParams.get('error');
        const ok = !err && u.searchParams.get('state') === state && u.searchParams.get('code');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<!doctype html><meta charset="utf-8"><title>Stream Extra</title><body style="font-family:Segoe UI,Tahoma,sans-serif;background:#0a0a0b;color:#fff;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h1 style="color:' + (ok ? '#53fc18' : '#ff6b80') + '">' + (ok ? '✔ تم تسجيل الدخول' : '✖ فشل الربط') + '</h1><p>' + (ok ? 'تم تسجيل دخولك تلقائياً. ارجع لبرنامج Stream Extra وتقدر تسكّر هذه الصفحة.' : 'ارجع للبرنامج وجرّب مرة ثانية.') + '</p></div></body>');
        if (ok) finish(null, u.searchParams.get('code'));
        else if (err) finish(new Error(u.searchParams.get('error_description') || err));
      } catch (e) { try { res.writeHead(400); res.end(); } catch (x) {} }
    };
    const port = parseInt(redirect.port, 10) || 80;
    let listening = 0, failed = 0;
    for (const host of ['127.0.0.1', '::1']) {
      const sv = http.createServer(handler);
      sv.on('error', () => { failed++; if (failed >= 2 && !listening) finish(new Error('PORT_BUSY')); });
      sv.listen(port, host, () => { listening++; });
      servers.push(sv);
    }
    timer = setTimeout(() => finish(new Error('TIMEOUT')), 3 * 60 * 1000);
  });
  pr.cancel = () => { try { cancelFn && cancelFn(); } catch (e) {} };
  return pr;
}
async function kickAuthFlow(redirect, scope) {
  const verifier = b64u(crypto.randomBytes(64));
  const challenge = b64u(crypto.createHash('sha256').update(verifier).digest());
  const state = b64u(crypto.randomBytes(16));
  const authUrl = KICK_ID + '/oauth/authorize?' + new URLSearchParams({
    response_type: 'code', client_id: kick.clientId, redirect_uri: redirect.toString(), scope,
    code_challenge: challenge, code_challenge_method: 'S256', state
  }).toString();
  const codeP = waitForCode(redirect, state);
  codeP.catch(() => {});
  /* v1.3.0: الربط يفتح في متصفح النظام (حيث دخولك العادي بـ Google أو Kick يشتغل صح)، والكود يرجع لسيرفر محلي مؤقت.
     ما عاد في أي نافذة تسجيل دخول داخل البرنامج. */
  await openInChrome(authUrl);
  const code = await codeP;
  return kickToken({
    grant_type: 'authorization_code', client_id: kick.clientId, client_secret: kick.clientSecret,
    redirect_uri: redirect.toString(), code_verifier: verifier, code
  });
}
async function kickConnect() {
  if (authBusy) return { ok: false, error: 'busy' };
  if (!kick.clientId || !kick.clientSecret) return { ok: false, error: 'NO_APP' };
  let redirect;
  try { redirect = new URL(kick.redirectUri || KICK_DEFAULT_REDIRECT); } catch (e) { return { ok: false, error: 'BAD_REDIRECT' }; }
  if (redirect.protocol !== 'http:' || !/^(localhost|127\.0\.0\.1)$/.test(redirect.hostname)) return { ok: false, error: 'BAD_REDIRECT' };
  authBusy = true;
  try {
    let j, used = KICK_SCOPES_FULL;
    try { j = await kickAuthFlow(redirect, KICK_SCOPES_FULL); }
    catch (e) {
      // لو كيك رفضت صلاحيات الإشراف لسبب ما، نرجع تدريجياً: (بدون إشراف) ثم (الأساسية فقط)
      if (/scope/i.test(String(e && e.message))) {
        try { used = KICK_SCOPES_WRITE; j = await kickAuthFlow(redirect, KICK_SCOPES_WRITE); }
        catch (e2) {
          if (/scope/i.test(String(e2 && e2.message))) { used = KICK_SCOPES_BASE; j = await kickAuthFlow(redirect, KICK_SCOPES_BASE); }
          else throw e2;
        }
      }
      else throw e;
    }
    storeTokens(j, used);
    // بيانات الحساب + القناة
    const me = await kickApi('GET', '/users');
    const u = me && me.data && me.data[0];
    const ch = await kickApi('GET', '/channels');
    const c = ch && ch.data && ch.data[0];
    kick.user = { id: (u && u.user_id) || (c && c.broadcaster_user_id) || null, name: (u && u.name) || '', slug: (c && c.slug) || '' };
    kick.web = {};
    if (!parseSlug(kick.channel) && kick.user.slug) kick.channel = kick.user.slug;      // قناتك تنحط تلقائياً بعد الربط
    saveKick();
    webMe = null; webMeAt = 0;
    return { ok: true, config: kickPublic() };
  } catch (e) {
    return { ok: false, error: e.message || 'FAIL' };
  } finally { authBusy = false; }
}

/* ---- بيانات الموقع (المتابعين + رقم غرفة الشات): net.fetch أولاً، ولو كلاودفلير منعتنا ننتقل لنافذة مخفية ---- */
let webLock = Promise.resolve();
function webJsonViaWindow(url) {
  return new Promise((resolve) => {
    let w;
    try {
      w = new BrowserWindow({ show: false, width: 800, height: 600, webPreferences: { partition: 'persist:streamextra-kickweb', sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
    } catch (e) { return resolve(null); }
    let finished = false;
    const end = (v) => { if (finished) return; finished = true; try { if (!w.isDestroyed()) w.destroy(); } catch (e) {} resolve(v); };
    w.webContents.setUserAgent(WEB_UA);
    w.loadURL(url).catch(() => {});
    let tries = 0;
    const tick = async () => {
      if (finished) return;
      if (++tries > 14 || w.isDestroyed()) return end(null);
      try {
        const txt = await w.webContents.executeJavaScript('document.body ? document.body.innerText : ""');
        const m = String(txt || '').trim();
        if (m.startsWith('{') || m.startsWith('[')) { try { return end(JSON.parse(m)); } catch (e) {} }
      } catch (e) {}
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1500);
  });
}
function webJsonViaPage(slug) {
  return new Promise((resolve) => {
    if (!/^[a-z0-9_\-]+$/i.test(slug)) return resolve(null);
    let w;
    try {
      w = new BrowserWindow({ show: false, width: 1000, height: 700, webPreferences: { partition: 'persist:streamextra-kickweb', sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
    } catch (e) { return resolve(null); }
    let finished = false;
    const end = (v) => { if (finished) return; finished = true; try { if (!w.isDestroyed()) w.destroy(); } catch (e) {} resolve(v); };
    w.webContents.setUserAgent(WEB_UA);
    w.loadURL('https://kick.com/' + slug).catch(() => {});
    const code = `(async()=>{for(const p of ['/api/v2/channels/','/api/v1/channels/']){try{const r=await fetch(p+${JSON.stringify(slug)},{headers:{accept:'application/json'},credentials:'include'});const j=JSON.parse(await r.text());if(j&&j.chatroom)return j;}catch(e){}}return null;})()`;
    let tries = 0;
    const tick = async () => {
      if (finished) return;
      if (++tries > 12 || w.isDestroyed()) return end(null);
      try {
        if (!w.webContents.isLoading()) {
          const j = await w.webContents.executeJavaScript(code);
          if (j && j.chatroom) return end(j);
        }
      } catch (e) {}
      setTimeout(tick, 2000);
    };
    setTimeout(tick, 2500);
  });
}

/* ---- طريقة احتياطية لإيجاد رقم غرفة الشات: نفتح صفحة القناة في نافذة مخفية ونلتقط اشتراك Pusher الذي يفتحه موقع Kick نفسه ---- */
function webIdsViaSocket(slug) {
  return new Promise((resolve) => {
    if (!/^[a-z0-9_\-]+$/i.test(slug)) return resolve(null);
    let w;
    try {
      w = new BrowserWindow({ show: false, width: 1000, height: 700, webPreferences: { partition: 'persist:streamextra-kickweb', sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
    } catch (e) { return resolve(null); }
    let finished = false, dbg = null, room = 0, chan = 0, timer = null;
    const end = (v) => {
      if (finished) return; finished = true; clearTimeout(timer);
      try { if (dbg && dbg.isAttached()) dbg.detach(); } catch (e) {}
      try { if (!w.isDestroyed()) w.destroy(); } catch (e) {}
      resolve(v);
    };
    try {
      dbg = w.webContents.debugger;
      dbg.attach('1.3');
      dbg.on('message', (_ev, method, params) => {
        if (method !== 'Network.webSocketFrameSent' && method !== 'Network.webSocketFrameReceived') return;
        const txt = params && params.response && params.response.payloadData;
        if (!txt || typeof txt !== 'string') return;
        const mr = /chatrooms[._](\d+)/.exec(txt); if (mr) room = parseInt(mr[1], 10) || room;
        const mc = /channel[._](\d+)/.exec(txt); if (mc) chan = parseInt(mc[1], 10) || chan;
        if (room) setTimeout(() => end({ id: chan || undefined, chatroom: { id: room } }), 600);
      });
      dbg.sendCommand('Network.enable').catch(() => {});
    } catch (e) { return end(null); }
    w.webContents.setUserAgent(WEB_UA);
    w.loadURL('https://kick.com/' + slug).catch(() => {});
    timer = setTimeout(() => end(room ? { id: chan || undefined, chatroom: { id: room } } : null), 22000);
  });
}

/* ---- طريقة جديدة (v1.2): curl.exe الموجود في ويندوز 10/11. بصمة TLS تبعه تمر من Cloudflare بدون نافذة مخفية ---- */
function webJsonViaCurl(slug) {
  return new Promise((resolve) => {
    if (!/^[a-z0-9_\-]+$/i.test(slug)) return resolve(null);
    const exe = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'curl.exe') : 'curl';
    const urls = ['https://kick.com/api/v2/channels/' + slug, 'https://kick.com/api/v1/channels/' + slug];
    let i = 0;
    const next = () => {
      if (i >= urls.length) return resolve(null);
      const u = urls[i++];
      let out = '', done = false, p;
      const fin = (v) => { if (done) return; done = true; if (v) resolve(v); else next(); };
      try {
        p = spawn(exe, ['-s', '-L', '--max-time', '15', '-A', WEB_UA, '-H', 'accept: application/json', '-H', 'referer: https://kick.com/', u], { windowsHide: true });
      } catch (e) { return fin(null); }
      p.stdout.on('data', d => { out += d; if (out.length > 3e6) { try { p.kill(); } catch (e) {} } });
      p.on('error', () => fin(null));
      p.on('close', () => { try { const j = JSON.parse(out); fin(j && j.chatroom ? j : null); } catch (e) { fin(null); } });
      setTimeout(() => { try { p.kill(); } catch (e) {} fin(null); }, 18000);
    };
    next();
  });
}
async function webChannel(slug) {
  const url = 'https://kick.com/api/v2/channels/' + encodeURIComponent(slug);
  try {
    const res = await net.fetch(url, { headers: { accept: 'application/json', 'user-agent': WEB_UA, referer: 'https://kick.com/', 'accept-language': 'en-US,en;q=0.9' } });
    if (res.ok) { const j = await res.json(); if (j && j.chatroom) return j; }
  } catch (e) {}
  const run = webLock.then(async () => (await webJsonViaCurl(slug)) || (await webJsonViaPage(slug)) || (await webIdsViaSocket(slug)) || (await webJsonViaWindow(url)));
  webLock = run.catch(() => {});
  const j = await run;
  return j && j.chatroom ? j : null;
}
function toIso(s) {
  if (!s) return null;
  let x = String(s).trim();
  if (/^\d{4}-\d\d-\d\d \d/.test(x)) x = x.replace(' ', 'T');
  if (!/[zZ]|[+-]\d\d:?\d\d$/.test(x)) x += 'Z';
  const d = new Date(x);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
let lastWeb = { slug: '', at: 0 };

/* ---- v1.3.0: قراءة حيّة خفيفة (كل ~2 ثانية) ---- */
const KW_LOG = [];            // آخر نتائج طلبات الموقع (للتشخيص)
function kwLog(tag, status, note) { KW_LOG.push({ t: Date.now(), tag, status, note: String(note || '').slice(0, 120) }); if (KW_LOG.length > 40) KW_LOG.shift(); }
function normChat(cr) {
  if (!cr || typeof cr !== 'object') return null;
  const en = (v) => (v && typeof v === 'object') ? !!(v.enabled != null ? v.enabled : v.enable) : !!v;
  const num = (...a) => { for (const x of a) { const n = parseInt(x, 10); if (!isNaN(n)) return n; } return 0; };
  const sm = cr.slow_mode, fm = cr.followers_mode, ac = cr.account_age, bp = cr.advanced_bot_protection;
  if (sm == null && fm == null && cr.subscribers_mode == null && cr.emotes_mode == null) return null;
  return {
    slow: en(sm), interval: num(sm && sm.message_interval, cr.message_interval),
    followers: en(fm), followMin: num(fm && fm.min_duration, cr.following_min_duration),
    subs: en(cr.subscribers_mode), emotes: en(cr.emotes_mode),
    account: en(ac), accountMin: num(ac && ac.min_duration),
    bot: en(bp), mode: cr.chat_mode || ''
  };
}
let fastCurlAt = 0;
async function kickFastRead(slug) {
  if (!/^[a-z0-9_\-]+$/i.test(slug)) return null;
  // 1) من صفحة الجسر (الصفحة اللي عدّت من Cloudflare أصلاً)
  try {
    if (bridge.w && !bridge.w.isDestroyed() && bridge.slug === slug && !bridge.w.webContents.isLoading()) {
      const code = `(async()=>{try{const r=await fetch('/api/v2/channels/${slug}',{headers:{accept:'application/json'},credentials:'include'});if(!r.ok)return {__s:r.status};return await r.json();}catch(e){return null;}})()`;
      const j = await Promise.race([bridge.w.webContents.executeJavaScript(code), new Promise(r => setTimeout(() => r(null), 6000))]);
      if (j && j.chatroom) return j;
    }
  } catch (e) {}
  // 2) طلب مباشر
  try {
    const res = await net.fetch('https://kick.com/api/v2/channels/' + encodeURIComponent(slug), { headers: { accept: 'application/json', 'user-agent': WEB_UA, referer: 'https://kick.com/' } });
    if (res.ok) { const j = await res.json(); if (j && j.chatroom) return j; }
  } catch (e) {}
  // 3) curl (كل 8 ثواني بالكثير)
  if (Date.now() - fastCurlAt > 8000) { fastCurlAt = Date.now(); try { const j = await webJsonViaCurl(slug); if (j && j.chatroom) return j; } catch (e) {} }
  return null;
}
let offCache = { slug: '', data: null }, offBackoff = 0;
async function officialChannel(own, slug) {
  if (Date.now() < offBackoff && offCache.slug === slug) return offCache.data;
  try {
    const r = await kickApi('GET', own ? '/channels' : '/channels?slug=' + encodeURIComponent(slug));
    const c = (r && r.data && r.data[0]) || null;
    offCache = { slug, data: c };
    return c;
  } catch (e) {
    if (e && e.status === 429) { offBackoff = Date.now() + 20000; if (offCache.slug === slug) return offCache.data; }
    throw e;
  }
}
let statsFlight = null;
function kickStatsShared(force) {
  if (statsFlight && !force) return statsFlight;
  const p = kickStats(force).finally(() => { if (statsFlight === p) statsFlight = null; });
  statsFlight = p; return p;
}
async function kickStats(force) {
  const ownSlug = (kick.user && kick.user.slug) || '';
  const slug = (parseSlug(kick.channel) || ownSlug).toLowerCase();
  if (!slug) return { ok: false, code: 'noChannel' };
  const own = !!ownSlug && slug === ownSlug.toLowerCase();
  const noLogin = !kick.tokens;      // وضع الشات فقط: بدون ربط المطوّر
  const out = { ok: true, slug, own, live: false, viewers: null, followers: null, subs: null, subsCanceled: null, title: '', category: '', categoryId: null, language: '', mature: null, tags: [], chat: null, startedAt: null, chatroomId: null, channelId: null, userId: own && kick.user ? kick.user.id : null, official: false, web: false, at: Date.now() };
  try {
    if (noLogin) throw Object.assign(new Error('chat-only'), { code: 'skip' });
    const c = await officialChannel(own, slug);
    if (c) {
      out.official = true; out.title = c.stream_title || '';
      out.category = (c.category && c.category.name) || ''; out.categoryId = (c.category && c.category.id) || null;
      if (Array.isArray(c.custom_tags)) out.tags = c.custom_tags.map(String);
      out.userId = c.broadcaster_user_id || out.userId;
      if (c.active_subscribers_count != null) { const n = parseInt(c.active_subscribers_count, 10); if (!isNaN(n)) out.subs = n; }
      if (c.canceled_subscribers_count != null) { const n = parseInt(c.canceled_subscribers_count, 10); if (!isNaN(n)) out.subsCanceled = n; }
      if (c.stream) { out.language = c.stream.language || ''; out.mature = c.stream.is_mature != null ? !!c.stream.is_mature : (c.stream.has_mature_content != null ? !!c.stream.has_mature_content : null); if (Array.isArray(c.stream.custom_tags) && c.stream.custom_tags.length) out.tags = c.stream.custom_tags.map(String); out.live = !!c.stream.is_live; out.viewers = out.live ? (parseInt(c.stream.viewer_count, 10) || 0) : 0; if (out.live) out.startedAt = toIso(c.stream.start_time); }
    }
  } catch (e) {
    if (e.code === 'auth') return { ok: false, code: 'auth' };
    if (e.code === 'net') return { ok: false, code: 'net' };
    if (e.code !== 'skip') out.apiError = e.message;
  }
  // الموقع: المتابعين + إعدادات الشات + رقم الغرفة. ثقيلة كل ~45 ثانية، وخفيفة كل ~2 ثانية
  const cached = kick.web && kick.web[slug];
  if (cached) { out.chatroomId = cached.chatroomId; out.channelId = cached.channelId; out.followers = cached.followers; out.userId = out.userId || cached.userId; out.chat = cached.chat || null; if (!out.language) out.language = cached.language || ''; }
  const heavy = force || !cached || lastWeb.slug !== slug || Date.now() - lastWeb.at > 45000;
  let w = null;
  if (heavy) {
    lastWeb = { slug, at: Date.now() };
    w = await webChannel(slug);
    if (!w || !(w.chatroom && w.chatroom.id)) lastWeb.at = Date.now() - 35000;   // فشل؟ نعيد المحاولة بعد ~10 ثواني بدل 45
  } else {
    w = await kickFastRead(slug);
  }
  if (w) {
    out.web = true;
    const cr = w.chatroom || {};
    const nc = normChat(cr); if (nc) out.chat = nc;
    if (w.livestream && typeof w.livestream === 'object' && !out.language) out.language = w.livestream.language || '';
    const fc = parseInt(w.followers_count != null ? w.followers_count : (w.followersCount != null ? w.followersCount : ''), 10);
    out.chatroomId = (w.chatroom && w.chatroom.id) || out.chatroomId;
    out.channelId = w.id || out.channelId;
    out.userId = out.userId || w.user_id || null;
    if (!isNaN(fc)) out.followers = fc;
    if (w.livestream && typeof w.livestream === 'object') {
      out.live = true;
      if (out.viewers == null) out.viewers = parseInt(w.livestream.viewer_count, 10) || 0;
      if (!out.title) out.title = w.livestream.session_title || '';
      if (!out.startedAt) out.startedAt = toIso(w.livestream.created_at);
      if (!out.category) out.category = (Array.isArray(w.livestream.categories) && w.livestream.categories[0] && w.livestream.categories[0].name) || '';
    }
    const prev = kick.web && kick.web[slug];
    kick.web = kick.web || {};
    kick.web[slug] = { chatroomId: out.chatroomId, channelId: out.channelId, followers: out.followers, userId: out.userId, chat: out.chat, language: out.language };
    if (heavy || !prev || prev.chatroomId !== out.chatroomId) saveKick();
  }
  if (!out.chatroomId && kick.chatroomManual) out.chatroomId = kick.chatroomManual;     // رقم يدوي من الإعدادات
  return out;
}

ipcMain.handle('kick:config', () => kickPublic());
ipcMain.handle('kick:save', (_e, c) => {
  c = c || {};
  const idChanged = typeof c.clientId === 'string' && c.clientId.trim() !== kick.clientId;
  if (typeof c.clientId === 'string') kick.clientId = c.clientId.trim();
  if (typeof c.clientSecret === 'string' && c.clientSecret.trim()) kick.clientSecret = c.clientSecret.trim();
  if (typeof c.redirectUri === 'string') kick.redirectUri = c.redirectUri.trim() || KICK_DEFAULT_REDIRECT;
  if (typeof c.channel === 'string') kick.channel = c.channel.trim();
  if (typeof c.chatroomId === 'string') kick.chatroomManual = parseInt(c.chatroomId.replace(/\D/g, ''), 10) || 0;
  if (idChanged) { kick.tokens = null; kick.user = null; }
  saveKick();
  return kickPublic();
});
ipcMain.handle('kick:connect', () => kickConnect());
ipcMain.handle('kick:disconnect', async () => {
  try {
    if (kick.tokens && kick.tokens.access_token) {
      await net.fetch(KICK_ID + '/oauth/revoke?' + new URLSearchParams({ token: kick.tokens.access_token, token_hint_type: 'access_token' }).toString(), { method: 'POST' }).catch(() => {});
    }
  } catch (e) {}
  kick.tokens = null; kick.user = null; kick.web = {}; saveKick();
  return kickPublic();
});
ipcMain.handle('kick:stats', async (_e, force) => { try { return await kickStatsShared(!!force); } catch (e) { return { ok: false, code: 'fail', error: e.message }; } });
ipcMain.handle('kick:send', async (_e, req) => {
  try {
    const text = String(req && req.text || '').trim().slice(0, 500);
    if (!text) return { ok: false, code: 'empty' };
    if (!kick.tokens) {   // v1.3.0: بدون ربط مطوّر → نرسل بجلسة حسابك على موقع Kick
      if (!(await webToken())) return { ok: false, code: 'webLogin' };
      const sl = chatSlug(); const cw = kick.web && kick.web[sl];
      const room = parseInt((req && req.chatroomId) || (cw && cw.chatroomId) || kick.chatroomManual, 10) || 0;
      if (!sl || !room) return { ok: false, code: 'noChannel' };
      const b = { content: text, type: 'message' };
      if (req && req.replyTo) b.metadata = { original_message: { id: String(req.replyTo) } };
      const r = await webCalls('send', sl, [{ m: 'POST', u: 'https://kick.com/api/v2/messages/send/' + room, b }]);
      return r.ok ? { ok: true, sent: true, id: '' } : Object.assign({}, r, { error: r.detail || '' });
    }
    let uid = req && req.broadcasterId ? parseInt(req.broadcasterId, 10) : 0;
    if (!uid && kick.user) uid = parseInt(kick.user.id, 10) || 0;
    if (!uid) return { ok: false, code: 'noChannel' };
    const body = { broadcaster_user_id: uid, content: text, type: 'user' };
    if (req && req.replyTo) body.reply_to_message_id = String(req.replyTo);
    const r = await kickApi('POST', '/chat', body);
    const d = (r && r.data) || {};
    return { ok: true, sent: d.is_sent !== false, id: d.message_id ? String(d.message_id) : '' };
  } catch (e) {
    return { ok: false, code: e.code || 'fail', status: e.status || 0, error: e.message };
  }
});
/* صور حسابات المشاهدين: API الرسمي GET /users?id=... (يحتاج الربط الرسمي، صلاحية user:read). تُخزَّن مؤقتاً. */
const avatarCache = new Map();
ipcMain.handle('kick:avatars', async (_e, ids) => {
  try {
    const list = (Array.isArray(ids) ? ids : []).map(x => parseInt(x, 10)).filter(n => n > 0).slice(0, 50);
    const need = list.filter(id => !avatarCache.has(id));
    if (need.length && kick.tokens) {
      const r = await kickApi('GET', '/users?' + need.map(i => 'id=' + i).join('&'));
      ((r && r.data) || []).forEach(u => { if (u && u.user_id != null) avatarCache.set(Number(u.user_id), String(u.profile_picture || '')); });
      need.forEach(id => { if (!avatarCache.has(id)) avatarCache.set(id, ''); });
      while (avatarCache.size > 3000) avatarCache.delete(avatarCache.keys().next().value);
    }
    const out = {}; list.forEach(id => { const v = avatarCache.get(id); if (v && /^https:\/\//i.test(v)) out[id] = v; });
    return { ok: true, avatars: out };
  } catch (e) { return { ok: false }; }
});
ipcMain.handle('kick:categories', async (_e, q) => {
  try {
    q = String(q || '').trim().slice(0, 60);
    if (!q) return { ok: true, list: [] };
    const r = await kickApi('GET', '/categories?q=' + encodeURIComponent(q));
    const list = ((r && r.data) || []).slice(0, 14).map(c => ({ id: c.id, name: c.name, thumb: c.thumbnail || '' }));
    return { ok: true, list };
  } catch (e) { return { ok: false, code: e.code || 'fail', status: e.status || 0, error: e.message }; }
});

/* ---- حفظ معلومات البث على Kick ----
   العنوان + التصنيف + الوسوم: API الرسمي (PATCH /channels).
   اللغة + محتوى +18: Kick ما بتعرضهم بالـ API الرسمي، فنحاول عبر جلسة موقع Kick (لازم تسجل دخولك مرة وحدة من زر "تسجيل دخول الموقع").
   لو الموقع رفض، تنرجع النتيجة web:false والواجهة تعرض تنبيه بدل ما تخبي المشكلة. */
const KICK_WEB_EP = [
  ['PATCH', (slug) => 'https://kick.com/api/internal/v1/channels/' + slug + '/stream-info'],
  ['PUT',   (slug) => 'https://kick.com/api/internal/v1/channels/' + slug + '/stream-info'],
  ['PUT',   (slug) => 'https://kick.com/api/v1/channels/' + slug + '/stream-info']
];
async function webUpdateInfo(slug, fields) {
  if (!/^[a-z0-9_\-]+$/i.test(slug)) return { ok: false, code: 'bad' };
  const ses = session.fromPartition(KICK_PART);
  let token = '';
  try { const ck = await ses.cookies.get({ url: 'https://kick.com', name: 'session_token' }); if (ck[0]) token = decodeURIComponent(ck[0].value); } catch (e) {}
  if (!token) return { ok: false, code: 'webLogin' };
  return new Promise((resolve) => {
    let w;
    try { w = new BrowserWindow({ show: false, width: 900, height: 700, webPreferences: { partition: KICK_PART, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); }
    catch (e) { return resolve({ ok: false, code: 'web' }); }
    let done = false;
    const end = (v) => { if (done) return; done = true; try { if (!w.isDestroyed()) w.destroy(); } catch (e) {} resolve(v); };
    setTimeout(() => end({ ok: false, code: 'web' }), 30000);
    w.webContents.setUserAgent(WEB_UA);
    w.webContents.once('did-finish-load', async () => {
      try {
        const body = {};
        if (fields.language) body.language = fields.language;
        if (typeof fields.mature === 'boolean') { body.is_mature = fields.mature; body.mature = fields.mature; }
        const eps = KICK_WEB_EP.map(([m, f]) => [m, f(slug)]);
        const code = '(async()=>{const tk=' + JSON.stringify(token) + ',b=' + JSON.stringify(JSON.stringify(body)) + ',eps=' + JSON.stringify(eps) + ';for(const [m,u] of eps){try{const r=await fetch(u,{method:m,credentials:"include",headers:{accept:"application/json","content-type":"application/json",authorization:"Bearer "+tk},body:b});if(r.ok)return {ok:true,status:r.status};}catch(e){}}return {ok:false};})()';
        const r = await w.webContents.executeJavaScript(code);
        end(r && r.ok ? { ok: true } : { ok: false, code: 'webRejected' });
      } catch (e) { end({ ok: false, code: 'web' }); }
    });
    w.loadURL('https://kick.com/' + slug).catch(() => end({ ok: false, code: 'web' }));
  });
}
ipcMain.handle('kick:setInfo', async (_e, req) => {
  try {
    req = req || {};
    const out = { ok: true, official: false, web: null };
    const body = {};
    const title = String(req.title == null ? '' : req.title).trim();
    if (title) body.stream_title = title.slice(0, 140);
    const cid = parseInt(req.categoryId, 10);
    if (cid > 0) body.category_id = cid;
    if (Array.isArray(req.tags)) body.custom_tags = req.tags.map(x => String(x).trim()).filter(Boolean).slice(0, 10);
    if (Object.keys(body).length) { await kickApi('PATCH', '/channels', body); out.official = true; }
    const wantWeb = !!req.language || typeof req.mature === 'boolean';
    if (wantWeb) {
      const slug = ((kick.user && kick.user.slug) || '').toLowerCase();
      const r = await webUpdateInfo(slug, { language: req.language ? String(req.language) : '', mature: typeof req.mature === 'boolean' ? req.mature : undefined });
      out.web = r.ok ? true : (r.code || false);
    }
    return out;
  } catch (e) { return { ok: false, code: e.code || 'fail', status: e.status || 0, error: e.message }; }
});
ipcMain.handle('kick:openWeb', async (_e, kind) => {
  if (kind === 'dashboard') { openKickWindow('https://dashboard.kick.com/'); return { ok: true }; }
  if (kind === 'popout') { const sl = (ownSlugNow() || parseSlug(kick.channel)); if (sl) { openKickWindow('https://kick.com/popout/' + sl + '/chat', 520, 820); return { ok: true }; } return { ok: false }; }
  return { ok: false };
});


/* ============ v1.3.0: إجراءات القناة (إعدادات الشات) + الكلمات المحظورة عبر جلسة موقع Kick ============
   Kick ما توفّر API رسمي لإعدادات الشات (المتابعين فقط / المشتركين فقط / الوضع البطيء ...)،
   فنرسلها بنفس جلسة موقع Kick اللي سجّلت دخولك فيها (زر "تسجيل دخول موقع Kick" مرة وحدة).
   كل محاولة وردّها (رقم HTTP) تنسجل وتظهر في ⓘ تشخيص الشات عشان لو Kick غيّرت المسار نعرف بالضبط وين المشكلة. */
let kwWin = null, kwSlug = '', kwIdle = null;
const kwHit = {};
function kwClose() { clearTimeout(kwIdle); try { if (kwWin && !kwWin.isDestroyed()) kwWin.destroy(); } catch (e) {} kwWin = null; kwSlug = ''; }
function kwOpen(slug) {
  clearTimeout(kwIdle); kwIdle = setTimeout(kwClose, 120000);
  if (kwWin && !kwWin.isDestroyed() && kwSlug === slug && !kwWin.webContents.isLoading()) return Promise.resolve(kwWin);
  kwClose(); kwSlug = slug;
  return new Promise((resolve) => {
    let w;
    try { w = new BrowserWindow({ show: false, width: 900, height: 700, webPreferences: { partition: KICK_PART, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); }
    catch (e) { return resolve(null); }
    kwWin = w; w.webContents.setUserAgent(WEB_UA);
    let done = false; const fin = (v) => { if (done) return; done = true; resolve(v); };
    setTimeout(() => fin(null), 25000);
    w.webContents.once('did-finish-load', () => fin(w));
    w.loadURL('https://kick.com/' + slug).catch(() => fin(null));
  });
}
const KW_PAGE_JS = `(async (tk, calls) => {
  const xs = decodeURIComponent((document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/) || [])[1] || '');
  const res = [];
  for (const c of calls) {
    try {
      const h = { accept: 'application/json' };
      if (c.b !== undefined) h['content-type'] = 'application/json';
      if (tk) h.authorization = 'Bearer ' + tk;
      if (xs) h['x-xsrf-token'] = xs;
      const r = await fetch(c.u, { method: c.m, credentials: 'include', headers: h, body: c.b === undefined ? undefined : JSON.stringify(c.b) });
      const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
      res.push({ u: c.u, m: c.m, s: r.status, j: r.ok ? j : null, t: txt.slice(0, 140) });
      if (r.ok) return { ok: true, hit: res.length - 1, res };
    } catch (e) { res.push({ u: c.u, m: c.m, s: 0, t: String(e).slice(0, 100) }); }
  }
  return { ok: false, res };
})`;
async function webCalls(tag, slug, calls) {
  if (!/^[a-z0-9_\-]+$/i.test(slug)) return { ok: false, code: 'bad' };
  let token = '';
  try { const ck = await session.fromPartition(KICK_PART).cookies.get({ url: 'https://kick.com', name: 'session_token' }); if (ck[0]) token = decodeURIComponent(ck[0].value); } catch (e) {}
  if (!token) return { ok: false, code: 'webLogin' };
  // الطريقة اللي نجحت قبل كذا تنجرّب أول
  const first = kwHit[tag];
  const list = calls.map((c, i) => ({ ...c, _i: i }));
  if (first != null) list.sort((a, b) => (a._i === first ? -1 : b._i === first ? 1 : 0));
  const w = await kwOpen(slug);
  if (!w) return { ok: false, code: 'web' };
  let r;
  try {
    r = await Promise.race([w.webContents.executeJavaScript(KW_PAGE_JS + '(' + JSON.stringify(token) + ',' + JSON.stringify(list.map(({ _i, ...c }) => c)) + ')'), new Promise((res) => setTimeout(() => res(null), 25000))]);
  } catch (e) { kwLog(tag, 0, e && e.message); return { ok: false, code: 'web' }; }
  if (!r) return { ok: false, code: 'web' };
  (r.res || []).forEach((x) => kwLog(tag, x.s, x.m + ' ' + String(x.u).replace('https://kick.com', '') + ' ' + (x.t || '')));
  if (r.ok) { kwHit[tag] = list[r.hit]._i; return { ok: true, data: (r.res[r.hit] || {}).j }; }
  const sts = (r.res || []).map((x) => x.s);
  const code = sts.some((s) => s === 401 || s === 419) ? 'webLogin' : (sts.some((s) => s === 403) ? 'webForbidden' : 'webRejected');
  /* سبب الرفض كما كتبته Kick نفسها (مثلاً: المدة غير مسموحة) عشان يظهر للمستخدم بدل رقم مبهم */
  let detail = '';
  for (const x of (r.res || [])) {
    if (!(x.s >= 400 && x.s < 500) || x.s === 404 || x.s === 405 || !x.t) continue;
    try { const j = JSON.parse(x.t); detail = String((j && (j.message || j.error || (j.errors && JSON.stringify(j.errors)))) || '').slice(0, 140); } catch (e) { detail = /^\s*</.test(x.t) ? '' : String(x.t).slice(0, 100); }
    if (detail) break;
  }
  return { ok: false, code, status: sts[sts.length - 1] || 0, detail };
}
const ownSlugNow = () => ((kick.user && kick.user.slug) || '').toLowerCase();
/* قناتك أنت (التوقعات لقناتك فقط): الربط الرسمي ← حساب موقع Kick المسجّل ← اسم القناة */
const myChannelSlug = () => ownSlugNow() || String((webMe && webMe.slug) || '').toLowerCase() || parseSlug(kick.channel) || '';
ipcMain.handle('kick:setChat', async (_e, req) => {
  try {
    const slug = ownSlugNow() || parseSlug(kick.channel); if (!slug) return { ok: false, code: 'noOwn' };
    const cur = (kick.web && kick.web[slug] && kick.web[slug].chat) || {};
    const s = Object.assign({ slow: false, interval: 5, followers: false, followMin: 0, subs: false, emotes: false, account: false, accountMin: 0, bot: false }, cur, (req && req.patch) || {});
    const I = (v, a, b, d) => { const n = parseInt(v, 10); return isNaN(n) ? d : Math.max(a, Math.min(b, n)); };
    s.interval = I(s.interval, 1, 300, 5); s.followMin = I(s.followMin, 0, 43200, 0); s.accountMin = I(s.accountMin, 0, 43200, 0);
    ['slow', 'followers', 'subs', 'emotes', 'account', 'bot'].forEach((k) => { s[k] = !!s[k]; });
    const flat = { slow_mode: s.slow, message_interval: s.interval, followers_mode: s.followers, following_min_duration: s.followMin, subscribers_mode: s.subs, emotes_mode: s.emotes };
    const nested = { slow_mode: { enabled: s.slow, message_interval: s.interval }, followers_mode: { enabled: s.followers, min_duration: s.followMin }, subscribers_mode: { enabled: s.subs }, emotes_mode: { enabled: s.emotes }, account_age: { enabled: s.account, min_duration: s.accountMin }, advanced_bot_protection: { enabled: s.bot } };
    const v2 = 'https://kick.com/api/v2/channels/' + slug, v1i = 'https://kick.com/api/internal/v1/channels/' + slug;
    const calls = [
      { m: 'PUT', u: v2 + '/chatroom/settings', b: flat },
      { m: 'PATCH', u: v2 + '/chatroom/settings', b: flat },
      { m: 'PUT', u: v1i + '/chatroom/settings', b: flat },
      { m: 'PUT', u: v2 + '/chatroom', b: nested },
      { m: 'PATCH', u: v1i + '/chatroom', b: nested },
      { m: 'PUT', u: v1i + '/chatroom/settings', b: nested },
      { m: 'PATCH', u: v2 + '/chatroom', b: Object.assign({}, flat, nested) },
      { m: 'PUT', u: 'https://kick.com/api/v1/channels/' + slug + '/chatroom/settings', b: Object.assign({}, flat, nested) },
      { m: 'PATCH', u: v1i + '/chatroom/settings', b: Object.assign({}, flat, nested) }
    ];
    const r = await webCalls('chat', slug, calls);
    if (r.ok) { kick.web = kick.web || {}; kick.web[slug] = Object.assign({}, kick.web[slug] || {}, { chat: s }); }
    return Object.assign({ state: s }, r);
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});
ipcMain.handle('kick:words', async (_e, req) => {
  try {
    const slug = ownSlugNow() || parseSlug(kick.channel); if (!slug) return { ok: false, code: 'noOwn' };
    req = req || {}; const op = String(req.op || 'list'); const word = String(req.word || '').trim().slice(0, 60);
    const bases = ['https://kick.com/api/internal/v1/channels/' + slug + '/banned-words', 'https://kick.com/api/v2/channels/' + slug + '/banned-words', 'https://kick.com/api/v2/channels/' + slug + '/chatroom/banned-words'];
    let calls;
    if (op === 'add') { if (!word) return { ok: false, code: 'empty' }; calls = bases.flatMap((u) => [{ m: 'POST', u, b: { word } }, { m: 'POST', u, b: { words: [word] } }]); }
    else if (op === 'remove') { if (!word) return { ok: false, code: 'empty' }; calls = bases.map((u) => ({ m: 'DELETE', u: u + '/' + encodeURIComponent(req.id || word) })); }
    else calls = bases.map((u) => ({ m: 'GET', u }));
    const r = await webCalls('words-' + op, slug, calls);
    if (!r.ok) return r;
    if (op !== 'list') return { ok: true };
    let d = r.data; if (d && !Array.isArray(d)) d = d.data || d.banned_words || d.words || d.items || [];
    const list = (Array.isArray(d) ? d : []).map((x) => typeof x === 'string' ? { word: x } : { word: String(x.word || x.name || x.text || ''), id: x.id }).filter((x) => x.word);
    return { ok: true, list };
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});

/* ---- إجراءات المشرف عبر API الرسمي (حذف رسالة / تايم أوت / حظر / فك حظر) ---- */
ipcMain.handle('kick:mod', async (_e, req) => {
  try {
    req = req || {};
    const bid = parseInt((kick.user && kick.user.id) || req.broadcasterId, 10) || 0;
    if (!bid) return { ok: false, code: 'noChannel' };
    const act = String(req.action || '');
    if (act === 'delete') {
      if (!req.messageId) return { ok: false, code: 'empty' };
      await kickApi('DELETE', '/chat/' + encodeURIComponent(String(req.messageId)));
      return { ok: true };
    }
    const uid = parseInt(req.userId, 10) || 0;
    if (!uid) return { ok: false, code: 'noUser' };
    if (act === 'timeout' || act === 'ban') {
      const body = { broadcaster_user_id: bid, user_id: uid };
      if (act === 'timeout') body.duration = Math.max(1, Math.min(10080, parseInt(req.minutes, 10) || 10));
      if (req.reason) body.reason = String(req.reason).slice(0, 100);
      await kickApi('POST', '/moderation/bans', body);
      return { ok: true };
    }
    if (act === 'unban') { await kickApi('DELETE', '/moderation/bans', { broadcaster_user_id: bid, user_id: uid }); return { ok: true }; }
    return { ok: false, code: 'bad' };
  } catch (e) { return { ok: false, code: e.code || 'fail', status: e.status || 0, error: e.message }; }
});


/* ============ v1.3.0: الشات الثنائي بدون تطبيق مطوّر + أوامر الشات ============
   كل هذا يعمل بجلسة تسجيل دخول موقع Kick (زر "تسجيل دخول موقع Kick" مرة وحدة) أو بالربط الرسمي لو موجود.
   مسارات الويب غير موثّقة رسمياً، فكل محاولة وردّها (رقم HTTP) تنسجل وتظهر في ⓘ تشخيص الشات. */
let webMe = null, webMeAt = 0;
const chatSlug = () => (parseSlug(kick.channel) || ownSlugNow());
/* v1.3.0: تسجيل دخول حسابك على موقع Kick (بدون تطبيق مطوّر). الجلسة تنحفظ في نفس جلسة Kick الدائمة،
   والأوامر/الإرسال تستخدم كوكي session_token منها. */
async function webToken() {
  try {
    const ck = await session.fromPartition(KICK_PART).cookies.get({ url: 'https://kick.com', name: 'session_token' });
    return ck[0] && ck[0].value ? decodeURIComponent(ck[0].value) : '';
  } catch (e) { return ''; }
}
let kloginWin = null;
ipcMain.handle('kick:webLogin', async () => {
  try {
    if (await webToken()) return { ok: true, already: true };
    if (kloginWin && !kloginWin.isDestroyed()) { kloginWin.focus(); return { ok: false, code: 'busy' }; }
    return await new Promise((resolve) => {
      let w;
      try {
        w = new BrowserWindow({ width: 520, height: 780, title: 'Kick', backgroundColor: '#0a0a0b', autoHideMenuBar: true, parent: win || undefined,
          icon: path.join(__dirname, 'assets', 'icon.ico'),
          webPreferences: { partition: KICK_PART, contextIsolation: true, nodeIntegration: false, sandbox: true } });
      } catch (e) { return resolve({ ok: false, code: 'fail' }); }
      kloginWin = w; w.webContents.setUserAgent(WEB_UA); attachPopupRules(w.webContents);
      let done = false, iv = null;
      const fin = (v) => { if (done) return; done = true; clearInterval(iv); resolve(v); };
      iv = setInterval(async () => {
        if (done) return;
        if (await webToken()) {
          await persistKickCookies();
          fin({ ok: true });
          setTimeout(() => { try { if (!w.isDestroyed()) w.close(); } catch (e) {} }, 700);
        }
      }, 1200);
      w.on('closed', async () => { kloginWin = null; fin({ ok: !!(await webToken()), closed: true }); });
      w.loadURL('https://kick.com/').catch(() => {});
    });
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});
/* طريقة بديلة: لصق session_token من متصفحك (لو Google منع الدخول داخل البرنامج) */
ipcMain.handle('kick:webToken', async (_e, raw) => {
  try {
    let v = String(raw || '').trim().replace(/^session_token\s*=\s*/i, '').replace(/^["']|["']$/g, '');
    if (!v || v.length < 10 || /\s/.test(v)) return { ok: false, code: 'bad' };
    try { v = decodeURIComponent(v); } catch (e) {}
    await session.fromPartition(KICK_PART).cookies.set({ url: 'https://kick.com', name: 'session_token', value: encodeURIComponent(v), domain: '.kick.com', path: '/', secure: true, httpOnly: false, sameSite: 'no_restriction', expirationDate: Math.floor(Date.now() / 1000) + KEEP_DAYS * 86400 });
    webMe = null; webMeAt = 0; kwClose();
    return { ok: true };
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});
ipcMain.handle('kick:webLogout', async () => {
  try {
    const ses = session.fromPartition(KICK_PART);
    const list = await ses.cookies.get({});
    for (const c of list) {
      if (!/(^|\.)kick\.com$/i.test(String(c.domain || '').replace(/^\./, ''))) continue;
      try { await ses.cookies.remove('https://' + String(c.domain || 'kick.com').replace(/^\./, '') + (c.path || '/'), c.name); } catch (e) {}
    }
    try { await ses.clearStorageData({ storages: ['localstorage', 'indexdb', 'serviceworkers', 'cachestorage'] }); } catch (e) {}
    webMe = null; webMeAt = 0; kwClose();
    return { ok: true };
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});
ipcMain.handle('kick:webState', async (_e, force) => {
  try {
    const tk = await webToken();
    if (!tk) { webMe = null; return { ok: true, login: false }; }
    if (force || !webMe || Date.now() - webMeAt > 600000) {
      webMeAt = Date.now();
      const r = await webCalls('me', chatSlug() || 'kick', [{ m: 'GET', u: 'https://kick.com/api/v1/user' }]);
      if (r.ok && r.data) {
        const d = r.data.data || r.data;
        webMe = { id: d.id || null, name: d.username || d.name || (d.streamer_channel && d.streamer_channel.slug) || '', slug: String((d.streamer_channel && d.streamer_channel.slug) || d.username || '').toLowerCase().replace(/_/g, '-') };
        if (!parseSlug(kick.channel) && webMe.slug) { kick.channel = webMe.slug; saveKick(); }
      } else if (r.code === 'webLogin') { webMe = null; return { ok: true, login: false, expired: true }; }
    }
    return { ok: true, login: true, user: webMe };
  } catch (e) { return { ok: false, login: false }; }
});
/* أوامر الشات: حظر / تايم أوت / فك حظر / مسح الشات بالاسم عبر جلسة الموقع */
ipcMain.handle('kick:cmdWeb', async (_e, req) => {
  try {
    req = req || {}; const slug = chatSlug(); if (!slug) return { ok: false, code: 'noChannel' };
    const v2 = 'https://kick.com/api/v2/channels/' + slug, v1i = 'https://kick.com/api/internal/v1/channels/' + slug;
    const user = String(req.user || '').replace(/^@/, '').trim().slice(0, 60); const act = String(req.action || '');
    let calls;
    if (act === 'ban') calls = [{ m: 'POST', u: v2 + '/bans', b: { banned_username: user, permanent: true, reason: String(req.reason || '').slice(0, 100) } }, { m: 'POST', u: v1i + '/bans', b: { banned_username: user, permanent: true } }];
    else if (act === 'timeout') calls = [{ m: 'POST', u: v2 + '/bans', b: { banned_username: user, duration: Math.max(1, Math.min(10080, parseInt(req.minutes, 10) || 10)), permanent: false } }, { m: 'POST', u: v1i + '/bans', b: { banned_username: user, duration: Math.max(1, Math.min(10080, parseInt(req.minutes, 10) || 10)), permanent: false } }];
    else if (act === 'unban') calls = [{ m: 'DELETE', u: v2 + '/bans/' + encodeURIComponent(user) }, { m: 'DELETE', u: v1i + '/bans/' + encodeURIComponent(user) }];
    else if (act === 'delete') { const room = parseInt(req.chatroomId, 10) || 0, mid = encodeURIComponent(String(req.messageId || '')); if (!mid || !room) return { ok: false, code: 'empty' }; calls = [{ m: 'DELETE', u: 'https://kick.com/api/v2/chatrooms/' + room + '/messages/' + mid }, { m: 'DELETE', u: 'https://kick.com/api/v2/messages/' + mid }]; }
    else if (act === 'clear') { const room = parseInt(req.chatroomId, 10) || 0; calls = [{ m: 'POST', u: v2 + '/chat-commands', b: { command: 'clear', parameter: '' } }, { m: 'POST', u: v2 + '/chat/clear', b: {} }].concat(room ? [{ m: 'POST', u: 'https://kick.com/api/v2/chatrooms/' + room + '/clear', b: {} }] : []); }
    else return { ok: false, code: 'bad' };
    if ((act === 'ban' || act === 'timeout' || act === 'unban') && !user) return { ok: false, code: 'empty' };
    return await webCalls('cmd-' + act, slug, calls);
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});
/* ---- التوقعات (Predictions) + إظهار عدد المشاهدات عبر جلسة موقع Kick (مسارات غير موثّقة: كل محاولة تنسجل في ⓘ التشخيص) ---- */
ipcMain.handle('kick:predict', async (_e, req) => {
  try {
    req = req || {}; if (!(await webToken())) return { ok: false, code: 'webLogin' };
    const slug = myChannelSlug(); if (!slug) return { ok: false, code: 'noChannel' };
    const bases = ['https://kick.com/api/v2/channels/' + slug + '/predictions', 'https://kick.com/api/internal/v1/channels/' + slug + '/predictions'];
    const op = String(req.op || 'get'); let calls;
    if (op === 'create') {
      const title = String(req.title || '').trim().slice(0, 60); const outs = (Array.isArray(req.outcomes) ? req.outcomes : []).map((x) => String(x).trim().slice(0, 25)).filter(Boolean).slice(0, 8);
      if (!title || outs.length < 2) return { ok: false, code: 'empty' };
      const dur = Math.max(30, Math.min(1800, parseInt(req.duration, 10) || 300));
      calls = bases.flatMap((u) => [{ m: 'POST', u, b: { title, outcomes: outs.map((o) => ({ title: o })), duration: dur } }, { m: 'POST', u, b: { title, outcomes: outs, duration: dur } }, { m: 'POST', u, b: { title, outcomes: outs.map((o) => ({ label: o })), duration: dur } }]);
    } else if (op === 'cancel') calls = bases.map((u) => ({ m: 'DELETE', u }));
    else calls = bases.map((u) => ({ m: 'GET', u }));
    return await webCalls('predict-' + op, slug, calls);
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});
ipcMain.handle('kick:viewerCount', async (_e, req) => {
  try {
    const slug = ownSlugNow() || chatSlug(); if (!slug) return { ok: false, code: 'noChannel' };
    const show = !!(req && req.show);
    const v2 = 'https://kick.com/api/v2/channels/' + slug, v1i = 'https://kick.com/api/internal/v1/channels/' + slug;
    const b = { show_viewer_count: show, viewer_count_enabled: show };
    const b2 = { show_viewer_count: show, viewer_count_enabled: show, hide_viewer_count: !show, is_viewer_count_hidden: !show };
    return await webCalls('viewercount', slug, [{ m: 'PATCH', u: v2 + '/settings', b }, { m: 'PUT', u: v2 + '/settings', b }, { m: 'PATCH', u: v1i + '/settings', b }, { m: 'PUT', u: v1i + '/settings', b }, { m: 'PATCH', u: v2 + '/settings', b: b2 }, { m: 'PUT', u: v1i + '/channel/settings', b: b2 }]);
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});

/* ---- إيموجيات القناة (للاختيار السريع في الشات) ---- */
ipcMain.handle('kick:emotes', async (_e, slug) => {
  try {
    slug = parseSlug(slug) || ((kick.user && kick.user.slug) || '').toLowerCase();
    if (!slug) return { ok: false, code: 'noChannel' };
    const url = 'https://kick.com/emotes/' + encodeURIComponent(slug);
    let j = null;
    try {
      const res = await net.fetch(url, { headers: { accept: 'application/json', 'user-agent': WEB_UA, referer: 'https://kick.com/' } });
      if (res.ok) j = await res.json();
    } catch (e) {}
    if (!Array.isArray(j)) { const run = webLock.then(() => webJsonViaWindow(url)); webLock = run.catch(() => {}); j = await run; }
    if (!Array.isArray(j)) return { ok: false, code: 'fail' };
    const groups = [];
    j.forEach(set => {
      const list = Array.isArray(set && set.emotes) ? set.emotes : [];
      if (!list.length) return;
      const nm = (set.user && set.user.username) || set.name || set.slug || 'Kick';
      groups.push({ name: String(nm), emotes: list.slice(0, 250).map(x => ({ id: x.id, name: String(x.name || ''), sub: !!x.subscribers_only })).filter(x => x.id && x.name) });
    });
    return { ok: true, groups };
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});
/* ---------- جسر الشات (احتياطي قوي) ----------
   نفتح صفحة شات Kick الرسمية (popout) في نافذة مخفية، ونلتقط إطارات الـ WebSocket التي تستقبلها الصفحة نفسها
   عبر debugger، ثم نرسل رسائل الشات للواجهة. بهذا الشات يشتغل حتى لو تغيّر رقم الغرفة / اسم القناة / مفتاح Pusher،
   لأننا نقرأ نفس البيانات التي يقرأها موقع Kick. الرسائل المكررة تُتجاهل في الواجهة حسب الـ id (مصدر واحد للرسائل = إطارات Pusher فقط). */
const KICK_EV_RE = /ChatMessage|MessageDeleted|UserBanned|UserUnbanned|FollowersUpdated|ChatroomUpdated|SubscriptionEvent|GiftedSubscriptions|RewardRedeemed|KicksGifted|StreamerIsLive|StopStreamBroadcast|"sender"/;
let quitting = false;
let bridge = { w: null, slug: '', dbg: null, timer: null, stopped: true };
const frameLog = [];                                  // آخر الإطارات الواصلة من صفحة Kick (للتشخيص)
function flog(src, txt) { try { if (/"event":"pusher:(ping|pong)"/.test(txt.slice(0, 60))) return; frameLog.push({ s: src, x: String(txt).replace(/\s+/g, ' ').slice(0, 130) }); if (frameLog.length > 10) frameLog.shift(); } catch (e) {} }
let learnedWs = '';                                   // رابط Pusher الحقيقي الذي تستخدمه صفحة Kick نفسها (يتغير حسب الـ cluster)
const pollState = { slug: '', seen: new Set(), base: false, busy: false, skip: 0, fails: 0, ok: 0 };
function bridgeStop() {
  bridge.stopped = true; clearTimeout(bridge.timer); try { clearInterval(bridge.pollT); } catch (e) {}
  try { if (bridge.dbg && bridge.dbg.isAttached()) bridge.dbg.detach(); } catch (e) {}
  try { if (bridge.w && !bridge.w.isDestroyed()) bridge.w.destroy(); } catch (e) {}
  bridge = { w: null, slug: '', dbg: null, timer: null, stopped: true };
}
/* v1.3.0 (إصلاح الاستقبال): نتعلّم رقم غرفة الشات من اشتراك صفحة Kick الرسمية نفسها (pusher:subscribe → chatrooms.<id>)،
   فلا نعتمد على واجهة kick.com/api (المحجوبة غالباً بـ Cloudflare). نقرأ اسم القناة من حقل channel في الإطار فقط (وليس من نص رسائل المشاهدين). */
function bridgeLearnRoom(txt, sent) {
  try {
    const o = JSON.parse(txt); if (!o || typeof o !== 'object') return;
    let ch = '';
    if (o.subscribe && typeof o.subscribe === 'object') { if (!sent) return; ch = o.subscribe.channel; }      // Centrifugo (Kick الجديد): {"subscribe":{"channel":"chatrooms.<id>.v2"}}
    else if (sent) { if (o.event !== 'pusher:subscribe') return; let d = o.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return; } } ch = d && d.channel; }
    else { if (o.event !== 'pusher_internal:subscription_succeeded') return; ch = o.channel; }
    const m = /^chatrooms[._](\d+)(?:[._]v2)?$/.exec(String(ch || '')); if (!m) return;
    const room = parseInt(m[1], 10), slug = bridge.slug; if (!room || !slug) return;
    kick.web = kick.web || {};
    const cur = kick.web[slug] || {};
    if (cur.chatroomId === room) return;
    kick.web[slug] = Object.assign({}, cur, { chatroomId: room });
    saveKick();
    kwLog('room', 200, 'chatroom ' + room + ' learned from kick.com page');
    send('kick:room', { slug, room });
  } catch (e) {}
}
/* v1.3.0: نلتقط رابط الـ WebSocket الحقيقي من صفحة Kick (cluster + مفتاح Pusher) ونرسله للواجهة، فلا نعتمد على cluster ثابت */
function bridgeLearnWs(u) {
  try {
    const x = new URL(String(u));
    if (x.protocol !== 'wss:' || !/(^|\.)(pusher(app)?|kick)\.com$/i.test(x.hostname) || !/^\/app\/[a-z0-9]+$/i.test(x.pathname)) return;
    const url = x.origin + x.pathname + '?protocol=7&client=js&version=8.4.0&flash=false';
    if (learnedWs === url) return;
    learnedWs = url; kwLog('ws', 200, x.hostname + x.pathname);
    send('kick:wsurl', url);
  } catch (e) {}
}
/* v1.3.0: مصدر ثالث مضمون للرسائل الواردة: نسحب آخر رسائل الشات من واجهة Kick عبر صفحة الجسر نفسها (نفس جلسة Cloudflare)،
   فتصل الرسائل حتى لو تعطل Pusher المباشر أو تغيّر شكل صفحة الشات. المكرر يُتجاهل في الواجهة حسب رقم الرسالة. */
async function bridgePoll(w) {
  const slug = bridge.slug; if (!slug) return;
  const P = pollState;
  if (P.slug !== slug) { P.slug = slug; P.seen = new Set(); P.base = false; P.skip = 0; P.fails = 0; P.ok = 0; }
  if (P.busy) return;
  if (P.skip > 0) { P.skip--; return; }
  try { if (w.isDestroyed() || w.webContents.isLoading()) return; } catch (e) { return; }
  const cached = (kick.web && kick.web[slug]) || {};
  const room = cached.chatroomId || kick.chatroomManual || 0;
  const urls = ['/api/v2/channels/' + slug + '/messages'];
  if (cached.channelId) urls.push('/api/v2/channels/' + cached.channelId + '/messages');
  if (room) urls.push('/api/v2/chatrooms/' + room + '/messages');
  const code = `(async()=>{const out={s:0,m:null,u:'',e:''};for(const u of ${JSON.stringify(urls)}){try{const r=await fetch(u,{headers:{accept:'application/json'},credentials:'include'});out.s=r.status;out.u=u;if(!r.ok)continue;const j=await r.json();const a=j&&j.data&&(Array.isArray(j.data.messages)?j.data.messages:(Array.isArray(j.data)?j.data:null));if(a){out.m=a.slice(-80);return out;}}catch(e){out.e=String(e&&e.message||e).slice(0,60);}}return out;})()`;
  P.busy = true;
  try {
    if (!learnedWs) { try { const us = await w.webContents.executeJavaScript('(window.__seWSurl||[]).slice()'); (us || []).forEach(bridgeLearnWs); } catch (e) {} }
    const r = await Promise.race([w.webContents.executeJavaScript(code), new Promise(res => setTimeout(() => res(null), 9000))]);
    if (!r || !Array.isArray(r.m)) {
      P.fails++; if (P.fails === 1 || P.fails % 10 === 0) kwLog('poll', (r && r.s) || 0, (r && (r.e || r.u)) || 'timeout');
      if (P.fails > 3) P.skip = Math.min(60, P.fails * 3);        // تهدئة لو Kick ترفض (429/403) بدل ما نضغط عليها
      return;
    }
    if (P.fails || !P.ok) kwLog('poll', r.s || 200, 'ok ' + r.m.length + ' ' + r.u);
    P.fails = 0; P.ok++;
    const list = r.m.filter(x => x && x.id != null && x.sender).sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
    for (const m of list) {
      const id = String(m.id); if (P.seen.has(id)) continue;
      P.seen.add(id); if (P.seen.size > 1500) P.seen.delete(P.seen.values().next().value);
      if (!P.base) continue;                                 // أول دفعة = تاريخ قديم، لا نعرضها
      bridge.api = (bridge.api || 0) + 1;
      send('kick:frame', JSON.stringify({ event: 'App\\Events\\ChatMessageEvent', channel: 'poll', data: JSON.stringify(m) }));
    }
    P.base = true;
  } catch (e) { P.fails++; } finally { P.busy = false; }
}
function bridgeStart(slug) {
  slug = String(slug || '').toLowerCase();
  if (!/^[a-z0-9_\-]+$/.test(slug)) return false;
  if (!bridge.stopped && bridge.slug === slug && bridge.w && !bridge.w.isDestroyed()) return true;
  bridgeStop();
  bridge.stopped = false; bridge.slug = slug;
  let w;
  try {
    w = new BrowserWindow({ show: false, width: 520, height: 700, webPreferences: { partition: 'persist:streamextra-kickembed', preload: path.join(__dirname, 'bridge-preload.js'), sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  } catch (e) { bridge.stopped = true; return false; }
  bridge.w = w;
  try { w.webContents.setAudioMuted(true); } catch (e) {}
  w.webContents.setUserAgent(WEB_UA);
  const restart = (ms) => {
    if (bridge.stopped || bridge.w !== w) return;
    clearTimeout(bridge.timer);
    const sl = bridge.slug;
    bridge.timer = setTimeout(() => { if (!bridge.stopped && bridge.slug === sl) { bridgeStop(); bridgeStart(sl); } }, ms);
  };
  try {
    const dbg = w.webContents.debugger; bridge.dbg = dbg;
    dbg.attach('1.3');
    dbg.on('message', (_ev, method, params) => {
      if (method === 'Network.webSocketCreated') { bridgeLearnWs(params && params.url); return; }
      if (method !== 'Network.webSocketFrameReceived' && method !== 'Network.webSocketFrameSent') return;
      const txt = params && params.response && params.response.payloadData;
      if (!txt || typeof txt !== 'string' || txt.length > 200000) return;
      if (method === 'Network.webSocketFrameSent') { bridgeLearnRoom(txt, true); return; }   // اشتراك الصفحة نفسها في غرفة الشات
      if (txt.length < 600) bridgeLearnRoom(txt, false);
      bridge.frames = (bridge.frames || 0) + 1; flog('dbg', txt);
      if (bridge.frames === 1) send('kick:bstate', { s: 'socket' });
      if (!KICK_EV_RE.test(txt)) return;
      bridge.chat = (bridge.chat || 0) + 1;
      send('kick:frame', txt);
    });
    dbg.on('detach', () => restart(5000));
    dbg.sendCommand('Network.enable').catch(() => {});
  } catch (e) { bridgeStop(); return false; }
  w.webContents.on('render-process-gone', () => restart(4000));
  w.webContents.on('did-fail-load', (_e, code) => { send('kick:bstate', { s: 'fail', code }); restart(15000); });
  // قراءة رسائل الشات مباشرة من صفحة الشات (طريقة ثالثة، لا تعتمد على أسماء القنوات)
  const DOM_JS = `(function(){
    if(window.__seInst) return 'ok'; window.__seInst = 1; window.__seQ = [];
    const seen = new Set();
    function take(n){
      try{
        if(!n || n.nodeType !== 1) return;
        const list = n.matches && n.matches('[data-chat-entry]') ? [n] : Array.from(n.querySelectorAll ? n.querySelectorAll('[data-chat-entry]') : []);
        list.forEach(el => {
          const id = el.getAttribute('data-chat-entry'); if(!id || seen.has(id)) return;
          const u = el.querySelector('.chat-entry-username, [class*="chat-entry-username"], [class*="username"]');
          const c = el.querySelector('.chat-entry-content, [class*="chat-entry-content"]');
          if(!u || !c) return;
          let txt = ''; (function walk(n){ n.childNodes.forEach(x => { if(x.nodeType === 3){ txt += x.textContent; } else if(x.nodeType === 1){ const im = x.tagName === 'IMG' ? x : (x.querySelector && x.querySelector('img')); const m = im && /emotes\\/(\\d+)/.exec(im.getAttribute('src') || im.getAttribute('data-src') || ''); if(m && (x === im || !(x.textContent || '').trim())) txt += '[emote:' + m[1] + ':' + (im.getAttribute('alt') || im.getAttribute('title') || 'emote') + ']'; else if(x !== im && x.childNodes.length && x.querySelector('img')) walk(x); else txt += (x.getAttribute('alt') || x.getAttribute('title') || x.textContent || ''); } }); })(c);
          txt = txt.replace(/\\s+/g,' ').trim(); if(!txt) return;
          seen.add(id); if(seen.size > 800) seen.delete(seen.values().next().value);
          window.__seQ.push({ id: id, user: (u.textContent || '').trim(), text: txt, color: u.style && u.style.color || '' });
        });
      }catch(e){}
    }
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(take))).observe(document.documentElement, { childList: true, subtree: true });
    take(document.body);
    // الرسائل الموجودة قبل التركيب لا نرسلها (تاريخ قديم)
    window.__seQ.length = 0;
    return 'ok';
  })()`;
  const domTimer = setInterval(async () => {
    if (bridge.stopped || bridge.w !== w || w.isDestroyed()) return clearInterval(domTimer);
    try {   // الطريقة الأضمن: رسائل WebSocket التي وصلت للصفحة نفسها (منسوخة بواسطة bridge-preload.js)
      const fr = await w.webContents.executeJavaScript('(window.__seWS||[]).splice(0)');
      if (Array.isArray(fr) && fr.length) fr.forEach(txt => { flog('hook', txt); bridge.hook = (bridge.hook || 0) + 1; bridge.chat = (bridge.chat || 0) + 1; send('kick:frame', txt); });
    } catch (e) {}
    try {
      if (w.webContents.isLoading()) return;
      await w.webContents.executeJavaScript(DOM_JS);
      const q = await w.webContents.executeJavaScript('(window.__seQ||[]).splice(0)');
      if (Array.isArray(q) && q.length) { bridge.dom = (bridge.dom || 0) + q.length; q.forEach(m => send('kick:dom', m)); }
    } catch (e) {}
  }, 700);
  const pollTimer = setInterval(() => { if (bridge.stopped || bridge.w !== w || w.isDestroyed()) return clearInterval(pollTimer); bridgePoll(w); }, 2500);
  bridge.pollT = pollTimer;
  w.webContents.on('did-finish-load', () => {
    send('kick:bstate', { s: 'loaded' });
    setTimeout(async () => {
      try { const ttl = await w.webContents.executeJavaScript('document.title + "|" + (document.body ? document.body.innerText.slice(0,200) : "")'); if (/just a moment|attention required|verify you are human/i.test(ttl)) send('kick:bstate', { s: 'cf' }); } catch (e) {}
    }, 4000);
  });
  w.on('close', (ev) => { if (!bridge.stopped && bridge.w === w && !w.isDestroyed() && !quitting) { ev.preventDefault(); w.hide(); } });
  w.on('closed', () => restart(5000));
  w.loadURL('https://kick.com/popout/' + slug + '/chat').catch(() => restart(15000));
  // تحديث دوري كل 30 دقيقة لتجنب انتهاء الجلسة
  bridge.timer = setTimeout(() => { if (!bridge.stopped && bridge.slug === slug) { bridgeStop(); bridgeStart(slug); } }, 30 * 60 * 1000);
  return true;
}
/* ============ v1.3.0: مركز بيانات لوحة Kick (الجلسة / النشاط / المشرف / معلومات البث) ============
   بدل عرض صفحات dashboard.kick.com للمستخدم، نفتحها في نوافذ مخفية بنفس جلسة تسجيل دخولك، ونلتقط:
     1) كل ردود JSON اللي تطلبها الصفحة نفسها من Kick (CDP: Network.responseReceived → getResponseBody) ونرسلها للواجهة لتُعرض بتصميم البرنامج.
     2) إطارات الـ WebSocket (متابعين جدد، اشتراكات، هدايا ...) وتمر على نفس مسار الشات (kick:frame).
   + مسارات الموقع المعروفة (events / bans ...) نجرّبها عبر جسر الموقع، وكل محاولة ورقم HTTP تظهر في ⓘ تشخيص الشات. */
const DASH_PAGES = { session: 'session-info', activity: 'activity-feed', mod: 'mod-actions', info: 'stream-info', channel: 'channel-actions' };
const dash = { wins: {}, log: [], slug: '', tab: '', idle: {} };
function dlog(page, status, note) { dash.log.push({ t: Date.now(), page, status, note: String(note || '').slice(0, 140) }); if (dash.log.length > 40) dash.log.shift(); }
function dashClose(page) {
  const D = dash.wins[page]; if (!D) return;
  delete dash.wins[page]; clearTimeout(D.idleT);
  try { if (D.dbg && D.dbg.isAttached()) D.dbg.detach(); } catch (e) {}
  try { if (D.w && !D.w.isDestroyed()) D.w.destroy(); } catch (e) {}
}
function dashCloseAll() { Object.keys(dash.wins).forEach(dashClose); }
function dashOpen(slug, page) {
  slug = String(slug || '').toLowerCase(); const pg = DASH_PAGES[page] ? page : null;
  if (!pg || !/^[a-z0-9_\-]+$/.test(slug)) return false;
  const cur = dash.wins[pg];
  if (cur && cur.slug === slug && cur.w && !cur.w.isDestroyed()) return true;
  dashClose(pg);
  let w;
  try { w = new BrowserWindow({ show: false, width: 900, height: 800, webPreferences: { partition: KICK_PART, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); }
  catch (e) { return false; }
  try { w.webContents.setAudioMuted(true); } catch (e) {}
  w.webContents.setUserAgent(WEB_UA);
  const D = { w, slug, page: pg, dbg: null, idleT: null, reqs: new Map(), n: 0 };
  dash.wins[pg] = D;
  try {
    const dbg = w.webContents.debugger; D.dbg = dbg; dbg.attach('1.3');
    dbg.on('message', (_ev, method, p) => {
      try {
        if (method === 'Network.responseReceived') {
          const r = p && p.response; if (!r || !/^https:\/\/([a-z0-9-]+\.)?kick\.com\//i.test(r.url || '')) return;
          if (!/json/i.test(r.mimeType || '')) return;
          D.reqs.set(p.requestId, { url: r.url, status: r.status });
        } else if (method === 'Network.loadingFinished') {
          const q = D.reqs.get(p.requestId); if (!q) return; D.reqs.delete(p.requestId);
          dbg.sendCommand('Network.getResponseBody', { requestId: p.requestId }).then((b) => {
            let txt = b && b.body; if (!txt) return; if (b.base64Encoded) txt = Buffer.from(txt, 'base64').toString('utf8');
            if (txt.length > 700000) { dlog(pg, q.status, 'big ' + q.url.replace(/^https:\/\/[^/]+/, '').slice(0, 80)); return; }
            let j; try { j = JSON.parse(txt); } catch (e) { return; }
            D.n++; dlog(pg, q.status, q.url.replace(/^https:\/\/[^/]+/, '').replace(/\?.*$/, '').slice(0, 90));
            send('kick:dash', { page: pg, url: q.url.replace(/^https:\/\/[^/]+/, '').replace(/\?.*$/, ''), status: q.status, j });
          }).catch(() => {});
        } else if (method === 'Network.webSocketFrameReceived') {
          const txt = p && p.response && p.response.payloadData;
          if (!txt || typeof txt !== 'string' || txt.length > 200000 || !KICK_EV_RE.test(txt)) return;
          send('kick:frame', txt);
        } else if (method === 'Network.webSocketCreated') { dlog(pg, 101, 'ws ' + String(p && p.url || '').replace(/^wss:\/\//, '').replace(/\?.*$/, '').slice(0, 80)); }
      } catch (e) {}
    });
    dbg.on('detach', () => { if (dash.wins[pg] === D) delete dash.wins[pg]; });
    dbg.sendCommand('Network.enable').catch(() => {});
  } catch (e) { dashClose(pg); return false; }
  w.webContents.on('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const u = String(w.webContents.getURL() || ''), ttl = String(w.webContents.getTitle() || '');
        const login = /\/(login|signin|sign-in|auth)\b/i.test(u) || /log ?in|sign ?in/i.test(ttl);
        const cf = /just a moment|attention required|verify you are human/i.test(ttl);
        dlog(pg, login ? 401 : (cf ? 403 : 200), (login ? 'login needed ' : (cf ? 'cloudflare ' : 'loaded ')) + u.replace(/^https:\/\//, '').slice(0, 70));
        send('kick:dashState', { page: pg, login, cf, url: u.slice(0, 120) });
      } catch (e) {}
    }, 3500);
  });
  w.webContents.on('did-fail-load', (_e, code) => { dlog(pg, 0, 'load failed ' + code); });
  w.webContents.on('render-process-gone', () => { dashClose(pg); });
  w.on('close', (ev) => { if (!quitting && !w.isDestroyed() && dash.wins[pg] === D) { ev.preventDefault(); w.hide(); } });
  w.loadURL('https://dashboard.kick.com/popout/' + slug + '/' + DASH_PAGES[pg]).catch(() => {});
  // تحديث دوري للصفحة (الجلسة تنتهي، والـ WebSocket ممكن ينقطع)
  D.idleT = setTimeout(() => { if (dash.wins[pg] === D) { dashClose(pg); if (pg === 'activity' || dash.tab === pg) dashOpen(slug, pg); } }, 25 * 60 * 1000);
  return true;
}
ipcMain.handle('kick:dashTab', (_e, req) => {
  try {
    req = req || {}; const slug = String(req.slug || '').toLowerCase(); const tab = String(req.tab || '');
    if (!slug || !/^[a-z0-9_\-]+$/.test(slug)) return { ok: false };
    if (dash.slug && dash.slug !== slug) dashCloseAll();
    dash.slug = slug; dash.tab = tab;
    dashOpen(slug, 'activity');                           // موجز النشاط يبقى شغّال دائماً (متابعين جدد / اشتراكات لحظياً)
    if (DASH_PAGES[tab] && tab !== 'activity') {
      dashOpen(slug, tab);
      clearTimeout(dash.idle[tab]);
    }
    Object.keys(dash.wins).forEach((pg) => {            // الصفحات اللي ما عاد نعرضها تُغلق بعد دقيقة
      if (pg === 'activity' || pg === tab) return;
      clearTimeout(dash.idle[pg]); dash.idle[pg] = setTimeout(() => { if (dash.tab !== pg) dashClose(pg); }, 60000);
    });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});
ipcMain.handle('kick:dashStop', () => { dashCloseAll(); dash.slug = ''; dash.tab = ''; return { ok: true }; });
ipcMain.handle('kick:dashReload', (_e, page) => { const D = dash.wins[page]; try { if (D && D.w && !D.w.isDestroyed()) D.w.webContents.reloadIgnoringCache(); else if (dash.slug) dashOpen(dash.slug, page); } catch (e) {} return { ok: true }; });
/* قراءة مباشرة لمسارات الموقع المعروفة (احتياط لو الصفحة ما رجعت بيانات): الأول اللي ينجح يُحفظ ويُجرَّب أول مرة جاية */
ipcMain.handle('kick:dashProbe', async (_e, req) => {
  try {
    req = req || {}; const slug = String(req.slug || '').toLowerCase(); const kind = String(req.kind || '');
    if (!/^[a-z0-9_\-]+$/.test(slug)) return { ok: false, code: 'noChannel' };
    const cached = (kick.web && kick.web[slug]) || {}; const room = cached.chatroomId || kick.chatroomManual || 0, cid = cached.channelId || 0;
    const K = 'https://kick.com'; const v2 = K + '/api/v2/channels/' + slug, v1i = K + '/api/internal/v1/channels/' + slug;
    let calls = [];
    if (kind === 'activity') {
      calls = [{ m: 'GET', u: v1i + '/events' }, { m: 'GET', u: K + '/api/v2/channels/feed-activities' }, { m: 'GET', u: v2 + '/feed-activities' }, { m: 'GET', u: v2 + '/subscribers/last' }]
        .concat(room ? [{ m: 'GET', u: K + '/api/internal/v1/chatrooms/' + room + '/events' }] : []);
    } else if (kind === 'mod') {
      calls = [{ m: 'GET', u: v1i + '/mod-actions' }, { m: 'GET', u: v1i + '/moderation/actions' }, { m: 'GET', u: v2 + '/bans' }, { m: 'GET', u: K + '/api/v1/channels/' + slug + '/banned-users' }]
        .concat(room ? [{ m: 'GET', u: K + '/api/internal/v1/chatrooms/' + room + '/events' }] : []);
    } else if (kind === 'live') {
      calls = [{ m: 'GET', u: v2 + '/livestream' }, { m: 'GET', u: K + '/api/v1/channels/' + slug + '/livestream' }].concat(cid ? [{ m: 'GET', u: K + '/api/internal/v1/livestreams/' + cid + '/events' }] : []);
    } else if (kind === 'team') {
      calls = [{ m: 'GET', u: v1i + '/community/moderators' }, { m: 'GET', u: v1i + '/community/vips' }];
    } else return { ok: false, code: 'bad' };
    const r = await webCalls('dash-' + kind, slug, calls);
    if (r && r.ok) { dlog(kind, 200, 'probe ok'); return { ok: true, data: r.data }; }
    dlog(kind, (r && r.status) || 0, 'probe ' + ((r && r.code) || 'fail'));
    return r || { ok: false, code: 'fail' };
  } catch (e) { return { ok: false, code: 'fail', error: e.message }; }
});

ipcMain.handle('kick:bridge', (_e, slug) => { if (!slug) { bridgeStop(); return { ok: true, on: false }; } return { ok: bridgeStart(slug), on: true }; });

ipcMain.handle('kick:diag', async () => {
  const slug = (parseSlug(kick.channel) || (kick.user && kick.user.slug) || '').toLowerCase();
  const cached = (kick.web && kick.web[slug]) || {};
  const d = { slug, room: cached.chatroomId || kick.chatroomManual || 0, bridgeOn: !bridge.stopped, frames: bridge.frames || 0, chat: bridge.chat || 0, dom: bridge.dom || 0, api: bridge.api || 0, apiOk: pollState.ok || 0, wsUrl: learnedWs.replace(/\?.*$/, ''), title: '', url: '', loading: false };
  try { if (bridge.w && !bridge.w.isDestroyed()) { d.title = String(bridge.w.webContents.getTitle() || '').slice(0, 80); d.url = String(bridge.w.webContents.getURL() || '').slice(0, 120); d.loading = bridge.w.webContents.isLoading(); } } catch (e) {}
  try {
    if (bridge.w && !bridge.w.isDestroyed()) {
      d.hook = bridge.hook || 0;
      d.probe = await bridge.w.webContents.executeJavaScript('(function(){var e=document.querySelectorAll("[data-chat-entry]");return {entries:e.length,wsAll:window.__seWSn||0,wsUrls:window.__seWSurl||[],hooked:!!window.__seHook,sample:e.length?e[e.length-1].outerHTML.slice(0,700):""};})()');
    }
  } catch (e) { d.probeErr = String(e && e.message || e).slice(0, 120); }
  d.fl = frameLog.slice(-8); d.pageWs = (d.probe && d.probe.wsUrls) || [];
  d.cf = /just a moment|attention required|verify you are human|cloudflare/i.test(d.title);
  d.kw = KW_LOG.slice(-14);
  d.dash = dash.log.slice(-12); d.dashWins = Object.keys(dash.wins);
  return d;
});
ipcMain.handle('kick:bridgeShow', (_e, slug) => {
  slug = String(slug || bridge.slug || '').toLowerCase();
  if (!bridge.w || bridge.w.isDestroyed()) { if (!bridgeStart(slug)) return { ok: false }; }
  try { const w = bridge.w; w.setTitle('Kick - ' + slug); w.show(); w.focus(); return { ok: true }; } catch (e) { return { ok: false }; }
});
ipcMain.handle('kick:chatRestart', () => {
  const sl = bridge.slug; bridgeStop(); kick.web = {}; lastWeb = { slug: '', at: 0 };
  return { ok: true, slug: sl };
});
ipcMain.handle('kick:openUser', (_e, name) => { const s = String(name || '').trim().toLowerCase().replace(/_/g, '-'); if (!/^[a-z0-9][a-z0-9\-]{0,40}$/.test(s)) return { ok: false }; shell.openExternal('https://kick.com/' + s); return { ok: true }; });
ipcMain.handle('kick:openDev', () => { shell.openExternal('https://kick.com/settings/developer'); return { ok: true }; });


/* ---------- Kick داخل البرنامج: شات popout + لوحة التحكم (webview بجلسة دائمة، تسجل دخولك مرة وحدة) ---------- */
const KICK_PART = 'persist:streamextra-kickembed';
const KICK_HOST = /(^|\.)kick\.com$/i;
const LOGIN_HOST = /(^|\.)(kick\.com|challenges\.cloudflare\.com|cloudflare\.com)$/i;   // v1.3.0: لا نوافذ Google/Apple/Discord، الدخول يتم عبر حساب المطوّر فقط
function hostOk(u, re) { try { const x = new URL(u); return x.protocol === 'https:' && re.test(x.hostname); } catch (e) { return false; } }
let kickWins = [];
function openKickWindow(url, w, h) {
  if (!hostOk(url, KICK_HOST)) return;
  const win2 = new BrowserWindow({
    width: w || 1280, height: h || 860, title: 'Kick', backgroundColor: '#0a0a0b', autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: { partition: KICK_PART, contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  kickWins.push(win2); win2.on('closed', () => { kickWins = kickWins.filter(x => x !== win2); });
  attachPopupRules(win2.webContents);
  win2.loadURL(url);
  return win2;
}
function attachPopupRules(wc) {
  wc.setWindowOpenHandler(({ url }) => {
    if (hostOk(url, LOGIN_HOST)) {            // نوافذ تسجيل الدخول (Google / Apple / Discord ...) تفتح داخل البرنامج
      return { action: 'allow', overrideBrowserWindowOptions: { width: 520, height: 720, autoHideMenuBar: true, webPreferences: { partition: KICK_PART, contextIsolation: true, nodeIntegration: false, sandbox: true } } };
    }
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}
/* v1.3.0: كوكيز الدخول في Kick بدون تاريخ انتهاء (كوكي جلسة) كانت تنمسح كل ما تسكّر البرنامج، فكل مرة تحتاج تسجيل دخول من جديد.
   نعيد حفظها بتاريخ انتهاء (60 يوم) أول ما تظهر، ونجدّدها دورياً، فيبقى دخولك محفوظ. */
const KEEP_DAYS = 60;
async function persistKickCookies() {
  try {
    const ses = session.fromPartition(KICK_PART);
    const list = await ses.cookies.get({});
    for (const c of list) {
      if (!c.session || !/(^|\.)kick\.com$/i.test(String(c.domain || '').replace(/^\./, ''))) continue;
      if (/^(__cf|cf_)/i.test(c.name)) continue;
      const host = String(c.domain || 'kick.com').replace(/^\./, '');
      try {
        await ses.cookies.set({ url: 'https://' + host + (c.path || '/'), name: c.name, value: c.value, domain: c.domain, path: c.path || '/', secure: true, httpOnly: !!c.httpOnly, sameSite: c.sameSite || 'unspecified', expirationDate: Math.floor(Date.now() / 1000) + KEEP_DAYS * 86400 });
      } catch (e) {}
    }
    await ses.cookies.flushStore();
  } catch (e) {}
}
function setupKickSession() {
  const ses = session.fromPartition(KICK_PART);
  ses.setUserAgent(WEB_UA);                    // بدون كلمة Electron عشان Cloudflare ما يعترض
  ses.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
  let pt = null;
  ses.cookies.on('changed', (_e, ck, _cause, removed) => {
    if (removed || !ck || !ck.session || !/kick\.com$/i.test(String(ck.domain || ''))) return;
    clearTimeout(pt); pt = setTimeout(persistKickCookies, 800);
  });
  setInterval(persistKickCookies, 10 * 60 * 1000);
}


/* ================= نظام التحديث (GitHub) =================
   - يقرأ app/package.json من GitHub (الفرع main) ويقارن الإصدار.
   - عند الضغط على "تحديث": يشغّل StreamExtra.exe (المشغّل/السيتب) بوضع --update ثم يقفل البرنامج؛
     المشغّل يحمّل الملفات الجديدة إلى مجلد التثبيت الذي اخترته ويفتح البرنامج من جديد. */
const GH_REPO = 'wwadewa17-netizen/StreamExtra';
const GH_BRANCH = 'main';
const APP_PKG = (() => { try { return require('./package.json'); } catch (e) { return {}; } })();
const APP_VERSION = String(APP_PKG.version || '0');
const APP_DATE = String(APP_PKG.releaseDate || '');
const installDirPath = path.dirname(process.execPath);
const launcherPath = path.join(installDirPath, 'StreamExtra.exe');
const isSetupInstall = () => path.basename(process.execPath).toLowerCase() === 'streamextraapp.exe' && fs.existsSync(launcherPath);
function cmpVer(a, b) {
  const pa = String(a).split('.').map(x => parseInt(x, 10) || 0), pb = String(b).split('.').map(x => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d > 0 ? 1 : -1; }
  return 0;
}
// يفحص كل المصادر بالتوازي ويأخذ "أعلى" إصدار موجود: هيك لو مصدر (مثل jsDelivr أو كاش GitHub) رجّع نسخة قديمة، ما بنخدع فيها.
// أول مصدر "commit": بنسأل GitHub API عن آخر commit بالفرع ثم بنقرأ package.json بالـ SHA مباشرة، وهذا بتجاوز أي كاش للفرع.
const UPD_SOURCES = () => [
  { name: 'GitHub', url: `https://raw.githubusercontent.com/${GH_REPO}/${GH_BRANCH}/app/package.json?t=${Date.now()}` },
  { name: 'GitHub API', url: `https://api.github.com/repos/${GH_REPO}/contents/app/package.json?ref=${GH_BRANCH}&t=${Date.now()}`, headers: { Accept: 'application/vnd.github.raw' } },
  { name: 'GitHub commit', sha: true },
  { name: 'jsDelivr', url: `https://cdn.jsdelivr.net/gh/${GH_REPO}@${GH_BRANCH}/app/package.json?t=${Date.now()}` },
  { name: 'jsDelivr-2', url: `https://fastly.jsdelivr.net/gh/${GH_REPO}@${GH_BRANCH}/app/package.json?t=${Date.now()}` }
];
async function fetchText(url, headers) {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await net.fetch(url, { signal: ctl.signal, headers: Object.assign({ 'Cache-Control': 'no-cache', Pragma: 'no-cache', 'User-Agent': 'StreamExtra-Updater' }, headers || {}) });
    clearTimeout(to);
    if (!r.ok) return { err: r.status === 404 ? 'notfound' : 'http' + r.status };
    return { text: await r.text() };
  } catch (e) { clearTimeout(to); return { err: (e && e.name === 'AbortError') ? 'timeout' : 'offline' }; }
}
async function fetchFromSource(src) {
  let lastErr = 'offline';
  for (let attempt = 0; attempt < 2; attempt++) {
    let url = src.url;
    if (src.sha) {
      const c = await fetchText(`https://api.github.com/repos/${GH_REPO}/commits/${GH_BRANCH}?t=${Date.now()}`, { Accept: 'application/vnd.github.sha' });
      if (c.err) { lastErr = c.err; if (c.err === 'notfound') break; continue; }
      const sha = String(c.text || '').trim();
      if (!/^[0-9a-f]{40}$/i.test(sha)) { lastErr = 'badjson'; break; }
      url = `https://raw.githubusercontent.com/${GH_REPO}/${sha}/app/package.json`;
    }
    const r = await fetchText(url, src.headers);
    if (r.err) { lastErr = r.err; if (r.err === 'notfound') break; continue; }
    try {
      const j = JSON.parse(String(r.text).replace(/^\uFEFF/, ''));
      if (j && j.version) return { pkg: j, source: src.name };
      lastErr = 'badjson'; break;
    } catch (e) { lastErr = 'badjson'; break; }
  }
  return { error: lastErr, source: src.name };
}
async function fetchRemotePkg() {
  const results = await Promise.all(UPD_SOURCES().map(fetchFromSource));
  let best = null, lastErr = 'offline';
  for (const r of results) {
    if (r.pkg) { if (!best || cmpVer(r.pkg.version, best.pkg.version) > 0) best = r; }
    else if (r.error && r.error !== 'offline') lastErr = r.error;
  }
  const tried = results.map(r => ({ name: r.source, v: r.pkg ? String(r.pkg.version) : '', err: r.pkg ? '' : (r.error || '') }));
  try { console.log('[update] ' + tried.map(t => t.name + ':' + (t.v || t.err)).join(' | ')); } catch (e) {}
  return best ? Object.assign(best, { tried }) : { error: lastErr, tried };
}
async function checkUpdate() {
  const out = { current: APP_VERSION, currentDate: APP_DATE, latest: APP_VERSION, latestDate: APP_DATE, available: false, canUpdate: isSetupInstall(), checkedAt: Date.now(), notes: null, source: '', repo: GH_REPO, tried: [] };
  const r = await fetchRemotePkg();
  out.tried = r.tried || [];
  if (r.error) { out.error = r.error; return out; }
  const j = r.pkg;
  out.source = r.source;
  out.latest = String(j.version); out.latestDate = String(j.releaseDate || '');
  out.notes = (j.notes && typeof j.notes === 'object') ? j.notes : null;
  out.available = cmpVer(out.latest, out.current) > 0;
  return out;
}
ipcMain.handle('update:check', () => checkUpdate());
// التحديث الصامت: المشغّل (StreamExtra.exe --update) بلا نافذة؛ يحمّل الملفات الجديدة إلى مجلد التثبيت الذي اخترته ويكتب التقدّم في ملف،
// وبرنامجنا يعرض التقدّم، وعند "ready" يقفل نفسه، فيبدّل المشغّل الملفات ويفتح البرنامج من جديد.
const UPD_PROG = path.join(dataDir, 'update-progress.json');
let updPoll = null;
function sendUpd(p) { try { if (win && !win.isDestroyed()) win.webContents.send('update:progress', p); } catch (e) {} }
ipcMain.handle('update:run', () => {
  if (!isSetupInstall()) return { ok: false, error: 'not-installed-by-setup' };
  if (updPoll) return { ok: true, already: true };
  try {
    try { fs.unlinkSync(UPD_PROG); } catch (e) {}
    const child = spawn(launcherPath, ['--update', '--pid', String(process.pid)], { detached: true, stdio: 'ignore', cwd: installDirPath, windowsHide: true });
    child.on('error', () => { sendUpd({ state: 'error', msg: 'launcher' }); clearInterval(updPoll); updPoll = null; });
    child.unref();
    const t0 = Date.now(); let lastPct = 0;
    updPoll = setInterval(() => {
      let j = null;
      try { j = JSON.parse(fs.readFileSync(UPD_PROG, 'utf8').replace(/^\uFEFF/, '')); } catch (e) {}
      if (!j) {
        if (Date.now() - t0 > 45000) { clearInterval(updPoll); updPoll = null; sendUpd({ state: 'error', msg: 'launcher' }); }
        return;
      }
      lastPct = Math.max(lastPct, Number(j.pct) || 0);
      sendUpd({ state: j.state, pct: lastPct, msg: j.msg || '' });
      if (j.state === 'ready') { clearInterval(updPoll); updPoll = null; setTimeout(() => app.quit(), 900); }
      else if (j.state === 'error') { clearInterval(updPoll); updPoll = null; }
    }, 350);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// تفضيلات السيتب (الثيم واللغة) تُطبَّق مرة واحدة عند أول تشغيل
function firstRunQuery() {
  try {
    const f = path.join(dataDir, 'install.json');
    const j = readJsonFile(f);
    if (j && (j.lang || j.theme)) return { initLang: j.lang === 'en' ? 'en' : 'ar', initTheme: j.theme === 'light' ? 'light' : 'dark' };
  } catch (e) {}
  return {};
}

function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1500, height: 900, minWidth: 1100, minHeight: 700,
    title: 'Stream Extra',
    show: false,
    backgroundColor: '#0a0a0b',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });
  // الشات المضمّن (kick.com/popout/<اسم>/chat): نسمح فقط بصفحات kick.com وبنفس جلسة Kick، بدون أي صلاحيات Node
  win.webContents.on('will-attach-webview', (ev, wp, params) => {
    if (!hostOk(String(params.src || ''), KICK_HOST)) { ev.preventDefault(); return; }
    delete wp.preload; delete wp.preloadURL;
    wp.nodeIntegration = false; wp.contextIsolation = true; wp.sandbox = true; params.partition = KICK_PART;
  });
  win.webContents.on('did-attach-webview', (_e, wc) => {
    attachPopupRules(wc);
    wc.on('will-navigate', (e, url) => { if (!hostOk(url, LOGIN_HOST)) e.preventDefault(); });
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.on('closed', () => app.quit());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: firstRunQuery() });
}

const gotSingleLock = app.requestSingleInstanceLock();
if (!gotSingleLock) { app.exit(0); }
else app.on('second-instance', () => { if (win && !win.isDestroyed()) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  if (!gotSingleLock) return;
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === 'media'));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === 'media'); // يعرض أسماء المايكات
  // صوت سطح المكتب: التقاط صوت النظام (loopback) عبر getDisplayMedia
  session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((src) => {
      if (src && src.length) cb({ video: src[0], audio: 'loopback' }); else cb({});
    }).catch(() => cb({}));
  });
  setupKickSession();
  createWindow();
});
app.on('will-quit', () => { try { globalShortcut.unregisterAll(); } catch (e) {} try { if (sysvol.proc) sysvol.proc.kill(); } catch (e) {} });
app.on('before-quit', () => { quitting = true; isLive = false; try { bridgeStop(); } catch (e) {} try { dashCloseAll(); } catch (e) {} try { kwClose(); } catch (e) {} try { if (recJob && recJob.out) recJob.out.end(); } catch (e) {} for (const w of sites.values()) { try { w.destroy(); } catch (e) {} } if (ff) { try { ff.kill(); } catch (e) {} } });
app.on('window-all-closed', () => app.quit());
