const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Require authentication for all cart routes
router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:gemstoneId', cartController.updateCartQuantity);
router.delete('/:gemstoneId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;