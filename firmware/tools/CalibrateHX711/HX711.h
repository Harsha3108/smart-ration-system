#ifndef HX711_H
#define HX711_H

#include <Arduino.h>

class HX711 {
private:
    uint8_t DOUT;
    uint8_t SCK;
    uint8_t GAIN;
    long OFFSET = 0;
    float SCALE = 1.0f;

public:
    HX711();
    virtual ~HX711();

    // Initialize library with data output pin, clock input pin and gain factor
    // Channel A, gain factor 128 is default
    void begin(uint8_t dout, uint8_t sck, uint8_t gain = 128);

    // Check if HX711 is ready
    // From datasheet: When output data is not ready for retrieval, digital output pin DOUT is high.
    bool is_ready();

    // Wait for the HX711 to become ready
    void wait_ready(unsigned long delay_ms = 0);
    bool wait_ready_retry(int retries = 3, unsigned long delay_ms = 0);
    bool wait_ready_timeout(unsigned long timeout = 1000, unsigned long delay_ms = 0);

    // Set the gain factor; takes effect only after a call to read()
    // channel A can be set for a 128 or 64 gain; channel B has a fixed 32 gain
    void set_gain(uint8_t gain = 128);

    // Read 24-bit raw value from HX711
    long read();

    // Return an average of reading 'times' samples
    long read_average(uint8_t times = 10);

    // Return (read_average() - OFFSET);
    double get_value(uint8_t times = 1);

    // Return get_value() / SCALE;
    float get_units(uint8_t times = 1);

    // Set the OFFSET value for tare weight; times = how many readings to take
    void tare(uint8_t times = 10);

    // Set the SCALE value; this value is used to convert raw data to human readable units (e.g. kg)
    void set_scale(float scale = 1.0f);

    // Get current SCALE value
    float get_scale();

    // Set OFFSET value
    void set_offset(long offset = 0);

    // Get current OFFSET value
    long get_offset();

    // Puts the chip into power down mode
    void power_down();

    // Wakes up the chip after power down mode
    void power_up();
};

#endif // HX711_H
