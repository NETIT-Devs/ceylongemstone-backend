const db = require('../config/db');

class CurrencyModel {
    /**
     * Retrieve active currencies for Storefront display
     * @returns {Promise<Array>} List of active currencies with exchange rates relative to LKR
     */
    static async getActiveCurrencies() {
        const query = `SELECT id, code, name, symbol, exchange_rate, flag_code FROM currencies WHERE is_active = 1`;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Retrieve all supported currencies including inactive ones (Admin Dashboard)
     * @returns {Promise<Array>} Complete list of currencies
     */
    static async getAllCurrencies() {
        const query = `SELECT id, code, name, symbol, exchange_rate, is_active, flag_code, updated_at FROM currencies`;
        const [rows] = await db.execute(query);
        return rows;
    }

    /**
     * Retrieve currency details by currency code
     * @param {string} code - Currency code (e.g., USD, AED)
     * @returns {Promise<Object>} Currency object containing exchange rate details
     */
    static async getCurrencyByCode(code) {
        const query = `SELECT id, code, name, symbol, exchange_rate, is_active, flag_code FROM currencies WHERE code = ?`;
        const [rows] = await db.execute(query, [code.toUpperCase()]);
        return rows[0];
    }

    /**
     * Update exchange rate for a currency (Admin privilege)
     * @param {string} code - Currency code to update
     * @param {number} rate - New exchange rate relative to LKR
     * @returns {Promise<boolean>} True if exchange rate updated successfully
     */
    static async updateExchangeRate(code, rate) {
        const query = `UPDATE currencies SET exchange_rate = ? WHERE code = ?`;
        const [result] = await db.execute(query, [rate, code.toUpperCase()]);
        return result.affectedRows > 0;
    }

    /**
     * Enable or disable currency active status (Admin privilege)
     * @param {string} code - Currency ISO code
     * @param {boolean} isActive - Active state flag (true/false)
     * @returns {Promise<boolean>} True if status updated successfully
     */
    static async toggleStatus(code, isActive) {
        const query = `UPDATE currencies SET is_active = ? WHERE code = ?`;
        const [result] = await db.execute(query, [isActive ? 1 : 0, code.toUpperCase()]);
        return result.affectedRows > 0;
    } 
}

module.exports = CurrencyModel;