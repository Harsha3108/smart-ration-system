/*
 * ======================================================================================
 * R307 FINGERPRINT ENROLLMENT UTILITY FOR SMART RATION SYSTEM
 * --------------------------------------------------------------------------------------
 * Controller: ESP32 DevKit V1
 * Sensor: R307 Optical Fingerprint Sensor (UART2: RX=16, TX=17)
 * Purpose:
 *  Use this sketch to register beneficiary fingerprints into slots (1 to 127).
 *  Open the Arduino Serial Monitor at 115200 baud, enter the desired Fingerprint ID
 *  (e.g., 1 for Ramesh Kumar, 2 for Sunita Kumar, etc.), and follow the prompts.
 * ======================================================================================
 */

#include "Adafruit_Fingerprint.h"

#define R307_RX_PIN 16 // ESP32 RX2 connected to R307 TX
#define R307_TX_PIN 17 // ESP32 TX2 connected to R307 RX

HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

uint8_t id;

uint8_t readnumber(void) {
  uint8_t num = 0;
  while (num == 0) {
    while (!Serial.available());
    num = Serial.parseInt();
  }
  return num;
}

uint8_t getFingerprintEnroll() {
  int p = -1;
  Serial.printf("\n[STEP 1] Waiting for valid finger to enroll as #%d...\n", id);
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
    case FINGERPRINT_OK:
      Serial.println("  Image taken successfully!");
      break;
    case FINGERPRINT_NOFINGER:
      // waiting
      break;
    case FINGERPRINT_PACKETRECIEVEERR:
      Serial.println("  Communication error.");
      break;
    case FINGERPRINT_IMAGEFAIL:
      Serial.println("  Imaging error.");
      break;
    default:
      Serial.println("  Unknown error.");
      break;
    }
  }

  // Convert image 1 to template
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("  Image conversion to template failed. Try again.");
    return p;
  }

  Serial.println("  Remove finger from sensor.");
  delay(2000);
  p = 0;
  while (p != FINGERPRINT_NOFINGER) {
    p = finger.getImage();
  }

  Serial.printf("\n[STEP 2] Place the SAME finger on sensor again to confirm...\n");
  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
    case FINGERPRINT_OK:
      Serial.println("  Confirmation image captured!");
      break;
    case FINGERPRINT_NOFINGER:
      break;
    default:
      Serial.println("  Scan error.");
      break;
    }
  }

  // Convert image 2
  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println("  Template conversion error.");
    return p;
  }

  // Create model
  Serial.println("  Creating model from both scans...");
  p = finger.createModel();
  if (p == FINGERPRINT_OK) {
    Serial.println("  Fingerprint models matched perfectly!");
  } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("  Communication error.");
    return p;
  } else if (p == FINGERPRINT_ENROLLMISMATCH) {
    Serial.println("  Fingerprints did NOT match. Enrollment cancelled.");
    return p;
  } else {
    Serial.println("  Unknown error creating model.");
    return p;
  }

  // Store model
  Serial.printf("  Storing model in Flash Slot #%d...\n", id);
  p = finger.storeModel(id);
  if (p == FINGERPRINT_OK) {
    Serial.printf("\n>>> SUCCESS! Fingerprint stored in slot #%d <<<\n", id);
    Serial.printf("You can now assign FP ID #%d to the beneficiary in the Web Admin Dashboard.\n", id);
  } else {
    Serial.println("  Error writing to flash memory.");
    return p;
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  while (!Serial);
  delay(500);

  Serial.println("\n=======================================================");
  Serial.println("  R307 FINGERPRINT ENROLLMENT UTILITY (SMART RATION)  ");
  Serial.println("=======================================================");

  mySerial.begin(57600, SERIAL_8N1, R307_RX_PIN, R307_TX_PIN);
  finger.begin(57600);

  if (finger.verifyPassword()) {
    Serial.println("[OK] R307 Optical Sensor detected!");
  } else {
    Serial.println("[ERROR] Did not find fingerprint sensor :(");
    Serial.println("Check: RX2 (GPIO 16) -> Sensor TX | TX2 (GPIO 17) -> Sensor RX | 5V & GND");
    while (1) delay(1);
  }

  finger.getParameters();
  Serial.printf("Sensor Capacity: %d templates | Security Level: %d\n", finger.capacity, finger.security_level);
}

void loop() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("Ready to enroll a beneficiary fingerprint!");
  Serial.println("Enter the ID # (from 1 to 127) you want to save this finger as:");
  id = readnumber();
  if (id == 0) return; // ID #0 not allowed

  Serial.printf("Enrolling ID #%d...\n", id);
  while (!getFingerprintEnroll());
}
