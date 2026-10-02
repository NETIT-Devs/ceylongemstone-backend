const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public Routes (Anyone can view categories)
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected Routes (Only Admins and Superadmins can modify categories)
router.post(
    '/',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    upload.single('image'),
    categoryController.createCategory
);

router.put(
    '/:id',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    upload.single('image'),
    categoryController.updateCategory
);

router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    categoryController.deleteCategory
);

module.exports = router;