import { PrismaClient } from '@prisma/client';

// 1. Create a function to generate the client
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        // Explicitly use the Pooled Port (6543) for the application
        url: process.env.DATABASE_URL, 
      },
    },
  });
};

// 2. Ensure we only have ONE instance globally during development
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;