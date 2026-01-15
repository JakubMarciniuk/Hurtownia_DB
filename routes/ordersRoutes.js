const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authorize } = require('../middleware/authMiddleware');

// Definicje ról
const ALL_ROLES = ['Klient', 'Kierownik Sklepu', 'Administrator'];
const MANAGER_OR_ADMIN = ['Kierownik Sklepu', 'Administrator'];

// --- 1. Pobieranie wszystkich zamówień (Dla Admina/Kierownika) ---
router.get('/all', authorize(MANAGER_OR_ADMIN), ordersController.getAllOrders);

// --- 2. NOWA TRASA: Szczegóły KONKRETNEGO zamówienia (Dla Modala) ---
// Frontend (OrderEditModal) strzela tutaj: GET /api/orders/123
router.get('/:id', authorize(MANAGER_OR_ADMIN), ordersController.getOrderDetails);

// --- 3. T1: Składanie nowego zamówienia (Wszyscy) ---
router.post('/', authorize(ALL_ROLES), ordersController.createOrder);

// --- 4. Aktualizacja statusu zamówienia ---
router.patch('/:id/status', authorize(MANAGER_OR_ADMIN), ordersController.updateOrderStatus);

// --- 5. Edycja pozycji w zamówieniu (Dodawanie/Usuwanie) ---
router.post('/:orderId/items/:productId', authorize(MANAGER_OR_ADMIN), ordersController.addOrderItem);
router.delete('/:orderId/items/:productId', authorize(MANAGER_OR_ADMIN), ordersController.removeOrderItem);

module.exports = router;