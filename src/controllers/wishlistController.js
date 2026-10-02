const WishlistModel = require('../models/wishlistModel');

// Get My Wishlist (Protected User Route)
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id; // Get from JWT auth token
        const items = await WishlistModel.getByUserId(userId);

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching wishlist',
            error: error.message
        });
    }
};

// Add to Wishlist (Protected User Route)
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gemstone_id } = req.body;

        if (!gemstone_id) {
            return res.status(400).json({
                success: false,
                message: 'Gemstone ID is required'
            });
        }

        const exists = await WishlistModel.checkExists(userId, gemstone_id);
        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Gemstone is already in your wishlist'
            });
        }

        await WishlistModel.add(userId, gemstone_id);

        res.status(201).json({
            success: true,
            message: 'Added to wishlist successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding to wishlist',
            error: error.message
        });
    }
};

// Remove from Wishlist (Protected User Route)
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gemstoneId } = req.params;

        const isRemoved = await WishlistModel.remove(userId, gemstoneId);

        if (!isRemoved) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Removed from wishlist successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing from wishlist',
            error: error.message
        });
    }
};