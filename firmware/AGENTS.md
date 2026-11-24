# AGENTS.md — ESP32 Firmware Guidelines (`firmware/`)

## Hardware Platform & Pinout Constraints
- **Target MCU:** ESP32 DevKit V1 (`board = esp32dev` in `platformio.ini`).
- **Forbidden Pins:** NEVER use GPIO `6–11` (internal SPI flash), GPIO `12` (boot strapping flash voltage), or input-only pins (`34, 35, 36, 39`) for outputs.
- **Standard Pin Map (Defined in `SmartRationSystem/Config.h`):**
  - **RC522 RFID (VSPI, 3.3V STRICT):** `SS=5`, `RST=4`, `SCK=18`, `MISO=19`, `MOSI=23`
  - **16×2 I2C LCD (Auto-scans `0x27` / `0x3F`):** `SDA=21`, `SCL=22`
  - **R307 Fingerprint (UART2, 57600 baud):** `RX2=16` (to R307 TX), `TX2=17` (to R307 RX)
  - **HX711 Load Cell:** `DOUT=32`, `SCK=33`
  - **Servo Motor (External 5V + Capacitor):** `PWM=13` (`0°` Closed, `60°` Open)
  - **Feedback & Controls:** `GREEN_LED=26`, `RED_LED=27`, `BUZZER=14`, `STAGE_CONFIRM_BTN=0` (Onboard `BOOT` button)

## State Machine & Sequential Dispensing
1. **Authentication (Dual-Factor OR Operator OTP Override):**
   - Path A (RFID + Fingerprint): Scan RFID UID $\rightarrow$ Query `/cards.json` $\rightarrow$ Check not `distributedThisMonth` $\rightarrow$ Scan R307 finger $\rightarrow$ Verify `fpId` belongs to a member on this card.
   - Path B (Web Operator Mobile OTP): Poll `/active_session` when idle; if `authorizedBy == "OTP"` and `currentStep == "AUTHORIZED_OTP"`, immediately accept authorization for `currentCardId` without requiring fingerprint scan.
2. **Sequential Dual-Commodity Dispensing (1 Servo):**
   - **Stage 1 (Rice):** Tare scale $\rightarrow$ Servo `60°` $\rightarrow$ Measure weight until `quotaRiceKg` reached $\rightarrow$ Servo `0°`.
   - **Stage 2 Swap Wait:** LCD prompts `"Rice Done! Swap / Bag & Tap/BOOT"`. Wait for either: (a) Onboard `BOOT` button (`GPIO 0`), (b) RFID card tap, or (c) Firebase `active_session/stage2Confirmed == true` (from Web Dashboard).
   - **Stage 3 (Ragi):** Tare scale $\rightarrow$ Servo `60°` $\rightarrow$ Measure weight until `quotaRagiKg` reached $\rightarrow$ Servo `0°`.
3. **3-Mode Weight Engine (`system_config` in Firebase):**
   - **Demo Scale Ratio Mode (`demoMode = true`, `demoRatio = 100`):** Divides target kg by `demoRatio` (e.g., `10.0 kg / 100 = 0.100 kg = 100g` physical threshold on scale) while reporting full kg equivalent on LCD/DB.
   - **Quick 500g Bottle Auto-Calibrate:** Triggered via Firebase `/system_config/quickCalibrateCmd == true` or Serial `'c'` command; computes `calibrationFactor = rawValue / 0.50f` and saves back to Firebase.
   - **Safe Timed Fallback:** If `!scale.wait_ready_timeout(300)` (HX711 disconnected/unmounted), safely opens servo for `DEMO_TIMED_DISPENSE_MS` (4000ms) while streaming simulated weight progress, then closes at `0°`.

## Self-Contained Library Policy
- Local copies of `HX711`, `LiquidCrystal_I2C`, and `Adafruit_Fingerprint` are bundled inside `SmartRationSystem/` and `tools/` using `"..."` quotes so Arduino IDE compiles without global library setup errors.
- Keep `platformio.ini` dependencies aligned with `SmartRationSystem.ino`.

## Build & ESP32 Core 3.x Compatibility Rules
- **Arduino Core 3.x LEDC API:** `platform = espressif32` (`8.0.0` / Core `3.3.12`) removes legacy `ledcSetup`/`ledcAttachPin`/`ledcDetachPin`. Always pin `madhephaestus/ESP32Servo @ ^3.0.5` (never `1.x`).
- **Bundled Header Standards:** Use `0b...` binary literals (not deprecated `B...` macros), keep all HD44780 flags (`LCD_4BITMODE`, `LCD_2LINE`, `LCD_5x8DOTS`, `LCD_DISPLAYMOVE`, `LCD_MOVELEFT`, `LCD_MOVERIGHT`) in `LiquidCrystal_I2C.h`, and type `device_address` as `uint32_t` in `Adafruit_Fingerprint.h`.
- **Version Control Hygiene:** Never commit `firmware/.pio/`, `.pio/`, `*.bin`, or `*.elf` build caches; keep them listed in `.gitignore`.
