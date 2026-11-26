@echo off
chcp 65001 >nul
title Stream Extra - Check GitHub
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1" -CheckOnly
echo.
pause
