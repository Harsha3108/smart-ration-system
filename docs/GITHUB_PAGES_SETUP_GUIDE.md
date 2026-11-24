# GitHub Pages Deployment & Repository Setup Guide
## Account: [Harsha3108](https://github.com/Harsha3108)
## Project: Smart Public Ration Distribution System

This document outlines the exact, step-by-step procedure to host the web dashboard on GitHub Pages under your personal account `https://github.com/Harsha3108`.

---

## 1. What You Need to Do on GitHub (Step-by-Step)

### Step 1: Create a New Repository on GitHub
1. Open your browser and go to: **[https://github.com/new](https://github.com/new)** (Make sure you are logged in as `Harsha3108`).
2. Fill in the repository details:
   - **Repository name:** `smart-ration-system`
   - **Description:** `Smart Public Ration Distribution System Using RFID Authentication, Biometrics, and Real-Time SMS Notifications (ESP32 IoT + Firebase)`
   - **Visibility:** Select **Public** (required for free GitHub Pages hosting).
   - **Initialize repository with:** Leave "Add a README file" unchecked (we have already created the complete project files).
3. Click the green button: **"Create repository"**.

---

### Step 2: Upload Project Files to Your New Repository

You can upload the files either using the **GitHub Web Interface (Drag & Drop)** or via **Git CLI**.

#### Option A: Easy Web Upload (No Git Installation Needed)
1. On your newly created repository page (`https://github.com/Harsha3108/smart-ration-system`), look for:
   > *"...or upload an existing file"*
2. Click **"uploading an existing file"** (or click **Add file** $\rightarrow$ **Upload files**).
3. Open your computer file explorer to: `c:\mmmmmmm\`
4. Drag and drop all the project files into the GitHub browser window:
   - `index.html` *(Must be in the repository root for GitHub Pages)*
   - `styles.css`
   - `app.js`
   - `firebase-config.js`
   - `README.md`
   - And the folders: `docs/`, `firmware/`, `database/`
5. At the bottom under "Commit changes":
   - Enter commit message: `Initial commit: Smart Ration System firmware, web dashboard, and docs`
   - Ensure **"Commit directly to the main branch"** is selected.
6. Click the green button: **"Commit changes"**.

#### Option B: Using Git Command Line (If you have Git installed on your PC)
Run these commands in terminal from `c:\mmmmmmm\`:
```bash
git init
git add .
git commit -m "Initial commit: Complete Smart Ration System IoT codebase"
git branch -M main
git remote add origin https://github.com/Harsha3108/smart-ration-system.git
git push -u origin main
```

---

### Step 3: Enable & Approve GitHub Pages (Where to Approve)

Here is exactly where you configure and approve GitHub Pages:

1. In your repository on GitHub, click on the **Settings** tab (the gear icon on the top right navigation bar of the repository).
   - Direct URL: `https://github.com/Harsha3108/smart-ration-system/settings`
2. In the left-hand sidebar menu, scroll down to the **"Code and automation"** section and click on **Pages**.
   - Direct URL: `https://github.com/Harsha3108/smart-ration-system/settings/pages`
3. Under **"Build and deployment"**:
   - **Source:** Ensure dropdown is set to **"Deploy from a branch"**.
   - **Branch:** Click the branch dropdown and select **`main`**.
   - **Folder:** Keep the folder as **`/ (root)`**.
4. Click the **Save** button.

---

### Step 4: Your Live Web Dashboard URL

After clicking **Save**, GitHub automatically triggers a GitHub Actions deployment workflow.
- In approximately **1 to 2 minutes**, refresh the Pages settings screen.
- You will see a banner at the top:
  > **"Your site is live at https://harsha3108.github.io/smart-ration-system/"**
- Visit that URL from any computer, tablet, or smartphone to open your live **Smart Public Ration Distribution System Admin Dashboard & Beneficiary Portal**!

---

## 2. Default Login Credentials for the System

### Administrator Credentials:
| Parameter | Value |
| :--- | :--- |
| **Admin Portal** | Direct toggle on Web Dashboard |
| **Username / Email** | `admin@smartration.gov` |
| **Password** | `Admin@Ration2026` |
| **Permissions** | Full CRUD on Beneficiaries, RFID UID re-assignment, Fingerprint Template mapping, Broadcast SMS trigger, HX711 Calibration factor sync, Monthly Quota reset |

### Beneficiary Pre-Configured Accounts (3 Cards):
| Card ID | Beneficiary Head | Family Members | Allocated Quota | User Login ID | Password | Registered Fingerprint Slots |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RC101** | Ramesh Kumar | **2 Members** (Ramesh, Sunita) | 10.0 kg Rice | `RC101` | `User@101` | Slots **#1** and **#2** |
| **RC102** | Rajesh Patel | **3 Members** (Rajesh, Priya, Amit) | 15.0 kg Wheat | `RC102` | `User@102` | Slots **#3**, **#4**, and **#5** |
| **RC103** | Suresh Sharma | **4 Members** (Suresh, Geeta, Rahul, Anita) | 20.0 kg Rice | `RC103` | `User@103` | Slots **#6**, **#7**, **#8**, and **#9** |

*(Quick 1-click login buttons are also built right into the web dashboard header under "Sign In / Switch Account" for testing).*
