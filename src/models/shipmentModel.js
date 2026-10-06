const db = require('../config/db');

/**
 * Shipment Data Access Object (Model)
 */
const shipmentModel = {
    /**
     * @desc Create a new shipment record or update existing tracking details
     * @param {Object} shipmentData - Shipment properties
     * @returns {Promise<Object>} MySQL query result
     */
    createOrUpdateShipment: async (shipmentData) => {
        const {
            order_id,
            courier_name,
            tracking_number,
            tracking_url,
            estimated_delivery_date,
            shipment_status,
            notes
        } = shipmentData;

        const query = `
            INSERT INTO shipments (
                order_id, 
                courier_name, 
                tracking_number, 
                tracking_url, 
                estimated_delivery_date, 
                shipment_status, 
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                courier_name = VALUES(courier_name),
                tracking_number = VALUES(tracking_number),
                tracking_url = VALUES(tracking_url),
                estimated_delivery_date = VALUES(estimated_delivery_date),
                shipment_status = VALUES(shipment_status),
                notes = VALUES(notes),
                updated_at = NOW();
        `;

        const [result] = await db.query(query, [
            order_id,
            courier_name,
            tracking_number,
            tracking_url || null,
            estimated_delivery_date || null,
            shipment_status || 'dispatched',
            notes || null
        ]);

        return result;
    },

    /**
     * @desc Retrieve shipment tracking details associated with a specific Order ID
     * @param {number|string} orderId - ID of the order
     * @returns {Promise<Object|undefined>} Shipment record row
     */
    getShipmentByOrderId: async (orderId) => {
        const [rows] = await db.query('SELECT * FROM shipments WHERE order_id = ?', [orderId]);
        return rows[0];
    },

    /**
     * @desc Delete a shipment record associated with a specific Order ID
     * @param {number|string} orderId - ID of the order
     * @returns {Promise<Object>} MySQL delete result
     */
    deleteShipmentByOrderId: async (orderId) => {
        const [result] = await db.query('DELETE FROM shipments WHERE order_id = ?', [orderId]);
        return result;
    }
};

module.exports = shipmentModel;