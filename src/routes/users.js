const express = require('express');
const userController = require('../controllers/usersController');
const passport = require('passport');
const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

router.post('/login',  passport.authenticate('local'),
  (req, res) => {
    res.json({
      message: 'Login successful',
      user: req.user
    });
  }
);
router.post('/register', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.removeUser);
module.exports = router;