@echo off
title Smart Ration System - PlatformIO Upload & Real-Time Log Monitor
echo =========================================================================
echo    SMART PUBLIC RATION SYSTEM - ESP32 UPLOAD AND LOG MONITOR
echo =========================================================================
echo.

cd /d "%~dp0..\firmware"

where pio >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] PlatformIO CLI (pio) not found in PATH.
    echo [INFO] Checking Python pip / PlatformIO installation...
    python -m platformio --version >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [INSTALL] Installing PlatformIO Core via pip...
        pip install -U platformio
    )
    echo.
    echo [BUILD & UPLOAD] Compiling and flashing ESP32...
    python -m platformio run -t upload -t monitor
    pause
    exit /b 0
)

echo [FOUND] PlatformIO CLI detected!
echo [BUILD & UPLOAD] Compiling, flashing ESP32, and opening serial logs...
echo.
pio run -t upload -t monitor
pause
