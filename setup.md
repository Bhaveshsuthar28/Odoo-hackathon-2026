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
- **API & Docs:** [http://localhost:4000/documentation](http://localhost:4000/documentation)

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

## 🔑 Demo Logins

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@subflow.io` | `SubFlow@Admin2026!` |
| **Staff** | `sarah.ops@subflow.io` | `SubFlow@Staff2026!` |
| **Customer** | `john@acmecorp.com` | `Customer@SubFlow2026!` |

---

## 🧪 Run Tests (Optional)
To verify everything is working properly:
```bash
npm run test
```
