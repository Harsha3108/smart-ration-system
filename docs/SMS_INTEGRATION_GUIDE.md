# SMS Notification System Architecture & Integration Guide
## Smart Public Ration Distribution System

This document explains the two-tier SMS notification subsystem:
1. **Admin Broadcast SMS Notification:** Alerts all registered consumers when the Fair Price Shop opens.
2. **Transaction Confirmation SMS:** Sends instantaneous proof of grain collection to the beneficiary's registered mobile number.

---

## 1. Notification Tier 1: Admin Broadcast SMS

### Workflow:
1. The FPS Administrator logs in to the Web Admin Dashboard.
2. The admin clicks the **"Broadcast SMS"** button in the top navigation or under the SMS Notification Center.
3. A confirmation modal displays:
   - Total number of registered households (e.g. 3 Families).
   - The message template:
     > *"Fair Price Shop #42 NOTICE: Monthly ration distribution has officially commenced. Please bring your registered RFID Smart Card to collect your quota."*
4. Upon clicking **"Confirm & Send Now"**:
   - The dashboard updates `/broadcast_notification` in Firebase Realtime Database.
   - The system queries all phone numbers registered in the `/cards` node:
     - Ramesh Kumar: `+919876543210`
     - Rajesh Patel: `+919876543211`
     - Suresh Sharma: `+919876543212`
   - Messages are dispatched through the configured SMS gateway.
   - Delivery timestamps and status appear immediately in the **Real-Time SMS Delivery Logs** widget.

---

## 2. Notification Tier 2: Real-Time Distribution Confirmation SMS

### Workflow:
1. Beneficiary scans their RFID card on the ESP32.
2. Beneficiary places an enrolled finger on the R307 sensor.
3. Once **BOTH** RFID and Fingerprint biometrics match, the servo rotates to 60° and grain pours onto the load cell.
4. When the target weight is reached, the servo snaps shut at 0°.
5. The ESP32 triggers `sendSmsNotification()`:
   - Message:
     > *"Dear [Consumer Name], your ration of [Quantity] kg [Grain Type] has been successfully dispensed on [Timestamp]. Transaction Verified. Fair Price Shop #42."*
6. Example Delivered Message:
   > *"Dear Ramesh Kumar, your ration of 10.00 kg Rice has been successfully dispensed on 2026-11-24 15:52:10. Transaction Verified. Fair Price Shop #42."*

---

## 3. Supported SMS Gateways & Setup

### Option A: Twilio SMS API (Global)
1. Sign up at [Twilio](https://www.twilio.com/) and obtain:
   - **Account SID** (e.g. `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token** (e.g. `3a9f8...`)
   - **Twilio Phone Number** (e.g. `+1234567890`)
2. In the Admin Dashboard $\rightarrow$ **System & Calibration** $\rightarrow$ enter your Twilio Account SID and Auth Token.
3. In `firmware/SmartRationSystem/Config.h`, set:
   ```cpp
   #define USE_TWILIO_SMS      true
   #define TWILIO_ACCOUNT_SID  "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   #define TWILIO_AUTH_TOKEN   "your_auth_token"
   #define TWILIO_FROM_PHONE   "+1234567890"
   ```

### Option B: Fast2SMS API (India +91 Numbers)
1. Register at [Fast2SMS](https://www.fast2sms.com/) and get an API Authorization Key.
2. API Endpoint:
   ```http
   POST https://www.fast2sms.com/dev/bulkV2
   Header: authorization: YOUR_FAST2SMS_KEY
   Body: { "route": "q", "message": "YOUR_MESSAGE", "numbers": "9876543210,9876543211" }
   ```

### Option C: Built-in Live Simulation Mode
If no API keys are entered, the system automatically uses its built-in live simulation engine. It validates phone number formatting, computes delivery timestamps, records transaction status as `DELIVERED`, and logs the full message body into the dashboard audit trail!
