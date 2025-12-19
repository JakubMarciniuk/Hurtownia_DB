// routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authorize } = require('../middleware/authMiddleware'); // Wprowadzamy autoryzację

// Wymagane role dla raportów
const MANAGER_OR_ADMIN = ['Kierownik Sklepu', 'Administrator'];

// Zapytanie 1: Kumulatywna historia zamówień (Tylko dla Kierownika/Admina)
router.get('/client/:id/history', authorize(MANAGER_OR_ADMIN), reportsController.getClientOrderHistory);

// Zapytanie 2: Produkty z niskim stanem magazynowym (Tylko dla Kierownika/Admina)
router.get('/low-stock', authorize(MANAGER_OR_ADMIN), reportsController.getLowStockProducts);

// Zapytanie 3: Szczegóły zamówienia (Tylko dla Kierownika/Admina)
router.get('/order-details/:id', authorize(MANAGER_OR_ADMIN), reportsController.getOrderDetails);

module.exports = router;