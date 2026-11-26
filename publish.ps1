# Stream Extra - one-click publish.
# 1) asks for the new version (Enter = next number)   2) writes version + today's date into app\package.json
# 3) builds StreamExtra-Setup.exe                       4) prepares the folder "GitHub_Upload" (ready to drag into GitHub)
param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$inv  = [Globalization.CultureInfo]::InvariantCulture
$utf8 = New-Object System.Text.UTF8Encoding($false)      # UTF-8 WITHOUT BOM (a BOM would break the update check)

function Get-Repo {
  $r = 'wwadewa17-netizen/StreamExtra'
  try { $cs = [IO.File]::ReadAllText((Join-Path $root 'setup\Setup.cs')); if ($cs -match 'Repo\s*=\s*"([^"]+)"') { $r = $Matches[1] } } catch {}
  return $r
}
function Compare-Ver([string]$a, [string]$b) {
  $pa = @($a.Split('.') | ForEach-Object { [int]$_ }); $pb = @($b.Split('.') | ForEach-Object { [int]$_ })
  $n = [Math]::Max($pa.Count, $pb.Count)
  for ($i = 0; $i -lt $n; $i++) {
    $x = 0; $y = 0
    if ($i -lt $pa.Count) { $x = $pa[$i] }
    if ($i -lt $pb.Count) { $y = $pb[$i] }
    if ($x -gt $y) { return 1 }
    if ($x -lt $y) { return -1 }
  }
  return 0
}
# reads the version that is REALLY on GitHub now (by commit id, so no cache can show an old file)
function Get-LiveVersion([string]$repo) {
  $script:liveErr = ''
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
  $ticks = [DateTime]::UtcNow.Ticks
  $url = "https://raw.githubusercontent.com/$repo/main/app/package.json?t=$ticks"
  try {
    $h = @{ 'User-Agent' = 'StreamExtra-Publisher'; 'Accept' = 'application/vnd.github.sha' }
    $r = Invoke-WebRequest -UseBasicParsing -Uri "https://api.github.com/repos/$repo/commits/main?t=$ticks" -Headers $h -TimeoutSec 15
    $sha = $r.Content; if ($sha -is [byte[]]) { $sha = [Text.Encoding]::ASCII.GetString($sha) }
    $sha = ([string]$sha).Trim()
    if ($sha -match '^[0-9a-fA-F]{40}$') { $url = "https://raw.githubusercontent.com/$repo/$sha/app/package.json" }
  } catch {}
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $url -Headers @{ 'User-Agent' = 'StreamExtra-Publisher'; 'Cache-Control' = 'no-cache' } -TimeoutSec 15
    $t = $r.Content; if ($t -is [byte[]]) { $t = [Text.Encoding]::UTF8.GetString($t) }
    $t = ([string]$t).TrimStart([char]0xFEFF)
    $j = $t | ConvertFrom-Json
    if ($j.version) { return [string]$j.version }
    $script:liveErr = 'there is no version inside app/package.json on GitHub'
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match '404') { $script:liveErr = 'app/package.json was NOT FOUND on GitHub (branch main)' } else { $script:liveErr = $msg }
  }
  return $null
}

try {
  Write-Host ''
  Write-Host '==========================================='
  Write-Host '      Stream Extra - Publish Update'
  Write-Host '==========================================='

  # ---------- 1) version ----------
  $pkgPath = Join-Path $root 'app\package.json'
  $pkg = [IO.File]::ReadAllText($pkgPath)
  if ($pkg -notmatch '"version"\s*:\s*"([^"]+)"') { throw 'Could not find "version" in app\package.json' }
  $cur = $Matches[1]
  $parts = $cur.Split('.'); $n = 0
  if ([int]::TryParse($parts[$parts.Length - 1], [ref]$n)) { $parts[$parts.Length - 1] = [string]($n + 1); $next = ($parts -join '.') } else { $next = "$cur.1" }
  $repo = Get-Repo
  Write-Host ''
  Write-Host "Repo            : $repo"
  Write-Host "This folder     : $cur"
  $live = Get-LiveVersion $repo
  if ($live) { Write-Host "On GitHub now   : $live" } else { Write-Host "On GitHub now   : (could not read)  $script:liveErr" -ForegroundColor Yellow }
  if ($CheckOnly) {
    Write-Host ''
    if (-not $live) {
      Write-Host '[!] Users CANNOT see updates right now. Fix:' -ForegroundColor Red
      Write-Host '    - the repo must be PUBLIC, branch "main", and the file app/package.json must exist at the TOP of the repo'
      Write-Host '    - upload the CONTENTS of GitHub_Upload (not the folder itself) and press "Commit changes"'
    } elseif ((Compare-Ver $cur $live) -gt 0) {
      Write-Host "[!] GitHub has an OLDER version ($live). Run Publish_Update.cmd and upload GitHub_Upload." -ForegroundColor Yellow
    } elseif ((Compare-Ver $cur $live) -lt 0) {
      Write-Host "[!] GitHub has a NEWER version ($live) than this folder ($cur)." -ForegroundColor Yellow
    } else {
      Write-Host "[OK] GitHub has version $live. Everyone on an older version will get the update screen." -ForegroundColor Green
    }
    exit 0
  }
  $def = $next
  if ($live) { try { if ((Compare-Ver $cur $live) -gt 0) { $def = $cur } } catch {} } else { $def = $cur }
  if ($def -eq $cur) { Write-Host "(version $cur is not on GitHub yet - normal for the first upload - press Enter to publish it as is)" -ForegroundColor DarkGray }
  $in = Read-Host "Version to publish (press Enter for $def)"
  if ([string]::IsNullOrWhiteSpace($in)) { $in = $def }
  $in = $in.Trim()
  if ($in -notmatch '^\d+(\.\d+)*$') { throw "Bad version '$in' - use numbers and dots only, for example 1.2" }
  if ($live -and $in -eq $live) {
    Write-Host 'GitHub already has this version - users will NOT see an update.' -ForegroundColor Yellow
    $a = Read-Host 'Continue anyway? (y/N)'
    if ($a -notmatch '^[yY]') { throw 'Cancelled.' }
  }
  $today = (Get-Date).ToString('yyyy-MM-dd', $inv)

  $pkg = [regex]::Replace($pkg, '"version"\s*:\s*"[^"]*"', ('"version": "' + $in + '"'))
  if ($pkg -match '"releaseDate"') { $pkg = [regex]::Replace($pkg, '"releaseDate"\s*:\s*"[^"]*"', ('"releaseDate": "' + $today + '"')) }
  else { $pkg = [regex]::Replace($pkg, '("version"\s*:\s*"[^"]*")', ('$1,' + "`r`n" + '  "releaseDate": "' + $today + '"')) }
  $null = $pkg | ConvertFrom-Json                         # make sure the JSON is still valid
  [IO.File]::WriteAllText($pkgPath, $pkg, $utf8)
  Write-Host "  -> version $in  ($today)" -ForegroundColor Green

  # ---------- 2) Setup.exe ----------
  Write-Host ''
  Write-Host 'Building StreamExtra-Setup.exe ...'
  $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
  if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
  if (-not (Test-Path $csc)) { throw 'csc.exe not found. Install .NET Framework 4.x (it ships with Windows 10/11).' }
  $rel = Join-Path $root 'release'
  New-Item -ItemType Directory -Force -Path $rel | Out-Null
  $setupExe = Join-Path $rel 'StreamExtra-Setup.exe'

  # backup copy of the app files, embedded INSIDE Setup.exe: if GitHub is blocked on the user's network,
  # the first install still finishes (no VPN needed)
  $embZip = Join-Path $rel 'app.zip'
  Remove-Item $embZip -Force -ErrorAction SilentlyContinue
  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zfs = [IO.File]::Open($embZip, [IO.FileMode]::Create)
  $za  = New-Object IO.Compression.ZipArchive($zfs, [IO.Compression.ZipArchiveMode]::Create)
  $appRoot = (Join-Path $root 'app').TrimEnd('\') + '\'
  foreach ($f in Get-ChildItem (Join-Path $root 'app') -Recurse -File) {
    $entry = 'app/' + $f.FullName.Substring($appRoot.Length).Replace('\', '/')
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($za, $f.FullName, $entry, [IO.Compression.CompressionLevel]::Optimal)
  }
  $za.Dispose(); $zfs.Dispose()

  & $csc /nologo /target:winexe /optimize+ /codepage:65001 "/out:$setupExe" "/win32icon:app\assets\icon.ico" "/resource:$embZip,app.zip" "/resource:app\assets\logo.png,logo.png" `
    /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll setup\Setup.cs
  Remove-Item $embZip -Force -ErrorAction SilentlyContinue
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $setupExe)) { throw 'Setup build failed.' }

  # ---------- 3) GitHub_Upload folder ----------
  Write-Host ''
  Write-Host 'Preparing the GitHub_Upload folder ...'
  $out = Join-Path $root 'GitHub_Upload'
  if (Test-Path $out) { Remove-Item $out -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $out | Out-Null
  Copy-Item (Join-Path $root 'app')   -Destination $out -Recurse -Force
  Copy-Item (Join-Path $root 'setup') -Destination $out -Recurse -Force
  foreach ($f in 'README.txt', 'build.ps1', 'Build_StreamExtra.cmd', 'Publish_Update.cmd', 'Check_GitHub.cmd', 'publish.ps1') {
    $p = Join-Path $root $f; if (Test-Path $p) { Copy-Item $p -Destination $out -Force }
  }
  Copy-Item $setupExe -Destination $out -Force

  # repo name is read from setup\Setup.cs (Cfg.Repo) so it only lives in one place
  $repo = 'wwadewa17-netizen/StreamExtra'
  $cs = [IO.File]::ReadAllText((Join-Path $root 'setup\Setup.cs'))
  if ($cs -match 'Repo\s*=\s*"([^"]+)"') { $repo = $Matches[1] }
  $url = "https://github.com/$repo/upload/main"

  Write-Host ''
  Write-Host '==========================================='
  Write-Host "  READY  -  version $in"
  Write-Host '==========================================='
  Write-Host ''
  Write-Host '  Now, in the GitHub page that just opened:'
  Write-Host '   1) In the folder GitHub_Upload: press Ctrl+A (select everything inside it)'
  Write-Host '   2) Drag it into the GitHub page and wait for the upload to finish'
  Write-Host '   3) Press the green "Commit changes" button'
  Write-Host ''
  Write-Host '  That is all. Everyone who opens the app will get the Update page.'
  Write-Host "  (Page: $url)"
  Start-Process explorer.exe $out
  Start-Process $url
  Write-Host ''
  Read-Host '  After you press "Commit changes" on GitHub, come back here and press Enter to VERIFY'
  $ok = $false
  for ($k = 1; $k -le 6; $k++) {
    $v = Get-LiveVersion $repo
    if ($v -eq $in) { $ok = $true; break }
    if ($v) { Write-Host "  GitHub still shows version $v  (attempt $k of 6) ..." -ForegroundColor Yellow }
    else { Write-Host "  Cannot read it yet: $script:liveErr  (attempt $k of 6) ..." -ForegroundColor Yellow }
    if ($k -lt 6) { Start-Sleep -Seconds 10 }
  }
  Write-Host ''
  if ($ok) {
    Write-Host "  [OK] GitHub has version $in - users will now get the update screen." -ForegroundColor Green
  } else {
    Write-Host '  [!] GitHub does NOT show the new version yet. Check:' -ForegroundColor Red
    Write-Host '      1) you pressed the green "Commit changes" button'
    Write-Host '      2) you uploaded the CONTENTS of GitHub_Upload (the folder "app" must be at the top of the repo, not inside another folder)'
    Write-Host '      3) the repo is Public and the branch is main'
    Write-Host '      Then run Check_GitHub.cmd to test again.'
  }
  exit 0
}
catch {
  Write-Host ''
  Write-Host "[X] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
