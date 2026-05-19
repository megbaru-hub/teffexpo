import app from './app';
import { prisma } from './utils/prisma';

let connected = false;

async function connectDB() {
  if (connected) return;
  if (!process.env.DATABASE_URL) return;
  await prisma.$connect();
  connected = true;
}

connectDB().catch((err) => {
  console.error('Database connection error:', err);
});

export default app;
