@echo off
title Build IPO Mitra Standalone Executable
echo ==================================================
echo   Building IPO Mitra Standalone Executable
echo ==================================================
echo.

echo [1/4] Installing Build Dependencies...
call pip install pyinstaller

echo.
echo [2/4] Building Frontend...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo [3/4] Copying Frontend Build to Backend...
if exist backend\static rmdir /s /q backend\static
mkdir backend\static
xcopy frontend\dist\* backend\static\ /s /e /y

echo.
echo [4/4] Creating Executable with PyInstaller...
cd backend
call python -m PyInstaller --noconfirm --onedir --windowed --add-data "static;static" --hidden-import="uvicorn.logging" --hidden-import="uvicorn.loops" --hidden-import="uvicorn.loops.auto" --hidden-import="uvicorn.protocols" --hidden-import="uvicorn.protocols.http.auto" --hidden-import="uvicorn.protocols.websockets.auto" --hidden-import="uvicorn.lifespan.on" --hidden-import="uvicorn.lifespan.off" --icon="..\icon.ico" --name "IPO_Mitra" desktop_app.py
cd ..

echo.
echo ==================================================
echo Build Complete!
echo ==================================================
echo.
echo Your standalone application has been built successfully.
echo.
echo You can find the executable at:
echo backend\dist\IPO_Mitra\IPO_Mitra.exe
echo.
echo To share the app, just ZIP the "backend\dist\IPO_Mitra" folder.
echo.
pause
