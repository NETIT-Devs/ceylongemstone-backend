const db = require('../config/db');

class CartModel {
    /**
     * Retrieve all cart items with associated gemstone details for a specific user
     * @param {number} userId - ID of the logged-in user
     * @returns {Promise<Array>} Array of cart items with gemstone metadata
     */
    static async getByUserId(userId) {
        const query = `
            SELECT 
                c.id AS cart_id,
                c.quantity,
                c.created_at AS added_at,
                g.id AS gemstone_id,
                g.title,
                g.price_usd AS price,
                g.carat_weight,
                g.is_available
            FROM cart c
            JOIN gemstones g ON c.gemstone_id = g.id
            WHERE c.user_id = ?
            ORDER BY c.id DESC
        `;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    /**
     * Add a gemstone to the user's cart or increment quantity if item already exists
     * @param {number} userId - ID of the user
     * @param {number} gemstoneId - ID of the gemstone
     * @param {number} quantity - Item quantity (defaults to 1)
     * @returns {Promise<Object>} Execution result of the insert/update query
     */
    static async addOrUpdate(userId, gemstoneId, quantity = 1) {
        const query = `
            INSERT INTO cart (user_id, gemstone_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `;
        const [result] = await db.execute(query, [userId, gemstoneId, quantity]);
        return result;
    }

    /**
     * Update the quantity of a specific cart item directly
     * @param {number} userId - ID of the user
     * @param {number} gemstoneId - ID of the gemstone
     * @param {number} quantity - New quantity value
     * @returns {Promise<boolean>} True if record was updated, false otherwise
     */
    static async updateQuantity(userId, gemstoneId, quantity) {
        const [result] = await db.execute(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND gemstone_id = ?',
            [quantity, userId, gemstoneId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Remove a single item from the user's cart
     * @param {number} userId - ID of the user
     * @param {number} gemstoneId - ID of the gemstone to remove
     * @returns {Promise<boolean>} True if record was deleted, false otherwise
     */
    static async remove(userId, gemstoneId) {
        const [result] = await db.execute(
            'DELETE FROM cart WHERE user_id = ? AND gemstone_id = ?',
            [userId, gemstoneId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Clear all items from a user's cart (typically called post-checkout)
     * @param {number} userId - ID of the user
     * @returns {Promise<boolean>} True if records were deleted, false otherwise
     */
    static async clear(userId) {
        const [result] = await db.execute(
            'DELETE FROM cart WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = CartModel;