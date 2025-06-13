#!/usr/bin/env node

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Charger les variables d'environnement
config({ path: '.env' });

// Debug: Vérifier que DATABASE_URL est chargée
console.log('DATABASE_URL présente:', !!process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.xfbotxiucyhwcbkrzhnz:2tDcak1k2dOjl4eK@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
    }
  }
});

const demoRestaurants = [
  {
    name: "Le Bistrot Parisien",
    slug: "bistrot-parisien-demo",
    description: "Restaurant français authentique avec une cuisine traditionnelle et moderne",
    address: "15 Rue de la Paix, Paris",
    phone: "+33 1 42 96 87 65",
    email: "contact@bistrot-parisien.fr",
    openingHours: {
      monday: { isOpen: false },
      tuesday: { isOpen: true, openTime: "18:00", closeTime: "23:00" },
      wednesday: { isOpen: true, openTime: "18:00", closeTime: "23:00" },
      thursday: { isOpen: true, openTime: "18:00", closeTime: "23:00" },
      friday: { isOpen: true, openTime: "18:00", closeTime: "00:00" },
      saturday: { isOpen: true, openTime: "12:00", closeTime: "00:00" },
      sunday: { isOpen: true, openTime: "12:00", closeTime: "22:00" }
    },
    categories: [
      {
        name: "Entrées",
        emoji: "🥗",
        description: "Entrées fraîches et savourеuses",
        order: 1,
        items: [
          { name: "Salade César", description: "Salade romaine, parmesan, croûtons, sauce César", price: 12.50, available: true },
          { name: "Carpaccio de bœuf", description: "Fines lamelles de bœuf, roquette, copeaux de parmesan", price: 16.00, available: true },
          { name: "Tartare de saumon", description: "Saumon frais, avocat, citron vert, pain grillé", price: 14.50, available: true }
        ]
      },
      {
        name: "Plats",
        emoji: "🍽️",
        description: "Nos spécialités de la maison",
        order: 2,
        items: [
          { name: "Coq au vin", description: "Poulet mijoté au vin rouge, champignons, lardons", price: 24.00, available: true },
          { name: "Bouillabaisse", description: "Soupe de poissons méditerranéenne, rouille, croûtons", price: 32.00, available: true },
          { name: "Magret de canard", description: "Magret rôti, sauce aux cerises, légumes de saison", price: 28.00, available: true }
        ]
      },
      {
        name: "Desserts",
        emoji: "🍰",
        description: "Desserts maison",
        order: 3,
        items: [
          { name: "Crème brûlée", description: "Crème vanille caramélisée", price: 8.50, available: true },
          { name: "Tarte Tatin", description: "Tarte aux pommes caramélisées, glace vanille", price: 9.00, available: true },
          { name: "Fondant au chocolat", description: "Chocolat noir, cœur coulant, glace vanille", price: 9.50, available: true }
        ]
      }
    ],
    tables: [
      { number: "1", qrCodeData: "bistrot-parisien-demo/table/1" },
      { number: "2", qrCodeData: "bistrot-parisien-demo/table/2" },
      { number: "3", qrCodeData: "bistrot-parisien-demo/table/3" },
      { number: "4", qrCodeData: "bistrot-parisien-demo/table/4" },
      { number: "5", qrCodeData: "bistrot-parisien-demo/table/5" }
    ],
    feedbacks: [
      { customerName: "Marie Dubois", rating: 5, comment: "Excellent repas, service impeccable !", isApproved: true },
      { customerName: "Jean Martin", rating: 4, comment: "Très bon restaurant, ambiance chaleureuse", isApproved: true },
      { customerName: "Sophie Laurent", rating: 5, comment: "La bouillabaisse était délicieuse !", isApproved: true }
    ]
  },
  {
    name: "Pizza Roma",
    slug: "pizza-roma-demo",
    description: "Pizzeria italienne authentique, pâtes fraîches et pizzas au feu de bois",
    address: "23 Avenue de la République, Lyon",
    phone: "+33 4 78 92 34 56",
    email: "info@pizza-roma.fr",
    openingHours: {
      monday: { isOpen: true, openTime: "18:00", closeTime: "22:30" },
      tuesday: { isOpen: true, openTime: "18:00", closeTime: "22:30" },
      wednesday: { isOpen: true, openTime: "18:00", closeTime: "22:30" },
      thursday: { isOpen: true, openTime: "18:00", closeTime: "22:30" },
      friday: { isOpen: true, openTime: "18:00", closeTime: "23:00" },
      saturday: { isOpen: true, openTime: "12:00", closeTime: "23:00" },
      sunday: { isOpen: false }
    },
    categories: [
      {
        name: "Pizzas",
        emoji: "🍕",
        description: "Pizzas cuites au feu de bois",
        order: 1,
        items: [
          { name: "Margherita", description: "Tomate, mozzarella, basilic", price: 11.50, available: true },
          { name: "Quattro Stagioni", description: "Tomate, mozzarella, jambon, champignons, artichauts, olives", price: 15.50, available: true },
          { name: "Prosciutto", description: "Tomate, mozzarella, jambon de Parme, roquette", price: 16.00, available: true }
        ]
      },
      {
        name: "Pâtes",
        emoji: "🍝",
        description: "Pâtes fraîches maison",
        order: 2,
        items: [
          { name: "Spaghetti Carbonara", description: "Œufs, parmesan, pancetta, poivre noir", price: 13.50, available: true },
          { name: "Lasagnes", description: "Bœuf, béchamel, parmesan, tomates", price: 14.00, available: true },
          { name: "Ravioli aux épinards", description: "Ricotta, épinards, sauce tomate basilic", price: 12.50, available: true }
        ]
      }
    ],
    tables: [
      { number: "A1", qrCodeData: "pizza-roma-demo/table/A1" },
      { number: "A2", qrCodeData: "pizza-roma-demo/table/A2" },
      { number: "B1", qrCodeData: "pizza-roma-demo/table/B1" },
      { number: "B2", qrCodeData: "pizza-roma-demo/table/B2" }
    ],
    feedbacks: [
      { customerName: "Marco Rossi", rating: 5, comment: "Comme en Italie ! Parfait !", isApproved: true },
      { customerName: "Claire Moreau", rating: 4, comment: "Très bonnes pizzas, pâte excellente", isApproved: true }
    ]
  }
];

const demoUsers = [
  {
    name: "Demo Owner",
    email: "demo@menuqr.fr",
    password: "demo123",
  },
  {
    name: "Test Restaurant",
    email: "test@menuqr.fr", 
    password: "test123",
  }
];

async function createDemoData() {
  console.log('🎭 Création des données de démo...');

  try {
    // Créer les utilisateurs de démo
    for (let i = 0; i < demoUsers.length; i++) {
      const userData = demoUsers[i];
      if (!userData) continue;
      
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
      });

      console.log(`✅ Utilisateur créé: ${user.email}`);

      // Associer le restaurant si disponible
      const restaurantData = demoRestaurants[i];
      if (restaurantData) {
        
        const restaurant = await prisma.restaurant.upsert({
          where: { slug: restaurantData.slug },
          update: {},
          create: {
            name: restaurantData.name,
            slug: restaurantData.slug,
            description: restaurantData.description,
            address: restaurantData.address,
            phone: restaurantData.phone,
            email: restaurantData.email,
            openingHours: restaurantData.openingHours,
            ownerId: user.id,
          },
        });

        console.log(`✅ Restaurant créé: ${restaurant.name}`);

        // Créer les catégories et menus
        for (const categoryData of restaurantData.categories) {
          const category = await prisma.category.create({
            data: {
              name: categoryData.name,
              emoji: categoryData.emoji,
              description: categoryData.description,
              order: categoryData.order,
              restaurantId: restaurant.id,
            },
          });

          // Créer les items du menu
          for (const itemData of categoryData.items) {
            await prisma.menuItem.create({
              data: {
                name: itemData.name,
                description: itemData.description,
                price: itemData.price,
                available: itemData.available,
                restaurantId: restaurant.id,
                categoryId: category.id,
              },
            });
          }
        }

        // Créer les tables
        for (const tableData of restaurantData.tables) {
          await prisma.table.create({
            data: {
              number: tableData.number,
              qrCodeData: tableData.qrCodeData,
              qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://votre-domaine.vercel.app/${tableData.qrCodeData}`)}`,
              restaurantId: restaurant.id,
            },
          });
        }

        // Créer les avis
        for (const feedbackData of restaurantData.feedbacks) {
          await prisma.feedback.create({
            data: {
              customerName: feedbackData.customerName,
              rating: feedbackData.rating,
              comment: feedbackData.comment,
              isApproved: feedbackData.isApproved,
              restaurantId: restaurant.id,
            },
          });
        }

        // Créer les paramètres du restaurant
        await prisma.restaurantSettings.upsert({
          where: { restaurantId: restaurant.id },
          update: {},
          create: {
            primaryColor: "#FF6600",
            showRating: true,
            showReviews: true,
            currency: "EUR",
            restaurantId: restaurant.id,
          },
        });

        console.log(`✅ Configuration complète pour: ${restaurant.name}`);
      }
    }

    console.log('\n🎉 Données de démo créées avec succès !');
    console.log('\n📋 Comptes de démo disponibles :');
    demoUsers.forEach(user => {
      console.log(`  📧 ${user.email} | 🔑 ${user.password}`);
    });
    
    console.log('\n🔗 URLs de démo :');
    demoRestaurants.forEach(restaurant => {
      console.log(`  🍴 https://votre-domaine.vercel.app/${restaurant.slug}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de démo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData();