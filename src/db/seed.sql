INSERT INTO users (email, password_hash)
VALUES
('alice@test.com', 'hashed_pw_1'),
('bob@test.com', 'hashed_pw_2');
INSERT INTO products (name, price, description)
VALUES
('Laptop', 999.99, 'Basic dev laptop'),
('Keyboard', 49.99, 'Mechanical keyboard'),
('Mouse', 19.99, 'Wireless mouse');
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES
(1, 1, 1),
(1, 2, 2);
INSERT INTO orders (user_id)
VALUES
(1);
INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
VALUES
(1, 1, 1, 999.99);