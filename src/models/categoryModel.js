const db = require('../config/db');

class CategoryModel {
    // Get all categories
    static async getAll() {
        const [rows] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
        return rows;
    }

    // Get category by ID
    static async getById(id) {
        const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
        return rows[0];
    }

    // Get category by Slug
    static async getBySlug(slug) {
        const [rows] = await db.execute('SELECT * FROM categories WHERE slug = ?', [slug]);
        return rows[0];
    }

    // Create new category
    static async create(name, slug, description = null, image_url = null) {
        const [result] = await db.execute(
            'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
            [name, slug, description, image_url]
        );
        return result.insertId;
    }

    // Update category
    static async update(id, name, slug, description = null, image_url = null) {
        const [result] = await db.execute(
            `UPDATE categories 
             SET name = ?, slug = ?, description = ?, image_url = COALESCE(?, image_url)
             WHERE id = ?`,
            [name, slug, description, image_url, id]
        );
        return result.affectedRows > 0;
    }

    // Delete category
    static async delete(id) {
        const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = CategoryModel;