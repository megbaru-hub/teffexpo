import app from './app';
import { prisma } from './utils/prisma';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');

let connected = false;

async function connectDB() {
  if (connected) return;
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    return;
  }
  await prisma.$connect();
  connected = true;
}

connectDB().catch((err) => {
  console.error('Database connection error:', err);
});

export default app;
