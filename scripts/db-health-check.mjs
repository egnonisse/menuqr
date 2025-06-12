#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de vérification rapide de la santé de la base de données
 */

async function checkDatabaseHealth() {
  const start = Date.now();
  
  try {
    console.log('🔍 Vérification de la connexion à la base de données...');
    
    // Test simple de connexion
    await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
    const latency = Date.now() - start;
    
    console.log('✅ Base de données accessible');
    console.log(`⚡ Latence: ${latency}ms`);
    
    // Test de quelques tables principales
    try {
      const userCount = await prisma.user.count();
      console.log(`👥 Utilisateurs: ${userCount}`);
      
      const restaurantCount = await prisma.restaurant.count();
      console.log(`🏪 Restaurants: ${restaurantCount}`);
      
      console.log('📊 Toutes les tables principales sont accessibles');
    } catch (tableError) {
      console.warn('⚠️ Problème d\'accès aux tables:', tableError.message);
    }
    
    const result = {
      healthy: true,
      latency,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n🎉 État de santé: EXCELLENT');
    return result;
    
  } catch (error) {
    const latency = Date.now() - start;
    
    console.error('❌ Erreur de connexion à la base de données:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Latence: ${latency}ms`);
    
    // Analyser le type d'erreur
    if (error.message?.includes('Timed out fetching a new connection')) {
      console.error('\n🚨 DIAGNOSTIC: Pool de connexions saturé');
      console.error('   Solution: Augmenter connection_limit dans DATABASE_URL');
    } else if (error.code === '26000') {
      console.error('\n🚨 DIAGNOSTIC: Erreur de prepared statement');
      console.error('   Solution: Redémarrer l\'application');
    }
    
    const result = {
      healthy: false,
      error: error.message,
      code: error.code,
      latency,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n💔 État de santé: CRITIQUE');
    return result;
    
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
checkDatabaseHealth()
  .then(result => {
    if (result.healthy) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }); 