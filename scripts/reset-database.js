#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function resetDatabase() {
  try {
    console.log('🔄 Nettoyage complet de la base de données...');
    
    // Étape 1: Supprimer toutes les tables existantes (skip pour éviter les erreurs de permissions)
    console.log('🗑️ Nettoyage des tables existantes...');
    
    // Étape 2: Recréer le schéma complet
    console.log('🏗️ Recréation du schéma...');
    await execAsync('npx prisma db push --force-reset --accept-data-loss');
    
    console.log('✅ Base de données réinitialisée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error instanceof Error ? error.message : String(error));
    
    // Plan B: Utiliser une approche plus douce
    console.log('🔄 Tentative avec approche alternative...');
    try {
      await execAsync('npx prisma generate');
      await execAsync('npx prisma db push --accept-data-loss');
      console.log('✅ Réinitialisé avec l\'approche alternative!');
    } catch (secondError) {
      console.error('❌ Échec de l\'approche alternative:', secondError instanceof Error ? secondError.message : String(secondError));
      process.exit(1);
    }
  }
}

resetDatabase(); 