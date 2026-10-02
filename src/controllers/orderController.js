const OrderModel = require('../models/orderModel');

/**
 * Place a new order (Checkout process)
 */
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            total_amount,
            currency_code,
            shipping_address,
            city,
            postal_code,
            country,
            phone_number,
            payment_method,
            notes,
            items
        } = req.body;

        // Basic validation for required checkout fields
        if (!total_amount || !shipping_address || !city || !postal_code || !country || !phone_number || !items || !items.length) {
            return res.status(400).json({
                success: false,
                message: 'Missing required checkout fields or order items array.'
            });
        }

        const orderData = {
            user_id: userId,
            total_amount,
            currency_code,
            shipping_address,
            city,
            postal_code,
            country,
            phone_number,
            payment_method,
            notes
        };

        const orderId = await OrderModel.createOrder(orderData, items);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order_id: orderId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error placing order',
            error: error.message
        });
    }
};

/**
 * Get detailed view of a specific order
 */
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const order = await OrderModel.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Access Control: Only the order owner or Admins/Superadmins can view order details
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        const isOwner = order.user_id === userId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own orders.'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving order details',
            error: error.message
        });
    }
};

/**
 * Get order history for the currently logged-in user
 */
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await OrderModel.getOrdersByUserId(userId);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching your order history',
            error: error.message
        });
    }
};

/**
 * Get all orders across the system (Admin / Superadmin only)
 */
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await OrderModel.getAllOrders();

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching system orders',
            error: error.message
        });
    }
};

/**
 * Update order or payment status (Admin / Superadmin only)
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status, payment_status } = req.body;

        if (!order_status && !payment_status) {
            return res.status(400).json({
                success: false,
                message: 'Provide at least order_status or payment_status to update.'
            });
        }

        // Validate order_status values if provided
        const allowedOrderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (order_status && !allowedOrderStatuses.includes(order_status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid order_status. Allowed values: ${allowedOrderStatuses.join(', ')}`
            });
        }

        // Validate payment_status values if provided
        const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (payment_status && !allowedPaymentStatuses.includes(payment_status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid payment_status. Allowed values: ${allowedPaymentStatuses.join(', ')}`
            });
        }

        const isUpdated = await OrderModel.updateOrderStatus(id, order_status, payment_status);

        if (!isUpdated) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};
/**
 * Cancel order by Customer (Only if order status is 'pending')
 */
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const isCancelled = await OrderModel.cancelOrder(id, userId);

        if (!isCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Unable to cancel order. Order might not exist or is already being processed.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};

/**
 * Delete order permanently (Admin / Superadmin only)
 */
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const isDeleted = await OrderModel.deleteOrder(id);

        if (!isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting order',
            error: error.message
        });
    }
};