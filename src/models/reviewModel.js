const db = require('../config/db');

class ReviewModel {
    /**
     * Insert a new gemstone review into the database
     * @param {number} userId - ID of the reviewing user
     * @param {number} gemstoneId - ID of the target gemstone
     * @param {number} rating - Numerical rating score (1 to 5)
     * @param {string} comment - Textual feedback provided by the customer
     * @returns {Promise<number>} - ID of the newly inserted review record
     */
    static async createReview(userId, gemstoneId, rating, comment) {
        const query = `
            INSERT INTO reviews (user_id, gemstone_id, rating, comment)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [userId, gemstoneId, rating, comment]);
        return result.insertId;
    }

    /**
     * Retrieve all reviews for a specific gemstone along with the reviewer's full name
     * @param {number} gemstoneId - ID of the target gemstone
     * @returns {Promise<Array>} - List of review objects sorted by creation timestamp (newest first)
     */
    static async getReviewsByGemstoneId(gemstoneId) {
        const query = `
            SELECT r.id, r.rating, r.comment, r.created_at, u.name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.gemstone_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.execute(query, [gemstoneId]);
        return rows;
    }

    /**
     * Update rating and comment of an existing review owned by the requesting user
     * @param {number} reviewId - Primary key ID of the review record to update
     * @param {number} userId - ID of the user attempting the update operation
     * @param {number} rating - Updated numerical rating score
     * @param {string} comment - Updated textual feedback
     * @returns {Promise<boolean>} - True if record was updated, false if not found or unauthorized
     */
    static async updateReview(reviewId, userId, rating, comment) {
        const query = `
            UPDATE reviews 
            SET rating = ?, comment = ?
            WHERE id = ? AND user_id = ?
        `;
        const [result] = await db.execute(query, [rating, comment, reviewId, userId]);
        return result.affectedRows > 0;
    }

    /**
     * Delete a review record from the database (Restricted to resource owner or administrators)
     * @param {number} reviewId - Primary key ID of the review record to delete
     * @param {number} userId - ID of the user attempting deletion
     * @param {boolean} isAdmin - Flag indicating whether requesting user possesses admin/superadmin privileges
     * @returns {Promise<boolean>} - True if record was deleted, false if not found or unauthorized
     */
    static async deleteReview(reviewId, userId, isAdmin) {
        let query = `DELETE FROM reviews WHERE id = ?`;
        let params = [reviewId];

        // Append ownership check if requester is not a system administrator
        if (!isAdmin) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }

        const [result] = await db.execute(query, params);
        return result.affectedRows > 0;
    }
}

module.exports = ReviewModel;