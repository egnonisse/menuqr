#!/usr/bin/env node

/**
 * Script de configuration du système de validation des utilisateurs
 * 
 * Ce script va :
 * 1. Vérifier la structure de la base de données
 * 2. Migrer les utilisateurs existants
 * 3. Promouvoir un utilisateur spécifique en super-admin
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🔧 Configuration du système de validation des utilisateurs...\n');

  try {
    // 1. Vérifier la connexion à la base de données
    console.log('📡 Vérification de la connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Connexion réussie!\n');

    // 2. Lister les utilisateurs existants
    console.log('👥 Utilisateurs existants dans la base de données:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('ℹ️  Aucun utilisateur trouvé. Vous devez d\'abord créer un compte via l\'interface.\n');
      return;
    }

    users.forEach((user, index) => {
      const status = user.role === 'SUPER_ADMIN' ? '👑' : 
                    user.role === 'ADMIN' ? '✅' : 
                    user.role === 'PENDING' ? '⏳' : '❌';
      console.log(`${index + 1}. ${status} ${user.email} (${user.name || 'Sans nom'}) - ${user.role}`);
    });

    console.log('\n');

    // 3. Migrer les utilisateurs qui n'ont pas encore de rôle défini
    console.log('🔄 Migration des utilisateurs sans rôle défini...');
    const usersToMigrate = users.filter(user => !user.role || user.role === null);
    
    if (usersToMigrate.length > 0) {
      for (const user of usersToMigrate) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'PENDING',
            isApproved: false
          }
        });
        console.log(`✅ Migré: ${user.email} -> PENDING`);
      }
    } else {
      console.log('✅ Tous les utilisateurs ont déjà un rôle défini.\n');
    }

    // 4. Promouvoir un utilisateur en super-admin
    const superAdmins = users.filter(user => user.role === 'SUPER_ADMIN');
    
    if (superAdmins.length === 0) {
      console.log('👑 Aucun super-administrateur détecté. Promotion d\'un utilisateur nécessaire.\n');
      
      const eligibleUsers = users.filter(user => user.role !== 'SUPER_ADMIN');
      if (eligibleUsers.length === 0) {
        console.log('❌ Aucun utilisateur éligible pour la promotion.');
        return;
      }

      console.log('Utilisateurs disponibles pour la promotion:');
      eligibleUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name || 'Sans nom'})`);
      });

      const choice = await question('\n🔢 Entrez le numéro de l\'utilisateur à promouvoir en super-admin: ');
      const userIndex = parseInt(choice) - 1;

      if (userIndex >= 0 && userIndex < eligibleUsers.length) {
        const selectedUser = eligibleUsers[userIndex];
        
        if (selectedUser) {
          const confirm = await question(`\n⚠️  Êtes-vous sûr de vouloir promouvoir "${selectedUser.email}" en super-administrateur? (oui/non): `);
          
          if (confirm.toLowerCase() === 'oui' || confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
            await prisma.user.update({
              where: { id: selectedUser.id },
              data: {
                role: 'SUPER_ADMIN',
                isApproved: true,
                approvedAt: new Date()
              }
            });

              console.log(`\n🎉 Succès! ${selectedUser.email} est maintenant super-administrateur!`);
            console.log('🔐 Cet utilisateur peut maintenant accéder à /admin/users pour valider d\'autres comptes.');
          } else {
            console.log('\n❌ Promotion annulée.');
          }
        }
      } else {
        console.log('\n❌ Choix invalide.');
      }
    } else {
      console.log(`✅ Super-admin(s) existant(s): ${superAdmins.map(u => u.email).join(', ')}\n`);
    }

    // 5. Statistiques finales
    console.log('\n📊 État final du système:');
    const finalStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true
      }
    });

    finalStats.forEach(stat => {
      const emoji = stat.role === 'SUPER_ADMIN' ? '👑' : 
                   stat.role === 'ADMIN' ? '✅' : 
                   stat.role === 'PENDING' ? '⏳' : '❌';
      console.log(`${emoji} ${stat.role}: ${stat._count._all} utilisateur(s)`);
    });

    console.log('\n🎯 Prochaines étapes:');
    console.log('1. Démarrez le serveur: npm run dev');
    console.log('2. Connectez-vous avec le compte super-admin');
    console.log('3. Accédez à /admin/users pour gérer les validations');
    console.log('4. Les nouveaux utilisateurs seront en statut PENDING par défaut\n');

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Solutions possibles:');
    console.error('- Vérifiez que la base de données est accessible');
    console.error('- Exécutez d\'abord: npx prisma migrate deploy');
    console.error('- Vérifiez votre DATABASE_URL dans .env');
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main(); 