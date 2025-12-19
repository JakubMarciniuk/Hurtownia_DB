// routes/usersRoutes.js

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// Utworzenie nowego użytkownika
router.post('/', usersController.createUser);

// T3: Reset hasła
router.post('/reset-password/:userId', usersController.resetPasswordByAdmin);

// Usuwanie użytkownika
router.delete('/:id', usersController.deleteUser);

module.exports = router;