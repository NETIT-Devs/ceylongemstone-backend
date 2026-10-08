const db = require('../config/db');

// Database query functions for User operations
const UserModel = {
    // Find a user by email address (Includes password for auth)
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // Create a new user record (Auto-approve clients, hold admins for superadmin approval)
    create: async (name, email, hashedPassword, role = 'client', isApproved = null) => {
        // Default rule: Clients are approved automatically (1), Admins need approval (0)
        const approvalStatus = isApproved !== null ? isApproved : (role === 'client' ? 1 : 0);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, approvalStatus]
        );
        return result.insertId;
    },

    // Find a user by ID (Must include is_approved for verifyApprovedUser middleware)
    findById: async (id) => {
        const [rows] = await db.query(
            'SELECT id, name, email, role, is_approved, created_at FROM users WHERE id = ?', 
            [id]
        );
        return rows[0];
    },

    // Update approval status of a user (For Superadmin use)
    updateApprovalStatus: async (userId, isApproved) => {
        const [result] = await db.query(
            'UPDATE users SET is_approved = ? WHERE id = ?',
            [isApproved ? 1 : 0, userId]
        );
        return result.affectedRows > 0;
    },

    // Fetch all pending users awaiting approval
    getPendingUsers: async () => {
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE is_approved = 0'
        );
        return rows;
    },

    // Update user profile password
    updatePassword: async (id, hashedPassword) => {
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = UserModel;