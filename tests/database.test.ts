import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { checkDatabaseHealth } from '../lib/monitoring'
import prisma from '../lib/db'

describe('Database Health Tests', () => {
  beforeAll(async () => {
    // Setup test environment
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should connect to database successfully', async () => {
    const health = await checkDatabaseHealth()
    expect(health.status).not.toBe('critical')
  })

  it('should respond within acceptable time', async () => {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime
    
    expect(responseTime).toBeLessThan(5000) // 5 secondes max
  })

  it('should handle concurrent connections', async () => {
    const promises = Array.from({ length: 10 }, () => 
      prisma.$queryRaw`SELECT 1`
    )
    
    await expect(Promise.all(promises)).resolves.toBeDefined()
  })

  it('should detect prepared statement conflicts', async () => {
    // Test spécifique pour l'erreur 42P05
    try {
      await Promise.all([
        prisma.user.findMany(),
        prisma.user.findMany(),
        prisma.user.findMany()
      ])
    } catch (error: any) {
      expect(error.code).not.toBe('42P05')
    }
  })

  it('should not timeout on pool connections', async () => {
    // Test spécifique pour l'erreur P2024
    const startTime = Date.now()
    
    try {
      await prisma.user.findFirst()
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(30000) // 30 secondes max
    } catch (error: any) {
      expect(error.code).not.toBe('P2024')
    }
  })
}) 