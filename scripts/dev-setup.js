#!/usr/bin/env node

/**
 * Script de configuration pour le développement local
 * Configure l'environnement et les variables nécessaires pour tester le système de validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configuration de l\'environnement de développement...\n');

// Configuration des variables d'environnement pour les tests
const envContent = `# Configuration pour tests locaux - Système de validation des utilisateurs
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-key-for-testing-user-validation-system"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
`;

const envPath = path.join(path.dirname(__dirname), '.env');

// Vérifier si .env existe déjà
if (!fs.existsSync(envPath)) {
  console.log('📝 Création du fichier .env pour les tests...');
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Fichier .env créé!\n');
} else {
  console.log('✅ Fichier .env existant détecté.\n');
}

console.log('🎯 Prochaines étapes pour tester le système de validation:');
console.log('');
console.log('1. 📦 Installer les dépendances:');
console.log('   npm install');
console.log('');
console.log('2. 🗄️  Initialiser la base de données:');
console.log('   npx prisma generate');
console.log('   npx prisma migrate deploy');
console.log('');
console.log('3. 👥 Configurer le système de validation:');
console.log('   node scripts/setup-user-validation.js');
console.log('');
console.log('4. 🚀 Démarrer le serveur:');
console.log('   npm run dev');
console.log('');
console.log('5. 🧪 Workflow de test:');
console.log('   a) Aller sur http://localhost:3000');
console.log('   b) Créer un nouveau compte via /auth/signup');
console.log('   c) Le nouveau compte sera en statut PENDING');
console.log('   d) Se connecter avec le super-admin');
console.log('   e) Aller sur /admin/users pour valider/rejeter');
console.log('   f) Tester la connexion avec le compte validé');
console.log('');
console.log('💡 Conseil: Gardez deux onglets ouverts:');
console.log('   - Un avec le super-admin (/admin/users)');
console.log('   - Un en navigation privée pour tester les nouveaux comptes');
console.log(''); 