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
      `SELECT c.id AS cart_item_id, c.product_id, p.name, p.price, c.quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1`,
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

    const result = await pool.query(
      `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE
      SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
      `,
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
  * /cart/sync:
  *   post:
  *     summary: Sync guest cart with authenticated user cart
  *     description: >
  *       Merges a guest (local storage) cart into the authenticated user's database cart.
  *       Matching items (by product_id) will have their quantities summed.
  *       Non-existing items will be inserted.
  *
  *       This endpoint is idempotent and returns the final authoritative cart state.
  *
  *     tags:
  *       - Cart
  *
  *     security:
  *       - bearerAuth: []
  *
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             required:
  *               - items
  *             properties:
  *               items:
  *                 type: array
  *                 description: Guest cart items to merge into user cart
  *                 items:
  *                   type: object
  *                   required:
  *                     - product_id
  *                     - quantity
  *                   properties:
  *                     product_id:
  *                       type: integer
  *                       example: 1
  *                     quantity:
  *                       type: integer
  *                       example: 3
  *
  *     responses:
  *       200:
  *         description: Cart successfully merged and returned
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   cart_item_id:
  *                     type: integer
  *                     example: 10
  *                   product_id:
  *                     type: integer
  *                     example: 1
  *                   name:
  *                     type: string
  *                     example: Laptop
  *                   price:
  *                     type: number
  *                     example: 999.99
  *                   quantity:
  *                     type: integer
  *                     example: 4
  *
  *       400:
  *         description: Invalid request payload
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: Invalid cart items payload
  *
  *       401:
  *         description: Unauthorized
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: Unauthorized
  *
  *       500:
  *         description: Server error during cart sync
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 message:
  *                   type: string
  *                   example: Cart sync failed
  */

router.post("/sync", async (req, res) => {
  try {
    console.log("Syncing cart for user:", req.user.id, req.body.items);
    const userId = req.user.id;
    const guestItems = req.body.items || [];

    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return res.status(200).json({ message: "Nothing to sync" });
    }

    // Step 1: fetch current DB cart
    const dbResult = await pool.query(
      `SELECT product_id, quantity FROM cart_items WHERE user_id = $1`,
      [userId]
    );

    const dbCart = dbResult.rows;

    // Step 2: build map of existing cart
    const map = new Map();

    for (const item of dbCart) {
      map.set(item.product_id, item.quantity);
    }

    // Step 3: merge guest cart into DB map
    for (const item of guestItems) {
      const current = map.get(item.product_id) || 0;
      map.set(item.product_id, current + item.quantity);
    }

    // Step 4: UPSERT final result (single source of truth)
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const [productId, quantity] of map.entries()) {
        await client.query(
          `
          INSERT INTO cart_items (user_id, product_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, product_id)
          DO UPDATE SET quantity = EXCLUDED.quantity
          `,
          [userId, productId, quantity]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    // Step 5: return final authoritative cart
    const finalCart = await pool.query(
      `SELECT * FROM cart_items WHERE user_id = $1`,
      [userId]
    );

    res.json(finalCart.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cart sync failed" });
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

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }

});

module.exports = router;