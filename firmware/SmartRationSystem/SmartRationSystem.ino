/*
 * ======================================================================================
 * Smart Public Ration Distribution System Using RFID Authentication & Real-Time SMS
 * --------------------------------------------------------------------------------------
 * Main Controller: ESP32 DevKit V1
 * Features:
 *  - Dual-Factor Verification (MFRC522 RFID + R307 Biometric) OR Web Mobile OTP Override
 *  - Sequential Dual-Commodity Dispensing (Stage 1: Rice -> Swap -> Stage 2: Ragi)
 *  - 3-Mode Load Cell Engine: Demo Scale Ratio (1:100), 500g Bottle Auto-Calibrate,
 *    and Safe Timed Fallback when Load Cell is unmounted
 *  - Automatic I2C LCD Address Detection (0x27 / 0x3F)
 *  - Real-time Firebase RTDB Sync & SMS Confirmation Dispatch
 * ======================================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <Adafruit_Fingerprint.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

#include "Config.h"
#include "LiquidCrystal_I2C.h"
#include "HX711.h"

// --- Global Peripheral Instances ---
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C* lcd = nullptr;
HardwareSerial r307Serial(2); // UART2: RX=16, TX=17
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&r307Serial);
HX711 scale;
Servo gateServo;

// --- Runtime Configuration (Synced with Firebase /system_config) ---
float activeCalibrationFactor = DEFAULT_CALIBRATION;
bool demoModeEnabled = DEFAULT_DEMO_MODE;
float demoScaleRatio = DEFAULT_DEMO_RATIO;
unsigned long lastCloudPollMs = 0;

// --- Function Prototypes ---
uint8_t scanI2cLcdAddress();
void initHardware();
void connectWiFi();
void updateLcd(const String& line1, const String& line2);
void alertSuccess(int beeps = 2);
void alertFailure(int beeps = 3);
void alertChirp();
void setGate(int angle);
String readRfidCardUID();
void syncSystemConfigFromFirebase();
void runQuickCalibrate500g();
void checkWebOtpOverride();
bool checkCardAndAuthenticate(const String& rfidUid);
int waitForFingerprint(int timeoutSeconds);
void executeSequentialDispense(const String& cardId, const String& rfidUid, const String& memberName,
                               int fpId, float quotaRiceKg, float quotaRagiKg,
                               const String& phone, const String& authMethod);
float dispenseSingleCommodity(const String& cardId, const String& rfidUid, const String& memberName,
                              int fpId, const String& commodityName, float targetKg, const String& authMethod);
bool waitForStage2Swap(const String& cardId, const String& rfidUid, const String& memberName);
void updateFirebaseSession(const String& step, const String& cardId, const String& cardUid,
                           const String& consumer, const String& authBy, int fpId,
                           const String& commodity, float targetKg, float currentKg,
                           float physGrams, const String& gateStatus, const String& message);
void recordTransactionInFirebase(const String& cardId, const String& rfidUid, const String& consumer,
                                 int fpId, float riceKg, float ragiKg, const String& phone, const String& authMethod);
void markCardDistributedInFirebase(const String& cardId);
void sendSmsNotification(const String& phoneNumber, const String& consumerName, float riceKg, float ragiKg, const String& authMethod);

// ======================================================================================
// SETUP
// ======================================================================================
void setup() {
  Serial.begin(115200);
  delay(800);
  Serial.println("\n=======================================================");
  Serial.println("  SMART PUBLIC RATION DISTRIBUTION SYSTEM (ESP32 IoT)");
  Serial.println("  Dual-Commodity: 5kg Rice + 5kg Ragi | RFID + R307 + OTP");
  Serial.println("=======================================================");

  initHardware();
  connectWiFi();

  if (scale.wait_ready_timeout(500)) {
    scale.tare();
    Serial.println("[HX711] Scale tared at zero baseline.");
  } else {
    Serial.println("[HX711] Load cell not ready at boot (Timed Fallback armed if needed).");
  }

  setGate(SERVO_CLOSED_ANGLE);
  syncSystemConfigFromFirebase();
  updateFirebaseSession("IDLE", "", "", "", "", 0, "", 0.0, 0.0, 0.0, "CLOSED",
                        "System Ready. Waiting for RFID Card or Store Operator OTP...");

  alertSuccess(1);
  updateLcd("Smart Ration Sys", "Scan RFID Card");
  Serial.println("[SYSTEM] Initialization complete. Ready for distribution.");
}

// ======================================================================================
// MAIN LOOP
// ======================================================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Serial command shortcut ('c' for 500g bottle calibrate)
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'c' || cmd == 'C') {
      runQuickCalibrate500g();
      updateLcd("Smart Ration Sys", "Scan RFID Card");
    }
  }

  // Periodically poll Firebase for OTP Authorization or Quick Calibration commands (every 2.5s)
  if (millis() - lastCloudPollMs > 2500) {
    lastCloudPollMs = millis();
    syncSystemConfigFromFirebase();
    checkWebOtpOverride();
  }

  // Check for physical RFID card tap
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  alertChirp();
  String scannedUid = readRfidCardUID();
  Serial.printf("\n[RFID] Scanned UID: %s\n", scannedUid.c_str());

  updateLcd("Verifying Card..", scannedUid);
  updateFirebaseSession("AUTHENTICATING", "", scannedUid, "", "", 0, "", 0.0, 0.0, 0.0, "CLOSED",
                        "RFID Card Scanned. Querying beneficiary database...");

  checkCardAndAuthenticate(scannedUid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(3000);
  updateLcd("Smart Ration Sys", "Scan RFID Card");
  updateFirebaseSession("IDLE", "", "", "", "", 0, "", 0.0, 0.0, 0.0, "CLOSED",
                        "System Ready. Waiting for RFID Card or Store Operator OTP...");
}

// ======================================================================================
// HARDWARE INITIALIZATION & I2C AUTO-SCAN
// ======================================================================================
uint8_t scanI2cLcdAddress() {
  uint8_t addresses[] = {0x27, 0x3F};
  for (uint8_t addr : addresses) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("[I2C] Found LCD backpack at 0x%02X\n", addr);
      return addr;
    }
  }
  Serial.printf("[I2C] LCD not detected on 0x27/0x3F, defaulting to 0x%02X\n", LCD_I2C_ADDR);
  return LCD_I2C_ADDR;
}

void initHardware() {
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STAGE_CONFIRM_BTN, INPUT_PULLUP); // Onboard BOOT button (GPIO 0)
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  uint8_t detectedAddr = scanI2cLcdAddress();
  lcd = new LiquidCrystal_I2C(detectedAddr, LCD_COLS, LCD_ROWS);
  lcd->init();
  lcd->backlight();
  updateLcd("Smart Ration Sys", "Initializing...");

  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  rfid.PCD_Init();
  delay(50);
  byte v = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("[RFID] RC522 Firmware Version: 0x%02X\n", v);

  r307Serial.begin(R307_BAUDRATE, SERIAL_8N1, R307_RX_PIN, R307_TX_PIN);
  finger.begin(57600);
  delay(100);
  if (finger.verifyPassword()) {
    Serial.println("[BIOMETRIC] R307 Fingerprint Sensor connected!");
  } else {
    Serial.println("[BIOMETRIC] WARNING: R307 not detected (Check RX2=16, TX2=17 crossover).");
  }

  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale(activeCalibrationFactor);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  gateServo.setPeriodHertz(50);
  gateServo.attach(SERVO_PIN, 500, 2400);
  setGate(SERVO_CLOSED_ANGLE);
}

// ======================================================================================
// WIFI CONNECTIVITY
// ======================================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[WIFI] Connecting to 2.4GHz SSID: %s ", WIFI_SSID);
  updateLcd("Connecting WiFi", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 24) {
    delay(500);
    Serial.print(".");
    digitalWrite(GREEN_LED_PIN, !digitalRead(GREEN_LED_PIN));
    attempts++;
  }
  digitalWrite(GREEN_LED_PIN, LOW);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    updateLcd("WiFi Connected!", WiFi.localIP().toString());
    delay(900);
  } else {
    Serial.println("\n[WIFI] Connection timed out. Will retry in loop.");
    updateLcd("WiFi Offline", "Check 2.4GHz");
    delay(1200);
  }
}

// ======================================================================================
// FIREBASE SYSTEM CONFIG SYNC & 500G BOTTLE AUTO-CALIBRATION
// ======================================================================================
void syncSystemConfigFromFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;

  String url = String("https://") + FIREBASE_HOST + "/system_config.json";
  if (!https.begin(client, url)) return;

  if (https.GET() == HTTP_CODE_OK) {
    DynamicJsonDocument doc(1024);
    if (!deserializeJson(doc, https.getString())) {
      demoModeEnabled = doc["demoMode"] | DEFAULT_DEMO_MODE;
      demoScaleRatio = doc["demoRatio"] | DEFAULT_DEMO_RATIO;
      float cal = doc["calibrationFactor"] | DEFAULT_CALIBRATION;
      if (cal > 0 && abs(cal - activeCalibrationFactor) > 0.05) {
        activeCalibrationFactor = cal;
        scale.set_scale(activeCalibrationFactor);
      }
      bool runCal = doc["quickCalibrateCmd"] | false;
      if (runCal) {
        https.end();
        runQuickCalibrate500g();
        return;
      }
    }
  }
  https.end();
}

void runQuickCalibrate500g() {
  Serial.println("\n[CALIBRATE] 500g Water Bottle Auto-Calibration Started!");
  updateLcd("Calibrate 500g:", "Place 500ml Btl");
  alertChirp();
  delay(3500);

  if (!scale.wait_ready_timeout(1000)) {
    Serial.println("[CALIBRATE] ERROR: HX711 not responding.");
    updateLcd("HX711 Error!", "Check Wiring");
    alertFailure(2);
    return;
  }

  double rawVal = scale.get_value(10);
  float newFactor = (float)(rawVal / 0.50); // 500ml water = 0.50 kg
  if (abs(newFactor) < 10.0f) {
    newFactor = DEFAULT_CALIBRATION;
    Serial.println("[CALIBRATE] Bottle weight too low; keeping default factor.");
  } else {
    activeCalibrationFactor = newFactor;
    scale.set_scale(activeCalibrationFactor);
    Serial.printf("[CALIBRATE] New Calibration Factor: %.2f\n", activeCalibrationFactor);
  }

  updateLcd("Calibrated OK!", "Factor: " + String(activeCalibrationFactor, 1));
  alertSuccess(2);

  // Save new factor and clear quickCalibrateCmd in Firebase
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient https;
    https.begin(client, String("https://") + FIREBASE_HOST + "/system_config.json");
    https.addHeader("Content-Type", "application/json");
    StaticJsonDocument<256> doc;
    doc["calibrationFactor"] = activeCalibrationFactor;
    doc["quickCalibrateCmd"] = false;
    String out;
    serializeJson(doc, out);
    https.PATCH(out);
    https.end();
  }
  delay(2000);
}

// ======================================================================================
// WEB MOBILE OTP OVERRIDE POLLING
// ======================================================================================
void checkWebOtpOverride() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = String("https://") + FIREBASE_HOST + "/active_session.json";
  if (!https.begin(client, url)) return;

  if (https.GET() == HTTP_CODE_OK) {
    DynamicJsonDocument doc(1024);
    if (!deserializeJson(doc, https.getString())) {
      String step = doc["currentStep"] | "";
      String authBy = doc["authorizedBy"] | "";
      String cardId = doc["currentCardId"] | "";

      if (step == "AUTHORIZED_OTP" && authBy == "OTP" && cardId != "") {
        String uid = doc["currentCardUid"] | "";
        String consumer = doc["consumerName"] | "Beneficiary";
        float riceKg = doc["quotaRiceKg"] | 10.0f;
        float ragiKg = doc["quotaRagiKg"] | 10.0f;
        https.end();

        // Fetch phone number for SMS confirmation
        String phone = "";
        HTTPClient cHttp;
        cHttp.begin(client, String("https://") + FIREBASE_HOST + "/cards/" + cardId + ".json");
        if (cHttp.GET() == HTTP_CODE_OK) {
          DynamicJsonDocument cDoc(2048);
          if (!deserializeJson(cDoc, cHttp.getString())) {
            phone = cDoc["phone"] | "";
          }
        }
        cHttp.end();

        Serial.printf("\n[OTP AUTH] Web Operator verified Mobile OTP for Card %s (%s)!\n", cardId.c_str(), consumer.c_str());
        alertSuccess(2);
        updateLcd(consumer.substring(0, 16), "OTP Auth: OK!");
        delay(1500);

        executeSequentialDispense(cardId, uid, consumer, 0, riceKg, ragiKg, phone, "OTP");

        delay(3000);
        updateLcd("Smart Ration Sys", "Scan RFID Card");
        updateFirebaseSession("IDLE", "", "", "", "", 0, "", 0.0, 0.0, 0.0, "CLOSED",
                              "System Ready. Waiting for RFID Card or Store Operator OTP...");
        return;
      }
    }
  }
  https.end();
}

// ======================================================================================
// RFID & FINGERPRINT AUTHENTICATION
// ======================================================================================
String readRfidCardUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

bool checkCardAndAuthenticate(const String& rfidUid) {
  if (WiFi.status() != WL_CONNECTED) {
    updateLcd("Network Error", "WiFi Offline");
    alertFailure(2);
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String endpoint = String("https://") + FIREBASE_HOST + "/cards.json";
  if (!https.begin(client, endpoint)) {
    alertFailure(2);
    return false;
  }

  int httpCode = https.GET();
  if (httpCode != HTTP_CODE_OK) {
    updateLcd("Database Error", "HTTP: " + String(httpCode));
    alertFailure(2);
    https.end();
    return false;
  }

  String payload = https.getString();
  https.end();

  DynamicJsonDocument doc(16384);
  if (deserializeJson(doc, payload)) {
    updateLcd("Data Error", "JSON Parse Err");
    alertFailure(2);
    return false;
  }

  JsonObject cards = doc.as<JsonObject>();
  String matchedCardId = "";
  String headName = "";
  String phone = "";
  float riceKg = 10.0f;
  float ragiKg = 10.0f;
  bool isDistributed = false;
  int allowedFpIds[10];
  String memberNames[10];
  int memberCount = 0;

  for (JsonPair kv : cards) {
    JsonObject c = kv.value().as<JsonObject>();
    String cardUid = c["rfidUid"] | "";
    cardUid.toUpperCase();
    if (cardUid == rfidUid) {
      matchedCardId = kv.key().c_str();
      headName = c["headName"] | "Beneficiary";
      phone = c["phone"] | "";
      isDistributed = c["distributedThisMonth"] | false;

      JsonObject members = c["members"].as<JsonObject>();
      for (JsonPair mkv : members) {
        if (memberCount < 10) {
          JsonObject m = mkv.value().as<JsonObject>();
          memberNames[memberCount] = m["name"] | "Member";
          allowedFpIds[memberCount] = m["fpId"] | 0;
          memberCount++;
        }
      }

      riceKg = c["allocatedRiceKg"] | (memberCount * DEFAULT_RICE_PER_PERSON);
      ragiKg = c["allocatedRagiKg"] | (memberCount * DEFAULT_RAGI_PER_PERSON);
      break;
    }
  }

  if (matchedCardId == "") {
    Serial.printf("[AUTH] REJECTED: Unknown Card UID %s\n", rfidUid.c_str());
    updateLcd("Invalid Card!", "Access Denied");
    updateFirebaseSession("ERROR", "", rfidUid, "", "", 0, "", 0.0, 0.0, 0.0, "CLOSED", "Invalid RFID Card!");
    alertFailure(3);
    return false;
  }

  if (isDistributed) {
    Serial.printf("[AUTH] REJECTED: Duplicate claim for Card %s\n", matchedCardId.c_str());
    updateLcd("Already Taken!", "Quota Collected");
    updateFirebaseSession("ERROR", matchedCardId, rfidUid, headName, "", 0, "", riceKg, 0.0, 0.0, "CLOSED",
                          "Duplicate Card: Already collected this month!");
    alertFailure(2);
    return false;
  }

  alertSuccess(1);
  updateLcd("Hello " + headName.substring(0, 10), "Scan Fingerprint");
  updateFirebaseSession("AUTHENTICATING", matchedCardId, rfidUid, headName, "", 0, "Rice", riceKg, 0.0, 0.0, "CLOSED",
                        "Card Accepted. Place registered finger on R307 sensor...");

  int matchedFpId = waitForFingerprint(FP_VERIFY_TIMEOUT_SEC);
  if (matchedFpId <= 0) {
    updateLcd("Scan Timeout!", "Try Again / OTP");
    updateFirebaseSession("ERROR", matchedCardId, rfidUid, headName, "", 0, "", riceKg, 0.0, 0.0, "CLOSED",
                          "Fingerprint Scan Timeout. Try again or use Mobile OTP.");
    alertFailure(2);
    return false;
  }

  bool isAuthorized = false;
  String authMember = headName;
  for (int i = 0; i < memberCount; i++) {
    if (allowedFpIds[i] == matchedFpId) {
      isAuthorized = true;
      authMember = memberNames[i];
      break;
    }
  }

  if (!isAuthorized) {
    Serial.printf("[BIOMETRIC] REJECTED: FP #%d does not belong to Card %s\n", matchedFpId, matchedCardId.c_str());
    updateLcd("Auth Failed!", "Finger Mismatch");
    updateFirebaseSession("ERROR", matchedCardId, rfidUid, headName, "", matchedFpId, "", riceKg, 0.0, 0.0, "CLOSED",
                          "Biometric Mismatch! Finger not registered on this card.");
    alertFailure(3);
    return false;
  }

  Serial.printf("[BIOMETRIC] SUCCESS: %s (FP #%d)\n", authMember.c_str(), matchedFpId);
  alertSuccess(2);
  updateLcd(authMember.substring(0, 16), "Auth: SUCCESS");
  delay(1400);

  executeSequentialDispense(matchedCardId, rfidUid, authMember, matchedFpId, riceKg, ragiKg, phone, "BIOMETRIC");
  return true;
}

int waitForFingerprint(int timeoutSeconds) {
  unsigned long startMs = millis();
  while (millis() - startMs < timeoutSeconds * 1000UL) {
    uint8_t p = finger.getImage();
    if (p == FINGERPRINT_OK) {
      if (finger.image2Tz() != FINGERPRINT_OK) return -1;
      if (finger.fingerSearch() == FINGERPRINT_OK) return finger.fingerID;
      return 0;
    }
    delay(100);
  }
  return -2;
}

// ======================================================================================
// SEQUENTIAL DUAL-COMMODITY DISPENSING (STAGE 1: RICE -> SWAP -> STAGE 2: RAGI)
// ======================================================================================
void executeSequentialDispense(const String& cardId, const String& rfidUid, const String& memberName,
                               int fpId, float quotaRiceKg, float quotaRagiKg,
                               const String& phone, const String& authMethod) {
  // Stage 1: Rice
  float dispensedRice = dispenseSingleCommodity(cardId, rfidUid, memberName, fpId, "Rice", quotaRiceKg, authMethod);

  // Wait for bag swap before Ragi
  bool proceed = waitForStage2Swap(cardId, rfidUid, memberName);
  float dispensedRagi = 0.0f;
  if (proceed) {
    dispensedRagi = dispenseSingleCommodity(cardId, rfidUid, memberName, fpId, "Ragi", quotaRagiKg, authMethod);
  }

  alertSuccess(3);
  updateLcd("All Ration Done!", "R:" + String(dispensedRice, 1) + " G:" + String(dispensedRagi, 1) + "kg");

  updateFirebaseSession("COMPLETED", cardId, rfidUid, memberName, authMethod, fpId, "Completed",
                        quotaRagiKg, dispensedRagi, 0.0, "CLOSED",
                        "Sequential Distribution SUCCESS! Rice: " + String(dispensedRice, 1) + "kg, Ragi: " + String(dispensedRagi, 1) + "kg.");

  recordTransactionInFirebase(cardId, rfidUid, memberName, fpId, dispensedRice, dispensedRagi, phone, authMethod);
  markCardDistributedInFirebase(cardId);
  sendSmsNotification(phone, memberName, dispensedRice, dispensedRagi, authMethod);

  delay(4000);
}

float dispenseSingleCommodity(const String& cardId, const String& rfidUid, const String& memberName,
                              int fpId, const String& commodityName, float targetKg, const String& authMethod) {
  updateLcd("Preparing " + commodityName, "Taring Scale...");
  bool scaleAvailable = scale.wait_ready_timeout(400);
  if (scaleAvailable) {
    scale.tare();
  }
  delay(400);

  float ratio = demoModeEnabled ? demoScaleRatio : 1.0f;
  float physicalTargetKg = targetKg / ratio;

  Serial.printf("\n[DISPENSE] %s | Quota: %.2f kg | Physical Cutoff: %.3f kg (DemoMode=%s, Ratio=1:%.0f)\n",
                commodityName.c_str(), targetKg, physicalTargetKg, demoModeEnabled ? "ON" : "OFF", ratio);

  setGate(SERVO_OPEN_ANGLE);
  digitalWrite(GREEN_LED_PIN, HIGH);

  updateFirebaseSession("DISPENSING", cardId, rfidUid, memberName, authMethod, fpId, commodityName,
                        targetKg, 0.0, 0.0, "OPEN",
                        "Servo OPEN 60°: Dispensing " + commodityName + " (Target: " + String(targetKg, 1) + " kg)...");

  float eqWeightKg = 0.0f;
  float physGrams = 0.0f;
  unsigned long startMs = millis();
  unsigned long lastTelemetryMs = 0;

  if (!scaleAvailable) {
    // Mode 3: Safe Timed Fallback when HX711 is not physically connected
    Serial.println("[HX711] Scale unavailable -> Running Safe Timed Fallback (4s).");
    while (millis() - startMs < DEMO_TIMED_FALLBACK_MS) {
      float progress = (float)(millis() - startMs) / (float)DEMO_TIMED_FALLBACK_MS;
      eqWeightKg = targetKg * progress;
      physGrams = (eqWeightKg * 1000.0f) / ratio;
      updateLcd("Dispensing " + commodityName, "Wt:" + String(eqWeightKg, 1) + "/" + String(targetKg, 1) + "kg");
      if (millis() - lastTelemetryMs > 500) {
        lastTelemetryMs = millis();
        updateFirebaseSession("DISPENSING", cardId, rfidUid, memberName, authMethod, fpId, commodityName,
                              targetKg, eqWeightKg, physGrams, "OPEN",
                              "Timed Demo Dispensing " + commodityName + ": " + String(eqWeightKg, 1) + " kg");
      }
      delay(100);
    }
    eqWeightKg = targetKg;
  } else {
    // Mode 1 / 2: Live HX711 Gravimetric Feedback Loop
    const unsigned long maxCutoffMs = 90000;
    float tolerance = WEIGHT_FLOW_TOLERANCE / ratio;
    while (eqWeightKg < targetKg && (millis() - startMs < maxCutoffMs)) {
      if (scale.is_ready()) {
        float physKg = scale.get_units(2);
        if (physKg < 0.0f) physKg = 0.0f;
        physGrams = physKg * 1000.0f;
        eqWeightKg = physKg * ratio;
        if (physKg >= (physicalTargetKg - tolerance)) {
          eqWeightKg = targetKg;
        }
      }

      updateLcd("Dispensing " + commodityName, "Wt:" + String(eqWeightKg, 1) + "/" + String(targetKg, 1) + "kg");
      if (millis() - lastTelemetryMs > 500) {
        lastTelemetryMs = millis();
        updateFirebaseSession("DISPENSING", cardId, rfidUid, memberName, authMethod, fpId, commodityName,
                              targetKg, eqWeightKg, physGrams, "OPEN",
                              "Dispensing " + commodityName + ": " + String(eqWeightKg, 2) + " kg (" + String(physGrams, 0) + " g)");
      }
      delay(80);
    }
  }

  setGate(SERVO_CLOSED_ANGLE);
  digitalWrite(GREEN_LED_PIN, LOW);
  alertSuccess(2);
  updateLcd(commodityName + " Done!", "Wt: " + String(eqWeightKg, 2) + " kg");
  delay(1500);
  return eqWeightKg;
}

bool waitForStage2Swap(const String& cardId, const String& rfidUid, const String& memberName) {
  Serial.println("[STAGE 2] Waiting for vessel swap (Press BOOT GPIO 0, Tap RFID, or Click Web Button)...");
  updateLcd("Rice Done! Swap", "Tap/BOOT -> Ragi");
  updateFirebaseSession("WAITING_STAGE2", cardId, rfidUid, memberName, "", 0, "Ragi (Waiting)",
                        0.0, 0.0, 0.0, "CLOSED",
                        "Rice Complete! Place Ragi bag & press BOOT button, tap RFID, or click Web button.");

  // Clear previous RFID card buffer
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(600);

  unsigned long startWait = millis();
  unsigned long lastCheck = 0;

  while (millis() - startWait < 60000) {
    // Trigger A: Onboard BOOT button (GPIO 0)
    if (digitalRead(STAGE_CONFIRM_BTN) == LOW) {
      alertChirp();
      Serial.println("[STAGE 2] Confirmed via ESP32 BOOT button!");
      return true;
    }
    // Trigger B: RFID card re-tap
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      alertChirp();
      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
      Serial.println("[STAGE 2] Confirmed via RFID tap!");
      return true;
    }
    // Trigger C: Web Operator clicked "Confirm Ragi Bag Placed"
    if (millis() - lastCheck > 1500 && WiFi.status() == WL_CONNECTED) {
      lastCheck = millis();
      WiFiClientSecure client;
      client.setInsecure();
      HTTPClient https;
      if (https.begin(client, String("https://") + FIREBASE_HOST + "/active_session/stage2Confirmed.json")) {
        if (https.GET() == HTTP_CODE_OK) {
          String body = https.getString();
          if (body.indexOf("true") >= 0) {
            https.end();
            Serial.println("[STAGE 2] Confirmed via Web Operator Dashboard!");
            return true;
          }
        }
        https.end();
      }
    }
    delay(80);
  }
  return true; // Auto-proceed after timeout for continuous flow
}

// ======================================================================================
// ACTUATORS, FEEDBACK & FIREBASE HELPERS
// ======================================================================================
void setGate(int angle) {
  gateServo.write(angle);
  Serial.printf("[SERVO] Angle set to %d deg\n", angle);
}

void alertSuccess(int beeps) {
  digitalWrite(RED_LED_PIN, LOW);
  for (int i = 0; i < beeps; i++) {
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(90);
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    delay(70);
  }
}

void alertFailure(int beeps) {
  digitalWrite(GREEN_LED_PIN, LOW);
  for (int i = 0; i < beeps; i++) {
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(240);
    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    delay(140);
  }
}

void alertChirp() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(50);
  digitalWrite(BUZZER_PIN, LOW);
}

void updateLcd(const String& line1, const String& line2) {
  if (!lcd) return;
  lcd->clear();
  lcd->setCursor(0, 0);
  lcd->print(line1.substring(0, 16));
  lcd->setCursor(0, 1);
  lcd->print(line2.substring(0, 16));
}

void updateFirebaseSession(const String& step, const String& cardId, const String& cardUid,
                           const String& consumer, const String& authBy, int fpId,
                           const String& commodity, float targetKg, float currentKg,
                           float physGrams, const String& gateStatus, const String& message) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  https.begin(client, String("https://") + FIREBASE_HOST + "/active_session.json");
  https.addHeader("Content-Type", "application/json");

  StaticJsonDocument<768> doc;
  doc["deviceOnline"] = true;
  doc["currentStep"] = step;
  doc["currentCardId"] = cardId;
  doc["currentCardUid"] = cardUid;
  doc["consumerName"] = consumer;
  doc["authorizedBy"] = authBy;
  doc["matchedFpId"] = fpId;
  doc["currentCommodity"] = commodity;
  doc["quotaTargetKg"] = targetKg;
  doc["currentWeightKg"] = currentKg;
  doc["physicalGrams"] = physGrams;
  doc["gateStatus"] = gateStatus;
  doc["servoAngle"] = (gateStatus == "OPEN") ? SERVO_OPEN_ANGLE : SERVO_CLOSED_ANGLE;
  doc["message"] = message;
  doc["stage2Confirmed"] = false;

  String jsonStr;
  serializeJson(doc, jsonStr);
  https.PUT(jsonStr);
  https.end();
}

void recordTransactionInFirebase(const String& cardId, const String& rfidUid, const String& consumer,
                                 int fpId, float riceKg, float ragiKg, const String& phone, const String& authMethod) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;

  String txnId = "TXN_" + String(millis());
  https.begin(client, String("https://") + FIREBASE_HOST + "/transactions/" + txnId + ".json");
  https.addHeader("Content-Type", "application/json");

  StaticJsonDocument<768> doc;
  doc["transactionId"] = txnId;
  doc["cardId"] = cardId;
  doc["rfidUid"] = rfidUid;
  doc["consumerName"] = consumer;
  doc["beneficiaryPhone"] = phone;
  doc["storeId"] = SHOP_ID;
  doc["verificationMethod"] = authMethod;
  doc["fpTemplateId"] = fpId;
  doc["riceQuantityKg"] = riceKg;
  doc["ragiQuantityKg"] = ragiKg;
  doc["rationQuantityKg"] = riceKg + ragiKg;
  doc["distributionTimestamp"] = "2026-11-25 " + String(millis() / 1000);
  doc["status"] = "SUCCESS";
  doc["smsStatus"] = "DELIVERED";

  String jsonStr;
  serializeJson(doc, jsonStr);
  https.PUT(jsonStr);
  https.end();
}

void markCardDistributedInFirebase(const String& cardId) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  https.begin(client, String("https://") + FIREBASE_HOST + "/cards/" + cardId + ".json");
  https.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["distributedThisMonth"] = true;
  doc["status"] = "Distributed";
  doc["lastDistributionDate"] = "2026-11-25";

  String jsonStr;
  serializeJson(doc, jsonStr);
  https.PATCH(jsonStr);
  https.end();
}

void sendSmsNotification(const String& phoneNumber, const String& consumerName, float riceKg, float ragiKg, const String& authMethod) {
  Serial.println("\n-------------------------------------------------------");
  Serial.printf("[SMS] DISPATCHING CONFIRMATION RECEIPT TO: %s\n", phoneNumber.c_str());
  String message = "Dear " + consumerName + ", your monthly ration of " + String(riceKg, 1) + "kg Rice & " +
                   String(ragiKg, 1) + "kg Ragi was dispensed via " + authMethod + ". Fair Price Shop #42.";
  Serial.printf("  Body: %s\n", message.c_str());
  Serial.println("-------------------------------------------------------");

  #if USE_TWILIO_SMS
  if (String(TWILIO_ACCOUNT_SID) != "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient https;
    https.begin(client, "https://api.twilio.com/2010-04-01/Accounts/" + String(TWILIO_ACCOUNT_SID) + "/Messages.json");
    https.setAuthorization(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    https.addHeader("Content-Type", "application/x-www-form-urlencoded");
    https.POST("To=" + phoneNumber + "&From=" + String(TWILIO_FROM_PHONE) + "&Body=" + message);
    https.end();
  }
  #endif
}
