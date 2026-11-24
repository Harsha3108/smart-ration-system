@echo off
setlocal enabledelayedexpansion
title Smart Ration System - Arduino Library Installer

echo =========================================================================
echo    SMART PUBLIC RATION DISTRIBUTION SYSTEM - LIBRARY INSTALLER
echo =========================================================================
echo.
echo This script will automatically download and install all 6 required
echo Arduino libraries directly into your Arduino libraries folder.
echo.

set "TARGET_DIR=%USERPROFILE%\Documents\Arduino\libraries"

if not exist "%TARGET_DIR%" (
    echo [INFO] Arduino libraries folder not found at default location.
    echo [INFO] Creating: "%TARGET_DIR%"
    mkdir "%TARGET_DIR%"
)

echo [TARGET] Installing to: "%TARGET_DIR%"
echo.

:: 1. Arduino-CLI check
where arduino-cli >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [FOUND] arduino-cli detected! Installing libraries via Arduino CLI...
    echo.
    arduino-cli lib install "MFRC522"
    arduino-cli lib install "LiquidCrystal_I2C"
    arduino-cli lib install "Adafruit Fingerprint Sensor Library"
    arduino-cli lib install "HX711 Arduino Library"
    arduino-cli lib install "ESP32Servo"
    arduino-cli lib install "ArduinoJson"
    echo.
    echo =========================================================================
    echo [SUCCESS] All libraries installed successfully via arduino-cli!
    echo =========================================================================
    pause
    exit /b 0
)

echo [INFO] Downloading and extracting library ZIPs from official GitHub releases...
echo.

:: Create temporary directory for downloads
set "TEMP_DIR=%TEMP%\SmartRationLibs"
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: Function to download and extract
powershell -NoProfile -ExecutionPolicy Bypass -Command "& {" ^
    "$target = '%TARGET_DIR%';" ^
    "$temp = '%TEMP_DIR%';" ^
    "$libs = @(" ^
        "@{ name = 'MFRC522'; url = 'https://github.com/OSSLibraries/Arduino_MFRC522/archive/refs/heads/master.zip'; folder = 'MFRC522' }," ^
        "@{ name = 'LiquidCrystal_I2C'; url = 'https://github.com/johnrickman/LiquidCrystal_I2C/archive/refs/heads/master.zip'; folder = 'LiquidCrystal_I2C' }," ^
        "@{ name = 'Adafruit_Fingerprint'; url = 'https://github.com/adafruit/Adafruit-Fingerprint-Sensor-Library/archive/refs/heads/master.zip'; folder = 'Adafruit_Fingerprint_Sensor_Library' }," ^
        "@{ name = 'HX711'; url = 'https://github.com/bogde/HX711/archive/refs/heads/master.zip'; folder = 'HX711' }," ^
        "@{ name = 'ESP32Servo'; url = 'https://github.com/madhephaestus/ESP32Servo/archive/refs/heads/master.zip'; folder = 'ESP32Servo' }," ^
        "@{ name = 'ArduinoJson'; url = 'https://github.com/bblanchon/ArduinoJson/archive/refs/tags/v6.21.4.zip'; folder = 'ArduinoJson' }" ^
    ");" ^
    "foreach ($lib in $libs) {" ^
        "Write-Host ('[DOWNLOADING] ' + $lib.name + '...') -ForegroundColor Cyan;" ^
        "$zipPath = Join-Path $temp ($lib.name + '.zip');" ^
        "try {" ^
            "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;" ^
            "Invoke-WebRequest -Uri $lib.url -OutFile $zipPath -UseBasicParsing;" ^
            "Write-Host ('[EXTRACTING] ' + $lib.name + '...') -ForegroundColor Yellow;" ^
            "$extractPath = Join-Path $temp $lib.name;" ^
            "Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force;" ^
            "$subFolder = Get-ChildItem -Path $extractPath | Where-Object { $_.PSIsContainer } | Select-Object -First 1;" ^
            "$destFolder = Join-Path $target $lib.folder;" ^
            "if (Test-Path $destFolder) { Remove-Item $destFolder -Recurse -Force };" ^
            "Move-Item -Path $subFolder.FullName -Destination $destFolder -Force;" ^
            "Write-Host ('[INSTALLED] ' + $lib.name + ' -> ' + $destFolder) -ForegroundColor Green;" ^
        "} catch {" ^
            "Write-Host ('[ERROR] Failed to install ' + $lib.name + ': ' + $_.Exception.Message) -ForegroundColor Red;" ^
        "}" ^
    "}" ^
"}"

echo.
echo Cleaning up temporary files...
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"

echo.
echo =========================================================================
echo    INSTALLATION COMPLETE!
echo =========================================================================
echo All 6 required libraries are installed in:
echo   "%TARGET_DIR%"
echo.
echo You can now open Arduino IDE and compile SmartRationSystem.ino!
echo =========================================================================
echo.
pause
