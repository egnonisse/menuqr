import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let lastStatus = {
  feedbackMenuItem: false,
  qRScan: false,
  usageStats: true,
  subscription: true
};

async function checkTableExists(tableName) {
  try {
    await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${tableName}" LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkAndReport() {
  const currentStatus = {
    feedbackMenuItem: await checkTableExists('FeedbackMenuItem'),
    qRScan: await checkTableExists('QRScan'),
    usageStats: await checkTableExists('UsageStats'),
    subscription: await checkTableExists('Subscription')
  };
  
  // Vérifier les changements
  const changes = [];
  Object.keys(currentStatus).forEach(table => {
    if (currentStatus[table] !== lastStatus[table]) {
      changes.push({
        table,
        status: currentStatus[table] ? 'CRÉÉE' : 'SUPPRIMÉE',
        emoji: currentStatus[table] ? '✅' : '❌'
      });
    }
  });
  
  if (changes.length > 0) {
    console.log(`\n🎉 CHANGEMENTS DÉTECTÉS - ${new Date().toLocaleTimeString()}`);
    changes.forEach(change => {
      console.log(`${change.emoji} ${change.table} - ${change.status}`);
    });
    
    // Mettre à jour le statut
    lastStatus = { ...currentStatus };
    
    // Afficher le résumé
    const totalTables = Object.keys(currentStatus).length;
    const syncedTables = Object.values(currentStatus).filter(exists => exists).length;
    console.log(`\n📊 État actuel: ${syncedTables}/${totalTables} tables synchronisées`);
    
    if (syncedTables === totalTables) {
      console.log('🎊 TOUTES LES TABLES SONT MAINTENANT SYNCHRONISÉES !');
      console.log('💪 Toutes les fonctionnalités avancées sont disponibles !');
      return true; // Arrêter la surveillance
    }
  } else {
    // Affichage discret du statut
    const syncedTables = Object.values(currentStatus).filter(exists => exists).length;
    process.stdout.write(`\r⏱️ ${new Date().toLocaleTimeString()} - ${syncedTables}/4 tables - En attente...`);
  }
  
  return false; // Continuer la surveillance
}

console.log('🚀 SURVEILLANCE CONTINUE ACTIVÉE');
console.log('⏱️ Vérification toutes les 10 secondes');
console.log('🛑 Ctrl+C pour arrêter\n');

// Surveillance continue
const interval = setInterval(async () => {
  try {
    const shouldStop = await checkAndReport();
    if (shouldStop) {
      clearInterval(interval);
      await prisma.$disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('\n🚨 Erreur:', error.message);
  }
}, 10000); // Vérifier toutes les 10 secondes

// Arrêt propre
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Arrêt de la surveillance...');
  clearInterval(interval);
  await prisma.$disconnect();
  process.exit(0);
});

// Première vérification immédiate
checkAndReport().catch(console.error); 