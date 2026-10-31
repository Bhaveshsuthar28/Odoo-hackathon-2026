# SubFlow — Complete Subscription Management & Recurring Billing Platform

> **"Every Subscription. Every Payment. Every Invoice."**

SubFlow is an enterprise-grade SaaS Subscription Management and Recurring Billing platform inspired by Odoo's clean enterprise design language. It is built as a modular, TypeScript monorepo featuring a **Next.js 15 App Router frontend**, a **Fastify REST API**, an **autonomous Node.js recurring billing worker**, and a **PostgreSQL relational database via Prisma ORM**.

The entire project is fully **Dockerized** with multi-stage builds, separate development and production profiles, automated migrations, database readiness health checks, and hot-reload development workflows.

---

## 🏛️ Architecture Overview

```text
subflow/
├── apps/
│   ├── web/                     # Next.js 15 (App Router, Tailwind, ECharts, Odoo Theme)
│   │   ├── app/                 # Dashboard, Customers, Plans, Quotes, Invoices, Portal
│   │   ├── components/          # Sidebar, TopNav, Charts, UI modals
│   │   ├── lib/                 # AuthContext, API client, Currency formatting
│   │   ├── Dockerfile           # Multi-stage Dockerfile (dev & production runner)
│   │   └── package.json
│   │
│   ├── api/                     # Fastify REST API & Business Engines
│   │   ├── src/
│   │   │   ├── modules/         # Auth, Billing Engine, Invoices, Payments, Portal, AI
│   │   │   ├── plugins/         # Fastify JWT, Cookies, CORS, Swagger, Rate Limit
│   │   │   ├── app.ts           # Fastify application setup
│   │   │   └── server.ts        # Server entrypoint
│   │   ├── Dockerfile           # Multi-stage Dockerfile (dev & production runner)
│   │   └── package.json
│   │
│   └── worker/                  # Standalone Autonomous Scheduled Billing Worker
│       ├── src/
│       │   └── worker.ts        # Node-cron recurring scheduler with single-instance lock
│       ├── Dockerfile           # Multi-stage Dockerfile (dev & production runner)
│       └── package.json
│
├── packages/
│   ├── database/                # Relational Prisma ORM Schema & Migrations
│   │   ├── prisma/
│   │   │   ├── migrations/      # Versioned SQL migrations for production deployment
│   │   │   ├── schema.prisma    # Full relational models with Decimal & UUID keys
│   │   │   └── seed.ts          # Realistic seed script
│   │   └── src/index.ts         # Singleton Prisma client export
│   │
│   └── shared/                  # Common Types, Zod Schemas & Decimal.js Helpers
│       └── src/index.ts         # Math calculation helpers, tax/discount formulas
│
├── scripts/
│   └── docker-init-db.js        # Safe database readiness & migration entrypoint
├── docker-compose.yml           # Development Compose (Hot reload, bind mounts)
├── docker-compose.prod.yml      # Production Compose (Immutable, hardened, non-root)
├── .dockerignore                # Monorepo build hygiene & cache optimization
├── package.json                 # Monorepo workspace orchestration
├── .env.example                 # Complete documented environment configuration
└── README.md
```

---

## 🐳 Docker Deployment Guide

SubFlow is designed so that any engineer on your team can clone the repository, configure an environment file, and run the complete ecosystem in seconds without manually installing Node.js, PostgreSQL, or npm packages on their host machine.

### Prerequisites

1. **Docker Engine & Docker Compose:**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or Docker Engine + Compose plugin (Linux).
   - Ensure Docker is running: `docker compose version` (v2.20+ recommended).

---

### Quick Start: Development Mode (Hot Reloading)

In development mode, containers use volume bind mounts so that changes to your TypeScript source code trigger immediate hot reloading (Next.js Fast Refresh for frontend, and `tsx watch` for API and Billing Worker).

#### 1. Configure Environment
```bash
# Copy template to active environment file
cp .env.example .env
```

#### 2. Start the Development Stack
```bash
docker compose up --build
```
*Tip: Add `-d` to run in detached background mode:*
```bash
docker compose up -d --build
```

#### 3. Access Services
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **Fastify API Server:** [http://localhost:4000](http://localhost:4000)
- **Interactive Swagger Docs:** [http://localhost:4000/documentation](http://localhost:4000/documentation)
- **PostgreSQL Database:** `localhost:5432` (User: `subflow`, Password: `subflow_secure_password`, DB: `subflow_db`)

#### 4. Stop Containers Safely
To stop the environment **without** destroying your database or records:
```bash
docker compose down
```
> [!WARNING]
> Do NOT use `docker compose down -v` unless you intentionally want to delete the persistent PostgreSQL volume and wipe all data.

---

### Quick Start: Production Mode

In production mode:
- Application containers run lightweight, multi-stage Alpine images.
- Non-root users (`node` / `nextjs`) execute processes.
- Source code is baked immutably into images with zero development bind mounts.
- A dedicated ephemeral `db-migrate` service runs `prisma migrate deploy` once before API and Worker start.

#### 1. Launch Production Stack
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

#### 2. Verify Status & Healthchecks
```bash
docker compose -f docker-compose.prod.yml ps
```

#### 3. Stop Production Stack
```bash
docker compose -f docker-compose.prod.yml down
```

---

## 🛠️ Everyday Docker Management Commands

| Action | Command |
|---|---|
| **View all running containers** | `docker compose ps` |
| **Stream all logs** | `docker compose logs -f` |
| **Stream API logs** | `docker compose logs -f api` |
| **Stream Web logs** | `docker compose logs -f web` |
| **Stream Billing Worker logs** | `docker compose logs -f worker` |
| **Connect to PostgreSQL CLI** | `docker compose exec postgres psql -U subflow -d subflow_db` |
| **Re-run Seed Script in Container** | `docker compose exec api npm run db:seed` |
| **Apply New Prisma Migrations** | `docker compose exec api npm run db:migrate:deploy` |
| **Restart a specific service** | `docker compose restart api` |

---

## 💾 Database Backup & Restore Workflow

### Backing Up PostgreSQL Data
Export a timestamped SQL dump directly from the running container:
```bash
docker compose exec -T postgres pg_dump -U subflow subflow_db > subflow_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restoring PostgreSQL Data
Import a SQL dump into your containerized PostgreSQL instance:
```bash
# 1. Terminate active connections and recreate clean database
docker compose exec -T postgres psql -U subflow -d postgres -c "DROP DATABASE IF EXISTS subflow_db;"
docker compose exec -T postgres psql -U subflow -d postgres -c "CREATE DATABASE subflow_db;"

# 2. Restore from SQL file
docker compose exec -T postgres psql -U subflow -d subflow_db < subflow_backup.sql
```

---

## 🌐 Next.js & Docker Networking Architecture

When containerizing a Next.js full-stack application, an important architectural distinction must be maintained:

1. **Server-Side Networking (`INTERNAL_API_URL`):**
   - Next.js server components, API route rewrites, and SSR requests run *inside* the `web` container.
   - Inside the Docker bridge network, other containers are resolved by their service name: `http://api:4000`.
   - `INTERNAL_API_URL=http://api:4000` is used by `next.config.mjs` to proxy `/api/:path*` seamlessly.

2. **Client-Side Networking (`NEXT_PUBLIC_API_URL`):**
   - Direct browser calls (e.g. from the client's web browser on host machine) cannot resolve `http://api:4000` because `api` is an internal Docker hostname.
   - Browser calls must target the published host port: `http://localhost:4000` (or `https://api.yourdomain.com`).
   - By proxying all frontend calls through `/api/...`, Next.js acts as the single origin and eliminates browser CORS complications!

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

1. **Executive Financial Dashboard:** Database-driven real metrics (MRR, ARR, Collected Revenue, Outstanding Balances, Overdue Alerts, Apache ECharts trends).
2. **Customer Directory:** Multi-tenant customer profiles, billing addresses, subscription history, ledger accounts.
3. **Product & Variant Catalog:** Multi-tier SKUs, cost vs. sales pricing, inventory types.
4. **Subscription Plans:** Daily, Weekly, Monthly, and Yearly intervals, pause/resume, automatic closing.
5. **Quotations & Proposals:** Line item builder with automated tax (GST/VAT) and discount calculations. One-click **"Convert to Subscription"** converts accepted proposals atomically.
6. **Subscription Management:** Full lifecycle (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`), pause, resume, and cancellation tracking.
7. **Automatic Recurring Billing Engine:**
   - Detects due subscriptions (`nextBillingDate <= now`).
   - Idempotency guard prevents duplicate invoices for identical cycles.
   - Computes lines, taxes, and discounts via `Decimal.js`.
   - Advances next billing date atomically inside a PostgreSQL transaction.
   - Two execution triggers: **Autonomous Node.js Cron Worker** and Admin-triggered **"Run Billing Now"**.
8. **Invoices & Billing Ledger:** Downloadable PDF invoices generated on-the-fly via PDFKit, payment status pills, and cancellation safeguards.
9. **Payments & Reconciliation:** Partial and full payments with real-time outstanding balance calculation. Automatically promotes invoice to `PAID` when balance reaches zero. Concurrency locks prevent race-condition overpayments.
10. **Customer Self-Service Portal (`/portal`):** Dedicated customer view to download PDFs, view next billing dates, request cancellations, or pause plans.

---

## 🧪 Automated Test Suite

SubFlow includes 30 automated integration, security, and lifecycle tests:

```bash
# Run all billing, security, and QA lifecycle tests:
npm run test
```

Test breakdown:
- **Financial & Tax Math:** Exact decimal precision verification.
- **Billing Engine Idempotency:** Duplicate invoice prevention on re-runs.
- **Security Audit (CWE-640, CWE-362, CWE-639, CWE-942, CWE-284, CWE-20):** Protection against token leakage, race conditions, IDOR, CORS spoofing, and negative numbers.
- **Concurrent Torture Test:** 5 simultaneous parallel payment requests against a single invoice balance verify atomic ledger isolation.

---

## ❓ Common Troubleshooting & FAQ

#### 1. Port 5432 or 4000 is already in use on the host
If you have a local PostgreSQL or Fastify instance running on your host machine:
- Stop local PostgreSQL or adjust `POSTGRES_PORT=5433` in `.env`.
- Docker Compose will map the container's internal port to your custom host port.

#### 2. Migrations failing to connect on initial startup
The Fastify container runs `scripts/docker-init-db.js`, which polls PostgreSQL with exponential backoff until it accepts connections before running `prisma db push` or `prisma migrate deploy`. Ensure `postgres` container healthcheck is green (`docker compose ps`).

#### 3. Fast Refresh not updating on Windows with WSL 2
If file change events are not detected inside the container on Windows:
- Ensure the repository is stored inside WSL filesystem or that Docker Desktop WSL 2 integration is enabled for your distribution.
