@echo off
title MeroShare Stopper
echo ==================================================
echo   Stopping MeroShare Background Services
echo ==================================================
echo.

echo Stopping Backend (Python)...
taskkill /F /IM python.exe /T >nul 2>&1

echo.
echo Stopping Frontend (Node.js/Vite)...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo All background services have been stopped successfully!
echo ==================================================
timeout /t 3 >nul
