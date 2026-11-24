# Smart Public Ration Distribution System Using RFID Authentication and Real-Time SMS Notifications

[![ESP32](https://img.shields.io/badge/Hardware-ESP32%20DevKit%20V1-blue.svg)](https://www.espressif.com/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Auth%20%2B%20RTDB-orange.svg)](https://firebase.google.com/)
[![GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-brightgreen.svg)](https://pages.github.com/)
[![PlatformIO](https://img.shields.io/badge/Firmware-PlatformIO%20%2B%20Arduino-orange.svg)](https://platformio.org/)

An enterprise-grade, IoT-enabled Public Distribution System (PDS) automated dispensing platform designed to eliminate ration diversion and ghost beneficiaries via **RFID Smart Card + R307 Biometric / Mobile OTP Verification**, **Sequential Dual-Commodity Gravimetric Dispensing (5 kg Rice + 5 kg Ragi per person)**, **Store Location & Operator Management**, and **Real-Time SMS Notifications**.

---

## 🌟 Key Capabilities

1. **Role-Based Access (Admin, Store Operator, Beneficiary):**
   - **Super Admin:** Full CRUD on Ration Cards, Family Members (with **Webcam Photo Capture & Image Upload**), Fair Price Shop **Stores & GPS Locations**, **Store Operator** accounts, and **Commodity Quotas (5 kg Rice + 5 kg Ragi per person)**.
   - **Store Distribution Operator:** Logs in to their assigned store location, searches/scans Ration Card No, displays household members with photos, verifies via **Biometric Fingerprint** OR **Mobile OTP**, and authorizes dispensing.
   - **Beneficiary Portal:** Self-service portal for families to inspect quotas, enrolled biometrics, and print official receipts.
2. **Sequential Dual-Commodity Dispensing (`Rice` $\rightarrow$ `Ragi`):**
   - **Stage 1 (Rice):** Servo opens to **60°**, HX711 tracks weight until `members × 5 kg`, closes at **0°**.
   - **Stage 2 (Vessel Swap):** Prompts on LCD & Web Dashboard; user confirms via onboard `BOOT` button (`GPIO 0`), RFID re-tap, or Web button.
   - **Stage 3 (Ragi):** Tares scale, opens servo to **60°** until `members × 5 kg`, closes at **0°**, logs transaction, and sends SMS receipt.
3. **3-Mode Load Cell Weight Engine (Built for Fast Demos):**
   - **Demo Scale Ratio (`1:100`):** `10.0 kg` quota cuts off at **100g** physical weight for clean tabletop demos.
   - **5-Second Water Bottle Auto-Calibrate:** Place a 500ml water bottle (`0.50 kg`) and click **"Trigger 500g Bottle Auto-Calibrate"** in the dashboard.
   - **Safe Timed Fallback:** Automatically runs a 4-second timed demo dispense if the load cell is not mounted yet.

---

## 👥 Pre-Configured Accounts & Ration Cards

### Staff & Admin Credentials
| Role | Email / ID | Password | Assigned Store |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@smartration.gov` | `Admin@Ration2026` | All Stores |
| **Store Operator 1** | `operator@fps42.gov` | `Operator@2026` | `FPS_KA_BLR_042` (Gandhi Nagar) |
| **Store Operator 2** | `operator@fps88.gov` | `Operator@2026` | `FPS_KA_BLR_088` (Indiranagar) |

### Ration Cards (5 kg Rice + 5 kg Ragi per Member)
| Card ID | Head Name | Members | Rice + Ragi Quota | Login ID / Password | FP Slots |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **RC101** | Ramesh Kumar | **2** | **10 kg Rice + 10 kg Ragi** | `RC101` / `User@101` | **#1, #2** |
| **RC102** | Rajesh Patel | **3** | **15 kg Rice + 15 kg Ragi** | `RC102` / `User@102` | **#3, #4, #5** |
| **RC103** | Suresh Sharma | **4** | **20 kg Rice + 20 kg Ragi** | `RC103` / `User@103` | **#6, #7, #8, #9** |

---

## 📂 Repository Structure

```text
.
├── AGENTS.md                        # Master AI agent context & architecture rules
├── README.md                        # Project overview & quick start
├── index.html                       # GitHub Pages entry point
├── assets/
│   ├── css/styles.css               # Custom styling
│   └── js/
│       ├── firebase-config.js       # Firebase Auth + RTDB configuration
│       └── app.js                   # Role-based UI, OTP, photos, telemetry
├── database/
│   ├── firebase_data_seed.json      # 1-Click seed (stores, operators, commodities, 3 cards)
│   └── database.rules.json          # Firebase indexing & security rules
├── firmware/
│   ├── AGENTS.md                    # ESP32 firmware guidelines & pin constraints
│   ├── platformio.ini               # PlatformIO config (esp32dev)
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
    ├── GITHUB_PAGES_SETUP_GUIDE.md  # GitHub Pages deployment for Harsha3108
    ├── FIREBASE_SETUP_GUIDE.md      # Firebase import & rules guide
    ├── SMS_INTEGRATION_GUIDE.md     # Broadcast SMS, OTP & Twilio/Fast2SMS setup
    └── LIBRARIES_INSTALLATION_GUIDE.md
```

---

## ⚡ Quick Start

1. **Web App (Local or GitHub Pages):** Open [index.html](index.html) in your browser or deploy to `https://harsha3108.github.io/smart-ration-system/` via [GitHub Pages Guide](docs/GITHUB_PAGES_SETUP_GUIDE.md).
2. **Firebase Backend:** Import `database/firebase_data_seed.json` into your Firebase RTDB console ([Firebase Guide](docs/FIREBASE_SETUP_GUIDE.md)).
3. **ESP32 Firmware & Live Logs:**
   - Update your **2.4 GHz Wi-Fi** credentials in `firmware/SmartRationSystem/Config.h`.
   - Connect your ESP32 via USB and double-click `scripts/upload_and_monitor.bat` (uses PlatformIO) **or** open `firmware/SmartRationSystem/SmartRationSystem.ino` in Arduino IDE.
