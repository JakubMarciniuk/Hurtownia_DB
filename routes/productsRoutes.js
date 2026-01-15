const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { authorize } = require('../middleware/authMiddleware');

const ADMIN_ONLY = ['Administrator'];

// Publiczne: Każdy może widzieć produkty
router.get('/', productsController.getAllProducts);

// Chronione: Tylko Admin może zarządzać
router.post('/', authorize(ADMIN_ONLY), productsController.createProduct);
router.put('/:id/stock', authorize(ADMIN_ONLY), productsController.updateStock);
router.put('/:id/price', authorize(ADMIN_ONLY), productsController.updatePrice);
router.delete('/:id', authorize(ADMIN_ONLY), productsController.deleteProduct);

module.exports = router;