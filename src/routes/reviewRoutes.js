const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public endpoint: Fetch reviews for a gemstone
router.get('/gemstone/:gemstoneId', reviewController.getGemstoneReviews);

// Protected endpoints: User authentication required
router.post('/', verifyToken, reviewController.createReview);
router.put('/:id', verifyToken, reviewController.updateReview);
router.delete('/:id', verifyToken, reviewController.deleteReview);

module.exports = router;