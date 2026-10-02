const fs = require('fs');
const path = require('path');
const BlogModel = require('../models/blogModel');

/**
 * Helper utility to generate SEO-friendly URL slugs
 */
const generateSlug = (text) => {
    return text.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

/**
 * Get all published blogs (Public Storefront)
 */
exports.getPublishedBlogs = async (req, res) => {
    try {
        const blogs = await BlogModel.getPublishedBlogs();
        return res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching published blogs.',
            error: error.message
        });
    }
};

/**
 * Get single blog post by Slug (Public View)
 */
exports.getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const blog = await BlogModel.getBlogBySlug(slug);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found.'
            });
        }

        // Increment article view count asynchronously
        BlogModel.incrementViews(blog.id);

        return res.status(200).json({
            success: true,
            data: blog
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching blog post.',
            error: error.message
        });
    }
};

/**
 * Get all blogs for Admin Dashboard (Admin & Superadmin)
 */
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await BlogModel.getAllBlogs();
        return res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching admin blogs.',
            error: error.message
        });
    }
};

/**
 * Create a new Blog Post with duplicate title protection and automatic media cleanup on failure
 */
exports.createBlog = async (req, res) => {
    try {
        const { title, category, excerpt, content, author, is_published } = req.body;
        const featured_image = req.file ? `/uploads/${req.file.filename}` : req.body.featured_image || '';

        // Helper function to delete uploaded file if validation/creation fails
        const cleanupUploadedFile = () => {
            if (req.file) {
                const filePath = path.join(__dirname, '../../uploads', req.file.filename);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Failed to clean up file after validation error:', err.message);
                });
            }
        };

        // Validation check for title & content
        if (!title || !content) {
            cleanupUploadedFile(); // Delete uploaded file
            return res.status(400).json({
                success: false,
                message: 'Blog title and content are required.'
            });
        }

        // Check for Duplicate Title
        const existingBlogs = await BlogModel.getAllBlogs();
        const isDuplicate = existingBlogs.some(
            (b) => b.title.trim().toLowerCase() === title.trim().toLowerCase()
        );

        if (isDuplicate) {
            cleanupUploadedFile(); // Delete uploaded file if duplicate title exists!
            return res.status(400).json({
                success: false,
                message: 'A blog post with this title already exists. Please use a different title or edit the existing post.'
            });
        }

        // Generate clean SEO slug
        const slug = generateSlug(title) + '-' + Date.now();

        const blogId = await BlogModel.createBlog({
            title,
            slug,
            category: category || 'Gemstone Guide',
            excerpt: excerpt || '',
            content,
            featured_image,
            author: author || 'Gemstone Expert',
            is_published: is_published !== undefined ? is_published : 1
        });

        return res.status(201).json({
            success: true,
            message: 'Blog post created successfully.',
            blogId
        });
    } catch (error) {
        // Cleanup file if database or server throws an unexpected error
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads', req.file.filename);
            fs.unlink(filePath, () => { });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating blog post.',
            error: error.message
        });
    }
};

/**
 * Update an existing Blog Post (Admin & Superadmin Only)
 */
exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, excerpt, content, author, is_published } = req.body;

        const existingBlog = await BlogModel.getBlogById(id);
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found.'
            });
        }

        const featured_image = req.file ? `/uploads/${req.file.filename}` : (req.body.featured_image || existingBlog.featured_image);
        const slug = title ? (generateSlug(title) + '-' + Date.now()) : existingBlog.slug;

        const updated = await BlogModel.updateBlog(id, {
            title: title || existingBlog.title,
            slug,
            category: category || existingBlog.category,
            excerpt: excerpt || existingBlog.excerpt,
            content: content || existingBlog.content,
            featured_image,
            author: author || existingBlog.author,
            is_published: is_published !== undefined ? is_published : existingBlog.is_published
        });

        if (updated) {
            return res.status(200).json({
                success: true,
                message: 'Blog post updated successfully.'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Failed to update blog post.'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating blog post.',
            error: error.message
        });
    }
};

/**
 * Delete a Blog Post and its associated image file (Admin & Superadmin Only)
 */
exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await BlogModel.getBlogById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found.'
            });
        }

        const deleted = await BlogModel.deleteBlog(id);

        if (deleted) {
            // Unlink and delete physical image file from storage if present
            if (blog.featured_image && blog.featured_image.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, '../../', blog.featured_image);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Failed to delete media file from disk:', err.message);
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Blog post and associated media file deleted successfully.'
            });
        }

        return res.status(404).json({
            success: false,
            message: 'Blog post not found.'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting blog post.',
            error: error.message
        });
    }
};