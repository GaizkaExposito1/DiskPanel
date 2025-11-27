@echo off
echo Iniciando Backend...
start "Backend Server" cmd /k "cd /d %~dp0backend && node src/index.js"
timeout /t 2 /nobreak >nul
echo Iniciando Frontend...
start "Frontend Dev Server" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Servidores iniciados!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173
