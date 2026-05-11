import { PrismaClient } from '@prisma/client';
import { ENV } from './env.js';

const prisma = new PrismaClient();

export const connectDB = async () => {
    try {
        const { NEON_DATABASE_URL } = ENV;
        if (!NEON_DATABASE_URL) throw new Error('NEON_DATABASE_URL is not set');

        await prisma.$connect();
        console.log(`Neon PostgreSQL Connected`);
    } catch (error) {
        console.error(`Error connection to Neon: ${error.message}`);
        process.exit(1);
    }
};

export default prisma;