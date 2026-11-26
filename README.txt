Stream Extra
============

A) For users  (Setup file)
--------------------------
1) Run  StreamExtra-Setup.exe
2) Pick language (Arabic / English) and theme (Light / Dark) -> Continue
3) Pick the folder to install into -> Download
   It downloads the engine + the app files from GitHub, then opens the app.
4) From now on, this same exe just opens the app (also a Desktop / Start-menu shortcut is created).
5) When a new version is published, the app shows an "Update" page (Settings -> Updates). Click Update now:
   the new files download into the folder you chose (progress is shown inside the app), the app closes by itself and re-opens. Nothing else.

B) For you (the developer) - 3 easy steps
-----------------------------------------
1) Double-click  Publish_Update.cmd  and press Enter.
   (It shows the version on GitHub now and the version in this folder, and suggests the right number.
    It builds the Setup file and opens the folder GitHub_Upload + your GitHub upload page.)
2) In the folder GitHub_Upload press Ctrl+A (select everything INSIDE it), drag it into the GitHub page,
   wait for the upload to finish, then press the green "Commit changes".
   IMPORTANT: drag the CONTENTS, not the folder GitHub_Upload itself. The folder "app" must sit at the TOP of the repo.
3) Go back to the black window and press Enter: it checks GitHub by itself and says [OK] when users can get the update.
   You can run  Check_GitHub.cmd  any time to test again.
Everyone who opens the app gets the "Update now" screen (also at Settings -> Updates -> Check for updates). No Git needed.

What must be on GitHub: public repo, branch main, and at the top of the repo:  app\  (with app\package.json),  setup\,  StreamExtra-Setup.exe
Nothing else (no Release, no Tag).  The update check reads only  app/package.json  -> its "version" must be HIGHER than the user's.
Quick manual test: open this link in a browser, it must show the new version:
  https://raw.githubusercontent.com/wwadewa17-netizen/StreamExtra/main/app/package.json

First time only: create a PUBLIC repo on GitHub named StreamExtra (branch: main).
Repo used by Setup + updater:  wwadewa17-netizen/StreamExtra  (main)
  -> if your account/repo is different, change it in setup\Setup.cs (Cfg.Repo) and app\main.js (GH_REPO).

In the app:  Settings -> Updates  shows your version, its date, the latest version + its release date,
when it last checked, a "Check for updates" button and an "Update now" button.

Download safety (v1.2): if GitHub is blocked/slow, Setup automatically tries a mirror (jsDelivr) and finally uses a copy of the app
embedded INSIDE StreamExtra-Setup.exe, so the last step no longer fails with the "internet / VPN" message.
The update check also tries several servers (GitHub, GitHub API, jsDelivr). Release notes: add them in app\package.json under "notes" (ar / en).

Updates only replace the  app  folder (small). Electron/ffmpeg are downloaded once at install.
Your Kick keys file (kick-app.json) and your settings in %AppData%\StreamExtra are kept.
Note: GitHub's web upload adds/overwrites files but does not delete files you removed locally.

C) Old local build (no updates)
-------------------------------
Build_StreamExtra.cmd still builds a portable "StreamExtra" folder for testing. The Update page is disabled there.

Your settings and Kick link are stored in %AppData%\StreamExtra (+ a backup in %LocalAppData%\StreamExtra-Backup).

v1.5
----
- Dock boxes (Scenes, Sources, Mixer, Session, Chat) are movable (drag title bar) and resizable (drag edge); layout saved; reset button in the preview bar.
- Restored Activity / Moderation / Channel / Info menus in the Kick panel (from v1.4). Session stays its own dock.

v1.4
----
- Fix: stream could not start ("IO error: End of file"). The stream URL is now corrected automatically (:443/app added, key split if pasted inside the URL) + clearer error message.
- Simpler sign-in: one "Sign in" button; Google/Apple fallback shows only when needed; developer app moved to optional Advanced.

v1.3
----
- New logo everywhere (app header, settings, window icon, desktop shortcut, installer); black edges removed, transparent rounded corners.

v1.1
----
First release.
