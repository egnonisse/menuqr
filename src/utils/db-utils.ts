import { db } from "@/server/db";

/**
 * Wrapper pour les opérations Prisma avec gestion d'erreurs améliorée
 */
export async function withDatabase<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Si c'est une erreur de prepared statement, on peut retry
      if (
        error?.code === "42P05" || 
        error?.message?.includes("prepared statement") ||
        error?.message?.includes("already exists")
      ) {
        console.warn(`Database retry attempt ${attempt}/${retries}:`, error.message);
        
        // Attendre un peu avant de retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        
        // Forcer une nouvelle connexion
        try {
          await db.$disconnect();
        } catch {
          // Ignore les erreurs de déconnexion
        }
        
        continue;
      }
      
      // Pour les autres erreurs, throw immédiatement
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Wrapper pour les requêtes de lecture
 */
export async function safeQuery<T>(operation: () => Promise<T>): Promise<T> {
  return withDatabase(operation, 2);
}

/**
 * Wrapper pour les mutations
 */
export async function safeMutation<T>(operation: () => Promise<T>): Promise<T> {
  return withDatabase(operation, 3);
} 