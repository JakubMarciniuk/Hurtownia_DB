// routes/ordersRoutes.js
const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authorize } = require('../middleware/authMiddleware'); // Wprowadzamy autoryzację

// Wymagane role dla modyfikacji/tworzenia zamówień
const ALL_ROLES = ['Klient', 'Kierownik Sklepu', 'Administrator'];
const MANAGER_OR_ADMIN = ['Kierownik Sklepu', 'Administrator'];

// T1: Składanie nowego zamówienia (Wszyscy)
router.post('/', authorize(ALL_ROLES), ordersController.createOrder);

// Aktualizacja statusu zamówienia (Tylko dla Kierownika/Admina)
router.put('/:id/status', authorize(MANAGER_OR_ADMIN), ordersController.updateOrderStatus);

// Dodawanie/Usuwanie pozycji (Wszyscy)
router.post('/:orderId/items/:productId', authorize(ALL_ROLES), ordersController.addOrderItem);
router.delete('/:orderId/items/:productId', authorize(ALL_ROLES), ordersController.removeOrderItem);

module.exports = router;