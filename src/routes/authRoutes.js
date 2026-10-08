const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles, verifyApprovedUser } = require('../middlewares/authMiddleware');

/**
 * ============================================================================
 * PUBLIC AUTH ROUTES
 * ============================================================================
 */

// @route   POST /api/auth/register
// @desc    Register a new user account (Clients auto-approved, Admins need approval)
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT Token
// @access  Public
router.post('/login', authController.login);

/**
 * ============================================================================
 * PROTECTED USER ROUTES
 * ============================================================================
 */

// @route   GET /api/auth/profile
// @desc    Fetch authenticated user's profile details
// @access  Private (Approved Users Only)
router.get('/profile', verifyToken, verifyApprovedUser, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Protected profile retrieved successfully.',
        user: req.user
    });
});

/**
 * ============================================================================
 * SUPERADMIN MANAGEMENT ROUTES (User Approvals)
 * ============================================================================
 */

// @route   GET /api/auth/pending-users
// @desc    Fetch list of users/admins waiting for approval
// @access  Private (Superadmin Only)
router.get(
    '/pending-users',
    verifyToken,
    authorizeRoles('superadmin'),
    authController.getPendingUsers || ((req, res) => res.status(501).json({ message: 'Controller pending' }))
);

// @route   PUT /api/auth/approve/:id
// @desc    Approve or reject a user/admin account
// @access  Private (Superadmin Only)
router.put(
    '/approve/:id',
    verifyToken,
    authorizeRoles('superadmin'),
    authController.approveUser || ((req, res) => res.status(501).json({ message: 'Controller pending' }))
);

module.exports = router;