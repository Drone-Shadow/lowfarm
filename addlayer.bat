@echo off
REM ============================================================
REM Add Layer Script for Project Viewer
REM Appends a new overlay entry into build\config.json
REM ============================================================

setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "BUILD=%ROOT%build"
set "CONFIG=%BUILD%\config.json"

echo ------------------------------------------------------------
echo Add Layer Script
echo ------------------------------------------------------------

set /p NAME=Enter layer name (folder name on BunnyCDN): 

REM Construct BunnyCDN URL from folder name
set "URL=https://lowfarm.b-cdn.net/%NAME%/{z}/{x}/{y}.png"

REM Use PowerShell to inject JSON safely
powershell -Command ^
  "$cfg = Get-Content '%CONFIG%' | ConvertFrom-Json; ^
   if (-not $cfg.overlays) { $cfg | Add-Member -MemberType NoteProperty -Name overlays -Value @{} }; ^
   $cfg.overlays.Add('$NAME', @{name='$NAME'; url='$URL'; tms=$false; minZoom=12; maxZoom=22; opacity=1.0; attribution='Survey © Drone Shadow'}); ^
   $cfg | ConvertTo-Json -Depth 5 | Set-Content '%CONFIG%'"

echo ------------------------------------------------------------
echo Layer added: %NAME%
echo URL: %URL%
echo ------------------------------------------------------------

endlocal
