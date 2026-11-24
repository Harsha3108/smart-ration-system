/*
 * ======================================================================================
 * HX711 LOAD CELL CALIBRATION UTILITY FOR SMART RATION DISPENSER
 * --------------------------------------------------------------------------------------
 * Controller: ESP32 DevKit V1
 * Sensor: HX711 24-bit ADC + 5kg/10kg/20kg Load Cell
 * Wiring:
 *  - HX711 DOUT / DT -> ESP32 GPIO 32
 *  - HX711 SCK       -> ESP32 GPIO 33
 *  - VCC             -> 5V or 3.3V
 *  - GND             -> ESP32 GND
 * Instructions:
 *  1. Upload sketch and open Serial Monitor at 115200 baud.
 *  2. Remove all weight from the platform. The sketch will tare (zero) the scale.
 *  3. Place a KNOWN standard calibration weight (e.g., exactly 1.0 kg or 500g).
 *  4. Use '+' or 'a' to increase calibration factor, '-' or 'z' to decrease.
 *  5. Once the displayed weight matches your known weight, note the calibration factor!
 *  6. Enter this factor into Config.h or directly in the Web Admin Dashboard.
 * ======================================================================================
 */

#include <Arduino.h>
#include "HX711.h"

#define HX711_DOUT_PIN 32
#define HX711_SCK_PIN  33

HX711 scale;

float calibration_factor = 420.5; // Initial guess

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  HX711 LOAD CELL CALIBRATION TOOL (SMART RATION)      ");
  Serial.println("=======================================================");
  Serial.println("1. DO NOT place any weight on the scale platform yet.");
  Serial.println("2. Taring load cell to establish zero baseline...");

  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale();
  scale.tare(); // Reset the scale to 0

  long zero_factor = scale.read_average(10);
  Serial.printf("[TARE DONE] Baseline Zero Offset: %ld\n", zero_factor);
  Serial.println("\nNow, place a KNOWN WEIGHT (e.g. 1.0 kg or 500g) on the load cell.");
  Serial.println("Commands:");
  Serial.println("  '+' or 'a' : Increase calibration factor (+10)");
  Serial.println("  '-' or 'z' : Decrease calibration factor (-10)");
  Serial.println("  't'        : Re-tare (zero) scale");
}

void loop() {
  scale.set_scale(calibration_factor);

  float currentWeight = scale.get_units(5);
  Serial.printf("Reading: %7.3f kg | Calibration Factor: %8.2f\n", currentWeight, calibration_factor);

  if (Serial.available()) {
    char temp = Serial.read();
    if (temp == '+' || temp == 'a') {
      calibration_factor += 10;
    } else if (temp == '-' || temp == 'z') {
      calibration_factor -= 10;
    } else if (temp == 't') {
      scale.tare();
      Serial.println("[TARED] Reset to 0.000 kg");
    }
  }
  delay(500);
}
