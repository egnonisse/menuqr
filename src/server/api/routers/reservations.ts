import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const reservationsRouter = createTRPCRouter({
  // Get all reservations for a restaurant
  getAll: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.reservation.findMany({
        where: { restaurantId: input.restaurantId },
        orderBy: { dateTime: "asc" },
      });
    }),

  // Create a new reservation
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        phone: z.string(),
        dateTime: z.date(),
        peopleCount: z.number(),
        notes: z.string().optional(),
        restaurantId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reservation.create({
        data: {
          customerName: input.name,
          customerPhone: input.phone,
          dateTime: input.dateTime,
          peopleCount: input.peopleCount,
          notes: input.notes,
          restaurantId: input.restaurantId,
        },
      });
    }),

  // Update reservation status or details
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        dateTime: z.date().optional(),
        peopleCount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, phone, ...updateData } = input;
      return ctx.db.reservation.update({
        where: { id },
        data: {
          ...updateData,
          ...(name && { customerName: name }),
          ...(phone && { customerPhone: phone }),
        },
      });
    }),

  // Delete a reservation
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reservation.delete({
        where: { id: input.id },
      });
    }),

  // Get reservation statistics
  getStats: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayReservations = await ctx.db.reservation.count({
        where: {
          restaurantId: input.restaurantId,
          dateTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      const totalReservations = await ctx.db.reservation.count({
        where: { restaurantId: input.restaurantId },
      });

      return {
        today: todayReservations,
        total: totalReservations,
        confirmed: 0, // We'll add status field later
        pending: 0,   // We'll add status field later
      };
    }),

  // Get reservations for a specific date
  getByDate: publicProcedure
    .input(
      z.object({
        restaurantId: z.string(),
        date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startOfDay = new Date(input.date.getFullYear(), input.date.getMonth(), input.date.getDate());
      const endOfDay = new Date(input.date.getFullYear(), input.date.getMonth(), input.date.getDate() + 1);

      return ctx.db.reservation.findMany({
        where: {
          restaurantId: input.restaurantId,
          dateTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        orderBy: { dateTime: "asc" },
      });
    }),
}); 