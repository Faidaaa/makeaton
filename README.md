# Brightloop Subscription Management System (SUBNEX)

Brightloop is a modern, enterprise-grade **Subscription Management & Revenue Orchestration Platform** built for the Odoo Hackathon following the provided **Design System Specification & Style Guide (`design.md`)**.

---

## 🏗️ Platform Architecture & Member Modules

The system brings together four specialized modules into an integrated revenue operations engine:

```text
makeaton/
├── backend/                    # Core Backend: Node.js (ESM) + Express + MongoDB Atlas + JWT Cookies
│   ├── config/                 # MongoDB Atlas connection with in-memory failover
│   ├── controllers/            # Auth, Admin RBAC, Products, Plans, Taxes, Discounts, Invoices, Telemetry
│   ├── middleware/             # protect (JWT Cookie / Bearer), requireRole (RBAC), errorMiddleware
│   ├── models/                 # User.js, schemas.js (Products, Plans, Taxes, Discounts, Invoices)
│   ├── routes/                 # /api/auth, /api/admin, /api/products, /api/plans, /api/taxes, etc.
│   └── server.js               # Unified API server
│
├── frontend/                   # Member 1 Auth Gateway & Member 2 Admin Console
│   ├── src/                    # React (Vite) single-screen zero-scroll authentication app
│   │   ├── components/auth/    # Segmented role switchers, password checklist, illustrations
│   │   ├── context/AuthContext # Global session manager (verifies GET /api/auth/me on load)
│   │   ├── pages/AuthPage.jsx  # Customer / Staff / Admin dedicated login portals
│   │   └── services/authService# Centralized API client with credentials: 'include'
│   └── admin-console.html      # Member 2 High-contrast HTML/JS Administrative Console
│
├── client/                     # Member 3: React (Vite) Staff Workspace & Quotation Builder
│   ├── src/pages/StaffWorkspace.jsx
│   ├── src/pages/QuotationBuilder.jsx
│   └── src/pages/SubscriptionDetail.jsx
│
├── server/                     # Member 3: Quotation & Subscription lifecycle backend
│   └── src/routes/quotationRoutes.js
│
└── docs/
    └── AUTHENTICATION_API.md   # Complete API & RBAC developer guide
```

---

## 👥 Module Breakdown

### 1. Member 1: Authentication & RBAC Gateway
- **Single-Screen Zero-Scroll Auth Interface:** 100dvh viewport locking, high-contrast segmented role switcher (`Customer Portal`, `Staff Workspace`, `Admin Console`).
- **Dedicated Portals:**
  - `/login` / `/customer/login` $\rightarrow$ Customer Portal sign-in
  - `/staff/login` $\rightarrow$ Staff Workspace sign-in
  - `/admin/login` $\rightarrow$ Admin Console sign-in
- **Security & Session Architecture:**
  - Salted and hashed passwords with bcrypt (work factor 12).
  - Signed JWTs stored exclusively in `HttpOnly`, `SameSite=Lax` cookies (no tokens in `localStorage`).
  - Cryptographically secure password reset workflow (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`).
  - Strict Role-Based Access Control (`admin`, `staff`, `customer`) via `roleMiddleware.js` and `<ProtectedRoute>`.

### 2. Member 2: Admin Console & Product Catalog
- **Products & Brand Variants:** Multi-tier product setup, price adjustments, and dynamic SKU generation.
- **Plan Engine:** Billing cadences (daily, weekly, monthly, yearly), minimum commitments, and lifecycle dates.
- **Tax & Discount Rules:** Percentage & fixed calculation engine, conditional validation (`ANNUAL20`, `BRIGHT10`).
- **Executive Telemetry:** Active MRR metrics, subscriber health counters, and recent activity logs.

### 3. Member 3: Staff Workspace & Quotation Builder
- **Real-time Staff Dashboard:** Open quotations, active subscription pipeline ARR/MRR.
- **Interactive Quotation Builder:** Real-time financial calculations, line-item taxes, payment term selectors ("Net 30", "Net 15"), and one-click quotation-to-subscription conversion.
- **5-State Subscription Pipeline:**
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longrightarrow \text{Closed}$$
  with pause/resume, audit timelines, and term extensions.

### 4. Member 4: Customer Portal & Invoicing (SUBNEX)
- **Customer Self-Service:** Subscription management, plan upgrades, instant checkout, and cancellation workflows.
- **Invoice & Payment Ledger:** Filterable invoices, downloadable PDFs, and payment receipts.
- **Profile & Notification Center:** Organization details, billing addresses, and transactional notifications.

---

## 🎨 Design System Compliance (`design.md`)

- **Canvas Background:** `#fcfbf9`
- **Surface:** `#ffffff`
- **Subtle Background:** `#f4f3f0`
- **Primary Text:** `#111827`
- **Strong Borders:** `2px solid #000000` with tactile hard drop-shadows (`box-shadow: 2px 2px 0 #000`)
- **Primary Accent:** `#ff4f00` (Vermilion orange CTAs)
- **Secondary Accent:** `#2563eb` (Royal blue highlights)
- **Typography:** Inter (headings and body) & JetBrains Mono (badges, metrics, IDs, code)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# In the root repository directory:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Create or edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/brightloop
JWT_SECRET=brightloop_secure_secret_key_2026
ADMIN_EMAIL=admin@brightloop.com
ADMIN_PASSWORD=Admin@12345
```

### 3. Seed Administrator Account
```bash
cd backend
npm run seed:admin
```

### 4. Launch Development Servers
```bash
# Terminal 1: Backend API (port 5000)
cd backend
npm run dev

# Terminal 2: Frontend SPA (port 5173)
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.
