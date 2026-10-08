const fs = require('fs');
const path = require('path');
const GemstoneModel = require('../models/gemstoneModel');

/**
 * Delete helper function to clean up files from storage
 */
const deletePhysicalFile = (relativePath) => {
    if (relativePath) {
        // Remove leading slashes
        const cleanPath = relativePath.replace(/^[\/\\]+/, '');
        const fullPath = path.join(process.cwd(), cleanPath);
        
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (err) {
                console.error(`Failed to delete file at ${fullPath}:`, err);
            }
        }
    }
};

/**
 * @desc    Create a new gemstone product directly with optional image and stock logic
 * @route   POST /api/gemstones
 * @access  Private (Admin & Superadmin)
 */
const createGemstone = async (req, res) => {
    try {
        const { title, sku, price_usd, carat_weight, color, shape, stock_quantity, stock_status } = req.body;

        // Basic input validation
        if (!title || !sku || !price_usd || !carat_weight || !color || !shape) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: title, sku, price_usd, carat_weight, color, shape.'
            });
        }

        // Extract image file correctly from upload.fields
        const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
        const filePath = imageFile ? `/uploads/${imageFile.filename}` : null;

        // Pass payload and file path to model
        const gemstoneId = await GemstoneModel.create({
            ...req.body,
            stock_quantity: stock_quantity !== undefined ? parseInt(stock_quantity) : 1,
            stock_status: stock_status || 'available'
        }, filePath);

        res.status(201).json({
            success: true,
            message: 'Gemstone created successfully.',
            gemstoneId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'A gemstone with this SKU already exists.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating gemstone.',
            error: error.message
        });
    }
};

/**
 * @desc    Fetch all gemstones with optional search, filters, stock status & low_stock
 * @route   GET /api/gemstones
 * @access  Public
 */
const getAllGemstones = async (req, res) => {
    try {
        const { category_id, color, min_price, max_price, search, stock_status, low_stock, is_available } = req.query;

        const gemstones = await GemstoneModel.getAll({
            category_id,
            color,
            min_price,
            max_price,
            search,
            stock_status,
            low_stock,
            is_available
        });

        res.status(200).json({
            success: true,
            count: gemstones.length,
            data: gemstones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching gemstones.',
            error: error.message
        });
    }
};

/**
 * @desc    Fetch a single gemstone by ID
 * @route   GET /api/gemstones/:id
 * @access  Public
 */
const getGemstoneById = async (req, res) => {
    try {
        const gemstone = await GemstoneModel.getById(req.params.id);

        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: gemstone
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching gemstone details.',
            error: error.message
        });
    }
};

/**
 * @desc    Update an existing gemstone (including stock quantity and status)
 * @route   PUT /api/gemstones/:id
 * @access  Private (Admin & Superadmin)
 */
const updateGemstone = async (req, res) => {
    try {
        const { stock_quantity, stock_status } = req.body;
        
        let updateData = { ...req.body };

        // Automatically set availability and fallback status based on stock quantity
        if (stock_quantity !== undefined && parseInt(stock_quantity) <= 0) {
            updateData.is_available = 0;
            if (!stock_status) {
                updateData.stock_status = 'acquired';
            }
        } else if (stock_quantity !== undefined && parseInt(stock_quantity) > 0) {
            updateData.is_available = 1;
        }

        const isUpdated = await GemstoneModel.update(req.params.id, updateData);

        if (!isUpdated) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found or no changes made.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Gemstone updated successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while updating gemstone.',
            error: error.message
        });
    }
};

/**
 * @desc    Delete a gemstone and remove its media and certificate files from disk
 * @route   DELETE /api/gemstones/:id
 * @access  Private (Admin & Superadmin)
 */
const deleteGemstone = async (req, res) => {
    try {
        const { id } = req.params;

        const gemstone = await GemstoneModel.getById(id);

        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found.'
            });
        }

        const imageFilePath = gemstone.file_path;
        const certFilePath = gemstone.pdf_url;

        const isDeleted = await GemstoneModel.delete(id);

        if (isDeleted) {
            deletePhysicalFile(imageFilePath);
            deletePhysicalFile(certFilePath);
        }

        res.status(200).json({
            success: true,
            message: 'Gemstone and associated media/certificates deleted successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while deleting gemstone.',
            error: error.message
        });
    }
};

// ==========================================
// CERTIFICATE CONTROLLER FUNCTIONS
// ==========================================

/**
 * @desc    Attach a certificate PDF to a specific gemstone
 * @route   POST /api/gemstones/:id/certificate
 * @access  Private (Admin & Superadmin)
 */
const addGemstoneCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificate_number, lab_name } = req.body;

        const gemstone = await GemstoneModel.getById(id);
        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found.'
            });
        }

        if (!certificate_number || !lab_name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide certificate_number and lab_name.'
            });
        }

        const pdfUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const certId = await GemstoneModel.addCertificate(id, req.body, pdfUrl);

        res.status(201).json({
            success: true,
            message: 'Certificate attached successfully.',
            certificateId: certId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Certificate number already exists in database.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while attaching certificate.',
            error: error.message
        });
    }
};

/**
 * @desc    Update certificate information and optionally replace the PDF file
 * @route   PUT /api/gemstones/:id/certificate
 * @access  Private (Admin & Superadmin)
 */
const updateGemstoneCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const existingCert = await GemstoneModel.getCertificateByGemstoneId(id);
        if (!existingCert) {
            return res.status(404).json({
                success: false,
                message: 'No certificate found for this gemstone.'
            });
        }

        let newPdfUrl = null;

        if (req.file) {
            newPdfUrl = `/uploads/${req.file.filename}`;

            // Clean up old certificate PDF from storage
            if (existingCert.pdf_url) {
                deletePhysicalFile(existingCert.pdf_url);
            }
        }

        const isUpdated = await GemstoneModel.updateCertificate(id, req.body, newPdfUrl);

        if (!isUpdated) {
            return res.status(400).json({
                success: false,
                message: 'No changes were made to the certificate.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Certificate updated successfully.'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Certificate number already exists in database.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while updating certificate.',
            error: error.message
        });
    }
};

/**
 * @desc    Delete a gemstone certificate and unlinks the PDF file from disk
 * @route   DELETE /api/gemstones/:id/certificate
 * @access  Private (Admin & Superadmin)
 */
const deleteGemstoneCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const existingCert = await GemstoneModel.getCertificateByGemstoneId(id);
        if (!existingCert) {
            return res.status(404).json({
                success: false,
                message: 'No certificate found for this gemstone.'
            });
        }

        const certFilePath = existingCert.pdf_url;
        const isDeleted = await GemstoneModel.deleteCertificate(id);

        if (isDeleted && certFilePath) {
            deletePhysicalFile(certFilePath);
        }

        res.status(200).json({
            success: true,
            message: 'Certificate removed successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while deleting certificate.',
            error: error.message
        });
    }
};

module.exports = {
    createGemstone,
    getAllGemstones,
    getGemstoneById,
    updateGemstone,
    deleteGemstone,
    addGemstoneCertificate,
    updateGemstoneCertificate,
    deleteGemstoneCertificate
};