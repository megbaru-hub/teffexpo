import app from '../server/src/app';
import mongoose from 'mongoose';

let cachedDb: typeof mongoose | null = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) return null;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  });
  return cachedDb;
}

connectDB().catch((err) => {
  console.error('MongoDB connection error:', err);
});

export default app;
