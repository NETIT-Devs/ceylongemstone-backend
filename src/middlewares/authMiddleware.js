const jwt = require('jsonwebtoken');

/**
 * @desc    Middleware to verify JWT Token and authorize protected routes
 * @access  Private
 */
const verifyToken = (req, res, next) => {
    // Extract Authorization header (supports both lowercase and capitalized keys)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // Extract token assuming format is "Bearer <TOKEN>"
    const token = authHeader && authHeader.split(' ')[1];

    // Reject request if no token is provided
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Authorization token missing.'
        });
    }

    try {
        // Verify token authenticity using system JWT Secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded user payload to request object
        req.user = decoded;

        // Proceed to next middleware or controller
        next();
    } catch (error) {
        // Handle token expiration or invalid signature
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }
};

/**
 * @desc    Middleware for Role-Based Access Control (RBAC)
 * @param   {...String} allowedRoles - List of authorized roles
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user exists and role matches allowed roles
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to access this resource.'
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    authorizeRoles
};