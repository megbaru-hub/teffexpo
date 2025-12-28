"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const http_status_codes_1 = require("http-status-codes");
const errorResponse_1 = require("./utils/errorResponse");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const cart_1 = __importDefault(require("./routes/cart"));
const orders_1 = __importDefault(require("./routes/orders"));
const admin_1 = __importDefault(require("./routes/admin"));
const merchant_1 = __importDefault(require("./routes/merchant"));
// Load environment variables
dotenv_1.default.config({ path: `${__dirname}/../.env` });
// Check for required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}
// Ensure JWT_SECRET has a minimum length
const MIN_SECRET_LENGTH = 32;
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    console.error(`❌ JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`);
    process.exit(1);
}
// Create Express app
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
// Apply rate limiting to all routes
app.use(limiter);
// Body parser, reading data from body into req.body
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
app.use((0, cookie_parser_1.default)());
// Data sanitization against NoSQL query injection
app.use((0, express_mongo_sanitize_1.default)());
// Data sanitization against XSS
app.use((0, xss_clean_1.default)());
// Enable CORS
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
// Logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Mount routers
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/cart', cart_1.default);
app.use('/api/v1/orders', orders_1.default);
app.use('/api/v1/admin', admin_1.default);
app.use('/api/v1/merchant', merchant_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware
app.use(errorResponse_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Route not found'
    });
});
// Connect to MongoDB and start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const MONGODB_URI = process.env.MONGODB_URI;
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error('Error:', err.name, err.message);
    console.error(err.stack);
    // Give the server time to log the error before shutting down
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
// Initialize MongoDB connection
mongoose_1.default.connection.on('connected', () => {
    console.log('✅ Connected to MongoDB');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
const startServer = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
        });
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🔄 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('UNHANDLED REJECTION! 💥 Shutting down...');
            console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
            // Close server and exit process
            server.close(() => {
                console.log('💥 Process terminated!');
                process.exit(1);
            });
        });
        // Handle SIGTERM for graceful shutdown
        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
            server.close(() => {
                console.log('💤 Process terminated!');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
