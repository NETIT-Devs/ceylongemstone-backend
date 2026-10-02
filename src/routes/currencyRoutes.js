const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/currencies
 * @desc    Retrieve all supported currencies and exchange rates
 * @access  Public
 */
router.get('/', currencyController.getAllCurrencies);

/**
 * @route   GET /api/currencies/convert
 * @desc    Convert base product price (LKR) to selected target currency
 * @access  Public
 */
router.get('/convert', currencyController.convertPrice);

/**
 * @route   PUT /api/currencies/:code
 * @desc    Update specific currency exchange rate
 * @access  Private (Admin & Superadmin only)
 */
router.put(
    '/:code', 
    verifyToken, 
    authorizeRoles('admin', 'superadmin'), 
    currencyController.updateRate
);

/**
 * @route   PATCH /api/currencies/:code/status
 * @desc    Toggle active/inactive status of a currency
 * @access  Private (Admin & Superadmin only)
 */
router.patch(
    '/:code/status', 
    verifyToken, 
    authorizeRoles('admin', 'superadmin'), 
    currencyController.toggleCurrencyStatus
);

module.exports = router;