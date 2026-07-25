INSERT INTO users (email, password_hash, role)
VALUES
('alice@test.com', 'hashed_pw_1', 'admin'),
('bob@test.com', 'hashed_pw_2', 'user');
INSERT INTO products (name, price, description, short_description, image_url)
VALUES
('Laptop', 999.99, 'Basic dev laptop for you know, doing dev things.', 'Basic dev laptop.', 'https://placehold.co/800?text=Basic+Laptop&font=roboto' ),
('Keyboard', 49.99, 'Mechanical keyboard, for when you need a mechanical keyboard.', 'Mechanical keyboard','https://placehold.co/800?text=Mechanical+Keyboard&font=roboto'),
('Mouse', 19.99, 'A compact wireless gaming mouse.', 'A wireless mouse.','https://placehold.co/800?text=Wireless+Mouse&font=roboto' );
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES
(1, 1, 1);
INSERT INTO orders (user_id, created_at, stripe_session_id, status)
VALUES
(1, CURRENT_TIMESTAMP, 'sess_123', 'pending');
INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
VALUES
(1, 1, 1, 999.99);