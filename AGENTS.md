# AGENTS.md — Smart Public Ration Distribution System

## Project Overview
This repository implements an end-to-end IoT **Smart Public Ration Distribution System Using RFID Authentication and Real-Time SMS Notifications**.
- **Frontend:** Vanilla HTML5, Tailwind CSS (CDN), Lucide Icons (CDN), and modular JavaScript hosted on **GitHub Pages** (`https://harsha3108.github.io/smart-ration-system/`) from repository root (`index.html`).
- **Backend:** **Firebase Authentication** + **Firebase Realtime Database** (`https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/`).
- **Hardware / Firmware:** **ESP32 DevKit V1** controlling RC522 RFID, R307 Fingerprint Sensor, 16×2 I2C LCD, HX711 Load Cell, Servo Motor (`0°` closed / `60°` open), Green/Red LEDs, and Active Buzzer.

## Repository Structure Rules
- `index.html`: Must remain in the repository root for GitHub Pages static deployment (no bundler required).
- `assets/css/` & `assets/js/`: All frontend styles and scripts. Do NOT place loose `.js` or `.css` files in root.
- `database/`: Contains `firebase_data_seed.json` (1-click import) and `database.rules.json`.
- `firmware/`: Contains PlatformIO config (`platformio.ini`), main ESP32 firmware (`SmartRationSystem/`), and hardware calibration/enrollment utilities (`tools/`). See `firmware/AGENTS.md`.
- `scripts/`: Windows batch and PowerShell automation scripts (library installation, PlatformIO upload & serial log monitoring).
- `docs/`: Architecture, circuit schematics, wiring guides, Firebase, GitHub Pages, and SMS guides.

## User Roles & Business Logic
1. **Super Admin (`admin`):**
   - Full CRUD on Ration Cards (`/cards`) and Family Members (including photo upload / webcam snapshot capture and R307 Fingerprint Slot IDs `1..127`).
   - Manages Commodity Quotas (`/commodities`): Default is **5 kg Rice + 5 kg Ragi per person** (`allocatedQuota = membersCount * kgPerPerson`).
   - Manages Fair Price Shop Stores (`/stores`) with physical address & GPS coordinates.
   - Creates & manages Store Distribution Operators (`/operators`) linked to a specific `storeId`.
   - Sends Broadcast SMS notifications to all registered consumers.
2. **Store Distribution Operator (`operator`):**
   - Logs in and operates under their assigned Fair Price Shop store location.
   - Searches/enters Ration Card Number or receives automatic lookup when RFID card is tapped on ESP32.
   - Views family member list with **member photos**, age, relation, and registered fingerprint slot IDs.
   - Verifies beneficiary via **Biometric Fingerprint** (R307) OR **Mobile OTP** (6-digit hybrid SMS + on-screen demo fallback).
   - Triggers/monitors sequential Rice $\rightarrow$ Ragi dispensing.
3. **Beneficiary (`beneficiary`):**
   - Self-service portal to view card eligibility, family member biometrics, commodity quotas, and printable receipts.

## Coding & Contribution Conventions
- **Zero-build Frontend:** Keep frontend compatible with static GitHub Pages hosting (no Node/Webpack build steps required for `index.html`). Use Firebase JS v8 compat SDK (`firebase-app.js`, `firebase-auth.js`, `firebase-database.js`).
- **Dual-Commodity Standard:** Always track `riceKg` and `ragiKg` separately in cards, transactions, and active sessions.
- **Duplicate Prevention:** Always check `distributedThisMonth` before authorizing dispensing or OTP generation.
- **Documentation Sync:** Whenever pinouts, Firebase schema keys, or scripts change, update `README.md`, `database/firebase_data_seed.json`, and the relevant file in `docs/`.
