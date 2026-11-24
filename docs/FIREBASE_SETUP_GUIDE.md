# Firebase Realtime Database Setup & Configuration Guide
## Target Database URL: [https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/](https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/)

This guide provides instructions to connect, initialize, and import the dedicated database structure for the Smart Public Ration Distribution System.

---

## 1. Importing the Pre-Configured Database Seed

We have created `database/firebase_data_seed.json` which contains:
- 3 pre-configured ration cards with **2, 3, and 4 users** respectively.
- Registered RFID UIDs, phone numbers, family head details, and quota calculations.
- Fingerprint Template IDs (1 through 9) mapped to each individual member.
- Initial system configuration, calibration factor, and servo angles.
- Live `active_session` telemetry node.

### How to Import into Firebase Console (1-Click):
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **beneficiary-details-default**.
3. In the left-hand navigation menu, under **Build**, click on **Realtime Database**.
4. Confirm you are in the **asia-southeast1** database (`beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app`).
5. On the top right corner of the database data viewer, click the **three vertical dots (⋮)** menu icon.
6. Click **Import JSON**.
7. Browse to `c:\mmmmmmm\database\firebase_data_seed.json` and select it.
8. Click **Import**.
9. All 3 ration cards, member biometric associations, and system parameters are now populated in your cloud database!

---

## 2. Configuring Security Rules

To ensure both your GitHub Pages web application and your ESP32 controller can read and write without authentication blocks:

1. In the **Realtime Database** console, click on the **Rules** tab.
2. Replace existing rules with the content from `database/database.rules.json`:
```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "cards": {
      ".indexOn": ["rfidUid", "phone", "status"]
    },
    "transactions": {
      ".indexOn": ["cardId", "rfidUid", "distributionDate", "status"]
    }
  }
}
```
3. Click **Publish**.

---

## 3. Dedicated Database Schema Overview

```
/
├── cards/
│   ├── RC101/                          <-- Card 1 (2 Family Members)
│   │   ├── cardId: "RC101"
│   │   ├── rfidUid: "B37A4C12"
│   │   ├── headName: "Ramesh Kumar"
│   │   ├── phone: "+919876543210"
│   │   ├── category: "BPL"
│   │   ├── allocatedQuotaKg: 10.0
│   │   ├── grainType: "Rice"
│   │   ├── distributedThisMonth: false
│   │   ├── membersCount: 2
│   │   ├── members/
│   │   │   ├── M101_1: { name: "Ramesh Kumar", relation: "Head", age: 46, fpId: 1 }
│   │   │   └── M101_2: { name: "Sunita Kumar", relation: "Spouse", age: 42, fpId: 2 }
│   │   └── loginCredentials: { userId: "RC101", password: "User@101" }
│   ├── RC102/                          <-- Card 2 (3 Family Members)
│   │   ├── members/
│   │   │   ├── M102_1: { name: "Rajesh Patel", fpId: 3 }
│   │   │   ├── M102_2: { name: "Priya Patel", fpId: 4 }
│   │   │   └── M102_3: { name: "Amit Patel", fpId: 5 }
│   │   └── allocatedQuotaKg: 15.0 (Wheat)
│   └── RC103/                          <-- Card 3 (4 Family Members)
│       ├── members/
│       │   ├── M103_1: { name: "Suresh Sharma", fpId: 6 }
│       │   ├── M103_2: { name: "Geeta Sharma", fpId: 7 }
│       │   ├── M103_3: { name: "Rahul Sharma", fpId: 8 }
│       │   └── M103_4: { name: "Anita Sharma", fpId: 9 }
│       └── allocatedQuotaKg: 20.0 (Rice)
├── transactions/
│   └── TXN_XXXXXX/                     <-- Real-time audit logs
│       ├── cardId, rfidUid, consumerName, fpTemplateId, rationQuantityKg, timestamp, status
├── broadcast_notification/             <-- Admin SMS broadcast commands
├── system_config/                      <-- Calibration factor (420.5), servo angles (0°/60°)
└── active_session/                     <-- Live ESP32 hardware telemetry stream
```
