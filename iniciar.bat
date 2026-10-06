@echo off
title BetTrack Pro - Servidor local
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No se encuentra Node.js. Instalalo desde https://nodejs.org y vuelve a intentarlo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias, solo la primera vez...
  call npm install
  if errorlevel 1 (
    echo Error instalando dependencias.
    pause
    exit /b 1
  )
)

if not exist .env (
  echo Aviso: no existe el archivo .env. La app funciona, pero la captura con IA no.
  echo Copia .env.example como .env y pon tu ANTHROPIC_API_KEY para activarla.
  echo.
)

echo Arrancando BetTrack Pro en http://localhost:3000
echo Cierra esta ventana para pararlo.
echo.
start "" cmd /c "timeout /t 4 >nul && start http://localhost:3000"
call npm run dev
pause
