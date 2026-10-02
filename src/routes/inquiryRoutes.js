const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Optional Authentication Middleware
 * Extracts user details from JWT if present in Authorization header,
 * otherwise allows guest requests to proceed without error.
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader) {
        return verifyToken(req, res, next);
    }
    next();
};

// Public/Authenticated Route: Submit a price inquiry (Supports both logged-in users and guests)
router.post('/', optionalAuth, inquiryController.createInquiry);

// Client Route: Fetch inquiries submitted by the currently logged-in user
router.get('/my-inquiries', verifyToken, inquiryController.getMyInquiries);

// Admin Routes: View all system inquiries & update inquiry resolution status
router.get('/', verifyToken, authorizeRoles('admin', 'superadmin'), inquiryController.getAllInquiries);
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'superadmin'), inquiryController.updateInquiryStatus);

// Client/Admin Route: Delete an inquiry (Logged-in users can delete their own / Admins can delete any)
router.delete('/:id', verifyToken, inquiryController.deleteInquiry);

module.exports = router;