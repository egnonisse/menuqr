import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const feedbacksRouter = createTRPCRouter({
  // Get all feedbacks for a restaurant
  getAll: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feedback.findMany({
        where: { restaurantId: input.restaurantId },
        include: { 
          table: true,
          // menuItems: {
          //   include: {
          //     menuItem: true
          //   }
          // }
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create a new feedback
  create: publicProcedure
    .input(
      z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        customerName: z.string().optional(),
        restaurantId: z.string(),
        tableId: z.string().optional(),
        menuItems: z.array(z.object({
          menuItemId: z.string(),
          rating: z.number().min(1).max(5).optional(),
          comment: z.string().optional(),
        })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier si la table existe avant de l'assigner
      let validTableId = null;
      if (input.tableId) {
        const tableExists = await ctx.db.table.findFirst({
          where: { 
            id: input.tableId,
            restaurantId: input.restaurantId 
          }
        });
        if (tableExists) {
          validTableId = input.tableId;
        }
      }

      const feedback = await ctx.db.feedback.create({
        data: {
          rating: input.rating,
          comment: input.comment,
          customerName: input.customerName,
          restaurantId: input.restaurantId,
          tableId: validTableId,
        },
      });

      // Créer les liens vers les plats mentionnés (avec gestion d'erreur temporaire)
      if (input.menuItems && input.menuItems.length > 0) {
        try {
          // await ctx.db.feedbackMenuItem.createMany({
          //   data: input.menuItems.map((item) => ({
          //     feedbackId: feedback.id,
          //     menuItemId: item.menuItemId,
          //     rating: item.rating,
          //     comment: item.comment,
          //   })),
          // });
          console.warn('FeedbackMenuItem table not found - skipping menu items linking');
        } catch (error) {
          // Table FeedbackMenuItem n'existe pas encore - ignore l'erreur temporairement
          console.warn('FeedbackMenuItem table not found - skipping menu items linking:', error);
        }
      }

      return feedback;
    }),

  // Delete a feedback
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.feedback.delete({
        where: { id: input.id },
      });
    }),

  // Get feedback statistics
  getStats: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feedbacks = await ctx.db.feedback.findMany({
        where: { restaurantId: input.restaurantId },
        select: { rating: true },
      });

      const totalFeedbacks = feedbacks.length;
      const averageRating = totalFeedbacks > 0 
        ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / totalFeedbacks
        : 0;
      
      const positiveFeedbacks = feedbacks.filter(f => f.rating >= 4).length;
      const negativeFeedbacks = feedbacks.filter(f => f.rating <= 3).length;

      return {
        total: totalFeedbacks,
        averageRating: Math.round(averageRating * 10) / 10,
        positive: positiveFeedbacks,
        negative: negativeFeedbacks,
      };
    }),

  // Get recent feedbacks
  getRecent: publicProcedure
    .input(
      z.object({
        restaurantId: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.feedback.findMany({
        where: { 
          restaurantId: input.restaurantId,
          isApproved: true // Seulement les avis approuvés pour le public
        },
        include: { 
          table: true,
          // menuItems: {
          //   include: {
          //     menuItem: true
          //   }
          // }
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get recent feedbacks for admin (all feedbacks, approved and pending)
  getRecentForAdmin: publicProcedure
    .input(
      z.object({
        restaurantId: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.feedback.findMany({
        where: { 
          restaurantId: input.restaurantId,
          // Pas de filtre isApproved pour l'admin - afficher tous les avis
        },
        include: { 
          table: true,
          // menuItems: {
          //   include: {
          //     menuItem: true
          //   }
          // }
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get feedback statistics for approved feedbacks only
  getApprovedStats: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feedbacks = await ctx.db.feedback.findMany({
        where: { 
          restaurantId: input.restaurantId,
          isApproved: true
        },
        select: { rating: true },
      });

      const totalFeedbacks = feedbacks.length;
      const averageRating = totalFeedbacks > 0 
        ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / totalFeedbacks
        : 0;
      
      const positiveFeedbacks = feedbacks.filter(f => f.rating >= 4).length;
      const negativeFeedbacks = feedbacks.filter(f => f.rating <= 3).length;

      return {
        total: totalFeedbacks,
        averageRating: Math.round(averageRating * 10) / 10,
        positive: positiveFeedbacks,
        negative: negativeFeedbacks,
      };
    }),

  // Approve a feedback (admin only)
  approve: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.feedback.update({
        where: { id: input.id },
        data: { isApproved: true },
      });
    }),

  // Reject/unapprove a feedback (admin only)
  reject: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.feedback.update({
        where: { id: input.id },
        data: { isApproved: false },
      });
    }),

  // Get menu item statistics (analytics par plat) - VERSION SIMPLIFIÉE
  getMenuItemStats: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Version simplifiée utilisant les commentaires des feedbacks
      const feedbacks = await ctx.db.feedback.findMany({
        where: {
          restaurantId: input.restaurantId,
          isApproved: true,
          comment: {
            not: null
          }
        },
        include: {
          table: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Récupérer tous les plats du restaurant
      const menuItems = await ctx.db.menuItem.findMany({
        where: {
          restaurantId: input.restaurantId
        },
        include: {
          category: true
        }
      });

      // Analyser les mentions de plats dans les commentaires
      const itemStats = menuItems.map(item => {
        const mentions = feedbacks.filter(feedback => 
          feedback.comment?.toLowerCase().includes(item.name.toLowerCase()) ||
          feedback.comment?.toLowerCase().includes(`@${item.name.toLowerCase()}`)
        );

        const totalMentions = mentions.length;
        const averageRating = totalMentions > 0 
          ? mentions.reduce((sum, feedback) => sum + feedback.rating, 0) / totalMentions
          : 0;

        const comments = mentions
          .map(feedback => feedback.comment)
          .filter(Boolean)
          .slice(0, 3); // Limiter à 3 commentaires

        return {
          menuItem: item,
          totalMentions,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: totalMentions,
          comments
        };
      }).filter(stat => stat.totalMentions > 0) // Seulement les plats mentionnés
        .sort((a, b) => b.totalMentions - a.totalMentions); // Trier par popularité

      return itemStats;
    }),

  // Get specific menu item feedbacks - TEMPORAIREMENT DÉSACTIVÉ
  getMenuItemFeedbacks: publicProcedure
    .input(z.object({ 
      menuItemId: z.string(),
      restaurantId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Retourner un tableau vide temporairement
      return [];
      
      /* CODE ORIGINAL - SERA REACTIVÉ APRÈS LA MIGRATION
      return ctx.db.feedbackMenuItem.findMany({
        where: {
          menuItemId: input.menuItemId,
          feedback: {
            restaurantId: input.restaurantId,
            isApproved: true
          }
        },
        include: {
          feedback: {
            include: {
              table: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });
      */
    }),
}); 