import prisma from './db'

// Types pour le monitoring
interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical'
  timestamp: Date
  metrics: {
    dbConnections: number
    responseTime: number
    errorRate: number
  }
  issues: string[]
}

// Vérification de santé de la base de données
export async function checkDatabaseHealth(): Promise<HealthCheck> {
  const startTime = Date.now()
  const issues: string[] = []
  let status: 'healthy' | 'warning' | 'critical' = 'healthy'

  try {
    // Test de connexion simple
    await prisma.$queryRaw`SELECT 1`
    
    // Test de performance
    const responseTime = Date.now() - startTime
    
    // Vérifier les métriques
    if (responseTime > 5000) {
      issues.push('Temps de réponse élevé (>5s)')
      status = 'warning'
    }
    
    if (responseTime > 10000) {
      issues.push('Temps de réponse critique (>10s)')
      status = 'critical'
    }

    return {
      status,
      timestamp: new Date(),
      metrics: {
        dbConnections: 0, // À implémenter avec des métriques Prisma
        responseTime,
        errorRate: 0
      },
      issues
    }
  } catch (error) {
    return {
      status: 'critical',
      timestamp: new Date(),
      metrics: {
        dbConnections: 0,
        responseTime: Date.now() - startTime,
        errorRate: 100
      },
      issues: [`Erreur de connexion: ${error instanceof Error ? error.message : 'Inconnue'}`]
    }
  }
}

// Logging structuré des erreurs
export function logError(error: Error, context: Record<string, any> = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    },
    context,
    severity: getErrorSeverity(error)
  }

  console.error('🚨 Error logged:', JSON.stringify(errorLog, null, 2))
  
  // En production, envoyer vers un service de monitoring (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // sendToMonitoringService(errorLog)
  }
}

// Déterminer la sévérité de l'erreur
function getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  const errorCode = (error as any).code
  
  if (errorCode === '42P05' || errorCode === 'P2024') return 'critical'
  if (errorCode?.startsWith('P')) return 'high'
  if (errorCode?.startsWith('42')) return 'medium'
  
  return 'low'
}

// Métriques de performance
export class PerformanceTracker {
  private static metrics: Map<string, number[]> = new Map()

  static track(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    
    const operationMetrics = this.metrics.get(operation)!
    operationMetrics.push(duration)
    
    // Garder seulement les 100 dernières mesures
    if (operationMetrics.length > 100) {
      operationMetrics.shift()
    }
  }

  static getAverageTime(operation: string): number {
    const metrics = this.metrics.get(operation) || []
    if (metrics.length === 0) return 0
    
    return metrics.reduce((sum, time) => sum + time, 0) / metrics.length
  }

  static getSlowOperations(threshold: number = 1000): string[] {
    const slowOps: string[] = []
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const avgTime = this.getAverageTime(operation)
      if (avgTime > threshold) {
        slowOps.push(`${operation}: ${avgTime.toFixed(2)}ms`)
      }
    }
    
    return slowOps
  }
} 