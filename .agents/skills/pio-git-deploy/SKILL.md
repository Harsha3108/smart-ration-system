---
name: pio-git-deploy
description: >-
  Build and flash ESP32 firmware with PlatformIO on Windows, push clean Git history
  to GitHub, verify GitHub Pages deployment, and seed/verify Firebase RTDB.
  Use when compiling/uploading ESP32 code, pushing to GitHub, or checking live deployment status.
---

# ESP32 PlatformIO, GitHub Pages & Firebase Deployment Runbook

## 1. Windows Tool Paths & Environment
- Do not rely on bare `python`, `pio`, or `git` in sandboxed shells (`WindowsApps\python.exe` is a store alias that fails).
- Resolve explicit executables when needed (with user approval outside sandbox):
  - PlatformIO: `C:\Users\user\python311\Scripts\pio.exe`
  - Python 3.11: `C:\Users\user\python311\python.exe`
  - Git: `C:\Program Files\Git\cmd\git.exe`

## 2. Firmware Build & Upload (`COM6`)
1. Confirm `firmware/SmartRationSystem/Config.h` does not still contain `"YOUR_WIFI_SSID"` before final field upload.
2. Verify connected serial ports: `[System.IO.Ports.SerialPort]::GetPortNames()`
3. Compile first: `C:\Users\user\python311\Scripts\pio.exe run -d c:\mmmmmmm\firmware`
4. Upload & monitor: `C:\Users\user\python311\Scripts\pio.exe run -d c:\mmmmmmm\firmware -t upload` and read `COM6` at `115200` baud.

## 3. Git & GitHub Pages Verification
1. Verify `.gitignore` excludes `firmware/.pio/`, `.pio/`, `*.bin`, `*.elf` before `git add .`.
2. Add `.nojekyll` and `.github/workflows/deploy-pages.yml` so GitHub Pages skips Jekyll and reports workflow runs in the Actions tab.
3. If `git push -u origin main` hangs under `credential.helper = manager` in a background shell, instruct the user to run it once in an interactive terminal so the browser OAuth prompt can appear.
4. Always probe the live Pages URL (`Invoke-WebRequest -Uri "https://harsha3108.github.io/smart-ration-system/" -UseBasicParsing`); if it returns `404`, direct the user to `Settings -> Pages -> Deploy from a branch -> main / (root) -> Save`.

## 4. Firebase RTDB Seeding & Verification
1. Check connectivity: `Invoke-RestMethod -Uri "https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/.json?shallow=true"`
2. Seed database via `PUT` `database/firebase_data_seed.json` to `/.json` and verify `/cards.json?shallow=true` and `/operators.json?shallow=true`.
