# 🛒 Ecommerce API (Stripe + OAuth + Full Cart System)

A full-stack ecommerce application built with Node.js, Express, PostgreSQL, React, Stripe, and OAuth (Google + Discord).  
Includes cart persistence, session-based authentication, and full order lifecycle management.

---

## 🚀 Features

### Authentication
- Local email/password login (Passport.js)
- OAuth login (Google + Discord)
- Session-based authentication
- Secure password hashing (bcrypt)

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

- users
- oauth_accounts
- products
- cart_items
- orders
- order_items

---

## 🔐 Authentication Flow

1. User logs in (local or OAuth)
2. Session established via Passport
3. Cart syncs if authenticated
4. Orders tied to user_id

---

## 💳 Stripe Flow

1. Cart loaded from DB
2. Server creates Stripe session
3. User redirected to Stripe checkout
4. Success page verifies session
5. Order finalized in database
6. Cart cleared

---

## 🧪 Test Credentials

Stripe test mode:
Card: 4242 4242 4242 4242
Any future expiry date
Any CVC


---

## ⚙️ Setup Instructions

### Database

Refer to Schema.sql in Database directory.
Built targetting PostgreSQL as database.

### Backend

```bash```
1. cd server
2. npm install
3. npm run dev

### Frontend

```bash```
1. cd client
2. npm install
3. npm run dev

See `.env.example` files in both client and server directories.
