#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildWithDatabase() {
  try {
    console.log('🔄 Generating Prisma Client...');
    await execAsync('npx prisma generate');
    
    console.log('🚀 Building Next.js application...');
    await execAsync('npx next build');
    
    console.log('✅ Build completed successfully!');
    console.log('ℹ️ Database operations will be handled at runtime');
  } catch (error) {
    console.error('❌ Build failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

buildWithDatabase(); 