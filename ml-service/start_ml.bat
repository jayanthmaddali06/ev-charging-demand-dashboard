@echo off
title EV Charging ML Service (FastAPI)
echo ====================================================
echo Starting Python FastAPI ML Service (Port 8000)
echo ====================================================

set PYTHON_CMD=python
where python >nul 2>nul
if %errorlevel% neq 0 (
    if exist "D:\Anaconda3\python.exe" (
        set PYTHON_CMD=D:\Anaconda3\python.exe
    ) else (
        echo [ERROR] Python not found in PATH or D:\Anaconda3. Please install Python.
        pause
        exit /b 1
    )
)

cd /d "%~dp0"
echo Using Python: %PYTHON_CMD%
"%PYTHON_CMD%" main.py
pause
