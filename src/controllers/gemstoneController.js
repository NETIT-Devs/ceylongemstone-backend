const fs = require('fs');
const path = require('path');
const GemstoneModel = require('../models/gemstoneModel');

/**
 * @desc    Create a new gemstone product with optional image
 * @route   POST /api/gemstones
 * @access  Private (Admin & Superadmin)
 */
exports.createGemstone = async (req, res) => {
    try {
        const { title, sku, price_usd, carat_weight, color, shape } = req.body;

        // Basic input validation
        if (!title || !sku || !price_usd || !carat_weight || !color || !shape) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: title, sku, price_usd, carat_weight, color, shape.'
            });
        }

        // Extract relative file path if file is uploaded via Multer
        const filePath = req.file ? `/uploads/${req.file.filename}` : null;

        // Pass payload and file path to model
        const gemstoneId = await GemstoneModel.create(req.body, filePath);

        res.status(201).json({
            success: true,
            message: 'Gemstone created successfully.',
            gemstoneId
        });
    } catch (error) {
        // Handle duplicate SKU error
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
 * @desc    Fetch all available gemstones with optional search & filters
 * @route   GET /api/gemstones
 * @access  Public
 */
exports.getAllGemstones = async (req, res) => {
    try {
        const { category_id, color, min_price, max_price, search } = req.query;

        const gemstones = await GemstoneModel.getAll({
            category_id,
            color,
            min_price,
            max_price,
            search
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
exports.getGemstoneById = async (req, res) => {
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
 * @desc    Update an existing gemstone
 * @route   PUT /api/gemstones/:id
 * @access  Private (Admin & Superadmin)
 */
exports.updateGemstone = async (req, res) => {
    try {
        const isUpdated = await GemstoneModel.update(req.params.id, req.body);

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
 * @desc    Delete a gemstone and its associated media & certificate files
 * @route   DELETE /api/gemstones/:id
 * @access  Private (Admin & Superadmin)
 */
exports.deleteGemstone = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch gemstone details to get image and certificate paths BEFORE DB deletion
        const gemstone = await GemstoneModel.getById(id);

        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found.'
            });
        }

        // Store file paths
        const imageFilePath = gemstone.file_path;
        const certFilePath = gemstone.pdf_url;

        // 2. Delete record from database
        const isDeleted = await GemstoneModel.delete(id);

        // 3. Delete physical files from server
        if (isDeleted) {
            const deleteFile = (relativePath) => {
                if (relativePath) {
                    const cleanPath = relativePath.replace(/^[\/\\]+/, '');
                    const fullPath = path.resolve(process.cwd(), cleanPath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log('File deleted:', fullPath);
                    }
                }
            };

            // Clean product image and certificate file
            deleteFile(imageFilePath);
            deleteFile(certFilePath);
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
 * @desc    Attach a certificate to a gemstone
 * @route   POST /api/gemstones/:id/certificate
 * @access  Private (Admin & Superadmin)
 */
exports.addGemstoneCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificate_number, lab_name } = req.body;

        // 1. Check if gemstone exists
        const gemstone = await GemstoneModel.getById(id);
        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found.'
            });
        }

        // 2. Input validation
        if (!certificate_number || !lab_name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide certificate_number and lab_name.'
            });
        }

        // 3. File path handling via Multer (Saves in /uploads/ directory)
        const pdfUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // 4. Insert into 'certificates' database table
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
 * @desc    Update a gemstone's certificate
 * @route   PUT /api/gemstones/:id/certificate
 * @access  Private (Admin & Superadmin)
 */
exports.updateGemstoneCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Check if certificate exists for this gemstone
        const existingCert = await GemstoneModel.getCertificateByGemstoneId(id);
        if (!existingCert) {
            return res.status(404).json({
                success: false,
                message: 'No certificate found for this gemstone.'
            });
        }

        let newPdfUrl = null;

        // 2. Handle file replacement
        if (req.file) {
            newPdfUrl = `/uploads/${req.file.filename}`;

            // Unlink old file from server
            if (existingCert.pdf_url) {
                const cleanPath = existingCert.pdf_url.replace(/^[\/\\]+/, '');
                const oldFullPath = path.resolve(process.cwd(), cleanPath);
                if (fs.existsSync(oldFullPath)) {
                    fs.unlinkSync(oldFullPath);
                    console.log('Old certificate file unlinked:', oldFullPath);
                }
            }
        }

        // 3. Update DB record
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
 * @desc    Delete only the certificate of a gemstone
 * @route   DELETE /api/gemstones/:id/certificate
 * @access  Private (Admin & Superadmin)
 */
exports.deleteGemstoneCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch certificate details FIRST to get pdf_url BEFORE DB deletion
        const existingCert = await GemstoneModel.getCertificateByGemstoneId(id);
        if (!existingCert) {
            return res.status(404).json({
                success: false,
                message: 'No certificate found for this gemstone.'
            });
        }

        const certFilePath = existingCert.pdf_url;

        // 2. Delete record from database
        const isDeleted = await GemstoneModel.deleteCertificate(id);

        // 3. Delete physical file from uploads folder
        if (isDeleted && certFilePath) {
            const cleanPath = certFilePath.replace(/^[\/\\]+/, '');
            const fullPath = path.resolve(process.cwd(), cleanPath);

            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log('Certificate file unlinked successfully:', fullPath);
            } else {
                console.log('Certificate file not found on disk at:', fullPath);
            }
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