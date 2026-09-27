@echo off
title EV Charging Node.js Backend
echo ====================================================
echo Starting Express Backend API (Port 5000)
echo ====================================================
cd /d "%~dp0"
node server.js
pause
