# SUBNEX – Customer Portal & Subscription Management Dashboard

A modern, high-contrast, fully functional **Customer Dashboard for SUBNEX**, built for **BrightLoop** following the provided **Design System Specification & Style Guide**.

---

## 🚀 Features & Architecture Overview

- **Design System Fidelity:**
  - High-contrast, sharp spatial structure with `2px` crisp black borders (`var(--border-strong)`).
  - High-energy accent vermilion (`#ff4f00`) and deep royal blue (`#2563eb`).
  - Warm neutral canvas (`#fcfbf9`) paired with stark white surfaces (`#ffffff`).
  - Monospace utility accents (`JetBrains Mono`) for IDs, timestamps, status tags, and statistics.
  - Tactile offsets (`box-shadow: 2px 2px 0 #000`, `translateY(-2px)`, `0 4px 0 #000` on hover).
  - Micro-skeuomorphic ticket stubs and clean horizontal dividers.

- **Technology Stack:**
  - **Backend:** Python Flask with blueprints architecture.
  - **Database:** MongoDB via PyMongo with automatic binary BSON persistence fallback for environments without an active external daemon.
  - **Charts:** Chart.js 4.4 (bundled locally in `static/vendor/chart.umd.min.js` for offline reliability).
  - **PDF Generation:** In-memory PDF invoices generated with ReportLab.
  - **Frontend:** Server-rendered Jinja2 templates, modern CSS custom properties, and vanilla ES6+ JavaScript.

- **Authentication & Security:**
  - Administrator-provisioned customer logins (no open sign-up).
  - Secure session cookies with `HttpOnly` and `SameSite` flags.
  - Time-limited token-based password reset workflow.
  - Strict tenant data isolation enforced through backend MongoDB customer ID filters.

- **Customer Modules:**
  1. **Overview Dashboard:** Clickable dynamic summary cards, 4 interactive Chart.js visualizations (Subscription Activity, Spending Overview, Invoice Status Doughnut, Subscription Distribution Doughnut), Upcoming Billing renewals ticket feed, Recent Transactions, and Recent Activity stream.
  2. **My Subscriptions:** Full subscription lifecycle management (View details, Upgrade/change plan, Pause, Resume, Renew, Cancel with audit reason, and associated billing history).
  3. **Available Plans:** Filterable product catalog (by domain, billing cycle, price range), features breakdown, discount code validation (`ANNUAL20`, `BRIGHT10`), instant checkout workflow, and enterprise quotation requests.
  4. **Invoice Management:** Comprehensive invoice ledger with status and date filters, detailed invoice view, instant payment settlement, printable CSS view, and downloadable signed PDFs.
  5. **Payment Management:** Immutable transactions ledger, payment status breakdown (Successful, Pending, Failed), payment method filters, and audit references.
  6. **Profile Settings:** Personal and organization details, billing address management, password change with security validation, notification preferences, and email change verification flow.
  7. **Notification Centre:** Live alert feed for invoices, renewals, payments, and subscriptions with read/unread statuses, unread count badges, and quick mark-all actions.
  8. **Help & Support:** Interactive FAQ accordions with `+` / `−` indicators, SLA & enterprise hotline cards, support ticket creation, and conversation reply history.

---

## 🔑 Pre-Configured Demo Accounts

| Account | Email | Password | Role / Company |
| :--- | :--- | :--- | :--- |
| **Primary Customer** | `alex.morgan@brightloop.io` | `Password123!` | BrightLoop Innovations Ltd (Has active subscriptions, invoices, payment history, notifications) |
| **Secondary Customer** | `sarah.chen@innovate.co` | `Password123!` | Innovate AI Labs Inc (Used to verify multi-tenant data isolation) |

---

## 🛠️ Installation & Running the Application

The project is organized into `backend/` (Flask application, routes, tests, dependencies, and database) and `frontend/` (Jinja templates and static assets).

### 1. Requirements
Ensure Python 3.10+ is installed on your machine.

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. (Optional) Run Native MongoDB Server
By default, the application connects to a MongoDB server running at:
```bash
mongodb://localhost:27017/subnex
```
*(If no native MongoDB server is active, the application automatically uses its high-performance persistent binary BSON storage engine in `backend/data/subnex_db.bson`, ensuring zero data loss and persistent MongoDB operations across restarts without requiring third-party services.)*

### 4. Seed the Database
```bash
python backend/seed.py --force
```

### 5. Launch the Dashboard
```bash
python backend/run.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🧪 Automated Test Suite

A complete test suite covering all authentication flows, dashboard calculations, subscription operations, invoice payments, PDF downloads, and customer data isolation is included:

```bash
python backend/test_app.py
```
*(All 14 tests pass with 0 errors.)*
