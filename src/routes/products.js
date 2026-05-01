const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get all products.' });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({message: `Product ${id} retrieved.`});
});

router.post('/', (req, res) => {
  res.status(201).json({message: 'Product created'});
});
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Product ${id} updated`});
});
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Product ${id} deleted.`});
});

module.exports = router;