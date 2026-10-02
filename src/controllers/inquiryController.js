const InquiryModel = require('../models/inquiryModel');

/**
 * Submit a new price enquiry
 */
exports.createInquiry = async (req, res) => {
    try {
        const { gemstone_id, user_name, email, phone_whatsapp, message, inquiry_type } = req.body;

        if (!gemstone_id || !user_name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Gemstone ID, user_name, email, and message are required fields'
            });
        }

        // Auto extract logged-in user_id if token is provided
        const userId = req.user ? req.user.id : null;

        const result = await InquiryModel.create({
            user_id: userId,
            gemstone_id,
            user_name,
            email,
            phone_whatsapp,
            message,
            inquiry_type
        });

        res.status(201).json({
            success: true,
            message: 'Price enquiry submitted successfully',
            inquiry_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting price enquiry',
            error: error.message
        });
    }
};

/**
 * Fetch inquiries submitted by currently authenticated user
 */
exports.getMyInquiries = async (req, res) => {
    try {
        const userId = req.user.id;
        const inquiries = await InquiryModel.getByUserId(userId);

        res.status(200).json({
            success: true,
            count: inquiries.length,
            data: inquiries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user inquiries',
            error: error.message
        });
    }
};

/**
 * Fetch all inquiries (Admin / Superadmin only)
 */
exports.getAllInquiries = async (req, res) => {
    try {
        const inquiries = await InquiryModel.getAll();

        res.status(200).json({
            success: true,
            count: inquiries.length,
            data: inquiries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching all inquiries',
            error: error.message
        });
    }
};

/**
 * Update status of an inquiry (Admin / Superadmin only)
 */
exports.updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['pending', 'contacted', 'closed'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Allowed values: pending, contacted, closed'
            });
        }

        const isUpdated = await InquiryModel.updateStatus(id, status);
        if (!isUpdated) {
            return res.status(404).json({
                success: false,
                message: 'Inquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Inquiry status updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating inquiry status',
            error: error.message
        });
    }
};

/**
 * Delete / Cancel an inquiry
 * (Users can delete their own inquiries / Admins can delete any inquiry)
 */
exports.deleteInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch inquiry to verify existence and check ownership
        const inquiry = await InquiryModel.getById(id);
        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Inquiry not found'
            });
        }

        // Ownership Validation: Users can only delete their own inquiries
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        const isOwner = inquiry.user_id === userId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own inquiries.'
            });
        }

        await InquiryModel.delete(id);

        res.status(200).json({
            success: true,
            message: 'Inquiry deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting inquiry',
            error: error.message
        });
    }
};