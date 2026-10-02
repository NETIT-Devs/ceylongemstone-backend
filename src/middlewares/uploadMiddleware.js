const multer = require('multer');
const path = require('path');

// Configure storage destination and filename generation for uploaded media files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Validation filter to allow both image and video file formats
const fileFilter = (req, file, cb) => {
    // Regex for supported image and video file extensions
    const allowedTypes = /jpeg|jpg|png|webp|mp4|webm|mov/;

    // Validate file extension and MIME type
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpg, jpeg, png, webp) and videos (mp4, webm, mov) are allowed!'), false);
    }
};

// Initialize multer middleware with configured storage, file filter, and size limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit to accommodate videos
});

module.exports = upload;