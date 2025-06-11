#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildWithDatabase() {
  try {
    console.log('🔄 Generating Prisma Client...');
    await execAsync('npx prisma generate');
    
    console.log('💾 Pushing database schema...');
    await execAsync('npx prisma db push --accept-data-loss --skip-generate');
    
    console.log('🚀 Building Next.js application...');
    await execAsync('npx next build');
    
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

buildWithDatabase(); 