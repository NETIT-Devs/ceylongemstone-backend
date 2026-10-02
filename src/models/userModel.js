const db = require('../config/db');

// Database query functions for User operations
const UserModel = {
    // Find a user by email address
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // Create a new user record
    create: async (name, email, hashedPassword, role = 'client') => {
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        return result.insertId;
    },

    // Find a user by ID
    findById: async (id) => {
        const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }
};

module.exports = UserModel;