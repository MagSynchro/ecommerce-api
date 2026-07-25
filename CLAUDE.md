# Project Overview & Guidelines: E-Commerce API & Client

This project is a full-stack e-commerce application featuring a Node.js/Express backend, a PostgreSQL database, and a React (Vite) frontend.

---

## Technical Stack

* **Backend**: Node.js, Express, Passport.js (Authentication), Swagger (API Docs)
* **Database**: PostgreSQL
* **Frontend**: React, Vite, React Router

---

## Repository Structure

ecommerce-api/
├── client/                  # React Frontend (Vite)
│   ├── src/
│   │   ├── api/            # Fetch client modules
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Cart contexts
│   │   ├── pages/          # Application views
│   │   └── styles/         # CSS stylesheets
│   ├── package.json
│   └── vite.config.js
├── database/                # Database Scripts & Config
│   ├── connection.js       # DB connection config
│   ├── schema.sql          # DB table schemas
│   └── seed.sql            # Initial seed data
├── server/                  # Node.js/Express Backend
│   ├── src/
│   │   ├── config/         # Passport & Swagger configs
│   │   ├── controllers/    # API Request Handlers
│   │   ├── middleware/     # Auth/role guards (ensureAuthenticated, ensureAdmin)
│   │   ├── routes/         # Express API Endpoints
│   │   ├── app.js          # Express app configuration
│   │   └── server.js       # Server entry point
│   ├── tests/               # Jest + Supertest integration tests
│   └── package.json
├── package.json              # Root dependency shim (see Common Commands)
└── README.md

---

## Common Commands

### Root
- `npm install` — Required once. `database/connection.js` is required by the server but lives outside `server/`, so it needs its own resolvable copy of `pg`.

### Backend (`/server`)
- `cd server && npm install` — Install server dependencies
- `npm run dev` — Run Express server in development mode (nodemon)
- `npm start` — Run Express server in production mode
- `npm test` — Run the Jest/Supertest integration suite (requires a reachable Postgres configured via `.env`, same as `npm run dev`)

### Frontend (`/client`)
- `cd client && npm install` — Install client dependencies
- `npm run dev` — Run Vite frontend development server
- `npm run build` — Build production bundle
- `npm run lint` — Run ESLint

### Database (`/database`)
- `psql -d <your_db_name> -f database/schema.sql` — Apply the schema. **This drops and recreates every table** — only run against a fresh/dev database.
- `psql -d <your_db_name> -f database/seed.sql` — Seed initial database data

---

## Active Roadmap: Admin Route Implementation

Administrative capabilities across backend endpoints and frontend views. Complete as of the `role`/`ensureAdmin` work.

### 1. Backend Admin Capabilities
- [x] **Admin Authentication / Authorization Middleware**: `server/src/middleware/auth.js` — `ensureAdmin` checks `req.user.role === 'admin'`.
- [x] **Product Management Endpoints** (`server/src/routes/products.js` & `server/src/controllers/productsController.js`):
  - `POST /products` — Create new product
  - `PUT /products/:id` — Edit existing product details and update prices
  - `DELETE /products/:id` — Soft-delete (deactivate) a product; hard delete isn't possible since `order_items`/`cart_items` FK-reference `products`. `GET /products?includeInactive=true` shows deactivated ones.
- [x] **Refund & Order Management Endpoints** (`server/src/routes/orders.js`):
  - `POST /orders/:id/refund` — Full or partial refund via Stripe; updates `refunded_amount`/`status`
  - `PUT /orders/:id/status` — Update order processing/fulfillment status
  - `GET /orders?all=true` — Admin-only: list every user's orders (needed for the dashboard; not in the original spec but required for the refund/status endpoints above to be usable)

### 2. Frontend Admin UI
- [x] **Admin Route Guard**: `ProtectedRoute.jsx` takes an `adminOnly` prop, redirects non-admins to `/`.
- [x] **Admin Dashboard View**: `client/src/pages/AdminDashboard.jsx` — product management, price updates, and refund processing.

### 3. Follow-ups (not yet done)
- [ ] Stripe webhook listener (`charge.refunded`) so refunds issued directly in the Stripe Dashboard also sync back to `orders` — current refund flow is one-directional (our dashboard → Stripe only).
- [ ] New users default to `role = 'user'`; there's no UI for promoting the first admin. Currently done by hand: `UPDATE users SET role = 'admin' WHERE email = '...'`.

---

## Testing

`server/tests/` holds Jest + Supertest integration tests that exercise the real Express app (`server/src/app.js`) against the configured Postgres database — no mocking of `pg`, since the bugs worth catching in this codebase (missing constraints, drifted schema) only surface against a real database. Tests create their own fixtures (randomized emails) and clean up after themselves; they don't touch seed data. Requires the same `.env` setup as `npm run dev`.

---

## Code & Architecture Guidelines

1. **Separation of Concerns**: Keep request handlers in `/server/src/controllers/` and endpoint route definitions in `/server/src/routes/`.
2. **Standardized Responses**: Return clear REST status codes (`400`, `401`, `403`, `404`, `500`) with consistent JSON error bodies (`{ message: "..." }`).
3. **API Client Layer**: Keep all frontend API requests isolated inside `/client/src/api/`.
