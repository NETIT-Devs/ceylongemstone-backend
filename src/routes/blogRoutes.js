const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

/**
 * @route   GET /api/blogs
 * @desc    Get all published blogs for storefront
 * @access  Public
 */
router.get('/', blogController.getPublishedBlogs);

/**
 * @route   GET /api/blogs/admin
 * @desc    Get all blogs for Admin Dashboard
 * @access  Private (Admin & Superadmin)
 */
router.get('/admin', verifyToken, authorizeRoles('admin', 'superadmin'), blogController.getAllBlogs);

/**
 * @route   GET /api/blogs/:slug
 * @desc    Get single blog post by slug
 * @access  Public
 */
router.get('/:slug', blogController.getBlogBySlug);

/**
 * @route   POST /api/blogs
 * @desc    Create a new blog post
 * @access  Private (Admin & Superadmin)
 */
router.post('/', verifyToken, authorizeRoles('admin', 'superadmin'), upload.single('image'), blogController.createBlog);

/**
 * @route   PUT /api/blogs/:id
 * @desc    Update a blog post
 * @access  Private (Admin & Superadmin)
 */
router.put('/:id', verifyToken, authorizeRoles('admin', 'superadmin'), upload.single('image'), blogController.updateBlog);

/**
 * @route   DELETE /api/blogs/:id
 * @desc    Delete a blog post
 * @access  Private (Admin & Superadmin)
 */
router.delete('/:id', verifyToken, authorizeRoles('admin', 'superadmin'), blogController.deleteBlog);

module.exports = router;