import { NextResponse } from 'next/server'
import { checkDatabaseHealth, PerformanceTracker } from '../../../../lib/monitoring'

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth()
    const slowOperations = PerformanceTracker.getSlowOperations()
    
    const overallStatus = dbHealth.status === 'critical' ? 'unhealthy' : 'healthy'
    
    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: {
        database: dbHealth,
        performance: {
          slowOperations,
          averageResponseTime: PerformanceTracker.getAverageTime('api_request')
        }
      }
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503
    
    return NextResponse.json(healthReport, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
} 