import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = () => {
  const prisma = new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Configuration optimisée pour les connexions
    datasources: {
      db: {
        url: env.DATABASE_URL
      }
    }
  });

  // Middleware pour gérer les erreurs de prepared statements
  prisma.$use(async (params, next) => {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await next(params);
      } catch (error: any) {
        attempt++;
        
        // Gestion spécifique des erreurs de prepared statements
        if (error?.code === '26000' || error?.message?.includes('prepared statement')) {
          console.warn(`[DB] Prepared statement error (attempt ${attempt}/${maxRetries}):`, error.message);
          
          if (attempt < maxRetries) {
            // Forcer une reconnexion
            try {
              await prisma.$disconnect();
              // Attendre un peu avant de retry
              await new Promise(resolve => setTimeout(resolve, 100 * attempt));
              continue;
            } catch (disconnectError) {
              // Ignorer les erreurs de déconnexion
            }
          }
        }
        
        // Gestion des erreurs de timeout de connexion
        if (error?.message?.includes('Timed out fetching a new connection')) {
          console.warn(`[DB] Connection timeout (attempt ${attempt}/${maxRetries}):`, error.message);
          
          if (attempt < maxRetries) {
            // Attendre progressivement plus longtemps
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
        
        // Pour les autres erreurs, ou si on a épuisé les tentatives
        throw error;
      }
    }
  });

  return prisma;
};

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
    
    // Test de connexion avec retry
    let connected = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!connected && attempts < maxAttempts) {
      try {
        await db.$connect();
        connected = true;
        console.log('✅ Database connected successfully');
      } catch (error) {
        attempts++;
        console.warn(`Database connection attempt ${attempts}/${maxAttempts} failed:`, error);
        
        if (attempts < maxAttempts) {
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        } else {
          throw error;
        }
      }
    }
    
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
    // Ne pas faire crash l'application, mais logger l'erreur
  }
}

// Ensure proper cleanup in serverless environments (Node.js only)
if (typeof window === "undefined" && typeof process !== "undefined" && env.NODE_ENV === "production") {
  // Only add process handlers if not in Edge Runtime
  if (typeof process.on === "function") {
    process.on('SIGTERM', async () => {
      try {
        console.log('🔄 Graceful shutdown: Disconnecting from database...');
        await db.$disconnect();
        console.log('✅ Database disconnected successfully');
      } catch (error) {
        console.warn('⚠️ Error during database disconnect:', error);
      }
    });
    
    process.on('SIGINT', async () => {
      try {
        console.log('🔄 Graceful shutdown: Disconnecting from database...');
        await db.$disconnect();
        console.log('✅ Database disconnected successfully');
      } catch (error) {
        console.warn('⚠️ Error during database disconnect:', error);
      }
    });
  }
}
