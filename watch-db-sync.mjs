import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Configuration de surveillance
const WATCH_INTERVAL = 30000; // Vérifier toutes les 30 secondes
const MAX_ATTEMPTS = 120; // Arrêter après 1 heure (120 x 30s)

let attempts = 0;
let syncStatus = {
  feedbackMenuItem: false,
  qRScan: false,
  usageStats: false,
  subscription: true, // Déjà créée
  lastCheck: new Date().toISOString()
};

async function checkTableExists(tableName) {
  try {
    await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${tableName}" LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function regeneratePrismaClient() {
  try {
    console.log('🔄 Régénération du client Prisma...');
    await execAsync('npx prisma generate');
    console.log('✅ Client Prisma régénéré');
    return true;
  } catch (error) {
    console.log('❌ Erreur lors de la régénération:', error.message);
    return false;
  }
}

async function reactivateCode() {
  try {
    console.log('🔄 Réactivation du code...');
    
    // Lire le fichier feedbacks router
    let feedbacksCode = readFileSync('./src/server/api/routers/feedbacks.ts', 'utf8');
    
    // Réactiver le code commenté pour FeedbackMenuItem
    if (syncStatus.feedbackMenuItem) {
      feedbacksCode = feedbacksCode.replace(
        /\/\/ await ctx\.db\.feedbackMenuItem\.createMany\({[\s\S]*?\/\/ }\);/g,
        `await ctx.db.feedbackMenuItem.createMany({
            data: input.menuItems.map((item) => ({
              feedbackId: feedback.id,
              menuItemId: item.menuItemId,
              rating: item.rating,
              comment: item.comment,
            })),
          });`
      );
      
      console.log('✅ Code FeedbackMenuItem réactivé');
    }
    
    // Sauvegarder les changements
    writeFileSync('./src/server/api/routers/feedbacks.ts', feedbacksCode);
    
    return true;
  } catch (error) {
    console.log('❌ Erreur lors de la réactivation:', error.message);
    return false;
  }
}

async function watchSync() {
  attempts++;
  console.log(`\n🔍 Surveillance ${attempts}/${MAX_ATTEMPTS} - ${new Date().toLocaleTimeString()}`);
  
  try {
    // Vérifier l'existence des tables
    const tableChecks = await Promise.all([
      checkTableExists('FeedbackMenuItem'),
      checkTableExists('QRScan'),
      checkTableExists('UsageStats'),
      checkTableExists('Subscription')
    ]);
    
    const newStatus = {
      feedbackMenuItem: tableChecks[0],
      qRScan: tableChecks[1],
      usageStats: tableChecks[2],
      subscription: tableChecks[3],
      lastCheck: new Date().toISOString()
    };
    
    // Vérifier s'il y a des changements
    const hasChanges = Object.keys(newStatus).some(key => 
      key !== 'lastCheck' && newStatus[key] !== syncStatus[key]
    );
    
    if (hasChanges) {
      console.log('🎉 Changement détecté !');
      console.log('État précédent:', syncStatus);
      console.log('Nouvel état:', newStatus);
      
      syncStatus = newStatus;
      
      // Si de nouvelles tables sont disponibles, régénérer le client
      if (newStatus.feedbackMenuItem || newStatus.qRScan || newStatus.usageStats) {
        await regeneratePrismaClient();
        
        // Attendre un peu puis réactiver le code
        setTimeout(async () => {
          await reactivateCode();
          console.log('🎊 Code réactivé avec succès !');
        }, 5000);
      }
    } else {
      // Afficher l'état actuel
      const totalTables = Object.keys(syncStatus).filter(k => k !== 'lastCheck').length;
      const syncedTables = Object.values(syncStatus).filter(v => v === true).length;
      console.log(`📊 État: ${syncedTables}/${totalTables} tables synchronisées`);
      
      Object.entries(syncStatus).forEach(([table, synced]) => {
        if (table !== 'lastCheck') {
          console.log(`   ${synced ? '✅' : '❌'} ${table}`);
        }
      });
    }
    
    // Continuer la surveillance si toutes les tables ne sont pas encore synchronisées
    const allSynced = Object.entries(syncStatus).every(([key, value]) => 
      key === 'lastCheck' || value === true
    );
    
    if (!allSynced && attempts < MAX_ATTEMPTS) {
      setTimeout(watchSync, WATCH_INTERVAL);
    } else if (allSynced) {
      console.log('🎉 TOUTES LES TABLES SONT SYNCHRONISÉES !');
      console.log('💪 Toutes les fonctionnalités avancées sont maintenant disponibles !');
      await prisma.$disconnect();
      process.exit(0);
    } else {
      console.log('⏰ Surveillance terminée après 1 heure');
      console.log('🔄 Relancez le script si nécessaire : node watch-db-sync.mjs');
      await prisma.$disconnect();
      process.exit(0);
    }
    
  } catch (error) {
    console.error('🚨 Erreur de surveillance:', error.message);
    if (attempts < MAX_ATTEMPTS) {
      setTimeout(watchSync, WATCH_INTERVAL);
    } else {
      await prisma.$disconnect();
      process.exit(1);
    }
  }
}

console.log('🚀 Début de la surveillance de synchronisation des tables');
console.log(`⏱️ Vérification toutes les ${WATCH_INTERVAL/1000}s pendant ${MAX_ATTEMPTS * WATCH_INTERVAL/1000/60} minutes`);
console.log('🛑 Appuyez sur Ctrl+C pour arrêter\n');

// Commencer la surveillance
watchSync();

// Gérer l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt de la surveillance...');
  await prisma.$disconnect();
  process.exit(0);
}); 