import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const feedbacksRouter = createTRPCRouter({
  // Get all feedbacks for a restaurant
  getAll: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feedback.findMany({
        where: { restaurantId: input.restaurantId },
        include: { table: true },
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.feedback.create({
        data: {
          rating: input.rating,
          comment: input.comment,
          customerName: input.customerName,
          restaurantId: input.restaurantId,
          tableId: input.tableId,
        },
      });
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
        include: { table: true },
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
}); 