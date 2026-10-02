const express = require('express');
const router = express.Router();
const gemstoneController = require('../controllers/gemstoneController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public Routes (Anyone can view products & filter)
router.get('/', gemstoneController.getAllGemstones);
router.get('/:id', gemstoneController.getGemstoneById);

// Protected Routes (Only logged-in Admins/Superadmins can modify product data)
router.post(
    '/',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    upload.single('image'),
    gemstoneController.createGemstone
);

router.put(
    '/:id',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    gemstoneController.updateGemstone
);

router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    gemstoneController.deleteGemstone
);

// Certificate Upload Route
router.post(
    '/:id/certificate',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    upload.single('certificate_file'),
    gemstoneController.addGemstoneCertificate
);
// Certificate Update
router.put(
    '/:id/certificate',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    upload.single('certificate_file'),
    gemstoneController.updateGemstoneCertificate
);

// Certificate Delete
router.delete(
    '/:id/certificate',
    verifyToken,
    authorizeRoles('admin', 'superadmin'),
    gemstoneController.deleteGemstoneCertificate
);
module.exports = router;