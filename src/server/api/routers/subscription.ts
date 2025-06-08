import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const subscriptionRouter = createTRPCRouter({
  // Obtenir l'abonnement actuel de l'utilisateur
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      const subscription = await ctx.db.subscription.findUnique({
        where: { userId: ctx.session.user.id },
      });

      // Si pas d'abonnement, créer un abonnement FREEMIUM par défaut
      if (!subscription) {
        const newSubscription = await ctx.db.subscription.create({
          data: {
            userId: ctx.session.user.id,
            plan: "FREEMIUM",
            status: "ACTIVE",
            maxRestaurants: 1,
            maxScansPerMonth: 50,
            features: {
              qrMenu: true,
              basicHomepage: true,
              reservation: true,
              tableOrdering: false,
              customerReviews: false,
              basicStats: false,
              advancedDashboard: false,
              customization: false,
              multiSite: false,
              api: false,
              prioritySupport: false,
              whiteLabel: false,
            },
          },
        });
        return newSubscription;
      }

      return subscription;
    }),

  // Obtenir les statistiques d'usage
  getUsageStats: protectedProcedure
    .query(async ({ ctx }) => {
      let stats = await ctx.db.usageStats.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!stats) {
        // Compter les restaurants existants
        const restaurantCount = await ctx.db.restaurant.count({
          where: { ownerId: ctx.session.user.id },
        });

        stats = await ctx.db.usageStats.create({
          data: {
            userId: ctx.session.user.id,
            restaurantCount,
            scansThisMonth: 0,
            scansTotal: 0,
          },
        });
      }

      return stats;
    }),

  // Vérifier les limitations du plan (SOFT LIMITS - Phase 1)
  checkLimits: protectedProcedure
    .input(z.object({
      action: z.enum(["create_restaurant", "qr_scan", "use_feature"]),
      feature: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.db.subscription.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const stats = await ctx.db.usageStats.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!subscription || !stats) {
        return { allowed: false, reason: "No subscription found" };
      }

      // PHASE 1: Tous les utilisateurs sont autorisés (soft limits uniquement)
      // On retourne juste des warning messages sans bloquer

      switch (input.action) {
        case "create_restaurant":
          if (stats.restaurantCount >= subscription.maxRestaurants) {
            return {
              allowed: true, // ✅ Toujours autorisé en Phase 1
              warning: true,
              reason: `Vous avez atteint la limite de ${subscription.maxRestaurants} restaurant(s) de votre plan ${subscription.plan}`,
              message: "Considérez un upgrade pour gérer plus de restaurants facilement.",
              upgradeRecommended: true,
            };
          }
          break;

        case "qr_scan":
          if (stats.scansThisMonth >= subscription.maxScansPerMonth) {
            return {
              allowed: true, // ✅ Toujours autorisé en Phase 1
              warning: true,
              reason: `Limite mensuelle de ${subscription.maxScansPerMonth} scans atteinte`,
              message: "Vos clients peuvent continuer à scanner, mais pensez à upgrader pour plus de capacité.",
              upgradeRecommended: true,
            };
          }
          break;

        case "use_feature":
          const features = subscription.features as any;
          if (input.feature && !features[input.feature]) {
            return {
              allowed: true, // ✅ Accès complet en Phase 1 (grandfathering)
              warning: true,
              reason: `Fonctionnalité ${input.feature} disponible avec nos nouveaux plans`,
              message: "Découvrez nos fonctionnalités avancées avec un plan supérieur.",
              upgradeRecommended: true,
            };
          }
          break;
      }

      return { allowed: true, warning: false };
    }),

  // Enregistrer un scan QR
  recordQRScan: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      tableId: z.string().optional(),
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Enregistrer le scan
      const scan = await ctx.db.qRScan.create({
        data: {
          restaurantId: input.restaurantId,
          tableId: input.tableId,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        },
      });

      // Mettre à jour les stats du propriétaire du restaurant
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
        select: { ownerId: true },
      });

      if (restaurant) {
        await ctx.db.usageStats.upsert({
          where: { userId: restaurant.ownerId },
          create: {
            userId: restaurant.ownerId,
            scansThisMonth: 1,
            scansTotal: 1,
            restaurantCount: 1,
            lastScanAt: new Date(),
          },
          update: {
            scansThisMonth: { increment: 1 },
            scansTotal: { increment: 1 },
            lastScanAt: new Date(),
          },
        });
      }

      return scan;
    }),

  // Reset mensuel des stats (à appeler via un cron job)
  resetMonthlyStats: protectedProcedure
    .mutation(async ({ ctx }) => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      await ctx.db.usageStats.updateMany({
        where: {
          resetAt: {
            lt: lastMonth,
          },
        },
        data: {
          scansThisMonth: 0,
          resetAt: now,
        },
      });

      return { success: true };
    }),

  // Obtenir les détails des plans
  getPlans: publicProcedure
    .query(() => {
      return {
        FREEMIUM: {
          name: "Freemium",
          price: 0,
          maxRestaurants: 1,
          maxScansPerMonth: 50,
          features: {
            qrMenu: true,
            basicHomepage: true,
            reservation: true,
            tableOrdering: false,
            customerReviews: false,
            basicStats: false,
          },
        },
        STARTER: {
          name: "Starter",
          price: 15,
          maxRestaurants: 1,
          maxScansPerMonth: 1000,
          features: {
            qrMenu: true,
            basicHomepage: true,
            reservation: true,
            tableOrdering: true,
            customerReviews: true,
            basicStats: true,
          },
        },
        GROWTH: {
          name: "Growth",
          price: 39,
          maxRestaurants: 3,
          maxScansPerMonth: 5000,
          features: {
            qrMenu: true,
            basicHomepage: true,
            reservation: true,
            tableOrdering: true,
            customerReviews: true,
            basicStats: true,
            advancedDashboard: true,
            customization: true,
          },
        },
        BUSINESS: {
          name: "Business",
          price: 79,
          maxRestaurants: 10,
          maxScansPerMonth: 20000,
          features: {
            qrMenu: true,
            basicHomepage: true,
            reservation: true,
            tableOrdering: true,
            customerReviews: true,
            basicStats: true,
            advancedDashboard: true,
            customization: true,
            multiSite: true,
            api: true,
            prioritySupport: true,
          },
        },
        ENTERPRISE: {
          name: "Enterprise",
          price: null, // Sur devis
          maxRestaurants: 999,
          maxScansPerMonth: 999999,
          features: {
            qrMenu: true,
            basicHomepage: true,
            reservation: true,
            tableOrdering: true,
            customerReviews: true,
            basicStats: true,
            advancedDashboard: true,
            customization: true,
            multiSite: true,
            api: true,
            prioritySupport: true,
            whiteLabel: true,
            dedicatedDeployment: true,
            onboarding: true,
          },
        },
      };
    }),
}); 