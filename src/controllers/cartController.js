const CartModel = require('../models/cartModel');

// Get User Cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await CartModel.getByUserId(userId);

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.status(200).json({
            success: true,
            count: items.length,
            total_amount: totalAmount,
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

// Add Item to Cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gemstone_id, quantity } = req.body;

        if (!gemstone_id) {
            return res.status(400).json({
                success: false,
                message: 'Gemstone ID is required'
            });
        }

        const itemQty = quantity && quantity > 0 ? parseInt(quantity) : 1;
        await CartModel.addOrUpdate(userId, gemstone_id, itemQty);

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
};

// Update Item Quantity in Cart
exports.updateCartQuantity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gemstoneId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity (greater than 0) is required'
            });
        }

        const isUpdated = await CartModel.updateQuantity(userId, gemstoneId, quantity);

        if (!isUpdated) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cart item quantity updated'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
};

// Remove Item from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gemstoneId } = req.params;

        const isRemoved = await CartModel.remove(userId, gemstoneId);

        if (!isRemoved) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
};

// Clear Entire Cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        await CartModel.clear(userId);

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};