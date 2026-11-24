#include "Adafruit_Fingerprint.h"

Adafruit_Fingerprint::Adafruit_Fingerprint(Stream *s) {
  mySerial = s;
}

void Adafruit_Fingerprint::begin(uint32_t baudrate) {
  delay(100);
}

bool Adafruit_Fingerprint::verifyPassword(void) {
  uint8_t packet[] = {0x13, (uint8_t)(thePassword >> 24), (uint8_t)(thePassword >> 16),
                      (uint8_t)(thePassword >> 8), (uint8_t)(thePassword & 0xFF)};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[12];
  uint8_t len = getReply(reply);
  if ((len == 1) && (reply[0] == FINGERPRINT_OK)) return true;
  return false;
}

uint8_t Adafruit_Fingerprint::getParameters(void) {
  uint8_t packet[] = {0x0F};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[20];
  uint8_t len = getReply(reply);
  if ((len >= 1) && (reply[0] == FINGERPRINT_OK)) {
    capacity = 128;
    security_level = 3;
    return FINGERPRINT_OK;
  }
  return reply[0];
}

uint8_t Adafruit_Fingerprint::getImage(void) {
  uint8_t packet[] = {0x01};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[12];
  uint8_t len = getReply(reply);
  if (len == 0) return FINGERPRINT_PACKETRECIEVEERR;
  return reply[0];
}

uint8_t Adafruit_Fingerprint::image2Tz(uint8_t slot) {
  uint8_t packet[] = {0x02, slot};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[12];
  uint8_t len = getReply(reply);
  if (len == 0) return FINGERPRINT_PACKETRECIEVEERR;
  return reply[0];
}

uint8_t Adafruit_Fingerprint::createModel(void) {
  uint8_t packet[] = {0x05};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[12];
  uint8_t len = getReply(reply);
  if (len == 0) return FINGERPRINT_PACKETRECIEVEERR;
  return reply[0];
}

uint8_t Adafruit_Fingerprint::storeModel(uint16_t id) {
  uint8_t packet[] = {0x06, 0x01, (uint8_t)(id >> 8), (uint8_t)(id & 0xFF)};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[12];
  uint8_t len = getReply(reply);
  if (len == 0) return FINGERPRINT_PACKETRECIEVEERR;
  return reply[0];
}

uint8_t Adafruit_Fingerprint::deleteModel(uint16_t id) {
  uint8_t packet[] = {0x0C, (uint8_t)(id >> 8), (uint8_t)(id & 0xFF), 0x00, 0x01};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[12];
  uint8_t len = getReply(reply);
  if (len == 0) return FINGERPRINT_PACKETRECIEVEERR;
  return reply[0];
}

uint8_t Adafruit_Fingerprint::emptyDatabase(void) {
  uint8_t packet[] = {0x0D};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[12];
  uint8_t len = getReply(reply);
  if (len == 0) return FINGERPRINT_PACKETRECIEVEERR;
  return reply[0];
}

uint8_t Adafruit_Fingerprint::fingerFastSearch(void) {
  return fingerSearch();
}

uint8_t Adafruit_Fingerprint::fingerSearch(void) {
  uint8_t packet[] = {0x04, 0x01, 0x00, 0x00, 0x00, (uint8_t)capacity};
  writePacket(theAddress, FINGERPRINT_COMMANDPACKET, sizeof(packet), packet);
  uint8_t reply[16];
  uint8_t len = getReply(reply);
  if (len == 0) return FINGERPRINT_PACKETRECIEVEERR;
  if (reply[0] == FINGERPRINT_OK) {
    fingerID = ((uint16_t)reply[1] << 8) | reply[2];
    confidence = ((uint16_t)reply[3] << 8) | reply[4];
    return FINGERPRINT_OK;
  }
  return reply[0];
}

void Adafruit_Fingerprint::writePacket(uint32_t addr, uint8_t packettype, uint16_t len, uint8_t *packet) {
  uint16_t sum = (len + 2) + packettype;
  mySerial->write((uint8_t)(FINGERPRINT_STARTCODE >> 8));
  mySerial->write((uint8_t)(FINGERPRINT_STARTCODE & 0xFF));
  mySerial->write((uint8_t)(addr >> 24));
  mySerial->write((uint8_t)(addr >> 16));
  mySerial->write((uint8_t)(addr >> 8));
  mySerial->write((uint8_t)(addr & 0xFF));
  mySerial->write(packettype);
  mySerial->write((uint8_t)((len + 2) >> 8));
  mySerial->write((uint8_t)((len + 2) & 0xFF));

  for (uint16_t i = 0; i < len; i++) {
    mySerial->write(packet[i]);
    sum += packet[i];
  }

  mySerial->write((uint8_t)(sum >> 8));
  mySerial->write((uint8_t)(sum & 0xFF));
}

uint8_t Adafruit_Fingerprint::getReply(uint8_t *replyPacket, uint16_t timeout) {
  uint8_t ch;
  uint8_t idx = 0;
  uint16_t timer = 0;

  while (timer < timeout) {
    while (mySerial->available()) {
      ch = mySerial->read();
      if ((idx == 0) && (ch != (FINGERPRINT_STARTCODE >> 8))) continue;
      replyPacket[idx++] = ch;
      if (idx >= 9) {
        uint16_t len = ((uint16_t)replyPacket[7] << 8) | replyPacket[8];
        while (idx < 9 + len && timer < timeout) {
          if (mySerial->available()) {
            replyPacket[idx++] = mySerial->read();
          } else {
            delay(1);
            timer++;
          }
        }
        if (idx >= 10) {
          for (uint8_t i = 0; i < len - 2; i++) {
            replyPacket[i] = replyPacket[9 + i];
          }
          return len - 2;
        }
      }
    }
    delay(1);
    timer++;
  }
  return 0;
}
