const express = require('express');
const userController = require('../controllers/usersController');
const passport = require('passport');
const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

router.post('/login',  passport.authenticate('local'),
  (req, res) => {
    const { id, email } = req.user;

    res.json({
      message: 'Login successful',
      user: { id, email }
    });
  }
);
router.post('/register', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.removeUser);
module.exports = router;