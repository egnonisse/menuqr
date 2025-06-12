#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function forceRecreate() {
  console.log('🔄 Force recreation with fresh connection...');
  
  try {
    // 1. Nettoyer les connexions persistantes
    console.log('🧹 Cleaning up connections...');
    process.env.DATABASE_URL = process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1';
    
    // 2. Générer le client avec la nouvelle URL
    console.log('🔄 Generating Prisma client...');
    await execAsync('npx prisma generate');
    
    // 3. Attendre un peu pour que les connexions se ferment
    console.log('⏳ Waiting for connection cleanup...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Essayer push avec force
    console.log('🚀 Force pushing schema...');
    await execAsync('npx prisma db push --force-reset --accept-data-loss');
    
    console.log('✅ Success! Database recreated');
    
  } catch (error) {
    console.error('❌ Error during recreation:', error instanceof Error ? error.message : String(error));
    
    // Plan B
    console.log('🔄 Trying alternative approach...');
    try {
      await execAsync('npx prisma migrate deploy');
      console.log('✅ Alternative approach successful!');
    } catch (altError) {
      console.error('❌ Alternative approach failed:', altError instanceof Error ? altError.message : String(altError));
      console.log('\n💡 Manual solutions:');
      console.log('1. Check database connection');
      console.log('2. Verify environment variables');
      console.log('3. Reset database manually');
      process.exit(1);
    }
  }
}

forceRecreate(); 