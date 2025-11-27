@echo off
REM ============================================================
REM Build Script for Project Viewer
REM Prompts for map centre, zoom level, and BunnyCDN path
REM Produces a GitHub + Netlify ready build folder with full config.json
REM ============================================================

setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "BUILD=%ROOT%build"

echo ------------------------------------------------------------
echo Project Viewer - Build Script
echo ------------------------------------------------------------

REM ===== Prompt for inputs =====
set /p LAT=Enter map centre latitude (e.g. 53.525): 
set /p LON=Enter map centre longitude (e.g. -0.327): 
set /p ZOOM=Enter zoom level (e.g. 15): 
set /p BUNNY=Enter BunnyCDN path (e.g. https://cdn.bunny.net/project/tiles): 

REM ===== Prepare build folder =====
if exist "%BUILD%" (
    echo Cleaning existing build folder...
    rmdir /s /q "%BUILD%"
)
mkdir "%BUILD%"

REM ===== Copy core files =====
if exist "%ROOT%index.html" (
    copy /Y "%ROOT%index.html" "%BUILD%\index.html" >nul
) else (
    echo WARNING: index.html not found in %ROOT%
)

if exist "%ROOT%js" (
    xcopy "%ROOT%js" "%BUILD%\js" /E /I /Y >nul
) else (
    echo WARNING: js folder not found in %ROOT%
)

REM ===== Generate config.json =====
(
echo {
echo   "center": [%LAT%, %LON%],
echo   "zoom": %ZOOM%,
echo   "basemaps": {
echo     "osm": {
echo       "name": "OpenStreetMap",
echo       "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
echo       "attribution": "&copy; OpenStreetMap contributors"
echo     },
echo     "esri": {
echo       "name": "Esri Satellite",
echo       "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
echo       "attribution": "Tiles © Esri"
echo     }
echo   },
echo   "defaultBasemap": "esri",
echo   "orthomosaic": {
echo     "name": "Orthomosaic",
echo     "url": "%BUNNY%/{z}/{x}/{y}.png",
echo     "tms": false,
echo     "minZoom": 12,
echo     "maxZoom": 22,
echo     "opacity": 1.0
echo   }
echo }
) > "%BUILD%\config.json"

echo ------------------------------------------------------------
echo Build complete!
echo Config written with:
echo   Centre: %LAT%, %LON%
echo   Zoom:   %ZOOM%
echo   CDN:    %BUNNY%
echo Output folder: %BUILD%
echo ------------------------------------------------------------

endlocal
