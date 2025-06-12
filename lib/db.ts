import { PrismaClient } from '@prisma/client'

// Configuration pour différents environnements
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }

  // Paramètres optimisés pour Vercel
  const params = new URLSearchParams({
    pg_prepared_statements: 'false',
    connection_limit: '50',
    pool_timeout: '30',
    connect_timeout: '60',
    statement_timeout: '60000',
    idle_timeout: '300'
  })

  return `${baseUrl}?${params.toString()}`
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

// Fonction utilitaire pour les opérations avec retry
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Ne pas retry sur certaines erreurs
      if (error instanceof Error && (
        error.message.includes('Unique constraint') ||
        error.message.includes('Foreign key constraint')
      )) {
        throw error
      }

      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries} attempts:`, lastError)
        throw lastError
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError!
}

// Test de connexion
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

export default prisma 