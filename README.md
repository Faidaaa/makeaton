# Brightloop Subscription Management System

### Member 3: Staff Workspace, Quotation Builder & Subscription Lifecycle

This repository contains the full-stack implementation for **Member 3** of the Brightloop Subscription Management System.

---

## Architecture Overview

```text
makeaton/
├── client/                     # Frontend: React (Vite) + Custom Design System (design.md)
│   ├── src/
│   │   ├── components/common/  # Reusable UI tokens: Button, Card, Badge, Modal, Navbar
│   │   ├── pages/
│   │   │   ├── StaffWorkspace.jsx      # Module A: Staff Dashboard & Overview
│   │   │   ├── QuotationBuilder.jsx    # Module B: Interactive Quotation Creator
│   │   │   ├── QuotationList.jsx       # Module B: Quotation Directory
│   │   │   ├── QuotationDetail.jsx     # Module B: Quotation Breakdown & Conversion
│   │   │   ├── SubscriptionList.jsx    # Module C: Subscriptions Directory
│   │   │   └── SubscriptionDetail.jsx  # Module C: Lifecycle Progression Pipeline
│   │   ├── services/api.js             # API Client & Mock Fallback Adapters
│   │   └── index.css                   # High-contrast 2px black border design system
├── server/                     # Backend: Node.js + Express + Mongoose (MongoDB)
│   ├── src/
│   │   ├── models/             # Mongoose schemas: Quotation.js, Subscription.js
│   │   ├── controllers/        # Request controllers: staff, quotation, subscription
│   │   ├── routes/             # API routes: /api/staff, /api/quotations, /api/subscriptions
│   │   ├── utils/              # Calculation engine & lifecycle state machine validator
│   │   └── server.js           # Server entry point
└── package.json                # Root workspace configuration
```

---

## Implemented Modules (Member 3 Scope)

### Module A: Staff Workspace
- Real-time KPI statistics: Active Subscriptions, Open Quotations, Active Pipeline ARR/MRR Value, Lifecycle Health.
- Structured recent quotation and subscription tables with search and view filters.
- Responsive, high-contrast dashboard with crisp 2px black borders.

### Module B: Quotation Builder
- Customer picker & base subscription plan picker.
- Catalog add-on integration: dynamic product search, automatic price lookup, and quantity modification.
- Real-time financial engine: calculates line item subtotals, configurable tax rates, quotation subtotals, and grand totals.
- Reusable quotation templates support (save as template, load from existing template).
- Validity date controls, payment terms selection ("Net 30", "Net 15", "Due on Receipt").
- One-click quotation conversion into a confirmed subscription.

### Module C: Subscription Lifecycle
- Strict 5-state lifecycle progression:
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longrightarrow \text{Closed}$$
- Prevention of illegal state jumps with server-side and client-side validation.
- Audit trail & history timeline logging every transition with timestamps, staff identity, and notes.
- Pause / Resume toggle for Active subscriptions (stored cleanly via `isPaused`).
- Contract renewal term extension (+1, +3, +6, +12 months).
- Confirmation modals before executing critical status changes.

---

## Design System Compliance (`design.md`)

- **Canvas Background:** `#fcfbf9`
- **Surface:** `#ffffff`
- **Subtle Background:** `#f4f3f0`
- **Primary Text:** `#111827`
- **Secondary Text:** `#6b7280`
- **Strong Borders:** `2px solid #000000` with hard drop-shadows
- **Primary Action Accent:** `#ff4f00` (Orange buttons)
- **Secondary Accent:** `#2563eb` (Blue accents)
- **Typography:** Inter (body, headings) & JetBrains Mono (monospaced metrics, IDs, badges)

---

## Getting Started

### 1. Install Dependencies
```bash
# In the root directory:
npm run install:all
```

### 2. Run Backend Server (Express + MongoDB)
```bash
cd server
npm run dev
```
*The backend runs on `http://localhost:5000` with automatic MongoDB connection and graceful in-memory fallback.*

### 3. Run Frontend (React + Vite)
```bash
cd client
npm run dev
```
*The frontend runs on `http://localhost:5173`.*

---

## Team Integration Reference

- **Member 1 (Auth & RBAC):** Replace mock staff headers in [api.js](file:///c:/Users/Vishnu/maketon/makeaton/client/src/services/api.js) with JWT bearer token.
- **Member 2 (Admin Catalog & Taxes):** Replace routes in [catalogMockRoutes.js](file:///c:/Users/Vishnu/maketon/makeaton/server/src/routes/catalogMockRoutes.js) with real Product/Plan/Customer endpoints.
- **Member 4 (Invoices & Payments):** Consume [Subscription.js](file:///c:/Users/Vishnu/maketon/makeaton/server/src/models/Subscription.js) when status transitions to `Active` to trigger billing cycles.