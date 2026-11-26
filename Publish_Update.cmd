@echo off
chcp 65001 >nul
title Stream Extra - Publish Update
cd /d "%~dp0"
if not exist "%~dp0app\main.js" (
  echo [X] Please extract the ZIP file first, then run this file from the extracted folder.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1"
if errorlevel 1 (
  echo.
  echo Something went wrong - see the message above.
  pause
  exit /b 1
)
pause
exit /b 0
