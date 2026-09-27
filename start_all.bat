@echo off
title EV Charging Platform Launcher
echo ===================================================================
echo   EV Charging Demand Prediction & Smart Charging Analytics Platform
echo ===================================================================
echo.
echo Launching full stack application:
echo  1. Python FastAPI ML Service (Port 8000)
echo  2. Node.js Express Backend API (Port 5000)
echo  3. React + Vite Frontend (Port 3000)
echo.

start "1. ML Service (FastAPI)" cmd /c "cd ml-service && start_ml.bat"
timeout /t 3 /nobreak >nul

start "2. Backend (Express)" cmd /c "cd backend && start_backend.bat"
timeout /t 2 /nobreak >nul

start "3. Frontend (React Vite)" cmd /c "cd frontend && start_frontend.bat"
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo All services launched!
echo Press any key to close this launcher window (services keep running).
pause >nul
