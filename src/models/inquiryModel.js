const db = require('../config/db');

class InquiryModel {
    /**
     * Create a new price enquiry (Supports both logged-in users and guest visitors)
     * @param {Object} inquiryData - Inquiry payload details
     * @returns {Promise<Object>} Database insertion query result
     */
    static async create(inquiryData) {
        const { user_id, gemstone_id, user_name, email, phone_whatsapp, message, inquiry_type } = inquiryData;
        const query = `
            INSERT INTO inquiries (user_id, gemstone_id, user_name, email, phone_whatsapp, message, inquiry_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            user_id || null,
            gemstone_id,
            user_name,
            email,
            phone_whatsapp || null,
            message,
            inquiry_type || 'request_price'
        ]);
        return result;
    }

    /**
     * Fetch a single inquiry by its primary key ID
     * @param {number} inquiryId - Target inquiry ID
     * @returns {Promise<Object|null>} Inquiry record or null if not found
     */
    static async getById(inquiryId) {
        const query = 'SELECT * FROM inquiries WHERE id = ?';
        const [rows] = await db.execute(query, [inquiryId]);
        return rows[0] || null;
    }

    /**
     * Fetch inquiries submitted by a specific logged-in user
     * @param {number} userId - User ID from JWT payload
     * @returns {Promise<Array>} User inquiry records with gemstone details
     */
    static async getByUserId(userId) {
        const query = `
            SELECT 
                i.id AS inquiry_id,
                i.user_name,
                i.email,
                i.phone_whatsapp,
                i.message,
                i.inquiry_type,
                i.status,
                i.created_at,
                g.id AS gemstone_id,
                g.title AS gemstone_title,
                g.price_usd
            FROM inquiries i
            JOIN gemstones g ON i.gemstone_id = g.id
            WHERE i.user_id = ?
            ORDER BY i.id DESC
        `;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    /**
     * Fetch all inquiries across the platform (Admin / Superadmin view)
     * @returns {Promise<Array>} Complete system inquiry records
     */
    static async getAll() {
        const query = `
            SELECT 
                i.id AS inquiry_id,
                i.user_id,
                i.user_name,
                i.email,
                i.phone_whatsapp,
                i.message,
                i.inquiry_type,
                i.status,
                i.created_at,
                g.id AS gemstone_id,
                g.title AS gemstone_title
            FROM inquiries i
            JOIN gemstones g ON i.gemstone_id = g.id
            ORDER BY i.id DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Update inquiry resolution status
     * @param {number} inquiryId - Target inquiry ID
     * @param {string} status - New status ('pending', 'contacted', 'closed')
     * @returns {Promise<boolean>} True if row was updated successfully
     */
    static async updateStatus(inquiryId, status) {
        const query = 'UPDATE inquiries SET status = ? WHERE id = ?';
        const [result] = await db.execute(query, [status, inquiryId]);
        return result.affectedRows > 0;
    }

    /**
     * Permanently delete an inquiry record from database
     * @param {number} inquiryId - Target inquiry ID to delete
     * @returns {Promise<boolean>} True if record was deleted successfully
     */
    static async delete(inquiryId) {
        const query = 'DELETE FROM inquiries WHERE id = ?';
        const [result] = await db.execute(query, [inquiryId]);
        return result.affectedRows > 0;
    }
}

module.exports = InquiryModel;