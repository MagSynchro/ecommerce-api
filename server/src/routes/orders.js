const express = require('express');
const pool = require('../../../database/connection');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

router.use(ensureAuthenticated);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders for the logged-in user
 *     tags:
 *       - Orders
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */

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

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get a specific order with items
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       price_at_time:
 *                         type: number
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */

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

module.exports = router;