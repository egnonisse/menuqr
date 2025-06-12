#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

/**
 * Script de monitoring des connexions et performances de la base de données
 */

const MONITOR_DURATION = 60000; // 1 minute de monitoring
const CHECK_INTERVAL = 5000; // Vérifier toutes les 5 secondes

let stats = {
  checks: 0,
  successes: 0,
  failures: 0,
  connectionTimeouts: 0,
  preparedStatementErrors: 0,
  totalLatency: 0,
  maxLatency: 0,
  minLatency: Number.MAX_VALUE,
  errors: []
};

console.log('🔍 Début du monitoring de la base de données...');
console.log(`⏱️ Durée: ${MONITOR_DURATION / 1000}s, Intervalle: ${CHECK_INTERVAL / 1000}s`);

async function checkDatabaseHealth() {
  const start = Date.now();
  stats.checks++;
  
  try {
    // Test de connexion simple
    await prisma.$queryRaw`SELECT 1 as health_check, NOW() as timestamp`;
    
    const latency = Date.now() - start;
    stats.successes++;
    stats.totalLatency += latency;
    stats.maxLatency = Math.max(stats.maxLatency, latency);
    stats.minLatency = Math.min(stats.minLatency, latency);
    
    console.log(`✅ Check ${stats.checks}: ${latency}ms`);
    
    return { success: true, latency };
  } catch (error) {
    const latency = Date.now() - start;
    stats.failures++;
    stats.totalLatency += latency;
    
    // Classifier les erreurs
    if (error.message?.includes('Timed out fetching a new connection')) {
      stats.connectionTimeouts++;
      console.log(`❌ Check ${stats.checks}: CONNECTION TIMEOUT (${latency}ms)`);
    } else if (error.code === '26000' || error.message?.includes('prepared statement')) {
      stats.preparedStatementErrors++;
      console.log(`❌ Check ${stats.checks}: PREPARED STATEMENT ERROR (${latency}ms)`);
    } else {
      console.log(`❌ Check ${stats.checks}: OTHER ERROR (${latency}ms) - ${error.message?.substring(0, 100)}`);
    }
    
    // Enregistrer l'erreur
    stats.errors.push({
      timestamp: new Date().toISOString(),
      code: error.code,
      message: error.message?.substring(0, 200),
      latency
    });
    
    return { success: false, error: error.message, latency };
  }
}

async function checkConnectionPoolStatus() {
  try {
    // Vérifier l'état des connexions actives
    const activeConnections = await prisma.$queryRaw`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active' AND application_name LIKE '%prisma%'
    `;
    
    const idleConnections = await prisma.$queryRaw`
      SELECT count(*) as idle_connections 
      FROM pg_stat_activity 
      WHERE state = 'idle' AND application_name LIKE '%prisma%'
    `;
    
    console.log(`📊 Connexions actives: ${activeConnections[0]?.active_connections || 0}, inactives: ${idleConnections[0]?.idle_connections || 0}`);
    
    return {
      active: Number(activeConnections[0]?.active_connections || 0),
      idle: Number(idleConnections[0]?.idle_connections || 0)
    };
  } catch (error) {
    console.warn('⚠️ Impossible de vérifier le statut du pool:', error.message);
    return null;
  }
}

// Fonction principale de monitoring
async function startMonitoring() {
  const startTime = Date.now();
  const endTime = startTime + MONITOR_DURATION;
  
  while (Date.now() < endTime) {
    await checkDatabaseHealth();
    
    // Vérifier le pool toutes les 10 vérifications
    if (stats.checks % 2 === 0) {
      await checkConnectionPoolStatus();
    }
    
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
  
  // Générer le rapport final
  const report = generateReport();
  console.log('\n📋 RAPPORT FINAL:');
  console.log(report);
  
  // Sauvegarder le rapport
  const reportData = {
    timestamp: new Date().toISOString(),
    duration: MONITOR_DURATION,
    interval: CHECK_INTERVAL,
    stats,
    report
  };
  
  writeFileSync('db-monitoring-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n💾 Rapport sauvegardé dans db-monitoring-report.json');
  
  await prisma.$disconnect();
}

function generateReport() {
  const avgLatency = stats.totalLatency / stats.checks;
  const successRate = (stats.successes / stats.checks * 100).toFixed(2);
  
  return `
🔍 MONITORING RÉSULTATS
======================
📊 Total vérifications: ${stats.checks}
✅ Succès: ${stats.successes} (${successRate}%)
❌ Échecs: ${stats.failures}
⏱️ Timeouts connexion: ${stats.connectionTimeouts}
🔧 Erreurs prepared statement: ${stats.preparedStatementErrors}

⚡ LATENCES
===========
📈 Moyenne: ${avgLatency.toFixed(2)}ms
📊 Min: ${stats.minLatency === Number.MAX_VALUE ? 'N/A' : stats.minLatency}ms
📊 Max: ${stats.maxLatency}ms

🚨 RECOMMANDATIONS
==================
${generateRecommendations()}
`;
}

function generateRecommendations() {
  const recommendations = [];
  
  if (stats.connectionTimeouts > 0) {
    recommendations.push('⚠️ URGENT: Augmenter connection_limit et pool_timeout');
    recommendations.push('🔧 DATABASE_URL="...?connection_limit=30&pool_timeout=60"');
  }
  
  if (stats.preparedStatementErrors > 0) {
    recommendations.push('⚠️ URGENT: Implémenter la gestion des prepared statements');
    recommendations.push('🔧 Utiliser le middleware Prisma pour les reconnexions');
  }
  
  const avgLatency = stats.totalLatency / stats.checks;
  if (avgLatency > 1000) {
    recommendations.push('⚠️ Latence élevée détectée (>1s)');
    recommendations.push('🔧 Vérifier les performances de la base de données');
  }
  
  const failureRate = stats.failures / stats.checks;
  if (failureRate > 0.1) {
    recommendations.push('⚠️ Taux d\'échec élevé (>10%)');
    recommendations.push('🔧 Redémarrer l\'application et nettoyer les connexions');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Aucun problème critique détecté');
    recommendations.push('📊 Performances de la base de données nominales');
  }
  
  return recommendations.join('\n');
}

// Démarrer le monitoring
startMonitoring().catch(error => {
  console.error('💥 Erreur fatale du monitoring:', error);
  process.exit(1);
}); 