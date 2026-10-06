// Import required external modules
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Establish MySQL database connection
require('./src/config/db');

// Import custom middleware modules
const errorHandler = require('./src/middlewares/errorHandler');

// Import application route modules
const authRoutes = require('./src/routes/authRoutes');
const gemstoneRoutes = require('./src/routes/gemstoneRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const inquiryRoutes = require('./src/routes/inquiryRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const currencyRoutes = require('./src/routes/currencyRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const shipmentRoutes = require('./src/routes/shipmentRoutes');

// Initialize the Express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for incoming client requests
app.use(cors());

// Parse incoming request payloads in JSON format
app.use(express.json());

// Parse incoming request payloads with URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Serve static directory for publicly accessible uploaded files (Gemstone photos, banners, blog images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register core application API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/gemstones', gemstoneRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/shipments', shipmentRoutes);

// Server health check endpoint to monitor API uptime and availability
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        message: 'Gemstone API Server is running smoothly!',
        timestamp: new Date()
    });
});

// Centralized Global Error Handler Middleware (Must be registered after all routes)
app.use(errorHandler);

// Bind and listen for connections on the designated port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});