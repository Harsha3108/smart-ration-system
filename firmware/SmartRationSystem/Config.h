#ifndef CONFIG_H
#define CONFIG_H

// =========================================================================
// SMART PUBLIC RATION DISTRIBUTION SYSTEM - HARDWARE & NETWORK CONFIG
// Controller: ESP32 DevKit V1
// =========================================================================

// --- 1. WiFi Network Credentials (MUST BE 2.4 GHz WiFi) ---
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"

// --- 2. Firebase Realtime Database Configuration ---
#define FIREBASE_HOST       "beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH       ""

// --- 3. Hardware Pin Mapping ---

// RFID RC522 (VSPI - Strictly 3.3V Power)
#define RFID_SS_PIN         5    // SDA / SS
#define RFID_RST_PIN        4    // Reset
#define RFID_SCK_PIN        18   // SPI Clock
#define RFID_MISO_PIN       19   // SPI MISO
#define RFID_MOSI_PIN       23   // SPI MOSI

// 16x2 I2C LCD (Auto-scans 0x27 and 0x3F on boot)
#define LCD_I2C_ADDR        0x27
#define LCD_COLS            16
#define LCD_ROWS            2
#define I2C_SDA_PIN         21
#define I2C_SCL_PIN         22

// R307 Optical Fingerprint Sensor (UART2)
#define R307_RX_PIN         16   // ESP32 RX2 -> R307 TX (Yellow)
#define R307_TX_PIN         17   // ESP32 TX2 -> R307 RX (Green)
#define R307_BAUDRATE       57600

// HX711 Load Cell Amplifier
#define HX711_DOUT_PIN      32   // Data Out
#define HX711_SCK_PIN       33   // Serial Clock
#define DEFAULT_CALIBRATION 420.5f

// Servo Motor (Dispensing Funnel Shutter - External 5V + Capacitor)
#define SERVO_PIN           13   // PWM Signal
#define SERVO_CLOSED_ANGLE  0    // Valve fully closed
#define SERVO_OPEN_ANGLE    60   // Valve open for dispensing

// Indicators, Buzzer & Stage Confirmation
#define GREEN_LED_PIN       26   // Success LED
#define RED_LED_PIN         27   // Error / Rejection LED
#define BUZZER_PIN          14   // Active Buzzer
#define STAGE_CONFIRM_BTN   0    // ESP32 Onboard BOOT button (GPIO 0, Active LOW)

// --- 4. Weight Demo Mode & Dual Commodity Quotas ---
#define DEFAULT_DEMO_MODE       true    // Scale physical grams for tabletop demo
#define DEFAULT_DEMO_RATIO      100.0f  // 1:100 (10.0 kg quota = 100g on load cell)
#define DEMO_TIMED_FALLBACK_MS  4000    // Fallback dispense duration if load cell unmounted
#define DEFAULT_RICE_PER_PERSON 5.0f
#define DEFAULT_RAGI_PER_PERSON 5.0f
#define WEIGHT_FLOW_TOLERANCE   0.05f

// --- 5. SMS Gateway Configuration ---
#define USE_TWILIO_SMS      false
#define TWILIO_ACCOUNT_SID  "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
#define TWILIO_AUTH_TOKEN   "your_twilio_auth_token"
#define TWILIO_FROM_PHONE   "+1234567890"

// --- 6. Operational Parameters ---
#define FP_VERIFY_TIMEOUT_SEC   15
#define SHOP_ID                 "FPS_KA_BLR_042"

#endif // CONFIG_H
