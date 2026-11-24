#include "HX711.h"

#if defined(ESP32)
#define SHIFTIN_WAIT_US 1
#else
#define SHIFTIN_WAIT_US 1
#endif

HX711::HX711() {
}

HX711::~HX711() {
}

void HX711::begin(uint8_t dout, uint8_t sck, uint8_t gain) {
    DOUT = dout;
    SCK = sck;

    pinMode(SCK, OUTPUT);
    pinMode(DOUT, INPUT_PULLUP);

    set_gain(gain);
}

bool HX711::is_ready() {
    return digitalRead(DOUT) == LOW;
}

void HX711::set_gain(uint8_t gain) {
    switch (gain) {
        case 128: // Channel A, Gain 128
            GAIN = 1;
            break;
        case 64:  // Channel A, Gain 64
            GAIN = 3;
            break;
        case 32:  // Channel B, Gain 32
            GAIN = 2;
            break;
        default:
            GAIN = 1;
            break;
    }
}

long HX711::read() {
    // Wait for the chip to become ready
    wait_ready(0);

    unsigned long value = 0;
    uint8_t data[3] = { 0 };
    uint8_t filler = 0x00;

    // Pulse SCK to shift in 24 bits
    // ESP32 requires precise microsecond pulse widths
    for (int8_t i = 2; i >= 0; i--) {
        for (int8_t bit = 7; bit >= 0; bit--) {
            digitalWrite(SCK, HIGH);
            delayMicroseconds(SHIFTIN_WAIT_US);
            if (digitalRead(DOUT)) {
                data[i] |= (1 << bit);
            }
            digitalWrite(SCK, LOW);
            delayMicroseconds(SHIFTIN_WAIT_US);
        }
    }

    // Set the channel and the gain factor for the next reading using extra clock pulses
    for (int i = 0; i < GAIN; i++) {
        digitalWrite(SCK, HIGH);
        delayMicroseconds(SHIFTIN_WAIT_US);
        digitalWrite(SCK, LOW);
        delayMicroseconds(SHIFTIN_WAIT_US);
    }

    // Replicate the most significant bit to pad out a 32-bit signed integer
    if (data[2] & 0x80) {
        filler = 0xFF;
    } else {
        filler = 0x00;
    }

    // Construct 32-bit signed integer
    value = ( static_cast<unsigned long>(filler) << 24
            | static_cast<unsigned long>(data[2]) << 16
            | static_cast<unsigned long>(data[1]) << 8
            | static_cast<unsigned long>(data[0]) );

    return static_cast<long>(value);
}

void HX711::wait_ready(unsigned long delay_ms) {
    while (!is_ready()) {
        delay(delay_ms);
    }
}

bool HX711::wait_ready_retry(int retries, unsigned long delay_ms) {
    int count = 0;
    while (count < retries) {
        if (is_ready()) {
            return true;
        }
        delay(delay_ms);
        count++;
    }
    return false;
}

bool HX711::wait_ready_timeout(unsigned long timeout, unsigned long delay_ms) {
    unsigned long startObj = millis();
    while (millis() - startObj < timeout) {
        if (is_ready()) {
            return true;
        }
        delay(delay_ms);
    }
    return false;
}

long HX711::read_average(uint8_t times) {
    if (times == 0) times = 1;
    long sum = 0;
    for (uint8_t i = 0; i < times; i++) {
        sum += read();
        yield();
    }
    return sum / times;
}

double HX711::get_value(uint8_t times) {
    return read_average(times) - OFFSET;
}

float HX711::get_units(uint8_t times) {
    if (SCALE == 0.0f) SCALE = 1.0f;
    return get_value(times) / SCALE;
}

void HX711::tare(uint8_t times) {
    double sum = read_average(times);
    set_offset(sum);
}

void HX711::set_scale(float scale) {
    if (scale == 0.0f) scale = 1.0f;
    SCALE = scale;
}

float HX711::get_scale() {
    return SCALE;
}

void HX711::set_offset(long offset) {
    OFFSET = offset;
}

long HX711::get_offset() {
    return OFFSET;
}

void HX711::power_down() {
    digitalWrite(SCK, LOW);
    digitalWrite(SCK, HIGH);
}

void HX711::power_up() {
    digitalWrite(SCK, LOW);
}
