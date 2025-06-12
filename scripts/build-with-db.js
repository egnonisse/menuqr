#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildWithDatabase() {
  try {
    console.log('🔄 Generating Prisma Client...');
    await execAsync('npx prisma generate');
    
    console.log('📋 Deploying database migrations...');
    try {
      // Utiliser des migrations au lieu de db push (SAFE pour production)
      await execAsync('npx prisma migrate deploy');
    } catch (migrateError) {
      console.log('⚠️ Migration deploy failed, trying alternative...');
      console.error('Migration error:', migrateError);
      
      // Fallback: Reset connection pool et retry
      console.log('🔄 Resetting connection and retrying...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      await execAsync('npx prisma migrate deploy --force');
    }
    
    console.log('🚀 Building Next.js application...');
    await execAsync('npx next build');
    
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

buildWithDatabase(); 