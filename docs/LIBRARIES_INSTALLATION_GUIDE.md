# Required Arduino Libraries & Installation Guide
## Smart Public Ration Distribution System (ESP32)

To compile and upload the ESP32 firmware ([SmartRationSystem.ino](../firmware/SmartRationSystem/SmartRationSystem.ino)), you need **6 external Arduino libraries**.

---

## 📦 Required Libraries Summary

| Library Name | Author | Purpose in Project |
| :--- | :--- | :--- |
| **`MFRC522`** | GithubCommunity / Miguel Balboa | RC522 RFID 13.56MHz SPI communication & UID reading |
| **`LiquidCrystal_I2C`** | Frank de Brabander | 16x2 Character LCD control via PCF8574 I2C backpack |
| **`Adafruit Fingerprint Sensor Library`** | Adafruit | R307 Optical Sensor UART control, template search & enrollment |
| **`HX711 Arduino Library`** | Bogdan Necula | 24-bit ADC readout and calibration for the strain gauge load cell |
| **`ESP32Servo`** | Kevin Harrington | Hardware PWM servo control on ESP32 (0° closed to 60° open) |
| **`ArduinoJson`** | Benoit Blanchon | Parsing Firebase Realtime Database JSON payloads (v6 or v7) |

---

## 🚀 Method 1: Automated 1-Click Installer (Fastest)

We have created an automated installer in the root of your project:
- **File:** [`install_libraries.bat`](../install_libraries.bat) (or [`install_libraries.ps1`](../install_libraries.ps1))

### How to Run:
1. Open your File Explorer to `c:\mmmmmmm\`.
2. Double-click **`install_libraries.bat`** (or right-click `install_libraries.ps1` $\rightarrow$ **Run with PowerShell**).
3. The script will automatically:
   - Check if you have `arduino-cli` installed and use it if available.
   - Otherwise, download the latest official releases from GitHub.
   - Unzip and place all 6 libraries into your Arduino libraries folder:
     `%USERPROFILE%\Documents\Arduino\libraries\`
4. When finished, you will see `[INSTALLATION COMPLETE!]`. Restart Arduino IDE, and you are ready to compile!

---

## 🖥️ Method 2: Installing via Arduino IDE Library Manager (Recommended GUI)

If you prefer to install through the official Arduino IDE GUI:

1. Open **Arduino IDE**.
2. Open the Library Manager:
   - Click the **Library icon** (bookshelf icon) in the left sidebar, or
   - Go to menu: **Sketch** $\rightarrow$ **Include Library** $\rightarrow$ **Manage Libraries...** (Shortcut: `Ctrl + Shift + I`).
3. Search and install each library:
   - **MFRC522:**
     - Type: `MFRC522`
     - Select: **MFRC522** by *GithubCommunity* $\rightarrow$ Click **Install**.
   - **LiquidCrystal I2C:**
     - Type: `LiquidCrystal I2C`
     - Select: **LiquidCrystal I2C** by *Frank de Brabander* $\rightarrow$ Click **Install**.
   - **Adafruit Fingerprint:**
     - Type: `Adafruit Fingerprint`
     - Select: **Adafruit Fingerprint Sensor Library** by *Adafruit* $\rightarrow$ Click **Install** *(if prompted to install dependencies, click "Install All")*.
   - **HX711:**
     - Type: `HX711`
     - Select: **HX711 Arduino Library** by *Bogdan Necula* $\rightarrow$ Click **Install**.
   - **ESP32Servo:**
     - Type: `ESP32Servo`
     - Select: **ESP32Servo** by *Kevin Harrington* $\rightarrow$ Click **Install**.
   - **ArduinoJson:**
     - Type: `ArduinoJson`
     - Select: **ArduinoJson** by *Benoit Blanchon* $\rightarrow$ Click **Install** *(select version 6.21.x or 7.x)*.

---

## 🌐 Method 3: Direct Manual ZIP Downloads

If your computer is behind a firewall, you can download the ZIPs directly and add them via **Sketch** $\rightarrow$ **Include Library** $\rightarrow$ **Add .ZIP Library...**:

1. [MFRC522 ZIP](https://github.com/OSSLibraries/Arduino_MFRC522/archive/refs/heads/master.zip)
2. [LiquidCrystal_I2C ZIP](https://github.com/johnrickman/LiquidCrystal_I2C/archive/refs/heads/master.zip)
3. [Adafruit Fingerprint Sensor Library ZIP](https://github.com/adafruit/Adafruit-Fingerprint-Sensor-Library/archive/refs/heads/master.zip)
4. [HX711 Arduino Library ZIP](https://github.com/bogde/HX711/archive/refs/heads/master.zip)
5. [ESP32Servo ZIP](https://github.com/madhephaestus/ESP32Servo/archive/refs/heads/master.zip)
6. [ArduinoJson v6.21.4 ZIP](https://github.com/bblanchon/ArduinoJson/archive/refs/tags/v6.21.4.zip)

---

## ⚡ ESP32 Board Package in Arduino IDE

In addition to the libraries, ensure you have the **ESP32 Board Package** installed:
1. In Arduino IDE, go to **File** $\rightarrow$ **Preferences**.
2. In **Additional boards manager URLs**, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools** $\rightarrow$ **Board** $\rightarrow$ **Boards Manager...**
4. Search for `esp32` by *Espressif Systems* and click **Install**.
5. Select board: **Tools** $\rightarrow$ **Board** $\rightarrow$ **ESP32 Arduino** $\rightarrow$ **ESP32 Dev Module**.
