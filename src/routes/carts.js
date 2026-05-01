const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get current cart.' });
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