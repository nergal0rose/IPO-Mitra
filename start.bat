@echo off
title MeroShare Launcher
echo ==================================================
echo   Starting MeroShare Full-Stack Application
echo ==================================================
echo.

echo [1/4] Checking and Installing Backend Dependencies...
call pip install -r backend\requirements.txt

echo.
echo [2/4] Checking and Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/4] Starting FastAPI Backend (Background)...
powershell -Command "Start-Process cmd -ArgumentList '/c cd backend && python -m uvicorn main:app --reload --port 8000' -WindowStyle Hidden"

:: Wait briefly before starting frontend
timeout /t 2 /nobreak >nul

echo.
echo [4/4] Starting React/Vite Frontend (Background)...
powershell -Command "Start-Process cmd -ArgumentList '/c cd frontend && npm run dev' -WindowStyle Hidden"

echo.
echo Waiting for servers to initialize before opening browser...
:: Wait 5 seconds to ensure Vite takes port 5173 before opening in browser
timeout /t 5 /nobreak >nul

start http://localhost:5173

echo.
echo Launch complete!
echo.
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000
echo.
echo The servers are now running silently in the background.
echo You can run "stop.bat" to shut them down.
echo Closing this launcher...
timeout /t 3 >nul
