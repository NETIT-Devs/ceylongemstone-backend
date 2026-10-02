const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middlewares/authMiddleware');

// All Wishlist routes require JWT Auth Token
router.use(verifyToken);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/:gemstoneId', wishlistController.removeFromWishlist);

module.exports = router;