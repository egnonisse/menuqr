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
              menuItem: {
                include: {
                  category: true
                }
              }
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
        try {
          await ctx.db.feedbackMenuItem.createMany({
            data: input.menuItems.map((item) => ({
              feedbackId: feedback.id,
              menuItemId: item.menuItemId,
              rating: item.rating,
              comment: item.comment,
            })),
          });
        } catch (error) {
          console.error('Error creating FeedbackMenuItem links:', error);
          // Ne pas faire échouer la création du feedback si les liens échouent
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
          menuItems: {
            include: {
              menuItem: {
                include: {
                  category: true
                }
              }
            }
          }
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
          menuItems: {
            include: {
              menuItem: {
                include: {
                  category: true
                }
              }
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

  // Get menu item statistics (analytics par plat) - VERSION COMPLÈTE AVEC FeedbackMenuItem
  getMenuItemStats: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Récupérer tous les plats du restaurant
      const menuItems = await ctx.db.menuItem.findMany({
        where: {
          restaurantId: input.restaurantId
        },
        include: {
          category: true,
          feedbackItems: {
            include: {
              feedback: true
            }
          }
        }
      });

      // Calculer les statistiques pour chaque plat
      const itemStats = menuItems.map(item => {
        const feedbackItems = item.feedbackItems; // Inclure tous les feedbacks (approuvés et non approuvés)
        const totalMentions = feedbackItems.length;
        
        if (totalMentions === 0) {
          return null; // Sera filtré plus tard
        }

        // Calculer la note moyenne spécifique aux plats (si disponible) sinon utiliser la note globale
        const ratingsFromItems = feedbackItems
          .map(fi => fi.rating)
          .filter(rating => rating !== null) as number[];
        
        const ratingsFromFeedbacks = feedbackItems
          .map(fi => fi.feedback.rating);

        const allRatings = ratingsFromItems.length > 0 ? ratingsFromItems : ratingsFromFeedbacks;
        const averageRating = allRatings.length > 0 
          ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
          : 0;

        // Récupérer les commentaires spécifiques aux plats ou les commentaires généraux
        const specificComments = feedbackItems
          .map(fi => fi.comment)
          .filter(Boolean);
        
        const generalComments = feedbackItems
          .map(fi => fi.feedback.comment)
          .filter(Boolean);

        const comments = specificComments.length > 0 ? specificComments : generalComments;

        return {
          menuItem: item,
          totalMentions,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: allRatings.length,
          comments: comments.slice(0, 3) // Limiter à 3 commentaires
        };
      }).filter(stat => stat !== null) // Supprimer les plats sans mentions
        .sort((a, b) => b.totalMentions - a.totalMentions); // Trier par popularité

      return itemStats;
    }),

  // Get specific menu item feedbacks - RÉACTIVÉ
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



  // Nouvelle fonction : Get detailed feedback with menu items
  getDetailedFeedback: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feedback.findUnique({
        where: { id: input.id },
        include: {
          table: true,
          menuItems: {
            include: {
              menuItem: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });
    }),
}); 