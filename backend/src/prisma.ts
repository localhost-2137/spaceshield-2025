import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

export async function initPrisma() {
    try {
        await execAsync('pnpm exec prisma db push');
        console.log('✅ Prisma schema synced to SQLite');
    } catch (err) {
        console.error('❌ Failed to push Prisma schema:', err);
        process.exit(1);
    }
}

export { prisma };
