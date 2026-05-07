@echo off
title Build IPO Mitra Desktop Application
echo ==================================================
echo   Building IPO Mitra Desktop Installer
echo ==================================================
echo.

:: Step 0: Kill any running instance to release file locks
echo [0/5] Clearing locked processes...
taskkill /F /IM IPO_Mitra.exe >nul 2>&1
taskkill /F /IM "IPO Mitra.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [1/5] Building React Frontend...
cd frontend
call npm install --silent
call npm run build
cd ..

echo.
echo [2/5] Copying frontend build into backend static folder...
if exist backend\static rmdir /s /q backend\static
mkdir backend\static
xcopy frontend\dist\* backend\static\ /s /e /y /q

echo.
echo [3/5] Packaging Python backend with PyInstaller...
call pip install pyinstaller --quiet
cd backend
call python -m PyInstaller --noconfirm --onedir --console ^
  --add-data "static;static" ^
  --hidden-import="uvicorn.logging" ^
  --hidden-import="uvicorn.loops" ^
  --hidden-import="uvicorn.loops.auto" ^
  --hidden-import="uvicorn.protocols" ^
  --hidden-import="uvicorn.protocols.http" ^
  --hidden-import="uvicorn.protocols.http.auto" ^
  --hidden-import="uvicorn.protocols.http.h11_impl" ^
  --hidden-import="uvicorn.protocols.websockets" ^
  --hidden-import="uvicorn.protocols.websockets.auto" ^
  --hidden-import="uvicorn.lifespan" ^
  --hidden-import="uvicorn.lifespan.on" ^
  --hidden-import="uvicorn.lifespan.off" ^
  --hidden-import="h11" ^
  --hidden-import="multiprocessing.popen_spawn_win32" ^
  --icon="..\icon.ico" ^
  --name "IPO_Mitra" ^
  desktop_app.py
cd ..

if not exist backend\dist\IPO_Mitra\IPO_Mitra.exe (
  echo ERROR: PyInstaller failed!
  pause
  exit /b 1
)

echo.
echo [4/5] Installing Electron dependencies...
cd electron
call npm install
cd ..

echo.
echo [5/5] Building Windows Installer...
cd electron
call npm run dist
cd ..

echo.
echo ==================================================
echo BUILD COMPLETE!
echo ==================================================
echo.
echo Installer is in: release\IPO Mitra Setup 1.0.1.exe
echo.
echo Share that single .exe file. Users double-click to install.
echo It creates Desktop + Start Menu shortcuts automatically.
echo.
pause
