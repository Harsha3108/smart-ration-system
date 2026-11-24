# System Access Credentials — Smart Public Ration Distribution System

**Live Portal URL:** https://harsha3108.github.io/smart-ration-system/  
**Backend Database:** https://beneficiary-details-default-rtdb.asia-southeast1.firebasedatabase.app/

> **Access Policy:** Only authorized **State Administrators** and **Fair Price Shop Distributors (Store Operators)** can sign in to the web portal. Citizens do not log in; they present their physical RFID Ration Card at the store counter and verify via Fingerprint or Mobile OTP.

---

## 1. State Administrator (Super Admin)
Full management access: Ration Card & Member CRUD, Member Photo Upload/Capture, Store & Location Setup, Distributor Provisioning, Commodity Entitlement Rules (5 kg Rice + 5 kg Ragi/person), Broadcast SMS, and Hardware Calibration.

| Role | Login Email | Password | Portal Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@pds.gov.in` | `Admin@2026` | All Fair Price Shops & Master Registry |

---

## 2. Store Distributors / Operators (3 Users)
Counter staff assigned to specific Fair Price Shop locations. Distributors log in to search Ration Card numbers, inspect family member photos, verify beneficiaries via **Biometric Fingerprint (R307)** or **6-Digit Mobile OTP**, and authorize grain dispensing.

| Operator ID | Distributor Name | Login Email | Password | Assigned Store ID | Store Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OP_101` | **Kiran Rao** | `operator1@pds.gov.in` | `Operator@101` | `FPS_KA_BLR_042` | Fair Price Shop #42, Gandhi Nagar, Bengaluru |
| `OP_102` | **Meena Devi** | `operator2@pds.gov.in` | `Operator@102` | `FPS_KA_BLR_088` | Fair Price Shop #88, Indiranagar, Bengaluru |
| `OP_103` | **Arjun Nair** | `operator3@pds.gov.in` | `Operator@103` | `FPS_KA_BLR_105` | Fair Price Shop #105, Jayanagar, Bengaluru |

---

## 3. Registered Ration Cards (No Web Login — Hardware RFID + Fingerprint / OTP Only)

| Ration Card ID | RFID UID | Family Head | Members | Monthly Entitlement | Enrolled Fingerprint Slots |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `RC101` | `B37A4C12` | **Ramesh Kumar** | 2 | **10 kg Rice + 10 kg Ragi** | **#1** (Ramesh), **#2** (Sunita) |
| `RC102` | `D49F2188` | **Rajesh Patel** | 3 | **15 kg Rice + 15 kg Ragi** | **#3** (Rajesh), **#4** (Priya), **#5** (Amit) |
| `RC103` | `71A83B5E` | **Suresh Sharma** | 4 | **20 kg Rice + 20 kg Ragi** | **#6** (Suresh), **#7** (Geeta), **#8** (Rahul), **#9** (Anita) |
