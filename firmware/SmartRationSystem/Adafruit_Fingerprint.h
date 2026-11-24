#ifndef ADAFRUIT_FINGERPRINT_H
#define ADAFRUIT_FINGERPRINT_H

#include <Arduino.h>

// Confirmation codes
#define FINGERPRINT_OK 0x00
#define FINGERPRINT_PACKETRECIEVEERR 0x01
#define FINGERPRINT_NOFINGER 0x02
#define FINGERPRINT_IMAGEFAIL 0x03
#define FINGERPRINT_IMAGEMESS 0x06
#define FINGERPRINT_FEATUREFAIL 0x07
#define FINGERPRINT_NOMATCH 0x08
#define FINGERPRINT_NOTFOUND 0x09
#define FINGERPRINT_ENROLLMISMATCH 0x0A
#define FINGERPRINT_BADLOCATION 0x0B
#define FINGERPRINT_DBRANGEFAIL 0x0C
#define FINGERPRINT_UPLOADFEATUREFAIL 0x0D
#define FINGERPRINT_PACKETRESPONSEFAIL 0x0E
#define FINGERPRINT_UPLOADFAIL 0x0F
#define FINGERPRINT_DELETEFAIL 0x10
#define FINGERPRINT_DBCLEARFAIL 0x11
#define FINGERPRINT_PASSFAIL 0x13
#define FINGERPRINT_INVALIDIMAGE 0x15
#define FINGERPRINT_FLASHERR 0x18
#define FINGERPRINT_INVALIDREG 0x1A
#define FINGERPRINT_ADDRCODE 0x20
#define FINGERPRINT_PASSVERIFY 0x21

#define FINGERPRINT_STARTCODE 0xEF01
#define FINGERPRINT_COMMANDPACKET 0x01
#define FINGERPRINT_DATAPACKET 0x02
#define FINGERPRINT_ACKPACKET 0x07
#define FINGERPRINT_ENDDATAPACKET 0x08

#define FINGERPRINT_TIMEOUT 1000

class Adafruit_Fingerprint {
public:
  Adafruit_Fingerprint(Stream *s);
  void begin(uint32_t baudrate);
  bool verifyPassword(void);
  uint8_t getParameters(void);
  uint8_t getImage(void);
  uint8_t image2Tz(uint8_t slot = 1);
  uint8_t createModel(void);
  uint8_t storeModel(uint16_t id);
  uint8_t deleteModel(uint16_t id);
  uint8_t emptyDatabase(void);
  uint8_t fingerFastSearch(void);
  uint8_t fingerSearch(void);

  uint16_t fingerID = 0;
  uint16_t confidence = 0;
  uint16_t templateCount = 0;
  uint16_t capacity = 128;
  uint16_t security_level = 3;
  uint32_t device_address = 0xFFFFFFFF;

private:
  Stream *mySerial;
  uint32_t thePassword = 0x00000000;
  uint32_t theAddress = 0xFFFFFFFF;

  void writePacket(uint32_t addr, uint8_t packettype, uint16_t len, uint8_t *packet);
  uint8_t getReply(uint8_t *replyPacket, uint16_t timeout = FINGERPRINT_TIMEOUT);
};

#endif
