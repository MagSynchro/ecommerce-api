const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get all users orders.' });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({message: `User order ${id} retrieved.`});
});

router.post('/', (req, res) => {
  res.status(201).json({message: 'User order placed.'});
});

module.exports = router;