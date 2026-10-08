const jwt = require('jsonwebtoken');

/**
 * @desc    Verify JWT authentication token attached in Request Headers
 * @access  Private
 */
const verifyToken = (req, res, next) => {
    // Extract Authorization header (supports both lowercase and capitalized keys)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // Extract Bearer token from header
    const token = authHeader && authHeader.split(' ')[1];

    // Reject request if no authorization token is provided
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Authorization token missing.'
        });
    }

    try {
        // Verify token authenticity against environment secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded user context to request instance
        req.user = decoded;

        // Pass control to the next middleware or controller
        next();
    } catch (error) {
        // Return forbidden status on invalid or expired token
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }
};

/**
 * @desc    Restrict access based on user role parameters (RBAC)
 * @param   {...String} allowedRoles - Authorized role names (e.g., 'client', 'admin', 'superadmin')
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Validate user authentication and role eligibility
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to perform this action.'
            });
        }
        next();
    };
};

/**
 * @desc    Verify account approval status for privileged roles (Admin)
 * @access  Private (Admin / Superadmin)
 */
const verifyApprovedUser = (req, res, next) => {
    const user = req.user;

    // Normal clients do not require approval
    if (user.role === 'client' || user.role === 'superadmin') {
        return next();
    }

    // Enforce approval check for Admin role
    if (user.role === 'admin') {
        if (!user.is_approved) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Your admin account is pending Superadmin approval.'
            });
        }
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Unauthorized access.'
    });
};

module.exports = {
    verifyToken,
    authorizeRoles,
    verifyApprovedUser
};