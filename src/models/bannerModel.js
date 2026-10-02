const db = require('../config/db');

class BannerModel {
    /**
     * Retrieve active banners for Storefront/Homepage
     */
    static async getActiveBanners() {
        const query = `SELECT id, title, subtitle, image_url, link_url FROM banners WHERE is_active = 1 ORDER BY id DESC`;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Retrieve all banners for Admin Panel
     */
    static async getAllBanners() {
        const query = `SELECT * FROM banners ORDER BY id DESC`;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Retrieve a single banner by ID
     */
    static async getBannerById(id) {
        const query = `SELECT * FROM banners WHERE id = ?`;
        const [rows] = await db.execute(query, [id]);
        return rows[0] || null;
    }

    /**
     * Create a new banner record
     */
    static async createBanner(bannerData) {
        const { title, subtitle, image_url, link_url } = bannerData;
        const query = `INSERT INTO banners (title, subtitle, image_url, link_url) VALUES (?, ?, ?, ?)`;
        const [result] = await db.execute(query, [title, subtitle, image_url, link_url]);
        return result.insertId;
    }

    /**
     * Toggle banner active status
     */
    static async toggleStatus(id, isActive) {
        const query = `UPDATE banners SET is_active = ? WHERE id = ?`;
        const [result] = await db.execute(query, [isActive ? 1 : 0, id]);
        return result.affectedRows > 0;
    }

    /**
     * Delete a banner
     */
    static async deleteBanner(id) {
        const query = `DELETE FROM banners WHERE id = ?`;
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = BannerModel;