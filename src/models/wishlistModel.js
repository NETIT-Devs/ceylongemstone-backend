const db = require('../config/db');

class WishlistModel {
    // Get user's wishlist with gemstone details
    static async getByUserId(userId) {
        const query = `
            SELECT 
                w.id AS wishlist_id,
                w.created_at AS added_at,
                g.*
            FROM wishlist w
            JOIN gemstones g ON w.gemstone_id = g.id
            WHERE w.user_id = ?
            ORDER BY w.id DESC
        `;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    // Add item to wishlist
    static async add(userId, gemstoneId) {
        const [result] = await db.execute(
            'INSERT INTO wishlist (user_id, gemstone_id) VALUES (?, ?)',
            [userId, gemstoneId]
        );
        return result.insertId;
    }

    // Check if item already in wishlist
    static async checkExists(userId, gemstoneId) {
        const [rows] = await db.execute(
            'SELECT * FROM wishlist WHERE user_id = ? AND gemstone_id = ?',
            [userId, gemstoneId]
        );
        return rows[0];
    }

    // Remove item from wishlist
    static async remove(userId, gemstoneId) {
        const [result] = await db.execute(
            'DELETE FROM wishlist WHERE user_id = ? AND gemstone_id = ?',
            [userId, gemstoneId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = WishlistModel;