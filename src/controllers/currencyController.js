const CurrencyModel = require('../models/currencyModel');

/**
 * Get all currencies and exchange rates
 */
exports.getAllCurrencies = async (req, res) => {
    try {
        const currencies = await CurrencyModel.getActiveCurrencies();
        return res.status(200).json({
            success: true,
            count: currencies.length,
            data: currencies
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching currencies.',
            error: error.message
        });
    }
};

/**
 * Convert product price based on requested currency code
 */
exports.convertPrice = async (req, res) => {
    try {
        const { amount, currency } = req.query;

        if (!amount || !currency) {
            return res.status(400).json({
                success: false,
                message: 'Base amount (in LKR) and target currency code are required parameters.'
            });
        }

        const currencyData = await CurrencyModel.getCurrencyByCode(currency);

        if (!currencyData) {
            return res.status(404).json({
                success: false,
                message: `Currency '${currency}' is not supported.`
            });
        }

        // Calculate converted price relative to LKR
        const convertedAmount = (parseFloat(amount) * parseFloat(currencyData.exchange_rate)).toFixed(2);

        return res.status(200).json({
            success: true,
            base_currency: 'LKR',
            target_currency: currencyData.code,
            symbol: currencyData.symbol,
            original_amount: parseFloat(amount),
            converted_amount: parseFloat(convertedAmount),
            exchange_rate: parseFloat(currencyData.exchange_rate)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while converting currency.',
            error: error.message
        });
    }
};

/**
 * Update exchange rate (Admin / Superadmin only)
 */
exports.updateRate = async (req, res) => {
    try {
        const { code } = req.params;
        const { rate } = req.body;

        if (!rate || isNaN(rate) || rate <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid positive numerical exchange rate is required.'
            });
        }

        const isUpdated = await CurrencyModel.updateExchangeRate(code, rate);

        if (!isUpdated) {
            return res.status(404).json({
                success: false,
                message: `Currency code '${code}' not found.`
            });
        }

        return res.status(200).json({
            success: true,
            message: `Exchange rate for ${code.toUpperCase()} updated successfully.`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating exchange rate.',
            error: error.message
        });
    }
};
/**
 * Toggle currency active status (Enable or Disable currency)
 */
exports.toggleCurrencyStatus = async (req, res) => {
    try {
        const { code } = req.params;
        const { is_active } = req.body; // Expects boolean (true/false)

        // Prevent disabling base currency (LKR)
        if (code.toUpperCase() === 'LKR' && !is_active) {
            return res.status(400).json({
                success: false,
                message: 'Base currency (LKR) cannot be deactivated.'
            });
        }

        const isUpdated = await CurrencyModel.toggleStatus(code, is_active);

        if (!isUpdated) {
            return res.status(404).json({
                success: false,
                message: `Currency code '${code}' not found.`
            });
        }

        return res.status(200).json({
            success: true,
            message: `Currency '${code.toUpperCase()}' status updated successfully.`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating currency status.',
            error: error.message
        });
    }
};

/**
 * Retrieve all currencies including inactive ones (Admin Dashboard)
 */
exports.getAdminCurrencies = async (req, res) => {
    try {
        const currencies = await CurrencyModel.getAllCurrencies();
        return res.status(200).json({
            success: true,
            count: currencies.length,
            data: currencies
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching admin currencies.',
            error: error.message
        });
    }
};