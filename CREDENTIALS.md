# System Access Credentials — Smart Public Ration Distribution System

**Live Portal URL:** https://harsha3108.github.io/smart-ration-system/  
**Backend Database:** https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/

---

## 1. State Administrator (Super Admin)
Full management access: Ration Card & Member CRUD, Member Photo Upload/Capture, Store & Location Setup, Distribution Operator Provisioning, Commodity Entitlement Rules (5 kg Rice + 5 kg Ragi/person), Broadcast SMS, and Hardware Calibration.

| Role | Login ID / Email | Password | Portal Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@pds.gov.in` | `Admin@2026` | All Fair Price Shops & Master Registry |

---

## 2. Store Distribution Operators (3 Users)
Counter staff assigned to specific Fair Price Shop locations. Operators log in to search Ration Card numbers, inspect family member photos, verify beneficiaries via **Biometric Fingerprint (R307)** or **6-Digit Mobile OTP**, and authorize grain dispensing.

| Operator ID | Staff Name | Login Email | Password | Assigned Store ID | Store Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OP_101` | **Kiran Rao** | `operator1@pds.gov.in` | `Operator@101` | `FPS_KA_BLR_042` | Fair Price Shop #42, Gandhi Nagar, Bengaluru |
| `OP_102` | **Meena Devi** | `operator2@pds.gov.in` | `Operator@102` | `FPS_KA_BLR_088` | Fair Price Shop #88, Indiranagar, Bengaluru |
| `OP_103` | **Arjun Nair** | `operator3@pds.gov.in` | `Operator@103` | `FPS_KA_BLR_105` | Fair Price Shop #105, Jayanagar, Bengaluru |

---

## 3. Beneficiary Ration Cards (3 Cards — 2, 3 & 4 Members)
Citizens can sign in to view monthly Rice + Ragi entitlements, family member biometrics, and transaction receipts.

| Ration Card ID | Family Head | Members | Monthly Entitlement | Login ID | Password | Enrolled Fingerprint Slots |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `RC101` | **Ramesh Kumar** | 2 | **10 kg Rice + 10 kg Ragi** | `RC101` | `Ration@101` | **#1** (Ramesh), **#2** (Sunita) |
| `RC102` | **Rajesh Patel** | 3 | **15 kg Rice + 15 kg Ragi** | `RC102` | `Ration@102` | **#3** (Rajesh), **#4** (Priya), **#5** (Amit) |
| `RC103` | **Suresh Sharma** | 4 | **20 kg Rice + 20 kg Ragi** | `RC103` | `Ration@103` | **#6** (Suresh), **#7** (Geeta), **#8** (Rahul), **#9** (Anita) |
