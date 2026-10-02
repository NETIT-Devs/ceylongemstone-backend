const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT Token
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Fetch authenticated user's profile details
 * @access  Private (Requires valid JWT Token)
 */
router.get('/profile', verifyToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Protected profile retrieved successfully.',
        user: req.user
    });
});

module.exports = router;