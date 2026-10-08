const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * @desc    Register a new user account (Public registration restricted to 'client' role)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, and password.'
            });
        }

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email address is already registered.'
            });
        }

        // Hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Public registration forced to 'client' role with auto-approval (1)
        const userId = await UserModel.create(name, email, hashedPassword, 'client', 1);

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            userId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during user registration.',
            error: error.message
        });
    }
};

/**
 * @desc    Authenticate user, verify approval status, and return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        // Check if user exists
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Verify password hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Check if user account is approved by Superadmin
        if (user.is_approved === 0 || user.is_approved === false) {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please contact system administrator.'
            });
        }

        // Check JWT Secret presence
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured in environment variables.');
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
            error: error.message
        });
    }
};

/**
 * @desc    Fetch pending users awaiting approval
 * @route   GET /api/auth/pending-users
 * @access  Private (Superadmin Only)
 */
const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await UserModel.getPendingUsers();
        res.status(200).json({
            success: true,
            count: pendingUsers.length,
            data: pendingUsers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching pending users.',
            error: error.message
        });
    }
};

/**
 * @desc    Approve or update user approval status
 * @route   PUT /api/auth/approve/:id
 * @access  Private (Superadmin Only)
 */
const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_approved } = req.body;

        const isUpdated = await UserModel.updateApprovalStatus(id, is_approved ?? 1);
        if (!isUpdated) {
            return res.status(404).json({
                success: false,
                message: 'User not found or no changes made.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User approval status updated successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while updating user approval status.',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getPendingUsers,
    approveUser
};