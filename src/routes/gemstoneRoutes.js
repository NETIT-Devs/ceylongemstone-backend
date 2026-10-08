const express = require('express');
const router = express.Router();
const gemstoneController = require('../controllers/gemstoneController');
const { verifyToken, authorizeRoles, verifyApprovedUser } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

/**
 * ============================================================================
 * PUBLIC ROUTES (Accessible by anyone)
 * ============================================================================
 */

// @route   GET /api/gemstones
// @desc    Fetch all available gemstones with dynamic filtering
// @access  Public
router.get('/', gemstoneController.getAllGemstones);

// @route   GET /api/gemstones/:id
// @desc    Fetch a single gemstone by its ID
// @access  Public
router.get('/:id', gemstoneController.getGemstoneById);

/**
 * ============================================================================
 * DIRECT GEMSTONE MANAGEMENT (Admins & Superadmins Only)
 * ============================================================================
 */

// @route   POST /api/gemstones
// @desc    Create and publish a new gemstone directly (Supports image & video upload)
// @access  Private (Approved Admins & Superadmins)
router.post(
    '/',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    verifyApprovedUser,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 }
    ]),
    gemstoneController.createGemstone
);

// @route   PUT /api/gemstones/:id
// @desc    Update existing gemstone details
// @access  Private (Approved Admins & Superadmins)
router.put(
    '/:id',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    verifyApprovedUser,
    gemstoneController.updateGemstone
);

// @route   DELETE /api/gemstones/:id
// @desc    Delete a gemstone record and its media
// @access  Private (Approved Admins & Superadmins)
router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    verifyApprovedUser,
    gemstoneController.deleteGemstone
);

/**
 * ============================================================================
 * CERTIFICATE MANAGEMENT (Admins & Superadmins Only)
 * ============================================================================
 */

// @route   POST /api/gemstones/:id/certificate
// @desc    Attach a new laboratory certificate to a gemstone
// @access  Private (Approved Admins & Superadmins)
router.post(
    '/:id/certificate',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    verifyApprovedUser,
    upload.single('certificate_file'),
    gemstoneController.addGemstoneCertificate
);

// @route   PUT /api/gemstones/:id/certificate
// @desc    Update an existing certificate and replace file
// @access  Private (Approved Admins & Superadmins)
router.put(
    '/:id/certificate',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    verifyApprovedUser,
    upload.single('certificate_file'),
    gemstoneController.updateGemstoneCertificate
);

// @route   DELETE /api/gemstones/:id/certificate
// @desc    Remove a certificate record and delete file from storage
// @access  Private (Approved Admins & Superadmins)
router.delete(
    '/:id/certificate',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    verifyApprovedUser,
    gemstoneController.deleteGemstoneCertificate
);

module.exports = router;