const express = require('express');
const userController = require('../controllers/usersController');
const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

router.post('/login', (req, res) => {
  res.status(201).json({message: 'User Login'});
});
router.post('/register', (req, res) => {
  res.status(201).json({message: 'User Registered'});
});
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.removeUser);
module.exports = router;