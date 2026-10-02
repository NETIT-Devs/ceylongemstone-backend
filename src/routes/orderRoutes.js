const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Client Routes: Place an order, View personal order history & details
router.post('/', verifyToken, orderController.createOrder);
router.get('/my-orders', verifyToken, orderController.getMyOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.put('/:id/cancel', verifyToken, orderController.cancelOrder); // User can cancel pending order

// Admin Routes: View all system orders & Update status (Admin / Superadmin ONLY)
router.get('/', verifyToken, authorizeRoles('admin', 'superadmin'), orderController.getAllOrders);
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'superadmin'), orderController.updateOrderStatus);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'superadmin'), orderController.deleteOrder); // Admin hard delete

module.exports = router;