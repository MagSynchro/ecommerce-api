const express = require('express');
const pool = require('../../../database/connection');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(ensureAuthenticated);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get orders for the logged-in user, or all orders if admin and ?all=true
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: all
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Admin only - return every user's orders instead of just the caller's
 *     responses:
 *       200:
 *         description: List of orders
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
  const wantsAll = req.query.all === 'true' && req.user.role === 'admin';

  try {
    const result = wantsAll
      ? await pool.query(
          `SELECT o.*, u.email,
                  COALESCE(SUM(oi.quantity * oi.price_at_time), 0) AS total
           FROM orders o
           JOIN users u ON u.id = o.user_id
           LEFT JOIN order_items oi ON oi.order_id = o.id
           GROUP BY o.id, u.email
           ORDER BY o.created_at DESC`
        )
      : await pool.query(
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

const UPDATABLE_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update an order's processing/fulfillment status (admin only)
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, completed, cancelled]
 *     responses:
 *       200:
 *         description: Order updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Forbidden (not an admin)
 *       404:
 *         description: Order not found
 */

router.put('/:id/status', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!UPDATABLE_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${UPDATABLE_STATUSES.join(', ')}`
    });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /orders/{id}/refund:
 *   post:
 *     summary: Issue a full or partial refund on a paid order (admin only)
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to refund. Omit to refund the full remaining balance.
 *     responses:
 *       200:
 *         description: Refund issued, updated order returned
 *       400:
 *         description: Invalid refund amount or order has no payment
 *       403:
 *         description: Forbidden (not an admin)
 *       404:
 *         description: Order not found
 */

router.post('/:id/refund', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body || {};

  try {
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (!order.stripe_session_id) {
      return res.status(400).json({ message: 'Order has no associated payment to refund' });
    }

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(quantity * price_at_time), 0) AS total
       FROM order_items WHERE order_id = $1`,
      [id]
    );

    const total = Number(totalResult.rows[0].total);
    const alreadyRefunded = Number(order.refunded_amount);
    const remaining = total - alreadyRefunded;
    const refundAmount = amount === undefined ? remaining : Number(amount);

    if (!(refundAmount > 0) || refundAmount > remaining) {
      return res.status(400).json({
        message: `Refund amount must be between 0 and ${remaining.toFixed(2)}`
      });
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);

    await stripe.refunds.create({
      payment_intent: session.payment_intent,
      amount: Math.round(refundAmount * 100)
    });

    const newRefundedAmount = alreadyRefunded + refundAmount;
    const newStatus = newRefundedAmount >= total ? 'refunded' : 'partially_refunded';

    const updateResult = await pool.query(
      `UPDATE orders
       SET refunded_amount = $1, status = $2
       WHERE id = $3
       RETURNING *`,
      [newRefundedAmount, newStatus, id]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ message: 'Refund failed' });
  }
});

module.exports = router;