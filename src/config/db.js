const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a MySQL connection pool using native promises for async/await support
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sri_lankan_gemstones_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Immediately Test and verify initial database connection status asynchronously
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL Database successfully!');
        connection.release(); // Release the connection back to the pool
    } catch (err) {
        console.error('❌ Database Connection Failed:', err.message);
    }
})();

// Export the promise-based pool for clean async/await usage across all models
module.exports = pool;