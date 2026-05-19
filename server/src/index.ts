import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';
import { prisma } from './utils/prisma';

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'] as const;
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const MIN_SECRET_LENGTH = 32;
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
  console.error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`);
  process.exit(1);
}

process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error(err.stack);
  setTimeout(() => process.exit(1), 1000);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
