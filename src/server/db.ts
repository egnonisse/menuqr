import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Auto-migration pour production sur Vercel
if (env.NODE_ENV === "production" && process.env.VERCEL) {
  initializeDatabase().catch(console.error);
}

async function initializeDatabase() {
  try {
    console.log('🔄 Checking database connection...');
    
    // Test de connexion simple
    await db.$connect();
    console.log('✅ Database connected successfully');
    
    // Optionnel : Auto-migration si nécessaire
    // Uniquement lors du premier démarrage sur Vercel
    if (process.env.AUTO_MIGRATE === "true") {
      console.log('🔄 Running auto-migration...');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        await execAsync('npx prisma migrate deploy');
        console.log('✅ Auto-migration completed');
      } catch (error) {
        console.warn('⚠️ Auto-migration failed, continuing with existing schema');
      }
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Ensure proper cleanup in serverless environments (Node.js only)
if (typeof window === "undefined" && typeof process !== "undefined" && env.NODE_ENV === "production") {
  // Only add process handlers if not in Edge Runtime
  if (typeof process.on === "function") {
    process.on('SIGTERM', async () => {
      try {
        await db.$disconnect();
      } catch {
        // Ignore disconnect errors
      }
    });
    
    process.on('SIGINT', async () => {
      try {
        await db.$disconnect();
      } catch {
        // Ignore disconnect errors
      }
    });
  }
}
