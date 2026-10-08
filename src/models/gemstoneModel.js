const db = require('../config/db');

class GemstoneModel {
    /**
     * Create a new gemstone product with optional image path and stock management fields
     */
    static async create(data, filePath = null) {
        const {
            title, sku, category_id, price_usd, carat_weight,
            color, shape, cut, dimensions, clarity,
            origin, treatment_status, is_available,
            stock_quantity, stock_status
        } = data;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Insert Gemstone details into 'gemstones' table
            const [gemstoneResult] = await connection.execute(
                `INSERT INTO gemstones (
                    title, sku, category_id, price_usd, carat_weight,
                    color, shape, cut, dimensions, clarity,
                    origin, treatment_status, is_available,
                    stock_quantity, stock_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title, sku, category_id || null, price_usd, carat_weight,
                    color, shape, cut || null, dimensions || null, clarity || null,
                    origin || 'Sri Lanka', treatment_status || 'Natural/Untreated', is_available ?? 1,
                    stock_quantity ?? 1, stock_status || 'available'
                ]
            );

            const gemstoneId = gemstoneResult.insertId;

            // 2. Insert image path into 'gemstone_media' table if file exists
            if (filePath) {
                await connection.execute(
                    `INSERT INTO gemstone_media (gemstone_id, file_path, media_type) 
                     VALUES (?, ?, ?)`,
                    [gemstoneId, filePath, 'image']
                );
            }

            await connection.commit();
            return gemstoneId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Fetch all available gemstones with full dynamic filtering
     */
    static async getAll(filters = {}) {
        let query = `
            SELECT g.*, 
                   (SELECT file_path FROM gemstone_media WHERE gemstone_id = g.id LIMIT 1) AS file_path
            FROM gemstones g 
            WHERE 1=1
        `;
        const params = [];

        if (filters.is_available !== undefined) {
            query += ` AND g.is_available = ?`;
            params.push(filters.is_available);
        }

        if (filters.stock_status) {
            query += ` AND g.stock_status = ?`;
            params.push(filters.stock_status);
        }

        // Low stock filter logic added here
        if (filters.low_stock === 'true' || filters.low_stock === true) {
            query += ` AND (g.stock_quantity <= 5 OR g.stock_status = 'low_stock')`;
        }

        if (filters.category_id) {
            query += ` AND g.category_id = ?`;
            params.push(filters.category_id);
        }

        if (filters.color) {
            query += ` AND g.color = ?`;
            params.push(filters.color);
        }

        if (filters.shape) {
            query += ` AND g.shape = ?`;
            params.push(filters.shape);
        }

        if (filters.min_price) {
            query += ` AND g.price_usd >= ?`;
            params.push(filters.min_price);
        }
        if (filters.max_price) {
            query += ` AND g.price_usd <= ?`;
            params.push(filters.max_price);
        }

        if (filters.min_carat) {
            query += ` AND g.carat_weight >= ?`;
            params.push(filters.min_carat);
        }
        if (filters.max_carat) {
            query += ` AND g.carat_weight <= ?`;
            params.push(filters.max_carat);
        }

        if (filters.search) {
            query += ` AND (g.title LIKE ? OR g.sku LIKE ? OR g.origin LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        query += ` ORDER BY g.created_at DESC`;

        const [rows] = await db.execute(query, params);
        return rows;
    }

    /**
     * Fetch a single gemstone by ID with associated image path and certificate
     */
    static async getById(id) {
        const [rows] = await db.execute(
            `SELECT g.*, 
                    (SELECT file_path FROM gemstone_media WHERE gemstone_id = g.id LIMIT 1) AS file_path,
                    c.certificate_number, c.lab_name, c.pdf_url, c.issue_date 
             FROM gemstones g 
             LEFT JOIN certificates c ON g.id = c.gemstone_id
             WHERE g.id = ?`,
            [id]
        );
        return rows[0];
    }

    /**
     * Update gemstone details dynamically (Prevents overwriting existing data with NULL)
     */
    static async update(id, data) {
        const allowedFields = [
            'title', 'sku', 'category_id', 'price_usd', 'carat_weight',
            'color', 'shape', 'cut', 'dimensions', 'clarity',
            'origin', 'treatment_status', 'is_available',
            'stock_quantity', 'stock_status'
        ];

        const updates = [];
        const params = [];

        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key) && data[key] !== undefined) {
                updates.push(`${key} = ?`);
                params.push(data[key]);
            }
        });

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE gemstones SET ${updates.join(', ')} WHERE id = ?`;

        const [result] = await db.execute(query, params);
        return result.affectedRows > 0;
    }

    /**
     * Delete a gemstone record
     */
    static async delete(id) {
        const [result] = await db.execute(
            'DELETE FROM gemstones WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // ==========================================
    // CERTIFICATE MANAGEMENT METHODS
    // ==========================================

    /**
     * Attach / Add certificate to 'certificates' table
     */
    static async addCertificate(gemstoneId, certData, pdfUrl = null) {
        const { certificate_number, lab_name, issue_date } = certData;

        const [result] = await db.execute(
            `INSERT INTO certificates (gemstone_id, certificate_number, lab_name, pdf_url, issue_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [gemstoneId, certificate_number, lab_name, pdfUrl, issue_date || null]
        );
        return result.insertId;
    }

    /**
     * Get certificate details by Gemstone ID
     */
    static async getCertificateByGemstoneId(gemstoneId) {
        const [rows] = await db.execute(
            `SELECT * FROM certificates WHERE gemstone_id = ?`,
            [gemstoneId]
        );
        return rows[0];
    }

    /**
     * Dynamic update for Certificate details & optional PDF replacement
     */
    static async updateCertificate(gemstoneId, certData, newPdfUrl = null) {
        const allowedFields = ['certificate_number', 'lab_name', 'issue_date'];
        const updates = [];
        const params = [];

        Object.keys(certData).forEach(key => {
            if (allowedFields.includes(key) && certData[key] !== undefined) {
                updates.push(`${key} = ?`);
                params.push(certData[key]);
            }
        });

        if (newPdfUrl) {
            updates.push(`pdf_url = ?`);
            params.push(newPdfUrl);
        }

        if (updates.length === 0) return false;

        params.push(gemstoneId);
        const query = `UPDATE certificates SET ${updates.join(', ')} WHERE gemstone_id = ?`;

        const [result] = await db.execute(query, params);
        return result.affectedRows > 0;
    }

    /**
     * Delete certificate record by Gemstone ID
     */
    static async deleteCertificate(gemstoneId) {
        const [result] = await db.execute(
            `DELETE FROM certificates WHERE gemstone_id = ?`,
            [gemstoneId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = GemstoneModel;