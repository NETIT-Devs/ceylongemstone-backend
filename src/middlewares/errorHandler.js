/**
 * Global Express error handling middleware.
 * Catches all uncaught errors passed via next(err) in the application.
 */
const errorHandler = (err, req, res, next) => {
    // Log the error timestamp and full stack trace to the console
    console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);

    // Specific handling for Multer file upload size limit exceeded
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File size is too large. Maximum limit is 5MB.'
        });
    }

    // Generic error response (hides stack trace in production environment)
    return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;