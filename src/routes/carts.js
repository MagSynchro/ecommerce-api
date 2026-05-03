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

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

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