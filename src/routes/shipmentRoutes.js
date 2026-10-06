const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/shipments/:orderId
 * @desc    Fetch shipment tracking information by Order ID
 * @access  Private (Customer, Admin, Super Admin)
 */
router.get(
    '/:orderId', 
    verifyToken, 
    shipmentController.getShipmentByOrderId
);

/**
 * @route   POST /api/shipments
 * @desc    Add new shipment tracking record or update existing details
 * @access  Private (Admin, Super Admin)
 */
router.post(
    '/', 
    verifyToken, 
    authorizeRoles('admin', 'super_admin'), 
    shipmentController.addOrUpdateShipment
);

/**
 * @route   DELETE /api/shipments/:orderId
 * @desc    Delete shipment tracking record by Order ID
 * @access  Private (Admin, Super Admin)
 */
router.delete(
    '/:orderId', 
    verifyToken, 
    authorizeRoles('admin', 'super_admin'), 
    shipmentController.deleteShipmentByOrderId
);

module.exports = router;