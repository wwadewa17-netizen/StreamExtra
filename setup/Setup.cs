// Stream Extra - Setup / Launcher / Updater  (C# 5 compatible: builds with the csc.exe that ships with Windows)
//  * First run  : wizard  (language + theme -> install folder -> download -> opens the app)
//  * Next runs  : this exe just opens the installed app
//  * --update   : (started by the app) waits for the app to close, downloads the new files from GitHub, reopens the app
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

static class Cfg
{
    public const string Repo = "wwadewa17-netizen/StreamExtra";
    public const string Branch = "main";
    public const string AppExe = "StreamExtraApp.exe";      // Electron, renamed
    public const string LauncherExe = "StreamExtra.exe";    // this program, copied into the install folder

    public static string DataDir
    {
        get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "StreamExtra"); }
    }
    public static string File { get { return Path.Combine(DataDir, "install.json"); } }

    public static string Read(string key)
    {
        try
        {
            if (!System.IO.File.Exists(File)) return null;
            string t = System.IO.File.ReadAllText(File, Encoding.UTF8);
            Match m = Regex.Match(t, "\"" + key + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
            return m.Success ? Regex.Unescape(m.Groups[1].Value) : null;
        }
        catch { return null; }
    }
    public static string Esc(string s) { return (s ?? "").Replace("\\", "\\\\").Replace("\"", "\\\""); }
    public static void Write(string dir, string lang, string theme)
    {
        Directory.CreateDirectory(DataDir);
        string j = "{\n  \"installDir\": \"" + Esc(dir) + "\",\n  \"lang\": \"" + Esc(lang) + "\",\n  \"theme\": \"" + Esc(theme) + "\"\n}\n";
        System.IO.File.WriteAllText(File, j, new UTF8Encoding(false));
    }
}

static class Strings
{
    static Dictionary<string, string[]> T = new Dictionary<string, string[]>();   // key -> { ar, en }
    static Strings()
    {
        Add("sub", "استوديو البث المباشر المجاني", "Free live streaming studio");
        Add("title", "Stream Extra - التثبيت", "Stream Extra - Setup");
        Add("p1h", "أهلاً بك في Stream Extra", "Welcome to Stream Extra");
        Add("lang", "اللغة", "Language");
        Add("theme", "المظهر", "Theme");
        Add("ar", "العربية", "Arabic");
        Add("en", "English", "English");
        Add("light", "نهاري ☀", "Light ☀");
        Add("dark", "ليلي ☾", "Dark ☾");
        Add("next", "إكمال", "Continue");
        Add("p2h", "اختر مجلد التحميل", "Choose the install folder");
        Add("p2s", "سيتم تحميل ملفات البرنامج إلى هذا المجلد، وكل التحديثات القادمة ستُحمَّل إليه.", "The app files will be downloaded to this folder, and all future updates will go there too.");
        Add("browse", "استعراض…", "Browse…");
        Add("install", "تحميل", "Download");
        Add("back", "رجوع", "Back");
        Add("pick", "اختر المجلد الذي تريد تحميل البرنامج فيه", "Select the folder to install the app into");
        Add("p3h", "جاري التحميل…", "Downloading…");
        Add("u3h", "جاري تحديث البرنامج…", "Updating the app…");
        Add("s_wait", "بانتظار إغلاق البرنامج…", "Waiting for the app to close…");
        Add("s_electron", "تحميل المحرك (Electron)…", "Downloading the engine (Electron)…");
        Add("s_ffmpeg", "تحميل ffmpeg…", "Downloading ffmpeg…");
        Add("s_ytdlp", "تحميل yt-dlp (اختياري)…", "Downloading yt-dlp (optional)…");
        Add("s_app", "تحميل ملفات البرنامج من GitHub…", "Downloading the app files from GitHub…");
        Add("s_mirror", "GitHub بطيء/محجوب — جاري استخدام خادم بديل…", "GitHub is slow/blocked - using a mirror server…");
        Add("s_embedded", "استخدام ملفات البرنامج المرفقة داخل ملف التثبيت…", "Using the app files bundled inside the setup file…");
        Add("s_unpack", "فك الضغط…", "Extracting…");
        Add("s_finish", "إنهاء التثبيت…", "Finishing…");
        Add("s_done", "تم! جاري فتح البرنامج…", "Done! Opening the app…");
        Add("err", "حدث خطأ", "Something went wrong");
        Add("retry", "إعادة المحاولة", "Retry");
        Add("close", "إغلاق", "Close");
        Add("noinet", "تعذّر التحميل بعد تجربة كل الخوادم. تأكد من اتصال الإنترنت ثم اضغط إعادة المحاولة (لا حاجة لـ VPN في الغالب).", "Download failed after trying every server. Check your connection and press Retry (a VPN is usually not needed).");
        Add("noffmpeg", "تعذّر الحصول على ffmpeg يدعم RTMPS.", "Could not get an ffmpeg build with RTMPS support.");
        Add("badzip", "ملف GitHub لا يحتوي مجلد app. تأكد أن المستودع يحتوي app\\main.js على الفرع main.", "The GitHub archive has no app folder. Make sure the repo has app\\main.js on the main branch.");
    }
    static void Add(string k, string ar, string en) { T[k] = new string[] { ar, en }; }
    public static string Get(string k, string lang)
    {
        string[] v;
        if (!T.TryGetValue(k, out v)) return k;
        return lang == "en" ? v[1] : v[0];
    }
}

class Net
{
    public static void Init()
    {
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)768 | (SecurityProtocolType)192; // TLS 1.2 / 1.1 / 1.0 (3072 = Tls12)
        ServicePointManager.DefaultConnectionLimit = 8;
        ServicePointManager.Expect100Continue = false;
    }

    // Downloads to destFile (via .part). progress: 0..1 (or -1 when size unknown). Returns true on success.
    public static bool Download(string[] urls, string destFile, long minBytes, bool mustBeZip, Action<double> progress, Action<string> log)
    {
        // every URL is tried twice (a short network hiccup should not fail the whole install)
        List<string> all = new List<string>();
        foreach (string u in urls) { all.Add(u); all.Add(u); }
        string lastUrl = null;
        foreach (string url in all)
        {
            if (url == lastUrl) Thread.Sleep(1500);
            lastUrl = url;
            string part = destFile + ".part";
            try
            {
                if (log != null) log("GET " + url);
                try { File.Delete(part); } catch { }
                HttpWebRequest rq = (HttpWebRequest)WebRequest.Create(url);
                rq.UserAgent = "StreamExtra-Setup";
                try { IWebProxy px = WebRequest.GetSystemWebProxy(); px.Credentials = CredentialCache.DefaultCredentials; rq.Proxy = px; } catch { }
                rq.Timeout = 20000;
                rq.ReadWriteTimeout = 30000;
                rq.AllowAutoRedirect = true;
                using (HttpWebResponse rs = (HttpWebResponse)rq.GetResponse())
                {
                    long total = rs.ContentLength;
                    using (Stream ins = rs.GetResponseStream())
                    using (FileStream fs = new FileStream(part, FileMode.Create, FileAccess.Write))
                    {
                        byte[] buf = new byte[81920];
                        long got = 0; int n;
                        while ((n = ins.Read(buf, 0, buf.Length)) > 0)
                        {
                            fs.Write(buf, 0, n);
                            got += n;
                            if (progress != null) progress(total > 0 ? (double)got / total : -1);
                        }
                    }
                }
                if (new FileInfo(part).Length < minBytes) { if (log != null) log("  file too small, skipping"); File.Delete(part); continue; }
                if (mustBeZip && !IsZip(part)) { if (log != null) log("  corrupt zip, skipping"); File.Delete(part); continue; }
                try { File.Delete(destFile); } catch { }
                File.Move(part, destFile);
                return true;
            }
            catch (Exception ex)
            {
                if (log != null) log("  failed: " + ex.Message);
                try { File.Delete(part); } catch { }
            }
        }
        return false;
    }

    public static string GetText(string[] urls, Action<string> log)
    {
        foreach (string url in urls)
        {
            try
            {
                HttpWebRequest rq = (HttpWebRequest)WebRequest.Create(url);
                rq.UserAgent = "StreamExtra-Setup";
                try { IWebProxy px = WebRequest.GetSystemWebProxy(); px.Credentials = CredentialCache.DefaultCredentials; rq.Proxy = px; } catch { }
                rq.Timeout = 15000; rq.ReadWriteTimeout = 15000;
                using (HttpWebResponse rs = (HttpWebResponse)rq.GetResponse())
                using (StreamReader sr = new StreamReader(rs.GetResponseStream(), Encoding.UTF8))
                    return sr.ReadToEnd();
            }
            catch (Exception ex) { if (log != null) log("  text failed: " + url + " - " + ex.Message); }
        }
        return null;
    }

    public static bool IsZip(string path)
    {
        try { using (ZipArchive z = ZipFile.OpenRead(path)) { return z.Entries.Count > 0; } }
        catch { return false; }
    }
}

class Installer
{
    public string Dir, Lang, Theme;
    public Action<string, double> Report;      // (status key or text, overall 0..1)
    public Action<string> Log;
    string tmp;

    static string SafeJoin(string root, string rel)
    {
        string full = Path.GetFullPath(Path.Combine(root, rel));
        string r = Path.GetFullPath(root).TrimEnd('\\') + "\\";
        if (!full.StartsWith(r, StringComparison.OrdinalIgnoreCase)) throw new IOException("bad zip path: " + rel);
        return full;
    }

    static void ExtractAll(string zip, string dest, string stripPrefix)   // stripPrefix: only entries under it, with it removed
    {
        using (ZipArchive z = ZipFile.OpenRead(zip))
        {
            foreach (ZipArchiveEntry e in z.Entries)
            {
                string name = e.FullName.Replace('\\', '/');
                if (stripPrefix != null)
                {
                    if (!name.StartsWith(stripPrefix, StringComparison.Ordinal)) continue;
                    name = name.Substring(stripPrefix.Length);
                }
                if (name.Length == 0) continue;
                string target = SafeJoin(dest, name);
                if (name.EndsWith("/")) { Directory.CreateDirectory(target); continue; }
                Directory.CreateDirectory(Path.GetDirectoryName(target));
                e.ExtractToFile(target, true);
            }
        }
    }

    static bool HasRtmps(string exe)
    {
        try
        {
            ProcessStartInfo si = new ProcessStartInfo(exe, "-hide_banner -protocols");
            si.UseShellExecute = false; si.CreateNoWindow = true;
            si.RedirectStandardOutput = true; si.RedirectStandardError = true;
            using (Process p = Process.Start(si))
            {
                string o = p.StandardOutput.ReadToEnd() + p.StandardError.ReadToEnd();
                p.WaitForExit(15000);
                return o.IndexOf("rtmps", StringComparison.OrdinalIgnoreCase) >= 0;
            }
        }
        catch { return false; }
    }

    double Slice(double a, double b, double f) { return a + (b - a) * (f < 0 ? 0.5 : f); }

    // ---------- full install ----------
    public void Install()
    {
        Directory.CreateDirectory(Dir);
        tmp = Path.Combine(Dir, "_download");
        Directory.CreateDirectory(tmp);
        string res = Path.Combine(Dir, "resources");

        // 1) Electron
        Report("s_electron", 0.0);
        string eZip = null;
        string[] versions = new string[] { "33.4.11", "33.3.2", "32.3.3" };
        foreach (string v in versions)
        {
            string f = "electron-v" + v + "-win32-x64.zip";
            string o = Path.Combine(tmp, f);
            string[] urls = new string[] {
                "https://cdn.npmmirror.com/binaries/electron/v" + v + "/" + f,
                "https://github.com/electron/electron/releases/download/v" + v + "/" + f,
                "https://registry.npmmirror.com/-/binary/electron/v" + v + "/" + f };
            if (Net.Download(urls, o, 50L * 1024 * 1024, true, delegate(double p) { Report("s_electron", Slice(0.0, 0.50, p)); }, Log)) { eZip = o; break; }
        }
        if (eZip == null) throw new Exception(Strings.Get("noinet", Lang));
        Report("s_unpack", 0.50);
        ExtractAll(eZip, Dir, null);
        string ee = Path.Combine(Dir, "electron.exe");
        string ae = Path.Combine(Dir, Cfg.AppExe);
        if (File.Exists(ae)) File.Delete(ae);
        File.Move(ee, ae);
        try { File.Delete(Path.Combine(res, "default_app.asar")); } catch { }
        Directory.CreateDirectory(res);

        // 2) ffmpeg (must support RTMPS)
        Report("s_ffmpeg", 0.52);
        string ffTarget = Path.Combine(res, "ffmpeg.exe");
        bool ffOk = false;
        string gzFile = Path.Combine(tmp, "ffmpeg-win32-x64.gz");
        if (Net.Download(new string[] {
                "https://cdn.npmmirror.com/binaries/ffmpeg-static/b6.0/ffmpeg-win32-x64.gz",
                "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-win32-x64.gz" },
                gzFile, 8L * 1024 * 1024, false, delegate(double p) { Report("s_ffmpeg", Slice(0.52, 0.72, p)); }, Log))
        {
            try
            {
                using (FileStream i = File.OpenRead(gzFile))
                using (GZipStream g = new GZipStream(i, CompressionMode.Decompress))
                using (FileStream o = File.Create(ffTarget)) { g.CopyTo(o); }
                ffOk = HasRtmps(ffTarget);
            }
            catch (Exception ex) { Log("gz extract failed: " + ex.Message); }
        }
        if (!ffOk)
        {
            string[][] zips = new string[][] {
                new string[] { "ffmpeg-release-essentials.zip", "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip", "https://github.com/GyanD/codexffmpeg/releases/download/7.1/ffmpeg-7.1-essentials_build.zip" },
                new string[] { "ffmpeg-master-latest-win64-gpl.zip", "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" } };
            foreach (string[] z in zips)
            {
                string zf = Path.Combine(tmp, z[0]);
                string[] urls = new string[z.Length - 1];
                Array.Copy(z, 1, urls, 0, urls.Length);
                if (!Net.Download(urls, zf, 40L * 1024 * 1024, true, delegate(double p) { Report("s_ffmpeg", Slice(0.52, 0.72, p)); }, Log)) continue;
                try
                {
                    using (ZipArchive za = ZipFile.OpenRead(zf))
                    {
                        foreach (ZipArchiveEntry e in za.Entries)
                        {
                            if (e.FullName.EndsWith("/ffmpeg.exe", StringComparison.OrdinalIgnoreCase) || e.FullName.Equals("ffmpeg.exe", StringComparison.OrdinalIgnoreCase))
                            { e.ExtractToFile(ffTarget, true); break; }
                        }
                    }
                    if (HasRtmps(ffTarget)) { ffOk = true; break; }
                }
                catch (Exception ex) { Log("zip extract failed: " + ex.Message); }
            }
        }
        if (!ffOk) throw new Exception(Strings.Get("noffmpeg", Lang));

        // 3) yt-dlp (optional)
        Report("s_ytdlp", 0.73);
        string yt = Path.Combine(tmp, "yt-dlp.exe");
        if (Net.Download(new string[] { "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" }, yt, 5L * 1024 * 1024, false,
                delegate(double p) { Report("s_ytdlp", Slice(0.73, 0.85, p)); }, Log))
        { try { File.Copy(yt, Path.Combine(res, "yt-dlp.exe"), true); } catch { } }

        // 4) app files from GitHub
        InstallAppFiles(0.86, 0.95);

        // 5) finish: launcher copy, icon, shortcut, config
        Report("s_finish", 0.96);
        string self = Assembly.GetExecutingAssembly().Location;
        string launcher = Path.Combine(Dir, Cfg.LauncherExe);
        if (!string.Equals(Path.GetFullPath(self), Path.GetFullPath(launcher), StringComparison.OrdinalIgnoreCase)) File.Copy(self, launcher, true);
        try { File.Copy(Path.Combine(res, "app", "assets", "icon.ico"), Path.Combine(Dir, "icon.ico"), true); } catch { }
        Cfg.Write(Dir, Lang, Theme);
        MakeShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Stream Extra.lnk"), launcher, Dir);
        MakeShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Stream Extra.lnk"), launcher, Dir);
        try { Directory.Delete(tmp, true); } catch { }
        Report("s_done", 1.0);
    }

    // ---------- update only the app code (silent: no window) ----------
    public void PrepareUpdate()
    {
        tmp = Path.Combine(Dir, "_download");
        Directory.CreateDirectory(tmp);
        PrepareApp(0.02, 0.95);
    }
    public void FinishUpdate()
    {
        SwapApp();
        Cfg.Write(Dir, Lang, Theme);
        try { Directory.Delete(tmp, true); } catch { }
    }

    // Reads the app copy that publish.ps1 embedded inside this exe (used when GitHub is unreachable on first install)
    static bool ExtractEmbedded(string zipOut)
    {
        try
        {
            using (Stream rs = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.zip"))
            {
                if (rs == null) return false;
                using (FileStream fs = File.Create(zipOut)) { rs.CopyTo(fs); }
            }
            return Net.IsZip(zipOut);
        }
        catch { return false; }
    }

    // jsDelivr mirror: works in places where github.com / codeload are blocked. Downloads app\* file by file.
    bool DownloadViaJsDelivr(string appNew, double a, double b)
    {
        try
        {
            string list = Net.GetText(new string[] {
                "https://data.jsdelivr.com/v1/package/gh/" + Cfg.Repo + "@" + Cfg.Branch + "/flat",
                "https://data.jsdelivr.com/v1/packages/gh/" + Cfg.Repo + "@" + Cfg.Branch + "?structure=flat" }, Log);
            if (list == null) return false;
            List<string> files = new List<string>();
            foreach (Match m in Regex.Matches(list, "\"name\"\\s*:\\s*\"(/app/[^\"]+)\""))
                files.Add(Regex.Unescape(m.Groups[1].Value));
            bool hasMain = false;
            foreach (string f in files) if (f == "/app/main.js") hasMain = true;
            if (!hasMain) return false;
            Directory.CreateDirectory(appNew);
            for (int i = 0; i < files.Count; i++)
            {
                string rel = files[i].Substring("/app/".Length);
                string target = SafeJoin(appNew, rel);
                Directory.CreateDirectory(Path.GetDirectoryName(target));
                string[] urls = new string[] {
                    "https://cdn.jsdelivr.net/gh/" + Cfg.Repo + "@" + Cfg.Branch + files[i],
                    "https://fastly.jsdelivr.net/gh/" + Cfg.Repo + "@" + Cfg.Branch + files[i],
                    "https://gcore.jsdelivr.net/gh/" + Cfg.Repo + "@" + Cfg.Branch + files[i],
                    "https://raw.githubusercontent.com/" + Cfg.Repo + "/" + Cfg.Branch + files[i] };
                if (!Net.Download(urls, target, 0, false, null, Log)) return false;
                Report("s_app", a + (b - a) * (i + 1) / files.Count);
            }
            return true;
        }
        catch (Exception ex) { Log("jsdelivr failed: " + ex.Message); return false; }
    }

    static string FindPrefix(string zf)
    {
        using (ZipArchive z = ZipFile.OpenRead(zf))
        {
            foreach (ZipArchiveEntry e in z.Entries)
            {
                string n = e.FullName.Replace('\\', '/');
                if (n.EndsWith("/app/main.js", StringComparison.Ordinal) || n == "app/main.js")
                    return n.Substring(0, n.Length - "main.js".Length);
            }
        }
        return null;
    }

    public bool AllowEmbedded = false;     // true only for the first install (an update must never go back to an older embedded copy)

    void InstallAppFiles(double a, double b) { PrepareApp(a, b); SwapApp(); }

    void PrepareApp(double a, double b)
    {
        Report("s_app", a);
        string res = Path.Combine(Dir, "resources");
        string appNew = Path.Combine(res, "app_new");
        string appDir = Path.Combine(res, "app");
        string appOld = Path.Combine(res, "app_old");
        Directory.CreateDirectory(res);
        try { if (Directory.Exists(appNew)) Directory.Delete(appNew, true); } catch { }
        try { if (Directory.Exists(appOld)) Directory.Delete(appOld, true); } catch { }

        bool got = false;

        // 1) GitHub zip (3 mirrors/hosts)
        string zf = Path.Combine(tmp, "app-main.zip");
        string[] urls = new string[] {
            "https://codeload.github.com/" + Cfg.Repo + "/zip/refs/heads/" + Cfg.Branch,
            "https://github.com/" + Cfg.Repo + "/archive/refs/heads/" + Cfg.Branch + ".zip" };
        if (Net.Download(urls, zf, 10L * 1024, true, delegate(double p) { Report("s_app", Slice(a, b - 0.05, p)); }, Log))
        {
            string prefix = FindPrefix(zf);
            if (prefix != null) { Report("s_unpack", b - 0.04); Directory.CreateDirectory(appNew); ExtractAll(zf, appNew, prefix); got = true; }
        }

        // 2) jsDelivr mirror (GitHub blocked / slow)
        if (!got)
        {
            Report("s_mirror", a);
            try { if (Directory.Exists(appNew)) Directory.Delete(appNew, true); } catch { }
            got = DownloadViaJsDelivr(appNew, a, b - 0.04);
        }

        // 3) copy embedded inside Setup.exe (first install only)
        if (!got && AllowEmbedded)
        {
            Report("s_embedded", b - 0.05);
            try { if (Directory.Exists(appNew)) Directory.Delete(appNew, true); } catch { }
            string ez = Path.Combine(tmp, "app-embedded.zip");
            if (ExtractEmbedded(ez))
            {
                string prefix = FindPrefix(ez);
                Directory.CreateDirectory(appNew);
                ExtractAll(ez, appNew, prefix == null ? "app/" : prefix);
                got = File.Exists(Path.Combine(appNew, "main.js"));
            }
        }
        if (!got) throw new Exception(Strings.Get("noinet", Lang));

    }

    void SwapApp()
    {
        string res = Path.Combine(Dir, "resources");
        string appNew = Path.Combine(res, "app_new");
        string appDir = Path.Combine(res, "app");
        string appOld = Path.Combine(res, "app_old");
        if (!Directory.Exists(appNew)) throw new Exception(Strings.Get("badzip", Lang));
        // keep the user's local Kick app keys (kick-app.json) if they exist
        string oldKick = Path.Combine(appDir, "kick-app.json");
        if (File.Exists(oldKick)) { try { File.Copy(oldKick, Path.Combine(appNew, "kick-app.json"), true); } catch { } }

        // swap folders (rollback on failure)
        if (Directory.Exists(appDir)) Directory.Move(appDir, appOld);
        try { Directory.Move(appNew, appDir); }
        catch
        {
            try { if (Directory.Exists(appOld) && !Directory.Exists(appDir)) Directory.Move(appOld, appDir); } catch { }
            throw;
        }
        try { if (Directory.Exists(appOld)) Directory.Delete(appOld, true); } catch { }
    }

    static void MakeShortcut(string lnkPath, string target, string workDir)
    {
        try
        {
            Type t = Type.GetTypeFromProgID("WScript.Shell");
            object sh = Activator.CreateInstance(t);
            object lnk = t.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, sh, new object[] { lnkPath });
            Type lt = lnk.GetType();
            lt.InvokeMember("TargetPath", BindingFlags.SetProperty, null, lnk, new object[] { target });
            lt.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, lnk, new object[] { workDir });
            lt.InvokeMember("IconLocation", BindingFlags.SetProperty, null, lnk, new object[] { Path.Combine(workDir, "icon.ico") });
            lt.InvokeMember("Save", BindingFlags.InvokeMethod, null, lnk, null);
        }
        catch { }
    }
}

// ======================= UI (same look as the app: dark/light, crimson accent) =======================
class Pal
{
    public bool Light;
    static Color C(int r, int g, int b) { return Color.FromArgb(r, g, b); }
    public Color Bg    { get { return Light ? C(236, 236, 240) : C(9, 9, 11); } }
    public Color Head  { get { return Light ? C(246, 246, 248) : C(24, 24, 27); } }
    public Color Panel { get { return Light ? C(255, 255, 255) : C(18, 18, 20); } }
    public Color Panel3 { get { return Light ? C(238, 238, 242) : C(33, 33, 38); } }
    public Color Line  { get { return Light ? C(222, 222, 229) : C(42, 42, 48); } }
    public Color Line2 { get { return Light ? C(203, 203, 212) : C(56, 56, 64); } }
    public Color Txt   { get { return Light ? C(20, 20, 24) : C(244, 244, 245); } }
    public Color Mut   { get { return Light ? C(93, 93, 105) : C(157, 157, 168); } }
    public Color Ac    { get { return C(161, 20, 44); } }
    public Color AcH   { get { return Light ? C(184, 26, 54) : C(187, 28, 56); } }
    public Color AcD   { get { return C(98, 9, 26); } }
    public Color Err   { get { return Light ? C(168, 20, 44) : C(255, 107, 128); } }
}

static class Gfx
{
    public static GraphicsPath Round(Rectangle r, int rad)
    {
        GraphicsPath p = new GraphicsPath();
        int d = rad * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }
}

class RBtn : Control
{
    public Pal P;
    public bool Primary, OnHead;
    bool hover, down;
    public RBtn(Pal p)
    {
        P = p;
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw | ControlStyles.Selectable, true);
        Cursor = Cursors.Hand;
        Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
    }
    protected override void OnMouseEnter(EventArgs e) { hover = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { hover = false; down = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseDown(MouseEventArgs e) { down = true; Invalidate(); base.OnMouseDown(e); }
    protected override void OnMouseUp(MouseEventArgs e) { down = false; Invalidate(); base.OnMouseUp(e); }
    protected override void OnEnabledChanged(EventArgs e) { Invalidate(); base.OnEnabledChanged(e); }
    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        Color back = OnHead ? P.Head : (Parent != null ? Parent.BackColor : P.Bg);
        g.Clear(back);
        Rectangle r = new Rectangle(0, 0, Width - 1, Height - 1);
        using (GraphicsPath gp = Gfx.Round(r, 10))
        {
            if (Primary)
            {
                Color c1 = hover ? P.AcH : P.Ac, c2 = down ? P.AcD : (hover ? P.Ac : P.AcD);
                using (LinearGradientBrush lg = new LinearGradientBrush(r, c1, c2, 90f)) g.FillPath(lg, gp);
            }
            else
            {
                using (SolidBrush b = new SolidBrush(hover ? P.Panel3 : P.Panel)) g.FillPath(b, gp);
                using (Pen pen = new Pen(hover ? P.Line2 : P.Line, 1f)) g.DrawPath(pen, gp);
            }
        }
        Color fg = Primary ? Color.White : P.Txt;
        if (!Enabled) fg = Color.FromArgb(120, fg);
        TextFormatFlags f = TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine | TextFormatFlags.NoPrefix;
        if (RightToLeft == RightToLeft.Yes) f |= TextFormatFlags.RightToLeft;
        TextRenderer.DrawText(g, Text, Font, r, fg, f);
    }
}

class RBar : Control
{
    public Pal P;
    int val;
    public RBar(Pal p) { P = p; SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true); }
    public int Value { get { return val; } set { val = Math.Max(0, Math.Min(1000, value)); Invalidate(); } }
    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.Clear(Parent != null ? Parent.BackColor : P.Bg);
        Rectangle r = new Rectangle(0, 0, Width - 1, Height - 1);
        int rad = Height / 2;
        using (GraphicsPath gp = Gfx.Round(r, rad)) using (SolidBrush b = new SolidBrush(P.Panel3)) g.FillPath(b, gp);
        int w = (int)((Width - 1) * (val / 1000.0));
        if (w < Height) w = val > 0 ? Height : 0;
        if (w > 0)
        {
            Rectangle fr = new Rectangle(0, 0, w, Height - 1);
            bool rtl = RightToLeft == RightToLeft.Yes;
            if (rtl) fr = new Rectangle(Width - 1 - w, 0, w, Height - 1);
            using (GraphicsPath gp = Gfx.Round(fr, rad)) using (LinearGradientBrush lg = new LinearGradientBrush(fr, P.AcH, P.AcD, 0f)) g.FillPath(lg, gp);
        }
    }
}

class MainForm : Form
{
    [DllImport("user32.dll")] static extern bool ReleaseCapture();
    [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr h, int msg, int w, int l);

    const int W = 600, H = 440, HEAD = 84;
    string lang, theme, dir;
    Pal pal = new Pal();
    Image logo;
    Panel p1, p2, p3;
    Label l1h, lLang, lTheme, l2h, l2s, l3h, status, pctLbl, errLbl;
    RBtn rAr, rEn, rLight, rDark, bNext, bBrowse, bInstall, bBack, bRetry, bClose, bX;
    TextBox tbDir;
    RBar bar;
    Thread worker;
    bool finished;
    Dictionary<Control, int[]> place = new Dictionary<Control, int[]>();   // control -> { x, w } (LTR position inside its panel)

    public MainForm(string initLang, string initTheme, string installDir)
    {
        lang = initLang == "en" ? "en" : "ar";
        theme = initTheme == "light" ? "light" : "dark";
        dir = installDir;
        pal.Light = theme == "light";

        FormBorderStyle = FormBorderStyle.None;
        ClientSize = new Size(W, H);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 10f);
        DoubleBuffered = true;
        try { Icon = Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location); } catch { }
        try
        {
            using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("logo.png"))
            {
                if (s != null) { MemoryStream ms = new MemoryStream(); s.CopyTo(ms); ms.Position = 0; logo = Image.FromStream(ms); }
            }
        }
        catch { }

        // close button (top corner)
        bX = new RBtn(pal); bX.Text = "✕"; bX.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
        bX.SetBounds(0, 26, 32, 32); bX.OnHead = true;
        bX.Click += delegate { Environment.Exit(1); };
        Controls.Add(bX);

        // page 1: language + theme
        p1 = NewPanel(); l1h = Head(p1);
        lLang = Lbl(p1, 36, 58, 526, 24); lTheme = Lbl(p1, 36, 150, 526, 24);
        rAr = Chip(p1, 36, 86); rEn = Chip(p1, 206, 86);
        rLight = Chip(p1, 36, 178); rDark = Chip(p1, 206, 178);
        bNext = Btn(p1, 36, 276, 526, 46, true);
        rAr.Click += delegate { lang = "ar"; Apply(); };
        rEn.Click += delegate { lang = "en"; Apply(); };
        rLight.Click += delegate { theme = "light"; Apply(); };
        rDark.Click += delegate { theme = "dark"; Apply(); };
        bNext.Click += delegate { ShowPage(p2); };

        // page 2: folder
        p2 = NewPanel(); l2h = Head(p2); l2s = Lbl(p2, 36, 58, 526, 48);
        tbDir = new TextBox(); tbDir.Font = new Font("Segoe UI", 10.5f); tbDir.BorderStyle = BorderStyle.FixedSingle; tbDir.Text = dir;
        tbDir.SetBounds(36, 122, 408, 30); p2.Controls.Add(tbDir); place[tbDir] = new int[] { 36, 408 };
        bBrowse = Btn(p2, 454, 118, 108, 36, false);
        bBack = Btn(p2, 36, 276, 150, 46, false);
        bInstall = Btn(p2, 196, 276, 366, 46, true);
        bBrowse.Click += delegate
        {
            using (FolderBrowserDialog fb = new FolderBrowserDialog())
            {
                fb.Description = Strings.Get("pick", lang);
                if (Directory.Exists(tbDir.Text)) fb.SelectedPath = tbDir.Text;
                if (fb.ShowDialog(this) == DialogResult.OK) tbDir.Text = fb.SelectedPath;
            }
        };
        bBack.Click += delegate { ShowPage(p1); };
        bInstall.Click += delegate { StartWork(); };

        // page 3: progress
        p3 = NewPanel(); l3h = Head(p3);
        status = Lbl(p3, 36, 78, 526, 28);
        bar = new RBar(pal); bar.SetBounds(36, 116, 526, 12); p3.Controls.Add(bar); place[bar] = new int[] { 36, 526 };
        pctLbl = Lbl(p3, 36, 136, 526, 24);
        errLbl = Lbl(p3, 36, 176, 526, 90);
        bRetry = Btn(p3, 36, 276, 256, 46, true); bClose = Btn(p3, 306, 276, 256, 46, false);
        bRetry.Visible = false; bClose.Visible = false;
        bRetry.Click += delegate { bRetry.Visible = false; bClose.Visible = false; errLbl.Text = ""; StartWork(); };
        bClose.Click += delegate { Environment.Exit(1); };

        Controls.Add(p1); Controls.Add(p2); Controls.Add(p3);
        Apply();
        FormClosing += delegate(object s, FormClosingEventArgs e) { if (worker != null && worker.IsAlive && !finished) Environment.Exit(1); };
        MouseDown += delegate(object s, MouseEventArgs e) { if (e.Button == MouseButtons.Left && e.Y < HEAD) { ReleaseCapture(); SendMessage(Handle, 0xA1, 2, 0); } };
        ShowPage(p1);
    }

    Panel NewPanel() { Panel p = new Panel(); p.SetBounds(1, HEAD + 1, W - 2, H - HEAD - 2); p.Visible = false; return p; }
    Label Head(Panel p)
    {
        Label l = new Label(); l.AutoSize = false; l.SetBounds(36, 8, 526, 40);
        l.Font = new Font("Segoe UI", 17f, FontStyle.Bold); p.Controls.Add(l); place[l] = new int[] { 36, 526 }; return l;
    }
    Label Lbl(Panel p, int x, int y, int w, int h)
    {
        Label l = new Label(); l.AutoSize = false; l.SetBounds(x, y, w, h); p.Controls.Add(l); place[l] = new int[] { x, w }; return l;
    }
    RBtn Chip(Panel p, int x, int y)
    {
        RBtn b = new RBtn(pal); b.SetBounds(x, y, 160, 46); b.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
        p.Controls.Add(b); place[b] = new int[] { x, 160 }; return b;
    }
    RBtn Btn(Panel p, int x, int y, int w, int h, bool primary)
    {
        RBtn b = new RBtn(pal); b.SetBounds(x, y, w, h); b.Primary = primary; p.Controls.Add(b); place[b] = new int[] { x, w }; return b;
    }

    void Apply()
    {
        bool rtl = lang == "ar";
        pal.Light = theme == "light";
        RightToLeft rt = rtl ? RightToLeft.Yes : RightToLeft.No;
        BackColor = pal.Bg; ForeColor = pal.Txt;
        foreach (Panel p in new Panel[] { p1, p2, p3 }) { p.BackColor = pal.Bg; p.ForeColor = pal.Txt; p.RightToLeft = rt; }
        // mirror the layout for Arabic
        int pw = W - 2;
        foreach (KeyValuePair<Control, int[]> kv in place) kv.Key.Left = rtl ? pw - kv.Value[0] - kv.Value[1] : kv.Value[0];
        bX.Left = rtl ? 18 : W - 18 - bX.Width;
        bX.RightToLeft = rt;
        foreach (RBtn b in new RBtn[] { rAr, rEn, rLight, rDark, bNext, bBrowse, bInstall, bBack, bRetry, bClose, bX }) b.RightToLeft = rt;

        Text = Strings.Get("title", lang);
        l1h.Text = Strings.Get("p1h", lang); lLang.Text = Strings.Get("lang", lang); lTheme.Text = Strings.Get("theme", lang);
        rAr.Text = Strings.Get("ar", lang); rEn.Text = Strings.Get("en", lang); rLight.Text = Strings.Get("light", lang); rDark.Text = Strings.Get("dark", lang);
        rAr.Primary = lang == "ar"; rEn.Primary = lang == "en"; rLight.Primary = theme == "light"; rDark.Primary = theme == "dark";
        bNext.Text = Strings.Get("next", lang);
        l2h.Text = Strings.Get("p2h", lang); l2s.Text = Strings.Get("p2s", lang);
        bBrowse.Text = Strings.Get("browse", lang); bBack.Text = Strings.Get("back", lang); bInstall.Text = Strings.Get("install", lang);
        l3h.Text = Strings.Get("p3h", lang);
        bRetry.Text = Strings.Get("retry", lang); bClose.Text = Strings.Get("close", lang);

        foreach (Label l in new Label[] { l1h, l2h, l3h }) l.ForeColor = pal.Txt;
        foreach (Label l in new Label[] { lLang, lTheme, l2s, pctLbl }) l.ForeColor = pal.Mut;
        status.ForeColor = pal.Txt; status.Font = new Font("Segoe UI", 11f, FontStyle.Bold);
        errLbl.ForeColor = pal.Err;
        tbDir.BackColor = pal.Panel; tbDir.ForeColor = pal.Txt; tbDir.TextAlign = HorizontalAlignment.Left; tbDir.RightToLeft = RightToLeft.No;
        bar.RightToLeft = rt;
        foreach (Control c in Controls) c.Invalidate();
        foreach (Panel p in new Panel[] { p1, p2, p3 }) foreach (Control c in p.Controls) c.Invalidate();
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.Clear(pal.Bg);
        using (SolidBrush b = new SolidBrush(pal.Head)) g.FillRectangle(b, 0, 0, W, HEAD);
        using (LinearGradientBrush lg = new LinearGradientBrush(new Rectangle(0, 0, W, 4), pal.AcD, pal.AcH, 0f)) g.FillRectangle(lg, 0, 0, W, 4);
        using (Pen pen = new Pen(pal.Line)) g.DrawLine(pen, 0, HEAD, W, HEAD);
        bool rtl = lang == "ar";
        int lx = rtl ? W - 28 - 44 : 28;
        if (logo != null) g.DrawImage(logo, new Rectangle(lx, 24, 44, 44));
        else using (SolidBrush b = new SolidBrush(pal.Ac)) g.FillEllipse(b, lx, 24, 44, 44);
        int tw = 300, tx = rtl ? lx - 14 - tw : lx + 44 + 14;
        TextFormatFlags f = TextFormatFlags.NoPrefix | TextFormatFlags.SingleLine | (rtl ? (TextFormatFlags.Right | TextFormatFlags.RightToLeft) : TextFormatFlags.Left);
        using (Font f1 = new Font("Segoe UI", 15f, FontStyle.Bold)) TextRenderer.DrawText(g, "Stream Extra", f1, new Rectangle(tx, 27, tw, 28), pal.Txt, f);
        using (Font f2 = new Font("Segoe UI", 9f)) TextRenderer.DrawText(g, Strings.Get("sub", lang), f2, new Rectangle(tx, 53, tw, 18), pal.Mut, f);
        using (Pen pen = new Pen(pal.Line2)) g.DrawRectangle(pen, 0, 0, W - 1, H - 1);
    }

    void ShowPage(Panel p) { p1.Visible = p == p1; p2.Visible = p == p2; p3.Visible = p == p3; }

    void SetStatus(string key, double frac)
    {
        BeginInvoke(new MethodInvoker(delegate
        {
            status.Text = Strings.Get(key, lang);
            int v = (int)(frac * 1000); if (v < 0) v = 0; if (v > 1000) v = 1000;
            bar.Value = v;
            pctLbl.Text = (v / 10) + "%";
        }));
    }

    void Fail(string msg)
    {
        BeginInvoke(new MethodInvoker(delegate
        {
            errLbl.Text = Strings.Get("err", lang) + ":\n" + msg;
            bRetry.Visible = true; bClose.Visible = true;
        }));
    }

    void StartWork()
    {
        string chosen = tbDir.Text.Trim();
        if (chosen.Length == 0) return;
        try
        {
            chosen = Path.GetFullPath(chosen);
            // if the folder already has other files (and is not a previous install), install into a "StreamExtra" subfolder
            if (Directory.Exists(chosen) && Directory.GetFileSystemEntries(chosen).Length > 0 && !File.Exists(Path.Combine(chosen, Cfg.AppExe)))
                chosen = Path.Combine(chosen, "StreamExtra");
        }
        catch { MessageBox.Show(this, "Invalid folder", Text); return; }
        dir = chosen;
        ShowPage(p3);
        bar.Value = 0; status.Text = ""; pctLbl.Text = "";
        worker = new Thread(delegate()
        {
            try
            {
                Installer ins = new Installer();
                ins.AllowEmbedded = true;
                ins.Dir = dir; ins.Lang = lang; ins.Theme = theme;
                ins.Log = delegate(string s) { };
                ins.Report = delegate(string k, double f) { SetStatus(k, f); };
                ins.Install();
                finished = true;
                Thread.Sleep(600);
                Launcher.StartApp(dir);
                Environment.Exit(0);
            }
            catch (Exception ex) { Fail(ex.Message); }
        });
        worker.IsBackground = true;
        worker.Start();
    }
}

static class Launcher
{
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

    public static void StartApp(string dir)
    {
        string exe = Path.Combine(dir, Cfg.AppExe);
        ProcessStartInfo si = new ProcessStartInfo(exe);
        si.WorkingDirectory = dir;
        si.UseShellExecute = false;
        Process.Start(si);
    }

    public static void WaitForAppExit(int pid, string dir)
    {
        if (pid > 0)
        {
            try { Process p = Process.GetProcessById(pid); p.WaitForExit(30000); } catch { }
        }
        // make sure no leftover process of this install keeps files locked
        string full = Path.GetFullPath(dir).TrimEnd('\\') + "\\";
        foreach (string name in new string[] { "StreamExtraApp", "ffmpeg", "yt-dlp" })
        {
            foreach (Process p in Process.GetProcessesByName(name))
            {
                try
                {
                    string path = p.MainModule.FileName;
                    if (path != null && path.StartsWith(full, StringComparison.OrdinalIgnoreCase)) { p.Kill(); p.WaitForExit(5000); }
                }
                catch { }
            }
        }
        Thread.Sleep(500);
    }

    // progress file read by the app (main.js) so the app itself shows the download progress
    static void WriteProg(string state, double pct, string msg)
    {
        try
        {
            Directory.CreateDirectory(Cfg.DataDir);
            string j = "{\"state\":\"" + state + "\",\"pct\":" + pct.ToString("0.000", CultureInfo.InvariantCulture) + ",\"msg\":\"" + Cfg.Esc(msg ?? "") + "\"}";
            System.IO.File.WriteAllText(Path.Combine(Cfg.DataDir, "update-progress.json"), j, new UTF8Encoding(false));
        }
        catch { }
    }

    // --update (started by the app): NO window. 1) download + unpack into app_new while the app is still open
    // 2) tell the app "ready" (it closes itself) 3) swap the folders 4) re-open the app. Files go to the folder the user chose.
    static void RunSilentUpdate(string dir, string lang, string theme, int pid)
    {
        bool exited = false;
        try
        {
            WriteProg("downloading", 0, "");
            Installer ins = new Installer();
            ins.Dir = dir; ins.Lang = lang; ins.Theme = theme;
            ins.Log = delegate(string s) { };
            ins.Report = delegate(string k, double f) { WriteProg("downloading", f, k); };
            ins.PrepareUpdate();
            WriteProg("ready", 1, "");
            WaitForAppExit(pid, dir);
            exited = true;
            ins.FinishUpdate();
            StartApp(dir);
            WriteProg("done", 1, "");
        }
        catch (Exception ex)
        {
            WriteProg("error", 0, ex.Message);
            if (exited) { try { StartApp(dir); } catch { } }     // never leave the user without the app
        }
    }

    [STAThread]
    static void Main(string[] args)
    {
        try { SetProcessDPIAware(); } catch { }
        Net.Init();

        bool update = false; int pid = 0;
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--update") update = true;
            else if (args[i] == "--pid" && i + 1 < args.Length) int.TryParse(args[i + 1], out pid);
        }

        string dir = Cfg.Read("installDir");
        string lang = Cfg.Read("lang") ?? "ar";
        string theme = Cfg.Read("theme") ?? "dark";
        bool installed = !string.IsNullOrEmpty(dir) && File.Exists(Path.Combine(dir, Cfg.AppExe));

        if (update && installed) { RunSilentUpdate(dir, lang, theme, pid); return; }
        if (installed)
        {
            // this file "became" the app: just open it
            try { StartApp(dir); } catch (Exception ex) { MessageBox.Show(ex.Message, "Stream Extra"); }
            return;
        }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        string def = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "StreamExtra");
        Application.Run(new MainForm(lang, theme, def));
    }
}
