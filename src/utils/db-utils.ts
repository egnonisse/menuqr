import { db } from "@/server/db";

/**
 * Wrapper pour les opérations Prisma avec gestion d'erreurs améliorée
 * Version optimisée pour gérer les erreurs de pool de connexions
 */
export async function withDatabase<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: Error;
  let baseDelay = 100;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      lastError = error;
      
      console.warn(`[DB] Operation failed (attempt ${attempt}/${retries}):`, {
        code: error?.code,
        message: error?.message?.substring(0, 200),
        attempt
      });
      
      // Gestion spécifique des erreurs de pool de connexions
      if (error?.message?.includes('Timed out fetching a new connection')) {
        if (attempt < retries) {
          console.warn(`[DB] Connection pool timeout, retrying in ${baseDelay * attempt}ms...`);
          
          // Attendre plus longtemps pour que le pool se libère
          await new Promise(resolve => setTimeout(resolve, baseDelay * attempt * 2));
          continue;
        }
      }
      
      // Gestion des erreurs de prepared statements
      if (
        error?.code === "26000" || 
        error?.code === "42P05" ||
        error?.message?.includes("prepared statement") ||
        error?.message?.includes("already exists")
      ) {
        if (attempt < retries) {
          console.warn(`[DB] Prepared statement error, forcing reconnection...`);
          
          // Forcer une nouvelle connexion
          try {
            await db.$disconnect();
          } catch (disconnectError) {
            // Ignore les erreurs de déconnexion
            console.warn('[DB] Disconnect error ignored:', disconnectError);
          }
          
          // Attendre avant de retry
          await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
          continue;
        }
      }
      
      // Gestion des erreurs de contraintes/conflits
      if (error?.code === "23505" || error?.code === "23503") {
        // Erreur de contrainte unique ou de clé étrangère
        // Ne pas retry ces erreurs logiques
        throw error;
      }
      
      // Pour les autres erreurs, retry avec délai progressif
      if (attempt < retries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 5000);
        console.warn(`[DB] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Si toutes les tentatives ont échoué
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Wrapper pour les requêtes de lecture avec retry optimisé
 */
export async function safeQuery<T>(operation: () => Promise<T>): Promise<T> {
  return withDatabase(operation, 2); // Moins de retries pour les lectures
}

/**
 * Wrapper pour les mutations avec gestion spéciale
 */
export async function safeMutation<T>(operation: () => Promise<T>): Promise<T> {
  return withDatabase(operation, 3); // Plus de retries pour les écritures critiques
}

/**
 * Vérifier l'état de santé de la base de données
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    // Test simple de connexion
    await db.$queryRaw`SELECT 1 as test`;
    const latency = Date.now() - start;
    
    return { healthy: true, latency };
  } catch (error: any) {
    return { 
      healthy: false, 
      error: error?.message || 'Unknown error',
      latency: Date.now() - start
    };
  }
}

/**
 * Nettoyer les connexions en cas de problème
 */
export async function cleanupConnections(): Promise<void> {
  try {
    console.log('[DB] Cleaning up database connections...');
    await db.$disconnect();
    // Attendre un peu pour que les connexions se ferment
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('[DB] Connections cleaned up successfully');
  } catch (error) {
    console.warn('[DB] Error during connection cleanup:', error);
  }
} 