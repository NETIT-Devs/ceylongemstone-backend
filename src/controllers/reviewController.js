const ReviewModel = require('../models/reviewModel');

/**
 * Handle creation of a new gemstone review
 */
exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gemstone_id, rating, comment } = req.body;

        // Input validation: Ensure required parameters are provided
        if (!gemstone_id || !rating) {
            return res.status(400).json({ 
                success: false, 
                message: 'Gemstone ID and rating are required fields.' 
            });
        }

        // Validate rating range constraints
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating value must be between 1 and 5.' 
            });
        }

        const reviewId = await ReviewModel.createReview(userId, gemstone_id, rating, comment);

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully.',
            review_id: reviewId
        });
    } catch (error) {
        // Handle database unique constraint violation (duplicate review per gemstone)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a review for this gemstone. You may update your existing review.'
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error while creating review.', 
            error: error.message 
        });
    }
};

/**
 * Handle retrieval of all reviews for a specific gemstone
 */
exports.getGemstoneReviews = async (req, res) => {
    try {
        const { gemstoneId } = req.params;
        const reviews = await ReviewModel.getReviewsByGemstoneId(gemstoneId);

        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error while fetching reviews.', 
            error: error.message 
        });
    }
};

/**
 * Handle review updates
 */
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { rating, comment } = req.body;

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating value must be between 1 and 5.' 
            });
        }

        const isUpdated = await ReviewModel.updateReview(id, userId, rating, comment);

        if (!isUpdated) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found or user unauthorized to edit this record.' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Review updated successfully.' 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error while updating review.', 
            error: error.message 
        });
    }
};

/**
 * Handle review deletion (Owners can delete their own reviews; Admins/Superadmins can delete any review)
 */
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role; // Extract user role from decoded JWT payload

        // Check if the requesting user possesses administrative privileges
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';

        const isDeleted = await ReviewModel.deleteReview(id, userId, isAdmin);

        if (!isDeleted) {
            return res.status(403).json({ 
                success: false, 
                message: 'Review not found or user unauthorized to delete this record.' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Review deleted successfully.' 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error while deleting review.', 
            error: error.message 
        });
    }
};