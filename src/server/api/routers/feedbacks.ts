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
          menuItems: {
            include: {
              menuItem: true
            }
          }
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

      // Créer les liens vers les plats mentionnés
      if (input.menuItems && input.menuItems.length > 0) {
        await ctx.db.feedbackMenuItem.createMany({
          data: input.menuItems.map((item) => ({
            feedbackId: feedback.id,
            menuItemId: item.menuItemId,
            rating: item.rating,
            comment: item.comment,
          })),
        });
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
          menuItems: {
            include: {
              menuItem: true
            }
          }
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

  // Get menu item statistics (analytics par plat)
  getMenuItemStats: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feedbackMenuItems = await ctx.db.feedbackMenuItem.findMany({
        where: {
          feedback: {
            restaurantId: input.restaurantId,
            isApproved: true
          }
        },
        include: {
          menuItem: true,
          feedback: true
        }
      });

      // Grouper par plat et calculer les stats
      const itemStats = feedbackMenuItems.reduce((acc: any, item) => {
        const menuItemId = item.menuItemId;
        if (!acc[menuItemId]) {
          acc[menuItemId] = {
            menuItem: item.menuItem,
            totalMentions: 0,
            ratings: [],
            comments: []
          };
        }
        
        acc[menuItemId].totalMentions++;
        if (item.rating) {
          acc[menuItemId].ratings.push(item.rating);
        }
        if (item.comment) {
          acc[menuItemId].comments.push(item.comment);
        }
        
        return acc;
      }, {});

      // Calculer les moyennes et retourner le résultat formaté
      return Object.values(itemStats).map((stat: any) => ({
        menuItem: stat.menuItem,
        totalMentions: stat.totalMentions,
        averageRating: stat.ratings.length > 0 
          ? Math.round((stat.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / stat.ratings.length) * 10) / 10
          : null,
        totalRatings: stat.ratings.length,
        comments: stat.comments
      })).sort((a: any, b: any) => b.totalMentions - a.totalMentions);
    }),

  // Get specific menu item feedbacks
  getMenuItemFeedbacks: publicProcedure
    .input(z.object({ 
      menuItemId: z.string(),
      restaurantId: z.string()
    }))
    .query(async ({ ctx, input }) => {
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
    }),
}); 