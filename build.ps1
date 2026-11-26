$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dl   = Join-Path $root 'downloads'
$app  = Join-Path $root 'app'
$dest = Join-Path $root 'StreamExtra'
New-Item -ItemType Directory -Force -Path $dl | Out-Null
try { Start-Transcript -Path (Join-Path $root 'build.log') -Force | Out-Null } catch {}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Returns $true only if the file is a complete, readable ZIP (has a valid "End of Central Directory").
function Test-Zip([string]$path) {
  try {
    $z = [IO.Compression.ZipFile]::OpenRead($path)
    try { return ($z.Entries.Count -gt 0) } finally { $z.Dispose() }
  } catch { return $false }
}

function Get-File([string[]]$urls, [string]$out, [int]$minMB, [bool]$isZip = $false) {
  if (Test-Path $out) {
    $ok = ((Get-Item $out).Length -gt ($minMB * 1MB))
    if ($ok -and $isZip) { $ok = Test-Zip $out }
    if ($ok) { Write-Host "  Using cached file: $out"; return $true }
    Write-Host "  Cached file is incomplete or corrupt - deleting it and downloading again"
    Remove-Item $out -Force -ErrorAction SilentlyContinue
  }
  foreach ($u in $urls) {
    $part = "$out.part"
    try {
      Write-Host "  Downloading: $u"
      Remove-Item $part -Force -ErrorAction SilentlyContinue
      Invoke-WebRequest -Uri $u -OutFile $part -UseBasicParsing -TimeoutSec 600
      $ok = ((Get-Item $part).Length -gt ($minMB * 1MB))
      if (-not $ok) { Write-Host "     file too small, skipping" }
      elseif ($isZip -and -not (Test-Zip $part)) { Write-Host "     downloaded ZIP is corrupt (incomplete download), skipping"; $ok = $false }
      if ($ok) { Move-Item $part $out -Force; return $true }
    } catch {
      Write-Host "     failed: $($_.Exception.Message)"
    }
    Remove-Item $part -Force -ErrorAction SilentlyContinue
  }
  return $false
}

function Expand-Gz([string]$gz, [string]$outFile) {
  $in = [IO.File]::OpenRead($gz)
  $g  = New-Object IO.Compression.GZipStream($in, [IO.Compression.CompressionMode]::Decompress)
  $o  = [IO.File]::Create($outFile)
  $g.CopyTo($o); $o.Close(); $g.Close(); $in.Close()
}

function Test-Rtmps([string]$exe) {
  try { $t = (& $exe -hide_banner -protocols 2>&1 | Out-String); return ($t -match 'rtmps') } catch { return $false }
}

try {
  Write-Host ''
  Write-Host '==========================================='
  Write-Host '      Stream Extra - Building the app'
  Write-Host '==========================================='

  # ---------- 1) Electron ----------
  Write-Host ''
  Write-Host '[1/3] Getting Electron ...'
  $electronZip = $null
  $manual = Get-ChildItem $dl -Filter 'electron-v*-win32-x64.zip' -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 50MB } | Select-Object -First 1
  if ($manual -and -not (Test-Zip $manual.FullName)) {
    Write-Host "  $($manual.Name) in 'downloads' is corrupt/incomplete - deleting it, will download a fresh copy"
    Remove-Item $manual.FullName -Force -ErrorAction SilentlyContinue
    $manual = $null
  }
  if ($manual) { $electronZip = $manual.FullName; Write-Host "  Using: $electronZip" }
  else {
    foreach ($v in @('33.4.11', '33.3.2', '32.3.3')) {
      $f = "electron-v$v-win32-x64.zip"
      $out = Join-Path $dl $f
      $urls = @(
        "https://cdn.npmmirror.com/binaries/electron/v$v/$f",
        "https://github.com/electron/electron/releases/download/v$v/$f",
        "https://registry.npmmirror.com/-/binary/electron/v$v/$f"
      )
      if (Get-File $urls $out 50 $true) { $electronZip = $out; break }
    }
  }
  if (-not $electronZip) {
    throw "Could not download Electron. Try a VPN, or download electron-v33.4.11-win32-x64.zip manually and put it in the 'downloads' folder next to this file."
  }

  # ---------- 2) ffmpeg ----------
  Write-Host ''
  Write-Host '[2/3] Getting ffmpeg ...'
  $ffmpegExe = $null
  $manualFf = Join-Path $root 'ffmpeg.exe'
  if (Test-Path $manualFf) { $ffmpegExe = $manualFf; Write-Host "  Using: $manualFf" }
  else {
    $cached = Join-Path $dl 'ffmpeg.exe'
    if ((Test-Path $cached) -and (Test-Rtmps $cached)) { $ffmpegExe = $cached; Write-Host '  Using cached ffmpeg.exe' }
  }
  if (-not $ffmpegExe) {
    $cands = @(
      @{ kind='gz';  min=8;  file='ffmpeg-win32-x64.gz'; urls=@(
          'https://cdn.npmmirror.com/binaries/ffmpeg-static/b6.0/ffmpeg-win32-x64.gz',
          'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-win32-x64.gz') },
      @{ kind='zip'; min=40; file='ffmpeg-release-essentials.zip'; urls=@(
          'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
          'https://github.com/GyanD/codexffmpeg/releases/download/7.1/ffmpeg-7.1-essentials_build.zip') },
      @{ kind='zip'; min=40; file='ffmpeg-master-latest-win64-gpl.zip'; urls=@(
          'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip') }
    )
    foreach ($c in $cands) {
      $out = Join-Path $dl $c.file
      if (-not (Get-File $c.urls $out $c.min ($c.kind -eq 'zip'))) { continue }
      $target = Join-Path $dl 'ffmpeg.exe'
      Remove-Item $target -Force -ErrorAction SilentlyContinue
      try {
        if ($c.kind -eq 'gz') { Expand-Gz $out $target }
        else {
          $tmp = Join-Path $dl 'ff_tmp'
          Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
          Expand-Archive -Path $out -DestinationPath $tmp -Force
          $found = Get-ChildItem $tmp -Recurse -Filter ffmpeg.exe | Select-Object -First 1
          Copy-Item $found.FullName $target -Force
          Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
        }
      } catch { Write-Host "     extract failed: $($_.Exception.Message)"; continue }
      if (Test-Rtmps $target) { $ffmpegExe = $target; break }
      Write-Host '     this ffmpeg build has no RTMPS support, trying next source'
    }
  }
  if (-not $ffmpegExe) {
    throw "Could not get ffmpeg. Try a VPN, or download ffmpeg.exe manually (gyan.dev essentials build) and put it next to this file."
  }

  # ---------- 2b) yt-dlp (optional: YouTube links for audio/video sources) ----------
  Write-Host ''
  Write-Host '[2b] Getting yt-dlp (optional, for YouTube links) ...'
  $ytdlpExe = $null
  $manualYt = Join-Path $root 'yt-dlp.exe'
  $cachedYt = Join-Path $dl 'yt-dlp.exe'
  if (Test-Path $manualYt) { $ytdlpExe = $manualYt; Write-Host "  Using: $manualYt" }
  elseif ((Test-Path $cachedYt) -and ((Get-Item $cachedYt).Length -gt 5MB)) { $ytdlpExe = $cachedYt; Write-Host '  Using cached yt-dlp.exe' }
  else {
    if (Get-File @('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe') $cachedYt 5) { $ytdlpExe = $cachedYt }
    else { Write-Host '  yt-dlp not available - YouTube links will be disabled (local files and direct links still work).' }
  }

  # ---------- 3) Build app ----------
  Write-Host ''
  Write-Host '[3/3] Building StreamExtra.exe ...'
  Get-Process -Name 'StreamExtra' -ErrorAction SilentlyContinue | Stop-Process -Force
  Write-Host '  (Your saved Kick link and settings in %AppData%\StreamExtra are kept - only the StreamExtra folder next to this file is replaced.)'
  Start-Sleep -Milliseconds 800
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  try { Expand-Archive -Path $electronZip -DestinationPath $dest -Force }
  catch {
    Remove-Item $electronZip -Force -ErrorAction SilentlyContinue
    throw "The Electron ZIP was corrupt and has been deleted. Just run Build_StreamExtra.cmd again to download a fresh copy. ($($_.Exception.Message))"
  }
  Rename-Item (Join-Path $dest 'electron.exe') 'StreamExtra.exe'
  Remove-Item (Join-Path $dest 'resources\default_app.asar') -Force -ErrorAction SilentlyContinue
  $appDest = Join-Path $dest 'resources\app'
  New-Item -ItemType Directory -Force -Path $appDest | Out-Null
  Copy-Item (Join-Path $app 'package.json') $appDest -Force
  Copy-Item (Join-Path $app 'main.js')      $appDest -Force
  Copy-Item (Join-Path $app 'preload.js')   $appDest -Force
  Copy-Item (Join-Path $app 'bridge-preload.js') $appDest -Force
  Copy-Item (Join-Path $app 'kick-app.json') $appDest -Force
  Copy-Item (Join-Path $app 'renderer') $appDest -Recurse -Force
  Copy-Item (Join-Path $app 'assets')   $appDest -Recurse -Force
  Copy-Item $ffmpegExe (Join-Path $dest 'resources\ffmpeg.exe') -Force
  if ($ytdlpExe) { Copy-Item $ytdlpExe (Join-Path $dest 'resources\yt-dlp.exe') -Force }
  Copy-Item (Join-Path $app 'assets\icon.ico') (Join-Path $dest 'icon.ico') -Force

  Write-Host ''
  Write-Host 'Done!  Open:  StreamExtra\StreamExtra.exe  (no setup, no install - just double-click it).'
  Write-Host "Folder: $dest"
  Start-Process (Join-Path $dest 'StreamExtra.exe')
  try { Stop-Transcript | Out-Null } catch {}
  exit 0
}
catch {
  Write-Host ''
  Write-Host "[X] $($_.Exception.Message)" -ForegroundColor Red
  try { Stop-Transcript | Out-Null } catch {}
  exit 1
}
