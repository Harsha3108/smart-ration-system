# Smart Public Ration Distribution System - Arduino Library Installer (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File .\install_libraries.ps1

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "   SMART PUBLIC RATION DISTRIBUTION SYSTEM - ARDUINO LIBRARY INSTALLER   " -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

$targetDir = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Arduino\libraries"

if (-not (Test-Path $targetDir)) {
    Write-Host "[INFO] Creating Arduino libraries folder: $targetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Write-Host "[TARGET] Installing libraries to: $targetDir" -ForegroundColor Green
Write-Host ""

# Check if arduino-cli is available
$arduinoCli = Get-Command "arduino-cli" -ErrorAction SilentlyContinue
if ($arduinoCli) {
    Write-Host "[FOUND] arduino-cli detected! Installing via CLI..." -ForegroundColor Cyan
    & arduino-cli lib install "MFRC522"
    & arduino-cli lib install "LiquidCrystal_I2C"
    & arduino-cli lib install "Adafruit Fingerprint Sensor Library"
    & arduino-cli lib install "HX711 Arduino Library"
    & arduino-cli lib install "ESP32Servo"
    & arduino-cli lib install "ArduinoJson"
    Write-Host "`n[SUCCESS] All libraries installed successfully via arduino-cli!" -ForegroundColor Green
    Read-Host "Press Enter to exit..."
    exit 0
}

# Download from GitHub Releases
$tempDir = Join-Path $env:TEMP "SmartRationLibs"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$libs = @(
    @{ name = "MFRC522"; url = "https://github.com/OSSLibraries/Arduino_MFRC522/archive/refs/heads/master.zip"; folder = "MFRC522" },
    @{ name = "LiquidCrystal_I2C"; url = "https://github.com/johnrickman/LiquidCrystal_I2C/archive/refs/heads/master.zip"; folder = "LiquidCrystal_I2C" },
    @{ name = "Adafruit_Fingerprint"; url = "https://github.com/adafruit/Adafruit-Fingerprint-Sensor-Library/archive/refs/heads/master.zip"; folder = "Adafruit_Fingerprint_Sensor_Library" },
    @{ name = "HX711"; url = "https://github.com/bogde/HX711/archive/refs/heads/master.zip"; folder = "HX711" },
    @{ name = "ESP32Servo"; url = "https://github.com/madhephaestus/ESP32Servo/archive/refs/heads/master.zip"; folder = "ESP32Servo" },
    @{ name = "ArduinoJson"; url = "https://github.com/bblanchon/ArduinoJson/archive/refs/tags/v6.21.4.zip"; folder = "ArduinoJson" }
)

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

foreach ($lib in $libs) {
    Write-Host ("[DOWNLOADING] " + $lib.name + "...") -ForegroundColor Cyan
    $zipPath = Join-Path $tempDir ($lib.name + ".zip")
    try {
        Invoke-WebRequest -Uri $lib.url -OutFile $zipPath -UseBasicParsing
        Write-Host ("[EXTRACTING]  " + $lib.name + "...") -ForegroundColor Yellow
        $extractPath = Join-Path $tempDir $lib.name
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        
        $subFolder = Get-ChildItem -Path $extractPath | Where-Object { $_.PSIsContainer } | Select-Object -First 1
        $destFolder = Join-Path $targetDir $lib.folder
        if (Test-Path $destFolder) { Remove-Item $destFolder -Recurse -Force }
        Move-Item -Path $subFolder.FullName -Destination $destFolder -Force
        Write-Host ("[INSTALLED]   " + $lib.name + " -> " + $destFolder) -ForegroundColor Green
    } catch {
        Write-Host ("[ERROR]       Failed to install " + $lib.name + ": " + $_.Exception.Message) -ForegroundColor Red
    }
}

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "   INSTALLATION COMPLETE! All 6 libraries are ready for Arduino IDE.   " -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit..."
