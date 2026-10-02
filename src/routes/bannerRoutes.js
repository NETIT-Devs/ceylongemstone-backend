const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

/**
 * @route   GET /api/banners
 * @desc    Get active banners for homepage (Public storefront view)
 * @access  Public
 */
router.get('/', bannerController.getActiveBanners);

/**
 * @route   GET /api/banners/admin
 * @desc    Get all banners for management (Admin Dashboard)
 * @access  Private (Admin & Superadmin only)
 */
router.get(
    '/admin', 
    verifyToken, 
    authorizeRoles('admin', 'superadmin'), 
    bannerController.getAllBanners
);

/**
 * @route   POST /api/banners
 * @desc    Create a new banner with image/video file upload
 * @access  Private (Admin & Superadmin only)
 */
router.post(
    '/', 
    verifyToken, 
    authorizeRoles('admin', 'superadmin'), 
    upload.single('image'), 
    bannerController.createBanner
);

/**
 * @route   PATCH /api/banners/:id/status
 * @desc    Toggle active status of a specific banner
 * @access  Private (Admin & Superadmin only)
 */
router.patch(
    '/:id/status', 
    verifyToken, 
    authorizeRoles('admin', 'superadmin'), 
    bannerController.toggleBannerStatus
);

/**
 * @route   DELETE /api/banners/:id
 * @desc    Delete a banner record and its media file
 * @access  Private (Admin & Superadmin only)
 */
router.delete(
    '/:id', 
    verifyToken, 
    authorizeRoles('admin', 'superadmin'), 
    bannerController.deleteBanner
);

module.exports = router;