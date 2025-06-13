import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const demoRouter = createTRPCRouter({
  // Obtenir la liste des restaurants de démo disponibles
  getAvailableRestaurants: publicProcedure
    .query(async ({ ctx }) => {
      const demoRestaurants = await ctx.db.restaurant.findMany({
        where: {
          slug: {
            endsWith: "-demo"
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          phone: true,
          categories: {
            select: {
              name: true,
              emoji: true,
              _count: {
                select: { menuItems: true }
              }
            }
          },
          _count: {
            select: {
              tables: true,
              feedbacks: true,
              menuItems: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      });

      return demoRestaurants.map(restaurant => ({
        ...restaurant,
        demoUrl: `/${restaurant.slug}`,
        stats: {
          tables: restaurant._count.tables,
          feedbacks: restaurant._count.feedbacks,
          menuItems: restaurant._count.menuItems,
          categories: restaurant.categories.length
        },
        categories: restaurant.categories.map(cat => ({
          name: cat.name,
          emoji: cat.emoji,
          itemCount: cat._count.menuItems
        }))
      }));
    }),

  // Obtenir les statistiques globales de démo
  getDemoStats: publicProcedure
    .query(async ({ ctx }) => {
      const [restaurantCount, totalMenuItems, totalTables, totalFeedbacks] = await Promise.all([
        ctx.db.restaurant.count({
          where: { slug: { endsWith: "-demo" } }
        }),
        ctx.db.menuItem.count({
          where: { 
            restaurant: { 
              slug: { endsWith: "-demo" } 
            } 
          }
        }),
        ctx.db.table.count({
          where: { 
            restaurant: { 
              slug: { endsWith: "-demo" } 
            } 
          }
        }),
        ctx.db.feedback.count({
          where: { 
            restaurant: { 
              slug: { endsWith: "-demo" } 
            },
            isApproved: true
          }
        })
      ]);

      return {
        restaurants: restaurantCount,
        menuItems: totalMenuItems,
        tables: totalTables,
        approvedFeedbacks: totalFeedbacks,
      };
    }),

  // Simuler un scan de QR code pour la démo
  simulateQRScan: publicProcedure
    .input(z.object({
      restaurantSlug: z.string(),
      tableNumber: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { slug: input.restaurantSlug },
        select: { id: true, name: true }
      });

      if (!restaurant) {
        throw new Error("Restaurant de démo non trouvé");
      }

      // Enregistrer le scan de démo (optionnel, pour les stats)
      await ctx.db.qRScan.create({
        data: {
          restaurantId: restaurant.id,
          tableId: input.tableNumber || null,
          userAgent: "Demo Simulation",
          ipAddress: "127.0.0.1",
          country: "Demo",
          city: "Demo City",
        }
      });

      return {
        success: true,
        restaurant: restaurant.name,
        redirectUrl: `/${input.restaurantSlug}`,
        message: `Scan simulé avec succès pour ${restaurant.name}`
      };
    }),

  // Créer un feedback de démo
  createDemoFeedback: publicProcedure
    .input(z.object({
      restaurantSlug: z.string(),
      customerName: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      tableNumber: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { slug: input.restaurantSlug },
        include: {
          tables: {
            where: { number: input.tableNumber }
          }
        }
      });

      if (!restaurant) {
        throw new Error("Restaurant de démo non trouvé");
      }

      const tableId = restaurant.tables[0]?.id;

      const feedback = await ctx.db.feedback.create({
        data: {
          customerName: input.customerName,
          rating: input.rating,
          comment: input.comment,
          isApproved: true, // Auto-approuver les feedbacks de démo
          restaurantId: restaurant.id,
          tableId: tableId,
        }
      });

      return {
        success: true,
        feedback: {
          id: feedback.id,
          customerName: feedback.customerName,
          rating: feedback.rating,
          comment: feedback.comment,
          createdAt: feedback.createdAt
        }
      };
    }),

  // Obtenir les informations de connexion pour les comptes de démo
  getDemoAccounts: publicProcedure
    .query(async ({ ctx }) => {
      const demoUsers = await ctx.db.user.findMany({
        where: {
          email: {
            in: ["demo@menuqr.fr", "test@menuqr.fr"]
          }
        },
        select: {
          email: true,
          name: true,
          restaurant: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      });

      return demoUsers.map(user => ({
        email: user.email,
        name: user.name,
        password: user.email === "demo@menuqr.fr" ? "demo123" : "test123",
        restaurant: user.restaurant ? {
          name: user.restaurant.name,
          slug: user.restaurant.slug,
          url: `/${user.restaurant.slug}`
        } : null
      }));
    }),

  // Réinitialiser les données de démo (pour usage interne)
  resetDemoData: publicProcedure
    .input(z.object({
      confirmationCode: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Code de confirmation simple pour éviter les suppressions accidentelles
      if (input.confirmationCode !== "RESET_DEMO_2024") {
        throw new Error("Code de confirmation incorrect");
      }

      // Supprimer les données de démo existantes
      await ctx.db.feedback.deleteMany({
        where: {
          restaurant: {
            slug: { endsWith: "-demo" }
          }
        }
      });

      await ctx.db.menuItem.deleteMany({
        where: {
          restaurant: {
            slug: { endsWith: "-demo" }
          }
        }
      });

      await ctx.db.category.deleteMany({
        where: {
          restaurant: {
            slug: { endsWith: "-demo" }
          }
        }
      });

      await ctx.db.table.deleteMany({
        where: {
          restaurant: {
            slug: { endsWith: "-demo" }
          }
        }
      });

      await ctx.db.restaurant.deleteMany({
        where: {
          slug: { endsWith: "-demo" }
        }
      });

      await ctx.db.user.deleteMany({
        where: {
          email: {
            in: ["demo@menuqr.fr", "test@menuqr.fr"]
          }
        }
      });

      return {
        success: true,
        message: "Données de démo réinitialisées avec succès"
      };
    })
});