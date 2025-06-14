#!/usr/bin/env node

/**
 * Script de test pour le système de validation des utilisateurs
 * 
 * Ce script va :
 * 1. Se connecter à la base de données
 * 2. Lister les utilisateurs existants
 * 3. Créer un utilisateur de test si nécessaire
 * 4. Promouvoir un utilisateur en super-admin
 * 5. Tester les fonctionnalités de validation
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Test du système de validation des utilisateurs...\n');

  try {
    // 1. Vérifier la connexion
    console.log('📡 Connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Connexion réussie!\n');

    // 2. Lister les utilisateurs existants
    console.log('👥 Utilisateurs existants:');
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
      console.log('ℹ️  Aucun utilisateur trouvé. Création d\'un utilisateur de test...');
      
      // Créer un utilisateur de test
      const hashedPassword = await bcrypt.hash('test123', 12);
      
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Utilisateur Test',
          password: hashedPassword,
          role: 'PENDING',
          isApproved: false
        }
      });
      
      console.log(`✅ Utilisateur de test créé: ${testUser.email}`);
      
      // Aussi créer un restaurant pour cet utilisateur
      const restaurant = await prisma.restaurant.create({
        data: {
          name: 'Restaurant Test',
          slug: 'restaurant-test',
          description: 'Restaurant de test pour le système de validation',
          ownerId: testUser.id
        }
      });
      
      console.log(`🏪 Restaurant créé: ${restaurant.name}\n`);
      
      users.push(testUser);
    }

    users.forEach((user, index) => {
      const status = user.role === 'SUPER_ADMIN' ? '👑' : 
                    user.role === 'ADMIN' ? '✅' : 
                    user.role === 'PENDING' ? '⏳' : '❌';
      console.log(`${index + 1}. ${status} ${user.email} (${user.name || 'Sans nom'}) - ${user.role} - Approuvé: ${user.isApproved}`);
    });

    console.log('\n');

    // 3. Promouvoir le premier utilisateur en super-admin s'il n'y en a pas
    const superAdmins = users.filter(user => user.role === 'SUPER_ADMIN');
    
    if (superAdmins.length === 0) {
      console.log('👑 Promotion du premier utilisateur en super-admin...');
      const userToPromote = users[0];
      
      await prisma.user.update({
        where: { id: userToPromote.id },
        data: {
          role: 'SUPER_ADMIN',
          isApproved: true,
          approvedAt: new Date()
        }
      });
      
      console.log(`🎉 ${userToPromote.email} est maintenant super-administrateur!\n`);
    } else {
      console.log(`✅ Super-admin(s) existant(s): ${superAdmins.map(u => u.email).join(', ')}\n`);
    }

    // 4. Créer un deuxième utilisateur en PENDING pour tester la validation
    const pendingUsers = await prisma.user.findMany({
      where: { role: 'PENDING' }
    });

    if (pendingUsers.length === 0) {
      console.log('⏳ Création d\'un utilisateur en attente pour tester la validation...');
      
      const hashedPassword = await bcrypt.hash('pending123', 12);
      
      const pendingUser = await prisma.user.create({
        data: {
          email: 'pending@example.com',
          name: 'Utilisateur En Attente',
          password: hashedPassword,
          role: 'PENDING',
          isApproved: false
        }
      });
      
      console.log(`✅ Utilisateur en attente créé: ${pendingUser.email}\n`);
    } else {
      console.log(`⏳ Utilisateur(s) en attente: ${pendingUsers.map(u => u.email).join(', ')}\n`);
    }

    // 5. Statistiques finales
    console.log('📊 État du système:');
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true
      }
    });

    stats.forEach(stat => {
      const emoji = stat.role === 'SUPER_ADMIN' ? '👑' : 
                   stat.role === 'ADMIN' ? '✅' : 
                   stat.role === 'PENDING' ? '⏳' : '❌';
      console.log(`${emoji} ${stat.role}: ${stat._count._all} utilisateur(s)`);
    });

    console.log('\n🎯 Instructions de test:');
    console.log('');
    console.log('1. 🌐 Ouvrez http://localhost:3000');
    console.log('2. 🔐 Connectez-vous avec le super-admin');
    console.log('3. 📋 Allez sur /admin/users pour voir les demandes');
    console.log('4. ✅ Approuvez/rejetez les comptes en attente');
    console.log('5. 🧪 Testez la connexion avec un compte validé');
    console.log('');
    console.log('Comptes de test disponibles:');
    
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, isApproved: true }
    });
    
    allUsers.forEach(user => {
      const status = user.role === 'SUPER_ADMIN' ? '👑 SUPER_ADMIN' : 
                    user.role === 'ADMIN' ? '✅ ADMIN' : 
                    user.role === 'PENDING' ? '⏳ PENDING' : '❌ REJECTED';
      console.log(`   • ${user.email} (${status}) - Mot de passe: test123 ou pending123`);
    });

    console.log('\n✨ Système de validation des utilisateurs prêt pour les tests!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Solutions possibles:');
    console.error('- Vérifiez que le serveur de développement tourne (npm run dev)');
    console.error('- Vérifiez la connexion à la base de données');
    console.error('- Relancez: npx prisma db push');
  } finally {
    await prisma.$disconnect();
  }
}

main(); 