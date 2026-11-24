# SecureOrg – Enterprise Security Management Platform
**Course:** Computer System Security | **Institution:** Addis Ababa Science and Technology University (AASTU)  
**Author:** Fike (5th Year Software Engineering) | **Target Submission:** December 7, 2026

---

## 🛡️ Architecture & Technology Stack
- **Database:** PostgreSQL (Database: `SecureOrg`)
- **ORM:** Prisma
- **Backend:** Node.js, Express, TypeScript (Strict REST API, Helmet, Zod, JWT, bcryptjs, otplib, AES-256-GCM, SHA-256 Hash Chaining)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Design tokens from `DESIGN.md`, Material Symbols Outlined, Inter font)

---

## 🚀 Live Services
- **Backend API:** `http://localhost:5000` (API endpoint: `http://localhost:5000/api/v1`)
- **Frontend Client:** `http://localhost:5173`
- **Health Check:** `http://localhost:5000/health`

---

## 🔑 Pre-Seeded Demonstration Accounts 

| Role | Email | Password | Capabilities & Testing Purpose |
|---|---|---|---|
| **Organization Administrator** | `admin@secureorg.test` | `password` | User management, infrastructure, system settings, backup creation. Direct password login. |
| **Security Officer** | `officer@secureorg.test` | `password` | **MFA Protected!** Enter password $\to$ prompted for TOTP code or backup recovery code. Manages audits, alerts, incidents, risks, and independent role approvals. |
| **Department Manager** | `manager@secureorg.test` | `password` | Scoped to Engineering department. Submits role elevation requests for unit staff. Cannot approve own requests. |
| **Employee** | `employee@secureorg.test` | `password` | Standard least-privilege account. Accesses profile, incident reporting, and digital policy sign-off. |

---

## 🧪 Security Verification & Rubric Demonstration Guide

### 1. User Registration & Sign Up (`/register`)
- Visit `http://localhost:5173/register`
- Identical aesthetic to the enterprise login card with shield brand, TLS badges, and operational status banner.
- Real-time password policy checklist (12+ characters, uppercase, lowercase, digit, special symbol).
- Anti-bot / Anti-automation CAPTCHA checkbox.
- Upon submission, a challenge verification modal displays the single-use 6-digit challenge code to immediately verify and activate the account.

### 2. Multi-Factor Authentication (TOTP) (`/mfa-verification` & `/mfa-enrollment`)
- Sign in as `officer@secureorg.test` with password `password`.
- The system intercepts the authentication flow and requires the second factor.
- Click "Use a backup recovery code instead" and enter your backup code.
- Or sign in as `admin@secureorg.test`, navigate to **My Profile**, and click **Enroll MFA Factor** to pair any mobile authenticator (Google Authenticator) via QR code.

### 3. Separation of Duties Enforcement (`/role-requests`)
- Sign in as `manager@secureorg.test` or `officer@secureorg.test`.
- Submit a role change request where you are the target or requester.
- Attempt to review/approve your own request.
- **Result:** The server strictly rejects the request with HTTP 403 `SEPARATION_OF_DUTIES_VIOLATION`. A critical security alert is automatically triggered and logged to the audit ledger.

### 4. Cryptographic Hash-Chain Audit Log (`/audit-logs`)
- Navigate to **Audit Logs**.
- Every single authentication event, permission denial, role change, and backup action is permanently chained using:
  `eventHash = SHA-256(previousHash | timestamp | actor | action | resource | status | metadata)`
- Click the **"Verify Hash-Chain Integrity"** button in the top right.
- The server traverses all records chronologically, recomputes each SHA-256 link, and provides instant mathematical verification that no record has been altered or deleted.

### 5. Resilience & AES-256-GCM Encrypted Backups (`/backups`)
- Navigate to **Backup & Recovery**.
- Click **"Trigger Encrypted Backup"** to create a fresh snapshot.
- Backups are encrypted with AES-256-GCM and stored outside public web paths.
- Click **"Restore Test Drill"** on any backup artifact: the server decrypts the payload, validates the SHA-256 checksum, and confirms that recovery fulfills the RTO target of 4 hours.

### 6. Brute-Force Defense & Rate Limiting
- Attempt to log in with an incorrect password 5 consecutive times.
- The server locks the target account for 15 minutes, rejects further attempts with HTTP 423 `ACCOUNT_LOCKED`, logs an `AUTH_ACCOUNT_LOCKED` event, and generates a High-severity threat alert in the SOC console.

### 7. Governance, Policies & Risk Register (`/policies` & `/risks`)
- Review organizational security policies (e.g. Acceptable Use Policy, Password Standard).
- Digitally acknowledge policies; the user identity, UTC timestamp, and client IP address are recorded into the tamper-evident audit log.
- Inspect the 5x5 Likelihood vs Impact cyber risk matrix.

---

## 🛠️ How to Start Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL Server with database `SecureOrg`

### 1. Backend Setup
```bash
cd backend
npm install
# Adjust database credentials in backend/.env if needed:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/SecureOrg?schema=public"
npx prisma db push
npx tsx prisma/seed.ts
npm run build
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
