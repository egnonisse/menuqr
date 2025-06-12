#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function recreateDatabase() {
  console.log('🗄️ Reconstruction de la base de données...');
  
  try {
    console.log('🔄 Génération du client Prisma...');
    await execAsync('npx prisma generate');
    
    console.log('🚀 Création du schéma avec db push...');
    await execAsync('npx prisma db push --accept-data-loss');
    
    console.log('✅ Base de données recréée avec succès !');
    console.log('📊 Vérification des tables...');
    
    // Vérifier que les tables existent
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Table User créée (${userCount} utilisateurs)`);
      
      const restaurantCount = await prisma.restaurant.count();
      console.log(`✅ Table Restaurant créée (${restaurantCount} restaurants)`);
      
      console.log('🎉 Toutes les tables sont opérationnelles !');
    } catch (checkError) {
      console.log('⚠️ Erreur lors de la vérification:', checkError instanceof Error ? checkError.message : String(checkError));
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la reconstruction:', error instanceof Error ? error.message : String(error));
    
    // Tentative alternative
    console.log('🔄 Tentative avec migration deploy...');
    try {
      await execAsync('npx prisma migrate deploy');
      console.log('✅ Migration deploy réussie !');
    } catch (migrateError) {
      console.error('❌ Migration aussi échouée:', migrateError instanceof Error ? migrateError.message : String(migrateError));
      console.log('\n💡 Solutions manuelles:');
      console.log('1. Vérifier la connexion Supabase');
      console.log('2. Recréer la base via l\'interface Supabase');
      console.log('3. Vérifier les variables d\'environnement');
    }
  }
}

recreateDatabase(); 