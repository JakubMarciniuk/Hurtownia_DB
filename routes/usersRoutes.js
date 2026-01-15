const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authorize } = require('../middleware/authMiddleware');

const ADMIN_ONLY = ['Administrator'];
const ALL_LOGGED = ['Klient', 'Kierownik Sklepu', 'Administrator'];

// Publiczne
router.post('/login', usersController.loginUser);
router.post('/register', usersController.createUser); // Rejestracja to w sumie createUser

// Zmiana hasła (Dla zalogowanego użytkownika - "Moje konto")
router.post('/reset-password/:id', authorize(ALL_LOGGED), usersController.resetPasswordByAdmin);

// --- PANEL ADMINA (CRUD UŻYTKOWNIKÓW) ---

// 1. Pobierz wszystkich
router.get('/', authorize(ADMIN_ONLY), usersController.getAllUsers);

// 2. Dodaj nowego (przez panel admina)
router.post('/', authorize(ADMIN_ONLY), usersController.createUser);

// 3. Edytuj użytkownika (Zmiana roli, loginu, hasła)
router.put('/:id', authorize(ADMIN_ONLY), usersController.updateUser);

// 4. Usuń użytkownika
router.delete('/:id', authorize(ADMIN_ONLY), usersController.deleteUser);

module.exports = router;