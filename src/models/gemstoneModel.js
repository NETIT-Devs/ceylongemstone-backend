const db = require('../config/db');

class GemstoneModel {
    // Create a new gemstone product with optional image path
    static async create(data, filePath = null) {
        const {
            title, sku, category_id, price_usd, carat_weight,
            color, shape, cut, dimensions, clarity,
            origin, treatment_status, is_available
        } = data;

        const connection = await db.getConnection();

        try {
            // Start SQL transaction
            await connection.beginTransaction();

            // 1. Insert Gemstone details into 'gemstones' table
            const [gemstoneResult] = await connection.execute(
                `INSERT INTO gemstones (
                    title, sku, category_id, price_usd, carat_weight,
                    color, shape, cut, dimensions, clarity,
                    origin, treatment_status, is_available
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title, sku, category_id || null, price_usd, carat_weight,
                    color, shape, cut || null, dimensions || null, clarity || null,
                    origin || 'Sri Lanka', treatment_status || 'Natural/Untreated', is_available ?? 1
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

            // Commit transaction
            await connection.commit();
            return gemstoneId;

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Fetch all available gemstones with full dynamic filtering
    static async getAll(filters = {}) {
        let query = `
            SELECT g.*, 
                   (SELECT file_path FROM gemstone_media WHERE gemstone_id = g.id LIMIT 1) AS file_path
            FROM gemstones g 
            WHERE g.is_available = 1
        `;
        const params = [];

        // Filter by Category
        if (filters.category_id) {
            query += ` AND g.category_id = ?`;
            params.push(filters.category_id);
        }

        // Filter by Color
        if (filters.color) {
            query += ` AND g.color = ?`;
            params.push(filters.color);
        }

        // Filter by Shape (Oval, Cushion, Round, etc.)
        if (filters.shape) {
            query += ` AND g.shape = ?`;
            params.push(filters.shape);
        }

        // Filter by Price Range
        if (filters.min_price) {
            query += ` AND g.price_usd >= ?`;
            params.push(filters.min_price);
        }
        if (filters.max_price) {
            query += ` AND g.price_usd <= ?`;
            params.push(filters.max_price);
        }

        // Filter by Carat Weight Range
        if (filters.min_carat) {
            query += ` AND g.carat_weight >= ?`;
            params.push(filters.min_carat);
        }
        if (filters.max_carat) {
            query += ` AND g.carat_weight <= ?`;
            params.push(filters.max_carat);
        }

        // Search Keyword (Title, SKU, or Origin)
        if (filters.search) {
            query += ` AND (g.title LIKE ? OR g.sku LIKE ? OR g.origin LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        query += ` ORDER BY g.created_at DESC`;

        const [rows] = await db.execute(query, params);
        return rows;
    }

    // Fetch a single gemstone by ID with associated image path and certificate
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

    // Update gemstone details safely handling null/optional fields
    static async update(id, data) {
        const {
            title, sku, category_id, price_usd, carat_weight,
            color, shape, cut, dimensions, clarity,
            origin, treatment_status, is_available
        } = data;

        const [result] = await db.execute(
            `UPDATE gemstones SET
                title = ?, sku = ?, category_id = ?, price_usd = ?, carat_weight = ?,
                color = ?, shape = ?, cut = ?, dimensions = ?, clarity = ?,
                origin = ?, treatment_status = ?, is_available = ?
            WHERE id = ?`,
            [
                title || null,
                sku || null,
                category_id ?? null,
                price_usd || null,
                carat_weight || null,
                color || null,
                shape || null,
                cut ?? null,
                dimensions ?? null,
                clarity ?? null,
                origin ?? 'Sri Lanka',
                treatment_status ?? 'Natural/Untreated',
                is_available ?? 1,
                id
            ]
        );
        return result.affectedRows > 0;
    }

    // Delete a gemstone record
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

    // Attach / Add certificate to 'certificates' table
    static async addCertificate(gemstoneId, certData, pdfUrl = null) {
        const { certificate_number, lab_name, issue_date } = certData;

        const [result] = await db.execute(
            `INSERT INTO certificates (gemstone_id, certificate_number, lab_name, pdf_url, issue_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [gemstoneId, certificate_number, lab_name, pdfUrl, issue_date || null]
        );
        return result.insertId;
    }

    // Get certificate details by Gemstone ID
    static async getCertificateByGemstoneId(gemstoneId) {
        const [rows] = await db.execute(
            `SELECT * FROM certificates WHERE gemstone_id = ?`,
            [gemstoneId]
        );
        return rows[0];
    }

    // Update Certificate details & replace file path if new file uploaded
    static async updateCertificate(gemstoneId, certData, newPdfUrl = null) {
        const { certificate_number, lab_name, issue_date } = certData;

        if (newPdfUrl) {
            const [result] = await db.execute(
                `UPDATE certificates 
                 SET certificate_number = ?, lab_name = ?, issue_date = ?, pdf_url = ? 
                 WHERE gemstone_id = ?`,
                [certificate_number, lab_name, issue_date || null, newPdfUrl, gemstoneId]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await db.execute(
                `UPDATE certificates 
                 SET certificate_number = ?, lab_name = ?, issue_date = ? 
                 WHERE gemstone_id = ?`,
                [certificate_number, lab_name, issue_date || null, gemstoneId]
            );
            return result.affectedRows > 0;
        }
    }

    // Delete certificate record by Gemstone ID
    static async deleteCertificate(gemstoneId) {
        const [result] = await db.execute(
            `DELETE FROM certificates WHERE gemstone_id = ?`,
            [gemstoneId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = GemstoneModel;