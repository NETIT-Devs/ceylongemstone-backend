const db = require('../config/db');

class OrderModel {
    /**
     * Create a new order with its associated line items (Uses Database Transaction)
     * @param {Object} orderData - Order header details
     * @param {Array} items - List of items included in the order [{ gemstone_id, unit_price, quantity }]
     * @returns {Promise<number>} Newly created Order ID
     */
    static async createOrder(orderData, items) {
        const connection = await db.getConnection();
        try {
            // Start SQL Transaction
            await connection.beginTransaction();

            const {
                user_id,
                total_amount,
                shipping_cost, // Destructure shipping_cost from controller payload
                currency_code,
                shipping_address,
                city,
                postal_code,
                country,
                phone_number,
                payment_method,
                notes
            } = orderData;

            // 1. Insert order header into orders table including shipping_cost
            const orderQuery = `
                INSERT INTO orders (
                    user_id, total_amount, shipping_cost, currency_code, shipping_address, 
                    city, postal_code, country, phone_number, payment_method, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [orderResult] = await connection.execute(orderQuery, [
                user_id,
                total_amount,
                shipping_cost || 0.00, // Pass shipping_cost value (Defaults to 0.00 if undefined)
                currency_code || 'USD',
                shipping_address,
                city,
                postal_code,
                country,
                phone_number,
                payment_method || 'card',
                notes || null
            ]);

            const orderId = orderResult.insertId;

            // 2. Insert line items into order_items table
            const itemQuery = `
                INSERT INTO order_items (order_id, gemstone_id, unit_price, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?)
            `;

            for (const item of items) {
                const quantity = item.quantity || 1;
                const subtotal = item.unit_price * quantity;

                await connection.execute(itemQuery, [
                    orderId,
                    item.gemstone_id,
                    item.unit_price,
                    quantity,
                    subtotal
                ]);
            }

            // Commit transaction after successfully creating order and all items
            await connection.commit();
            return orderId;

        } catch (error) {
            // Rollback all database operations if any single step fails
            await connection.rollback();
            throw error;
        } finally {
            // Always release the database connection back to the connection pool
            connection.release();
        }
    }

    /**
     * Fetch a complete order by ID including item details and gemstone title
     * @param {number} orderId - Target Order ID
     * @returns {Promise<Object|null>} Detailed order object or null if not found
     */
    static async getOrderById(orderId) {
        // Fetch order main header
        const orderQuery = `
            SELECT o.*, u.name AS customer_name, u.email AS customer_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `;
        const [orders] = await db.execute(orderQuery, [orderId]);

        if (orders.length === 0) return null;

        const order = orders[0];

        // Fetch associated order items
        const itemsQuery = `
            SELECT 
                oi.id AS item_id,
                oi.gemstone_id,
                oi.unit_price,
                oi.quantity,
                oi.subtotal,
                g.title AS gemstone_title
            FROM order_items oi
            JOIN gemstones g ON oi.gemstone_id = g.id
            WHERE oi.order_id = ?
        `;
        const [items] = await db.execute(itemsQuery, [orderId]);

        order.items = items;
        return order;
    }

    /**
     * Fetch all orders belonging to a specific user
     * @param {number} userId - User ID from JWT Token
     * @returns {Promise<Array>} User order history list
     */
    static async getOrdersByUserId(userId) {
        const query = `
            SELECT 
                id AS order_id,
                total_amount,
                shipping_cost,
                currency_code,
                payment_status,
                order_status,
                created_at
            FROM orders
            WHERE user_id = ?
            ORDER BY id DESC
        `;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    /**
     * Fetch all orders across the system (Admin / Superadmin view)
     * @returns {Promise<Array>} Complete system order list
     */
    static async getAllOrders() {
        const query = `
            SELECT 
                o.id AS order_id,
                o.user_id,
                u.name AS customer_name,
                u.email AS customer_email,
                o.total_amount,
                o.shipping_cost,
                o.currency_code,
                o.payment_status,
                o.order_status,
                o.created_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.id DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Update order status or payment status (Admin action)
     * @param {number} orderId - Target Order ID
     * @param {string} orderStatus - New order status
     * @param {string} paymentStatus - New payment status
     * @returns {Promise<boolean>} True if updated successfully
     */
    static async updateOrderStatus(orderId, orderStatus, paymentStatus) {
        let query = 'UPDATE orders SET ';
        const queryParams = [];

        if (orderStatus) {
            query += 'order_status = ? ';
            queryParams.push(orderStatus);
        }

        if (paymentStatus) {
            if (orderStatus) query += ', ';
            query += 'payment_status = ? ';
            queryParams.push(paymentStatus);
        }

        query += 'WHERE id = ?';
        queryParams.push(orderId);

        const [result] = await db.execute(query, queryParams);
        return result.affectedRows > 0;
    }

    /**
     * Cancel an order if it's still in 'pending' status (Customer action)
     * @param {number} orderId - Target Order ID
     * @param {number} userId - Owner User ID
     * @returns {Promise<boolean>}
     */
    static async cancelOrder(orderId, userId) {
        const query = `
            UPDATE orders 
            SET order_status = 'cancelled' 
            WHERE id = ? AND user_id = ? AND order_status = 'pending'
        `;
        const [result] = await db.execute(query, [orderId, userId]);
        return result.affectedRows > 0;
    }

    /**
     * Permanently delete an order and its items (Admin action)
     * @param {number} orderId - Target Order ID
     * @returns {Promise<boolean>}
     */
    static async deleteOrder(orderId) {
        const query = `DELETE FROM orders WHERE id = ?`;
        const [result] = await db.execute(query, [orderId]);
        return result.affectedRows > 0;
    }
}

module.exports = OrderModel;