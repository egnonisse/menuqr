import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  console.log('🔍 Vérification de l\'état des tables...\n');
  
  const tables = [
    'FeedbackMenuItem',
    'QRScan', 
    'UsageStats',
    'Subscription'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}" LIMIT 1`);
      console.log(`✅ ${table} - Table existe`);
      results[table] = true;
    } catch (error) {
      console.log(`❌ ${table} - Table manquante`);
      results[table] = false;
    }
  }
  
  console.log('\n📊 Résumé:');
  const totalTables = tables.length;
  const existingTables = Object.values(results).filter(exists => exists).length;
  console.log(`${existingTables}/${totalTables} tables synchronisées`);
  
  if (existingTables === totalTables) {
    console.log('🎉 Toutes les tables sont synchronisées !');
  } else {
    console.log('⏳ Synchronisation en cours...');
  }
  
  await prisma.$disconnect();
}

checkTables().catch(console.error); 