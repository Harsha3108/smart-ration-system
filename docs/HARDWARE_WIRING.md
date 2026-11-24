# Hardware Assembly & Component Wiring Guide
## Smart Public Ration Distribution System

This document provides step-by-step physical assembly, testing, and troubleshooting guidelines for all hardware peripherals.

---

## 1. Required Hardware Checklist

| Item | Specification | Quantity | Purpose |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32 DevKit V1 (30 or 38 pins) | 1 | Master IoT Controller with Wi-Fi & Dual Core |
| **RFID Module** | RC522 13.56MHz SPI Reader + Cards | 1 Reader + 3 Cards | Beneficiary Identification |
| **Display** | 16x2 Character LCD with PCF8574 I2C Backpack | 1 | Consumer instruction & weight display |
| **Biometric Sensor** | R307 Optical Fingerprint Scanner (UART) | 1 | 1:N Biometric verification |
| **Weight Sensor** | 5kg or 10kg Load Cell + HX711 24-bit ADC | 1 Set | Closed-loop grain mass measurement |
| **Actuator** | Servo Motor (TowerPro MG995 / MG996R or SG90) | 1 | 0° to 60° Rotary Chute Gate |
| **Indicators** | 5mm Green LED & 5mm Red LED | 1 each | Visual feedback (Success / Error) |
| **Audio Alert** | 5V Active Buzzer | 1 | Audible transaction feedback |
| **Resistors** | 330 $\Omega$ (x2), 100 $\Omega$ (x1) | 3 | Current limiting for LEDs and Buzzer |
| **Power Supply** | 5V 3A DC Power Adapter | 1 | Powering ESP32, Servo, and sensors |
| **Capacitor** | 470 $\mu$F or 1000 $\mu$F 16V Electrolytic | 1 | Decoupling / Surge filtering for Servo |

---

## 2. Step-by-Step Peripheral Integration

### Step 1: Connect the RFID RC522 Reader (SPI)
> [!IMPORTANT]
> **RC522 operates strictly at 3.3V logic and 3.3V power.** Connecting it to the 5V rail will permanently destroy the MFRC522 IC.
- Connect `VCC` $\rightarrow$ ESP32 `3V3`
- Connect `GND` $\rightarrow$ ESP32 `GND`
- Connect `RST` $\rightarrow$ ESP32 `GPIO 4`
- Connect `SDA (SS)` $\rightarrow$ ESP32 `GPIO 5`
- Connect `SCK` $\rightarrow$ ESP32 `GPIO 18`
- Connect `MISO` $\rightarrow$ ESP32 `GPIO 19`
- Connect `MOSI` $\rightarrow$ ESP32 `GPIO 23`

### Step 2: Connect the 16x2 I2C LCD Display
- Connect `VCC` $\rightarrow$ ESP32 `VIN` (5V from USB/Adapter)
- Connect `GND` $\rightarrow$ ESP32 `GND`
- Connect `SDA` $\rightarrow$ ESP32 `GPIO 21`
- Connect `SCL` $\rightarrow$ ESP32 `GPIO 22`
- *Adjustment:* If text is not visible, adjust the blue potentiometer on the back of the I2C backpack with a small screwdriver until letters appear crisp.

### Step 3: Connect the R307 Optical Fingerprint Sensor
The R307 has a 6-pin JST connector. Only 4 wires are needed:
- **Red wire (VCC)** $\rightarrow$ 5V rail (VIN)
- **Black wire (GND)** $\rightarrow$ Common GND
- **Yellow wire (TX)** $\rightarrow$ ESP32 `GPIO 16` (RX2)
- **Green wire (RX)** $\rightarrow$ ESP32 `GPIO 17` (TX2)
- *(Leave White and Blue wake-up pins unconnected)*

### Step 4: Connect the HX711 Load Cell
1. Mount the load cell bar securely between two acrylic/wooden plates:
   - Fixed end bolted to bottom base.
   - Cantilever (floating) end bolted to weighing tray.
   - Observe arrow on load cell pointing in direction of gravitational force.
2. Solder or wire load cell 4-pin lead to HX711 board:
   - Red $\rightarrow$ `E+`
   - Black $\rightarrow$ `E-`
   - White $\rightarrow$ `A-`
   - Green $\rightarrow$ `A+`
3. Wire HX711 board to ESP32:
   - `VCC` $\rightarrow$ 3.3V or 5V
   - `GND` $\rightarrow$ GND
   - `DT (DOUT)` $\rightarrow$ ESP32 `GPIO 32`
   - `SCK` $\rightarrow$ ESP32 `GPIO 33`

### Step 5: Connect the Servo Motor
- **Signal wire (Orange/Yellow)** $\rightarrow$ ESP32 `GPIO 13`
- **Power wire (Red)** $\rightarrow$ External 5V rail (DO NOT use ESP32 3.3V pin!)
- **Ground wire (Brown/Black)** $\rightarrow$ Common Ground
- Place a 470 $\mu$F capacitor between Red and Brown wires to prevent brownout reset.

### Step 6: Connect Status LEDs & Buzzer
- **Green LED:** Anode $\rightarrow$ 330 $\Omega$ $\rightarrow$ ESP32 `GPIO 26`. Cathode $\rightarrow$ GND.
- **Red LED:** Anode $\rightarrow$ 330 $\Omega$ $\rightarrow$ ESP32 `GPIO 27`. Cathode $\rightarrow$ GND.
- **Active Buzzer:** Positive (+) $\rightarrow$ 100 $\Omega$ $\rightarrow$ ESP32 `GPIO 14`. Negative (-) $\rightarrow$ GND.

---

## 3. Hardware Diagnostic Checklist

| Test | Expected Output | If Failed |
| :--- | :--- | :--- |
| **Power On** | ESP32 Power LED ON, LCD Backlight ON | Check USB cable / 5V power adapter |
| **I2C LCD** | Shows "Smart Ration Sys" | Check SDA=21, SCL=22, turn contrast screw |
| **RC522 RFID** | Serial prints `RC522 Version: 0x92` | Check SPI wiring, verify 3.3V connection |
| **R307 Sensor** | Red optical light blinks inside sensor glass | Check RX/TX crossover (Sensor TX $\rightarrow$ ESP32 RX2) |
| **HX711** | Serial prints steady weight `0.00 kg` | Check E+, E-, A+, A- wiring order |
| **Servo Motor** | Snaps firmly to 0° (Closed) upon boot | Check PWM GPIO 13 and external 5V power |
