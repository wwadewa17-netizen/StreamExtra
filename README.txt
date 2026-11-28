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

v2.6
----
- Version 2.6.
- The "Master" strip was REMOVED from the audio mixer (and the master speaker button). Every source has two bars only: "Stream" (what viewers hear) and "Me" (your headphones), saved per scene. Both bars now go up to 200% (desktop audio "Me" = Windows volume, 0-100).
- New test system on every source (mixer row, Properties page and the audio settings window): two buttons.
    * "Test in my headphones": you hear the source at the "Me" level only. Meter = Me level.
    * "Test on stream": you hear what viewers will hear, at the "Stream" level. Meter = Stream level.
  Both are LOCAL: nothing is sent to the real stream (file sources are silenced on the real stream path while testing). A big meter with a dB readout and a red warning when the level clips. Desktop-audio test is blocked while live; other tests are blocked while live if desktop audio is visible (it would re-capture them).
- Peak limiter on the stream path and on your headphones path (no more crackling when you boost).
- YouTube links in "Built-in audio": yt-dlp output is cleaned with ffmpeg into a standard m4a (AAC) and checked to be playable BEFORE the item is added (other MIME types are tried automatically). The sound linked to an image is preloaded, so pressing the play button of the image shows the image and starts the sound at once. If a file cannot play you now get a clear message instead of silence.

v2.5
----
- Version 2.5.
- The ALERTS system was removed completely (alerts window, bell button, alert drawing on the stream, app/renderer/alerts.js and logodata.js).
  The Activity page, follower names and quick buttons (Open profile / Copy name) stay; only the "Replay alert" button is gone.
- Desktop audio: "Test" button plays a built-in sample clip and the meter shows how loud it will be on the STREAM (from the Stream bar + Master).
  It is a separate path: it never reaches the real stream, and it is blocked while you are live.
- Desktop audio: new "Me" bar = your Windows volume (set through a small PowerShell helper, Windows only). Windows loopback capture is taken
  BEFORE the Windows volume, so lowering it lowers only what you hear; the stream keeps the level of the Stream bar. If the Me bar is not shown, the helper could not start.
- Microphone: Test plays your voice at the stream level (meter = level for viewers); Stream + Me bars are also in the Properties page.
- Built-in audio: desktop audio no longer silences your own listening (before, the mixer stopped playing on your speakers whenever desktop audio was on).
  Note: if viewers hear an added sound twice, desktop audio is re-capturing your speakers -> press the speaker button in Master.
- New button "Add sound to this item" (image / video / text ... properties): picks a sound file, links it to the item. Press the play button in the mixer to show the item with the sound.

v2.4 (additions)
----
- Kick settings: the "Channel" box was REMOVED. The channel is taken automatically from the Kick account you log in with.
- Activity page: follower names fixed. Kick often sends the follow WITHOUT a name; now the name is fetched from the Kick panel within a few seconds
  ("Fetching name..." shows meanwhile), merged into the same row (no duplicate rows) and the alert shows the real name (waits max 8 s, then shows without name).
- Activity rows: quick buttons on hover -> Open profile on Kick, Copy name, Replay alert.

v2.4
----
- NEW default follow alert "Stream Extra": animated site LOGO (pulsing glow + orbiting rings) -> "أهلاً وسهلاً" / "Welcome" -> account name. Red like the site. Arabic + English (Templates tab -> Template language).
- NEW "Full-screen clip" mode (Media tab or Build tab -> Video): the video (e.g. an anime clip) plays full screen with its own sound. N seconds before it ends a box with the follower name appears
  (N is adjustable; the box is the same template - remove the logo/welcome in the Build tab to keep the name only). Display time is set to "Auto" automatically.
- Song: added from Media tab or Build tab; plays with the alert on every new follower (together with the video if you add both).
- Build tab: new add buttons -> Site logo, Video, Song. Logo animation: Orbit / Pulse / Float / None.
- Long follower names shrink to fit instead of being cut. Welcome + name appear one after the other.
- Old v2.3 alert settings are converted once to the new design (your image, video, song and custom text are kept).
- New file: app/renderer/logodata.js (the logo embedded so the stream canvas is never blocked).

v2.3
----
- NEW LAYOUT: Kick chat = LEFT column (full height) | preview in the MIDDLE with Scenes - Sources - Mixer under it | Controls + Session = RIGHT column.
  Drag the thin lines between the columns to resize them (double-click = default). The reset button (preview bar) restores everything.
- Follow alert, new "Build" tab (first tab): "Blank template" button, then ADD buttons: Image, Welcome message, Account name, Background.
  Each element is dragged in the preview and resized with the mouse wheel. "Zoom preview" button for fine editing.
- Fonts: Arabic fonts are listed with ARABIC names and each one is shown in its own look (only fonts installed on the PC are listed).
- FIX: the alert now shows for every new Kick follower. Before, if the follow reached the app first from the Kick dashboard page, the real-time event was
  treated as a duplicate and no alert appeared. Follow events without a name also work now. Same person = one alert per 20 minutes.

v2.2
----
- Follow alert: only 4 TEMPLATES now (Kick Classic, Neon, Glass, Gold VIP). Each one works in Arabic AND English:
  Templates tab -> "Template language" (عربي / English) changes the default welcome text and the font list.
- 10+ fonts per language (Arabic list / English list). Each font is previewed in its own look; only fonts installed on the PC are listed.
- TEMPLATE BACKGROUND: two colors (gradient) + opacity, or a background IMAGE (with dimming). Applying a template restores its own background.
- WELCOME MESSAGE and ACCOUNT NAME: size, color, font, weight and position. In the preview: drag to move, mouse wheel to resize.
- The card is now in the CENTER of the screen by default. Drag the card in the preview (snaps to center) or use General tab -> "Template position" (X / Y + Center button).
- Old v2.1 alert settings are converted automatically (card moved to the center once, texts/image/sound/video kept).

v2.1
----
- Follow alert: 11 ready-made TEMPLATES (Kick Classic, Neon, Glass, Violet, Fire, Ocean, Gold VIP, Clean White, Pill, Sunset, Cinema).
  One click applies a template; your image, texts, song and video are kept. Each template has a live thumbnail.
- The WELCOME MESSAGE and the FOLLOWER NAME are now two separate elements: own text / font / weight / size / color / position, both draggable in the preview.
  (Old v2.0 alert settings are converted automatically.)
- SONG: add MP3/WAV/OGG/M4A with volume, start second, fade-out and a Listen button. Plays through the mixer, so it reaches the stream and your speakers.
- VIDEO MP4: add a video with its own sound (song + picture in one clip). It is drawn inside the alert card; duration "Auto" keeps the alert until the video ends.
  Song and video files are stored inside the app (IndexedDB, keys start with "alert_") and are not removed by the asset cleanup.
- Alerts window redesigned: live preview + test name + Play button, tabs (Templates | Texts | Media | Look | General),
  card size, gradient background, border glow, glass effect, moving shine, sparkles, entrance animation (slide / pop / fade), screen-center position.

v2.0
----
- Kick pages (inside the chat) redesigned: ONE tab bar at the top, all buttons side by side:
  Chat | Activity | Moderation | Channel | Info.  (the old bottom bar and the "back to chat" button are gone)
- Channel page is live again (the "coming soon" cover was removed) and grouped in clear categories:
  Quick presets -> Chat access -> Chat options -> Channel options.
- Activity / Moderation pages: tidy toolbar, one-row scrollable filters, clearer stat cards.
- Alerts window redesigned: the left side lists the alert TYPES (Follow alert for now). Click one and ALL its settings are on one page: live preview (drag image / name with the mouse) + General, Image (add / change / remove, size, X/Y), Account name (show, size, color, X/Y) and Card look (border color, background color + opacity).

v1.9
----
- Whole UI re-arranged: big preview + bottom row (Scenes, Sources, Mixer, Session) on one side, and a fixed side column (control panel + full-height Kick chat) on the other. Drag the divider to resize the side column (double-click = default).
- Alerts button moved under the Settings button in the control panel (it was in the Kick header).
- Saved box layout from older versions is reset once to the new default (new keys se_dock_order2 / se_dock_w2 / se_dockh2).

v1.8
----
- Kick panel reorganized: header = name + channel (start) / stats + control buttons (diagnostics, settings, expand) grouped together.
- 4 clear cells at the bottom: Activity, Moderation, Channel, Info (icon + label). A "Chat" button appears in the header when a section is open; tapping the open cell again also returns to chat.
- Alerts system (step 1): a new-follower alert is drawn on the preview AND on the stream. A bell button in the Kick panel header opens Alert settings (on/off, duration, position, label text, test button). Saved in se_kalert; ready for more alert types later.

v1.7
----
- Layout lock button (prevents accidental moves/resizes) next to the reset button; both remembered.
- Includes everything from 1.5/1.6 below (GitHub already had 1.5 and 1.6 without these changes, so users get 1.7).

v1.6
----
- Same files as 1.5 (re-published); superseded by 1.7.

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
