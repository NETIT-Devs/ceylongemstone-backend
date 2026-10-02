const fs = require('fs');
const path = require('path');
const BannerModel = require('../models/bannerModel');

/**
 * Get active banners for Homepage UI (Public)
 */
exports.getActiveBanners = async (req, res) => {
    try {
        const banners = await BannerModel.getActiveBanners();
        return res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching banners.',
            error: error.message
        });
    }
};

/**
 * Get all banners for Admin Dashboard (Admin & Superadmin)
 */
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await BannerModel.getAllBanners();
        return res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching admin banners.',
            error: error.message
        });
    }
};

/**
 * Add a new banner (Admin & Superadmin Only)
 */
exports.createBanner = async (req, res) => {
    try {
        const { title, subtitle, link_url } = req.body;
        // Check if image file was uploaded via uploadMiddleware
        const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: 'Banner image file or image URL is required.'
            });
        }

        const bannerId = await BannerModel.createBanner({
            title: title || '',
            subtitle: subtitle || '',
            image_url,
            link_url: link_url || ''
        });

        return res.status(201).json({
            success: true,
            message: 'Banner created successfully.',
            bannerId
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating banner.',
            error: error.message
        });
    }
};

/**
 * Toggle banner active status (Admin & Superadmin Only)
 */
exports.toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const updated = await BannerModel.toggleStatus(id, is_active);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Banner not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Banner status updated successfully.`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating banner status.',
            error: error.message
        });
    }
};

/**
 * Delete a banner and remove its file from uploads directory (Admin & Superadmin Only)
 */
exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch banner details first to retrieve the associated file path
        const banner = await BannerModel.getBannerById(id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found.' });
        }

        // Delete record from MySQL Database
        const deleted = await BannerModel.deleteBanner(id);

        if (deleted) {
            // Unlink and remove the physical file from uploads folder if path exists
            if (banner.image_url && banner.image_url.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, '../../', banner.image_url);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Failed to delete media file from disk:', err.message);
                    }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Banner and associated media file deleted successfully.'
            });
        }

        return res.status(404).json({ success: false, message: 'Banner not found.' });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting banner.',
            error: error.message
        });
    }
};