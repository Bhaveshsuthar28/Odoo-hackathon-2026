# SubFlow Setup Guide

Quick and simple instructions to run SubFlow on your computer.

---

## ⚡ Option 1: Run with Docker (Recommended)

No need to install Node.js or PostgreSQL. Just Docker Desktop.

### 1. Copy Environment File

Open your terminal in the project folder and run:

```bash
cp .env.example .env
```

*(On Windows PowerShell, use: `Copy-Item .env.example .env`)*

### 2. Start SubFlow

```bash
docker compose up -d --build
```

### 3. Open in Browser

- **App:** [http://localhost:3000](http://localhost:3000)
- **API & Swagger Docs:** [http://localhost:4000/documentation](http://localhost:4000/documentation)

### 4. Stop SubFlow

```bash
docker compose down
```

---

## 💻 Option 2: Run Locally (Without Docker)

### 1. Requirements

- Node.js v20+
- PostgreSQL running on port 5432

### 2. Install & Configure

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Setup database & seed sample data
npm run db:push
npm run db:seed
```

### 3. Start the Project

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Role-Based Portals & URLs

| Portal                           | URL                           | Description                                                     |
| -------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| **Portal Selector**        | `/login`                    | Interactive entry point for selecting your role portal          |
| **Admin Login**            | `/admin/login`              | Full system access, financials, audit logs & staff provisioning |
| **Staff Login**            | `/staff/login`              | Operational access: quotations, customer records, payments      |
| **Customer Login**         | `/customer/login`           | Verified subscriber access to plans, invoices & receipts        |
| **Customer Registration**  | `/customer/register`        | Self-service signup strictly for `@gmail.com` accounts        |
| **Email OTP Verification** | `/customer/verify-email`    | 6-digit individual box verification with 5-minute expiry        |
| **Forgot Password**        | `/customer/forgot-password` | Gmail OTP password recovery                                     |
| **Reset Password**         | `/customer/reset-password`  | Set new password with OTP confirmation                          |

---

## 🔑 Demo Accounts

| Role               | Email                    | Password                  | Allowed Portal      |
| ------------------ | ------------------------ | ------------------------- | ------------------- |
| **Admin**    | `admin@subflow.io`     | `SubFlow@Admin2026!`    | `/admin/login`    |
| **Staff**    | `sarah.ops@subflow.io` | `SubFlow@Staff2026!`    | `/staff/login`    |
| **Customer** | `john.doe@gmail.com`   | `Customer@SubFlow2026!` | `/customer/login` |

> [!NOTE]
> In local development/test environments without Google App Passwords configured, emails and OTP codes are safely simulated and displayed directly in the API console. To deliver real emails via Gmail, set `MAIL_USER` and `MAIL_PASSWORD` in your `.env` file.

---

## 🧪 Run Automated Tests

To verify the complete test suite including billing calculations, security isolation, QA lifecycles, and Gmail OTP verification:

```bash
npm test
```
