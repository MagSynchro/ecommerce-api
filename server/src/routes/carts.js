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
 * tags:
 *   name: Cart
 *   description: Shopping cart management (requires authentication)
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get current user's cart
 *     tags:
 *       - Cart
 *     responses:
 *       200:
 *         description: List of cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   quantity:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 */

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT c.id, p.name, p.price, c.quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
  });

 /**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add product to cart (increments quantity if item already exists)
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *                 description: ID of the product to add to the cart
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 description: Quantity to add (will be added to existing quantity if item already exists)
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item already existed and quantity was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 user_id:
 *                   type: integer
 *                 product_id:
 *                   type: integer
 *                 quantity:
 *                   type: integer
 *                   description: Updated total quantity in cart
 *       201:
 *         description: New item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 user_id:
 *                   type: integer
 *                 product_id:
 *                   type: integer
 *                 quantity:
 *                   type: integer
 *                   description: Quantity of newly created cart item
 *       401:
 *         description: Unauthorized - user must be logged in
 *       500:
 *         description: Server error
 */

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    // check if item already exists
    const existing = await pool.query(
      `SELECT * FROM cart_items
       WHERE user_id = $1 AND product_id = $2`,
      [userId, product_id]
    );

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE cart_items
         SET quantity = quantity + $1
         WHERE user_id = $2 AND product_id = $3
         RETURNING *`,
        [quantity, userId, product_id]
      );

      return res.json(updated.rows[0]);
    }

    // insert new item
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, product_id, quantity]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /cart/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart item updated
 *       404:
 *         description: Cart item not found
 *       401:
 *         description: Unauthorized
 */

router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const result = await pool.query(
      `UPDATE cart_items
      SET quantity = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *`,
      [quantity, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /cart/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       204:
 *         description: Item removed successfully
 *       404:
 *         description: Cart item not found
 *       401:
 *         description: Unauthorized
 */

router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
  const result = await pool.query(
    `DELETE FROM cart_items
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  res.sendStatus(204);

} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}
  
});

module.exports = router;