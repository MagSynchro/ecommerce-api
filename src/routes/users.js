const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get all users.' });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({message: `User ${id} retrieved.`});
});

router.post('/login', (req, res) => {
  res.status(201).json({message: 'User Login'});
});
router.post('/register', (req, res) => {
  res.status(201).json({message: 'User Registered'});
});
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `User ${id} updated`});
});
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `User ${id} deleted.`});
});
module.exports = router;