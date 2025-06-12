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
    console.log('❌ Error:', error instanceof Error ? error.message : String(error));
    
    console.log('\n🛠️ Alternative approach:');
    console.log('1. Go to Supabase dashboard');
    console.log('2. SQL Editor > New query');
    console.log('3. Paste the migration SQL manually');
    console.log('4. Execute the script');
    
    // Essayons de créer juste les tables essentielles via SQL direct
    console.log('\n📝 Essential tables SQL:');
    console.log(`
-- Core tables creation
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "openingHours" JSONB,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);
    `);
  }
}

forceRecreate(); 