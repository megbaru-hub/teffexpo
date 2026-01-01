import dotenv from 'dotenv';
// Load environment variables
dotenv.config({ path: `${__dirname}/../.env` });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';


import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { errorHandler } from './utils/errorResponse';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import merchantRoutes from './routes/merchant';

// Check for required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'] as const;
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
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all routes
app.use(limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/merchant', merchantRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const MONGODB_URI = process.env.MONGODB_URI!;

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error(err.stack);

  // Give the server time to log the error before shutting down
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Initialize MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🔄 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
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
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
