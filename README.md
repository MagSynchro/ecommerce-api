# 🛒 Ecommerce API (Stripe + OAuth + Full Cart System)

A full-stack ecommerce application built with Node.js, Express, PostgreSQL, React, Stripe, and OAuth (Google + Discord).  
Includes cart persistence, session-based authentication, role-based admin management, and full order lifecycle management.

---

## 🚀 Features

### Authentication
- Local email/password login (Passport.js)
- OAuth login (Google + Discord)
- Session-based authentication
- Secure password hashing (bcrypt)
- Role-based access control (`user` / `admin`)

### Cart System
- Guest cart (localStorage)
- Authenticated cart (PostgreSQL)
- Automatic cart sync on login
- Persistent cart across sessions

### Checkout System
- Stripe Checkout integration
- Secure server-side price validation
- Order creation on checkout
- Stripe session tracking

### Orders
- Order history per user
- Order detail view with items
- Price snapshot at time of purchase
- Relational order_items structure

### Admin Dashboard
- Product management: create, edit, deactivate/reactivate products
- Order management: view all orders across all users, update fulfillment status
- Full or partial refunds, issued directly through Stripe
- Gated behind an `ensureAdmin` middleware and a frontend route guard

---

## 🧱 Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- Passport.js
- Stripe API

### Frontend
- React
- React Router
- Context API

---

## 🗄️ Database Schema Overview

- `users` (includes `role`: `user` | `admin`)
- `oauth_accounts`
- `products` (includes `is_active` for soft delete/deactivation)
- `cart_items`
- `orders` (includes `refunded_amount`)
- `order_items`

---

## 🔐 Authentication Flow

1. User logs in (local or OAuth)
2. Session established via Passport
3. Cart syncs if authenticated
4. Orders tied to user_id
5. Admin-only routes check `req.user.role === 'admin'` via `ensureAdmin` middleware

---

## 💳 Stripe Flow

1. Cart loaded from DB
2. Server creates Stripe session
3. User redirected to Stripe checkout
4. Success page verifies session
5. Order finalized in database
6. Cart cleared

### Refunds
Admins can issue a full or partial refund on any paid order from the Admin Dashboard. The server looks up the order's Stripe Checkout Session, refunds the associated payment intent, and updates the order's `status`/`refunded_amount` accordingly. This only reflects refunds issued through the dashboard — refunds issued directly in the Stripe Dashboard won't sync back automatically (no webhook listener yet).

---

## 🧪 Test Credentials

Stripe test mode:
Card: 4242 4242 4242 4242
Any future expiry date
Any CVC

---

## ⚙️ Setup Instructions

### Database

1. Create a PostgreSQL database and user.
2. Apply the schema: `psql -d <your_db_name> -f database/schema.sql` — **this drops and recreates all tables**, so only run it against a fresh/dev database.
3. Optionally seed sample data: `psql -d <your_db_name> -f database/seed.sql`

### Root dependencies

`database/connection.js` is shared by the server but lives outside `server/`, so it needs its own copy of `pg` resolvable from the project root:

```bash
npm install
```

### Backend

```bash
cd server
npm install
npm run dev
```

Copy `server/.env.example` to `server/.env` and fill in real values — in particular, `FRONT_END_SERVER` must match the URL the frontend actually runs on (e.g. `http://localhost:5173`), or the browser will reject every request with a CORS error.

### Frontend

```bash
cd client
npm install
npm run dev
```

See `.env.example` files in both `client/` and `server/` directories for the full list of required environment variables.

### Creating an admin user

New accounts default to the `user` role. To try the admin dashboard, register a normal account through the app, then promote it directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```
