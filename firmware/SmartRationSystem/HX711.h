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

    void begin(uint8_t dout, uint8_t sck, uint8_t gain = 128);
    bool is_ready();
    void wait_ready(unsigned long delay_ms = 0);
    bool wait_ready_retry(int retries = 3, unsigned long delay_ms = 0);
    bool wait_ready_timeout(unsigned long timeout = 1000, unsigned long delay_ms = 0);
    void set_gain(uint8_t gain = 128);
    long read();
    long read_average(uint8_t times = 10);
    double get_value(uint8_t times = 1);
    float get_units(uint8_t times = 1);
    void tare(uint8_t times = 10);
    void set_scale(float scale = 1.0f);
    float get_scale();
    void set_offset(long offset = 0);
    long get_offset();
    void power_down();
    void power_up();
};

#endif // HX711_H
