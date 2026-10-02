const db = require('../config/db');

class BlogModel {
    /**
     * Get published blogs for Storefront (Public)
     */
    static async getPublishedBlogs() {
        const query = `SELECT id, title, slug, category, excerpt, featured_image, author, views, created_at FROM blogs WHERE is_published = 1 ORDER BY created_at DESC`;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Get single blog post by Slug (Public View)
     */
    static async getBlogBySlug(slug) {
        const query = `SELECT * FROM blogs WHERE slug = ? AND is_published = 1`;
        const [rows] = await db.execute(query, [slug]);
        return rows[0] || null;
    }

    /**
     * Increment view count for a blog post
     */
    static async incrementViews(id) {
        const query = `UPDATE blogs SET views = views + 1 WHERE id = ?`;
        await db.execute(query, [id]);
    }

    /**
     * Get all blogs for Admin Panel
     */
    static async getAllBlogs() {
        const query = `SELECT * FROM blogs ORDER BY created_at DESC`;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Get single blog by ID
     */
    static async getBlogById(id) {
        const query = `SELECT * FROM blogs WHERE id = ?`;
        const [rows] = await db.execute(query, [id]);
        return rows[0] || null;
    }

    /**
     * Create a new blog post
     */
    static async createBlog(blogData) {
        const { title, slug, category, excerpt, content, featured_image, author, is_published } = blogData;
        const query = `INSERT INTO blogs (title, slug, category, excerpt, content, featured_image, author, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(query, [title, slug, category, excerpt, content, featured_image, author, is_published ? 1 : 0]);
        return result.insertId;
    }

    /**
     * Update an existing blog post
     */
    static async updateBlog(id, blogData) {
        const { title, slug, category, excerpt, content, featured_image, author, is_published } = blogData;
        const query = `UPDATE blogs SET title = ?, slug = ?, category = ?, excerpt = ?, content = ?, featured_image = ?, author = ?, is_published = ? WHERE id = ?`;
        const [result] = await db.execute(query, [title, slug, category, excerpt, content, featured_image, author, is_published ? 1 : 0, id]);
        return result.affectedRows > 0;
    }

    /**
     * Delete a blog post
     */
    static async deleteBlog(id) {
        const query = `DELETE FROM blogs WHERE id = ?`;
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = BlogModel;