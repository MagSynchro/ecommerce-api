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
    if (!req.user){
      return res.status(401).json({ message: 'Not logged in'});
    }
  
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

router.post('/', (req, res) => {
  res.status(201).json({message: 'Product added to cart.'});
});
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Product ${id} updated in cart.`});
});
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Product ${id} removed from cart.`});
});

module.exports = router;