# Smart Public Ration Distribution System Using RFID Authentication and Real-Time SMS Notifications

[![ESP32](https://img.shields.io/badge/Hardware-ESP32%20DevKit%20V1-blue.svg)](https://www.espressif.com/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Auth%20%2B%20RTDB-orange.svg)](https://firebase.google.com/)
[![GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-brightgreen.svg)](https://harsha3108.github.io/smart-ration-system/)
[![PlatformIO](https://img.shields.io/badge/Firmware-PlatformIO%20%2B%20Arduino-orange.svg)](https://platformio.org/)

An enterprise-grade, IoT-enabled Public Distribution System (e-PDS) automated dispensing platform built for the Department of Food, Civil Supplies & Consumer Affairs. Designed to eliminate ration diversion and ghost beneficiaries via **RFID Smart Card + R307 Biometric / Mobile OTP Verification**, **Sequential Dual-Commodity Gravimetric Dispensing (5 kg Rice + 5 kg Ragi per person)**, **Store Location & Operator Management**, and **Real-Time SMS Notifications**.

**Live Portal:** https://harsha3108.github.io/smart-ration-system/

---

## System Capabilities

1. **Enforced Role-Based Access Control (`Admin` & `Store Distributor` Only):**
   - **State Administrator (`admin`):** Full CRUD on Ration Cards, Family Members (with **Webcam Photo Capture & Image Upload**), Fair Price Shop **Stores & GPS Locations**, **Store Distributors**, and **Commodity Quotas (5 kg Rice + 5 kg Ragi per person)**.
   - **Store Distributor (`operator`):** Authenticated staff assigned to a Fair Price Shop store location; looks up Ration Cards, verifies citizen photos, authorizes distribution via **Biometric Fingerprint** or **6-Digit Mobile OTP**, and monitors live dispensing.
   - *(Citizens do not have web logins; they present their physical RFID Ration Card at the store counter).*
2. **Sequential Dual-Commodity Dispensing (`Rice` -> `Ragi`):**
   - **Stage 1 (Rice):** Servo opens to **60 deg**, HX711 tracks weight until `members x 5 kg`, closes at **0 deg**.
   - **Stage 2 (Vessel Swap):** Prompts on LCD & Web Dashboard; operator/citizen confirms via onboard `BOOT` button (`GPIO 0`), RFID re-tap, or Web button.
   - **Stage 3 (Ragi):** Tares scale, opens servo to **60 deg** until `members x 5 kg`, closes at **0 deg**, logs transaction, and sends SMS receipt.
3. **3-Mode Load Cell Weight Engine:**
   - **Demo Scale Ratio (`1:100`):** `10.0 kg` quota cuts off at **100g** physical weight for clean tabletop demos.
   - **5-Second Water Bottle Auto-Calibrate:** Place a 500ml water bottle (`0.50 kg`) and trigger calibration from the Admin Console.
   - **Safe Timed Fallback:** Runs a 4-second timed demo dispense if the load cell is not mounted yet.

---

## Pre-Configured Accounts & Ration Cards

See **[CREDENTIALS.md](CREDENTIALS.md)** for the full login directory:
- **Super Admin:** `admin@pds.gov.in` / `Admin@2026`
- **3 Store Distributors:** `operator1@pds.gov.in` (`Operator@101`), `operator2@pds.gov.in` (`Operator@102`), `operator3@pds.gov.in` (`Operator@103`)
- **3 Registered Ration Cards (2, 3, 4 members, no web login):** `RC101`, `RC102`, `RC103`

---

## Repository Structure

```text
.
├── AGENTS.md                        # Master AI agent context & architecture rules
├── CREDENTIALS.md                   # Admin, 3 Store Operators & 3 Citizen Card logins
├── README.md                        # Project overview & quick start
├── index.html                       # GitHub Pages entry point (Login Gate + e-PDS Portal)
├── .nojekyll                        # Static GitHub Pages marker
├── .github/workflows/deploy-pages.yml
├── assets/
│   ├── css/styles.css               # Government PDS styling
│   └── js/
│       ├── firebase-config.js       # Firebase Auth + RTDB configuration
│       └── app.js                   # Role-based UI, OTP, photos, telemetry
├── database/
│   ├── firebase_data_seed.json      # 1-Click seed (3 stores, 3 operators, commodities, 3 cards)
│   └── database.rules.json          # Firebase indexing & security rules
├── firmware/
│   ├── AGENTS.md                    # ESP32 firmware guidelines & pin constraints
│   ├── platformio.ini               # PlatformIO config (esp32dev on COM6)
│   ├── SmartRationSystem/           # Master ESP32 firmware & bundled local libs
│   └── tools/
│       ├── CalibrateHX711/          # HX711 calibration sketch
│       └── EnrollFingerprint/       # R307 enrollment sketch (slots 1-127)
├── scripts/
│   ├── install_libraries.bat        # Automated Arduino library installer
│   ├── install_libraries.ps1        # PowerShell library installer
│   └── upload_and_monitor.bat       # PlatformIO 1-click compile, flash & serial monitor
└── docs/
    ├── CIRCUIT_DIAGRAM.md           # Pinouts, block diagrams & power protection
    ├── HARDWARE_WIRING.md           # Physical assembly & troubleshooting
    ├── GITHUB_PAGES_SETUP_GUIDE.md  # GitHub Pages deployment guide
    ├── FIREBASE_SETUP_GUIDE.md      # Firebase import & rules guide
    ├── SMS_INTEGRATION_GUIDE.md     # Broadcast SMS, OTP & Twilio/Fast2SMS setup
    └── LIBRARIES_INSTALLATION_GUIDE.md
```
