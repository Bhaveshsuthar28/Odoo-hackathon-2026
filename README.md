# SubFlow — Complete Subscription Management & Recurring Billing Platform

> **"Every Subscription. Every Payment. Every Invoice."**

SubFlow is an enterprise-grade SaaS Subscription Management and Recurring Billing platform inspired by Odoo's clean enterprise design language. It is built as a modular, TypeScript monorepo featuring a **Next.js 15 App Router frontend**, a **Fastify REST API**, an **autonomous Node.js recurring billing worker**, and a **PostgreSQL relational database via Prisma ORM**.

---

## 🏛️ Architecture Overview

```
subflow/
├── apps/
│   ├── web/                     # Next.js 15 (App Router, Tailwind, ECharts, Odoo Theme)
│   │   ├── app/                 # Dashboard, Customers, Plans, Quotes, Invoices, Portal
│   │   ├── components/          # Sidebar, TopNav, Charts, UI modals
│   │   ├── lib/                 # AuthContext, API client, Currency formatting
│   │   └── hooks/
│   │
│   ├── api/                     # Fastify REST API & Business Engines
│   │   └── src/
│   │       ├── modules/         # Auth, Billing Engine, Invoices, Payments, Portal, AI
│   │       ├── plugins/         # Fastify JWT, Cookies, CORS, Swagger, Rate Limit
│   │       ├── middleware/      # Centralized error handler & Zod validation
│   │       ├── utils/           # Audit trail logging, PDF invoice generation
│   │       ├── app.ts           # Fastify application setup
│   │       └── server.ts        # Server entrypoint
│   │
│   └── worker/                  # Standalone Autonomous Scheduled Billing Worker
│       └── src/
│           └── worker.ts        # Node-cron recurring scheduler with single-instance lock
│
├── packages/
│   ├── database/                # Relational Prisma ORM Schema & Seed Data
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Full relational models with Decimal & UUID keys
│   │   │   └── seed.ts          # Realistic seed script
│   │   └── src/index.ts         # Singleton Prisma client export
│   └── shared/                  # Common Types, Zod Schemas & Decimal.js Helpers
│       └── src/index.ts         # Math calculation helpers, tax/discount formulas
│
├── docker-compose.yml           # PostgreSQL 16 container definition
├── package.json                 # Monorepo workspaces
├── .env.example                 # Environment configuration template
└── README.md
```

---

## ⚡ Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript with strict mode
- **Styling:** Tailwind CSS with Odoo-inspired enterprise theme (`#714B67` primary purple, `#55364E` dark purple, `#F7F7F8` light surface)
- **Typography:** `next/font/google` with Plus Jakarta Sans (headings) and Inter (body and tabular metrics)
- **Analytics & Visualizations:** Apache ECharts (`echarts`)
- **Icons:** Lucide React
- **Validation:** React Hook Form & Zod

### Backend
- **Framework:** Fastify
- **Architecture:** Modular REST API with fastify plugins
- **Authentication:** JWT in secure HTTP-only cookies (`subflow_token`) + Bearer tokens
- **Hashing:** Argon2 / Bcrypt secure password hashing
- **Documentation:** Interactive OpenAPI / Swagger UI at `/documentation`
- **PDF Generation:** PDFKit for automated tax invoice PDFs
- **Financial Math:** Decimal.js for exact financial precision without float errors

### Database
- **Engine:** PostgreSQL 16
- **ORM:** Prisma ORM with strict referential integrity, UUID primary keys, and Decimal(12, 2) monetary columns
- **Transactions:** Critical financial operations (billing runs, quote-to-subscription conversion, payment reconciliation) run in PostgreSQL transactions (`$transaction`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v20+
- **PostgreSQL:** Running on port 5432 (or via Docker Compose: `docker-compose up -d`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Default connection string:
```env
DATABASE_URL="postgresql://subflow:subflow@127.0.0.1:5432/subflow_db?schema=public"
PORT=4000
WEB_URL=http://localhost:3000
```

### 4. Database Setup & Seeding
Deploy database schema and seed demonstration accounts:
```bash
# Push schema directly to PostgreSQL
npm run db:push

# Seed realistic demo data
npm run db:seed
```

### 5. Run Verification Test Suite
Run the automated test suite verifying mathematical precision, idempotency, duplicate prevention, and payment reconciliation:
```bash
npm run test
```

### 6. Start Development Servers
Run the full stack concurrently:
```bash
npm run dev
```
Or start individually:
- **API Server:** `npm run dev:api` (Runs at `http://localhost:4000`)
- **Web App:** `npm run dev:web` (Runs at `http://localhost:3000`)
- **Worker:** `npm run dev:worker` (Autonomous scheduler)

---

## 🔑 Demonstration Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **ADMIN** | `admin@subflow.io` | `SubFlow@Admin2026!` | Full enterprise administrative privileges |
| **STAFF** | `sarah.ops@subflow.io` | `SubFlow@Staff2026!` | Quotations, subscriptions, operations |
| **STAFF** | `david.finance@subflow.io` | `SubFlow@Staff2026!` | Invoices, payments, financial reports |
| **CUSTOMER** | `john@acmecorp.com` | `Customer@SubFlow2026!` | Self-service portal: own subscriptions & invoices |
| **CUSTOMER** | `priya@techstart.io` | `Customer@SubFlow2026!` | Self-service portal: own subscriptions & invoices |

---

## 💼 Core Business Modules

1. **Executive Financial Dashboard:** Real database-driven metrics (MRR, ARR, Collected Revenue, Outstanding Balances, Overdue Alerts, Apache ECharts trends).
2. **Customer Directory:** Organization management, contact info, subscription/invoice histories, activity timelines.
3. **Product & Variant Catalog:** Multi-tier SKUs, sales and cost pricing, goods vs services.
4. **Subscription Plans:** Daily, Weekly, Monthly, and Yearly intervals, auto-close, pause/resume.
5. **Quotations & Proposals:** Line item builder with automated tax (GST) and discount calculations. One-click **"Convert to Subscription"** converts accepted proposals atomically without duplicate subscriptions.
6. **Subscription Management:** Full lifecycle (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`), pause, resume, and cancellation tracking.
7. **Automatic Recurring Billing Engine:**
   - Detects due subscriptions (`nextBillingDate <= now`).
   - Idempotency check prevents duplicate invoices for the same billing cycle.
   - Computes lines, taxes, and discounts via Decimal.js.
   - Advances next billing date inside a PostgreSQL transaction.
   - Two execution triggers: **Autonomous Node.js Cron Worker** and Admin-triggered **"Run Billing Now"**.
8. **Invoices & Billing Ledger:** Downloadable PDF invoices generated on-the-fly via PDFKit, payment status pills, and cancellation safeguards.
9. **Payments & Reconciliation:** Partial and full payments with real-time outstanding balance calculation. Automatically promotes invoice to `PAID` when balance reaches zero.
10. **Customer Self-Service Portal (`/portal`):** Dedicated customer view to download PDFs, view next billing dates, request cancellations, or pause plans.

---

## 🌟 Competitive Bonus Features

1. **Revenue Leakage Detector (`/leakage`):** Identifies failed transactions, overdue receivables, expiring subscriptions, and unbilled cycles with estimated recovery impact.
2. **Billing Simulator (`/simulator`):** Calculates mid-cycle plan switch prorations, unused credits, upgrade charges, and next renewal pricing before committing.
3. **Subscription Recovery Center (`/recovery`):** Dunning orchestration with simulated safe retries, recovery queue, and recovered revenue tracking.
4. **CSV Import Wizard (`/csv-import`):** Bulk imports customers with client-side syntax validation and database duplicate detection.
5. **AI Finance Assistant (`/ai-assistant`):** Natural language Q&A backed by predefined, authorized SQL queries answering MRR changes, top debtors, and monthly revenue.
6. **Audit Trail & Governance (`/audit`):** Immutable log of actors, entities, and actions.
