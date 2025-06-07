✅ 1. Pré-requis
Assure-toi d’avoir :

Un compte Vercel

Un compte GitHub (ou GitLab/Bitbucket)

Ton projet poussé sur un repo GitHub

Prisma configuré avec une base PostgreSQL (pas SQLite) – SQLite ne fonctionne pas bien sur Vercel en production

✅ 2. Remplacer SQLite par PostgreSQL
Vercel ne supporte pas SQLite. Voici comment passer à PostgreSQL :

a. Crée une base PostgreSQL gratuite :
Supabase

Neon

Railway

PlanetScale (MySQL mais aussi compatible avec Prisma)

b. Mets à jour ton fichier .env :
env
Copier
Modifier
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="super-secret-value"
NEXTAUTH_URL="https://ton-app.vercel.app"
c. Mets à jour Prisma :
```bash
# Synchronise le schéma avec la nouvelle base
npx prisma db push

# Génère le client Prisma
npx prisma generate

# (Optionnel) Ajoute des données de test
npx prisma db seed
```

d. Teste la connexion :
```bash
# Ouvre Prisma Studio pour vérifier
npx prisma studio
```
✅ 3. Pousse ton code sur GitHub
bash
Copier
Modifier
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ton-utilisateur/ton-repo.git
git push -u origin main
✅ 4. Déploiement sur Vercel
Va sur vercel.com

Clique sur "Add New Project"

Connecte ton compte GitHub si ce n’est pas déjà fait

Choisis ton dépôt restaurant-app

Vercel détecte Next.js automatiquement

Configure les variables d’environnement :

DATABASE_URL

AUTH_SECRET

NEXTAUTH_URL (par ex : https://restaurant-app.vercel.app)

NEXTAUTH_DATABASE_URL (même valeur que DATABASE_URL)

UPLOADTHING_SECRET (si upload d'images activé)

UPLOADTHING_APP_ID (si upload d'images activé)

Clique sur Deploy

✅ 5. (Optionnel) Migrations Prisma sur Vercel
Par défaut, Vercel ne supporte pas prisma migrate dev automatiquement.

Utilise plutôt prisma db push (déjà dans ton postinstall) pour synchroniser le schéma.

✅ 6. Fonctionnement après déploiement
Tu obtiens une URL du type :

bash
Copier
Modifier
https://restaurant-app.vercel.app
Tu peux aussi connecter ton propre domaine.

✅ 7. Vérification Post-Déploiement
Après le déploiement, teste ces points essentiels :

🔍 **Tests de base :**
- [ ] Page d'accueil accessible (https://ton-app.vercel.app)
- [ ] Inscription/Connexion admin fonctionnelle
- [ ] Accès au dashboard admin (/admin)
- [ ] Base de données connectée (Prisma Studio fonctionne)

🔍 **Tests fonctionnels :**
- [ ] Création restaurant 
- [ ] Ajout tables et génération QR codes
- [ ] Gestion menu (catégories + plats)
- [ ] Page publique restaurant (/resto-test)
- [ ] Formulaire réservation

🚨 **En cas d'erreur :**
- Vérifier les logs Vercel (onglet "Functions")
- Contrôler les variables d'environnement
- Tester la connexion base de données
- Vérifier les domaines autorisés NextAuth

✅ 8. Maintenance
📊 **Suivi :**
- Logs d'erreur : Dashboard Vercel → Functions
- Base de données : Interface Supabase/Neon
- Analytics : Vercel Analytics (optionnel)

🔧 **Mises à jour :**
- Push sur GitHub → déploiement automatique
- Modifications schema : `npx prisma db push` + redéploiement
- Variables d'env : Dashboard Vercel → Settings → Environment Variables

