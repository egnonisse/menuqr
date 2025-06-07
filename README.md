# MenuQR 🍽️📱

**MenuQR** - Digitalisez votre restaurant avec des menus QR, réservations en ligne et gestion complète via back-office.

## 🎯 Description

Une **Web App moderne pour restaurants** permettant :

- 📱 **Clients** : Menu digital via QR code + réservations en ligne + avis clients
- 👨‍💼 **Gérants** : Back-office complet pour gérer menus, tables, réservations et retours clients
- 🌐 **Vitrine** : Mini-site personnalisable pour chaque restaurant

## 🛠️ Technologies

- **Framework** : Next.js (T3 Stack)
- **Backend** : tRPC + Next.js API Routes
- **Database** : Prisma + PostgreSQL
- **Auth** : NextAuth.js
- **UI** : Tailwind CSS
- **Validation** : Zod

## 🚀 Installation

```bash
# Cloner le repo
git clone https://github.com/egnonisse/menuqr.git

# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos variables

# Initialiser Prisma
npx prisma generate
npx prisma db push

# Lancer en développement
npm run dev
```

## 📝 Fonctionnalités

- ✅ **Menu digital** accessible via QR code
- ✅ **Réservations en ligne** avec gestion admin
- ✅ **Avis clients** collectés automatiquement  
- ✅ **Back-office complet** : menus, tables, stats
- ✅ **Mini-site vitrine** personnalisable
- ✅ **Génération QR codes** pour chaque table

## 🎨 Pages principales

**Public :**
- `/` - Mini-site du restaurant
- `/reservation` - Formulaire de réservation  
- `/menu/[tableId]` - Menu via QR code
- `/feedback/[tableId]` - Avis client

**Admin :**
- `/admin` - Dashboard
- `/admin/tables` - Gestion tables + QR codes
- `/admin/menu` - Gestion menus & catégories
- `/admin/reservations` - Suivi réservations
- `/admin/feedbacks` - Avis reçus

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.
