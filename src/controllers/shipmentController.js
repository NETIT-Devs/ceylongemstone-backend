const shipmentModel = require('../models/shipmentModel');
const db = require('../config/db');

/**
 * @desc    Create or Update Shipment Tracking Details & Sync Order Status
 * @route   POST /api/shipments
 * @access  Private (Admin, Super Admin)
 */
exports.addOrUpdateShipment = async (req, res, next) => {
    try {
        const { order_id, courier_name, tracking_number, shipment_status } = req.body;

        if (!order_id || !courier_name || !tracking_number) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, Courier Name, and Tracking Number are required.'
            });
        }

        // Save or update shipment record in database via shipmentModel
        await shipmentModel.createOrUpdateShipment(req.body);

        // Synchronize corresponding order status in orders table
        let newOrderStatus = (shipment_status === 'delivered') ? 'delivered' : 'shipped';
        await db.query('UPDATE orders SET order_status = ? WHERE id = ?', [newOrderStatus, order_id]);

        res.status(200).json({
            success: true,
            message: 'Shipment tracking details saved and order status synced successfully!'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Fetch Shipment Tracking Details by Order ID
 * @route   GET /api/shipments/:orderId
 * @access  Private (Customer, Admin, Super Admin)
 */
exports.getShipmentByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const shipment = await shipmentModel.getShipmentByOrderId(orderId);

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'No tracking information found for this order.'
            });
        }

        res.status(200).json({
            success: true,
            data: shipment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete Shipment Tracking Details by Order ID
 * @route   DELETE /api/shipments/:orderId
 * @access  Private (Admin, Super Admin)
 */
exports.deleteShipmentByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const result = await shipmentModel.deleteShipmentByOrderId(orderId);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No shipment record found to delete.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Shipment tracking record deleted successfully!'
        });
    } catch (error) {
        next(error);
    }
};