@echo off
title Stream Extra - Build
cd /d "%~dp0"
if not exist "%~dp0app\main.js" (
  echo [X] Please extract the ZIP file first, then run this file from the extracted folder.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
if errorlevel 1 (
  echo.
  echo Build failed. Details were saved in build.log next to this file.
  pause
  exit /b 1
)
pause
exit /b 0
