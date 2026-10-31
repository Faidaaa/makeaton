# Brightloop Authentication & RBAC API Documentation

This document provides a comprehensive guide for frontend developers and backend teammates integrating with Brightloop's Authentication and Role-Based Access Control (RBAC) subsystems.

---

## 1. Architectural Overview

- **Authentication Method:** JSON Web Tokens (JWT) issued into `HttpOnly`, `SameSite=Lax` cookies (`token`).
- **Storage:** No tokens are stored in `localStorage` or `sessionStorage` (mitigating XSS attack vectors).
- **Password Security:** Salted and hashed using `bcryptjs` (work factor 10–12).
- **Session Duration:** 24 hours.
- **Roles Supported:**
  - `admin`: Full platform access, admin console, staff creation, staff routes.
  - `staff`: Access to staff workspace and management tools.
  - `customer`: Public access level; access to customer subscription portal only.

---

## 2. API Endpoints Reference

### 2.1 Public Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
Registers a new customer account. Public registration **always** assigns the role `customer` (client-provided roles are ignored).

- **Rate Limit:** 10 registrations per 15 minutes per IP.
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "Password@123",
    "fullName": "Jane Doe" // optional
  }
  ```
- **Password Rules:**
  - Minimum 8 characters
  - At least one uppercase letter (`A-Z`)
  - At least one lowercase letter (`a-z`)
  - At least one special character (`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`)
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "user": {
      "id": "6723a1b2c3d4e5f678901234",
      "email": "customer@example.com",
      "role": "customer",
      "createdAt": "2026-10-31T12:00:00.000Z"
    }
  }
  ```
- **Error Responses:** `400 Bad Request` (validation/weak password), `409 Conflict` (duplicate email).

---

#### `POST /api/auth/login`
Authenticates a user and sets the `token` HTTP-only cookie.

- **Rate Limit:** 5 failed attempts per 15 minutes per IP.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password@123"
  }
  ```
- **Success Response (200 OK):**
  - Sets Header: `Set-Cookie: token=<jwt>; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`
  - Body:
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "user": {
        "id": "6723a1b2c3d4e5f678901234",
        "email": "user@example.com",
        "role": "customer",
        "createdAt": "2026-10-31T12:00:00.000Z"
      }
    }
    ```
- **Error Responses:** `401 Unauthorized` (generic `"Invalid email or password."`), `403 Forbidden` (account deactivated), `429 Too Many Requests`.

---

#### `GET /api/auth/me`
Retrieves sanitized profile details for the currently active session.

- **Authentication:** Required (`token` cookie or `Authorization: Bearer <jwt>`).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "id": "6723a1b2c3d4e5f678901234",
    "email": "user@example.com",
    "role": "customer"
  }
  ```
- **Error Response:** `401 Unauthorized` (`"Access denied. No authentication token provided."` or `"Session expired."`).

---

#### `POST /api/auth/logout`
Invalidates the current session by clearing the `token` cookie.

- **Success Response (200 OK):**
  - Sets Header: `Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  - Body:
    ```json
    {
      "success": true,
      "message": "Logged out successfully."
    }
    ```

---

#### `POST /api/auth/forgot-password`
Generates a cryptographically random reset token, stores its SHA-256 hash with a 1-hour expiry, and dispatches a reset link via email.

- **Rate Limit:** 3 requests per 15 minutes per IP.
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response (200 OK):**
  - Returns a generic message to prevent account enumeration:
    ```json
    {
      "success": true,
      "message": "If an account with that email exists, a password reset link has been dispatched."
    }
    ```

---

#### `POST /api/auth/reset-password`
Verifies the SHA-256 hash of the reset token and updates the user's password.

- **Request Body:**
  ```json
  {
    "token": "a1b2c3d4e5f6...",
    "password": "NewStrongPassword@123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password updated successfully. You may now log in with your new password."
  }
  ```
- **Error Responses:** `400 Bad Request` (token invalid, expired, or weak password).

---

### 2.2 Administrative Endpoints (`/api/admin`)

#### `POST /api/admin/create-staff`
Creates a new staff member account. Accessible **only** by users with the `admin` role.

- **Authentication:** Required (`protect` middleware + `requireRole(['admin'])`).
- **Request Body:**
  ```json
  {
    "email": "staff.member@brightloop.com",
    "password": "StaffPassword@123",
    "fullName": "Staff Member Name" // optional
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Staff account created successfully.",
    "user": {
      "id": "6723b2c3d4e5f67890123456",
      "email": "staff.member@brightloop.com",
      "fullName": "Staff Member Name",
      "role": "staff",
      "createdAt": "2026-10-31T12:30:00.000Z"
    }
  }
  ```
- **Error Responses:** `401 Unauthorized` (not logged in), `403 Forbidden` (non-admin attempting access), `409 Conflict` (duplicate email).

---

## 3. How Teammates Can Protect Backend Routes

To guard new APIs or dashboards being built by other team members, use the reusable middleware in `backend/middleware/`:

### 3.1 Basic Authentication Guard (`protect`)
Verifies that the caller has a valid, non-expired session and attaches `req.user` (sanitized Mongoose user document without `passwordHash`):

```javascript
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Any authenticated user (customer, staff, or admin)
router.get('/my-profile', protect, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
```

### 3.2 Role-Based Access Control (`requireRole`)
To restrict routes to specific roles, chain `requireRole(allowedRoles)` **after** `protect`:

```javascript
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// 1. Admin only
router.delete('/system/purge', protect, requireRole(['admin']), purgeHandler);

// 2. Staff and Admin
router.get('/subscriptions/all', protect, requireRole(['admin', 'staff']), listAllSubscriptions);

// 3. Customer only
router.get('/my-subscription', protect, requireRole(['customer']), getCustomerSubscription);
```

---

## 4. Frontend Integration Guide

### 4.1 Using `authService`
Import the centralized auth service from `frontend/src/services/authService.js`:

```javascript
import { authService } from '../services/authService';

// All methods automatically attach `credentials: 'include'`
await authService.login(email, password);
await authService.logout();
const currentUser = await authService.me();
```

### 4.2 Using the `useAuth()` Hook
Components wrapped in `AuthProvider` (see `App.jsx`) can read global auth state directly:

```javascript
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function MyWidget() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div>Loading user session...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <p>Hello, {user.email}! (Role: {user.role})</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### 4.3 Route Protection (`ProtectedRoute`)
To protect frontend dashboard routes, wrap them in `<ProtectedRoute>` in `App.jsx`:

```jsx
<Route
  path="/staff/dashboard"
  element={
    <ProtectedRoute allowedRoles={['staff', 'admin']}>
      <StaffDashboard />
    </ProtectedRoute>
  }
/>
```
Users without the required role will be redirected to their role portal automatically (`/admin`, `/staff`, or `/customer`), and unauthenticated users will be redirected to `/login`.

### 4.4 Dedicated Role Login Routes
The application provides both universal and dedicated role-specific login routes:
- `/admin/login` — Dedicated Admin Console login (pre-selects ADMIN tab, custom admin branding).
- `/staff/login` — Dedicated Staff Workspace login (pre-selects STAFF tab, workspace branding).
- `/customer/login` or `/login` — Customer Portal login.

Users can also switch between role portals dynamically using the interactive segmented switch on the login screen. Regardless of the entry route, the backend securely validates credentials and enforces role-based redirection to the authorized destination (`/admin`, `/staff`, or `/customer`).

