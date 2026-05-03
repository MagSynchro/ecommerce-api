const express = require('express');
const pool = require('../db');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

router.use(ensureAuthenticated);

router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT *
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Step 1: Get the order (and verify ownership)
    const orderResult = await pool.query(
      `SELECT id, created_at
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 2: Get order items
    const itemsResult = await pool.query(
      `SELECT oi.product_id, p.name, oi.quantity, oi.price_at_time
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    // Step 3: Combine into a clean response
    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const userId = req.user.id;

  try {
    // STEP 1: get cart items
    const cart = await pool.query(
      `SELECT c.product_id, c.quantity, p.price
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cart.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderResult = await pool.query(
      `INSERT INTO orders (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );

    const orderId = orderResult.rows[0].id;
    
    for (const item of cart.rows) {
      await pool.query(
        `INSERT INTO order_items
         (order_id, product_id, quantity, price_at_time)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }
    
    await pool.query(
      `DELETE FROM cart_items WHERE user_id = $1`,
      [userId]
    );
    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;