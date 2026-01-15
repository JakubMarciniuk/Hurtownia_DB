// routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authorize } = require('../middleware/authMiddleware');

// Grupy ról
const MANAGER_OR_ADMIN = ['Kierownik Sklepu', 'Administrator'];
const CLIENT_OR_ADMIN = ['Klient', 'Kierownik Sklepu', 'Administrator'];

// 1. Historia zamówień (Dostępna dla Klienta)
router.get('/history/:id', authorize(CLIENT_OR_ADMIN), reportsController.getClientOrderHistory);

// 2. Niski stan magazynowy (Tylko Manager)
router.get('/low-stock', authorize(MANAGER_OR_ADMIN), reportsController.getLowStockProducts);

// 3. Szczegóły zamówienia
router.get('/order-details/:id', authorize(CLIENT_OR_ADMIN), reportsController.getOrderDetails);

module.exports = router;