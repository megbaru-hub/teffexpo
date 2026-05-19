import app from '../server/src/app';
import { prisma } from '../server/src/utils/prisma';

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
