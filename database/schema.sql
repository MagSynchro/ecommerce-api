DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS oauth_accounts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash TEXT,
role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);
CREATE TABLE oauth_accounts (
id SERIAL PRIMARY KEY,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
provider VARCHAR(50) NOT NULL, 
provider_user_id VARCHAR(255) NOT NULL,
provider_email VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
UNIQUE(provider, provider_user_id)
);
CREATE TABLE products (
id SERIAL PRIMARY KEY,
name VARCHAR(255) UNIQUE NOT NULL,
price DECIMAL(10,2) NOT NULL,
description TEXT,
short_description TEXT,
image_url TEXT,
is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE cart_items (
id SERIAL PRIMARY KEY,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
product_id INTEGER NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL CHECK (quantity > 0),
UNIQUE(user_id, product_id)
);
CREATE TABLE orders (
id SERIAL PRIMARY KEY,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
stripe_session_id VARCHAR(255),
status VARCHAR(50) DEFAULT 'pending',
refunded_amount DECIMAL(10,2) NOT NULL DEFAULT 0
);
CREATE TABLE order_items (
id SERIAL PRIMARY KEY,
order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
product_id INTEGER NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL CHECK (quantity > 0),
price_at_time DECIMAL(10,2) NOT NULL
);