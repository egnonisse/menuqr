import { z } from "zod";
import QRCode from "qrcode";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const tablesRouter = createTRPCRouter({
  // Get all tables for a restaurant
  getAll: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.table.findMany({
        where: { restaurantId: input.restaurantId },
        orderBy: { number: "asc" },
      });
    }),

  // Create a new table
  create: protectedProcedure
    .input(z.object({
      number: z.string().min(1).max(20),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get restaurant to build QR code URL
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Generate QR code URL
      const menuUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/menu/${restaurant.slug}/${input.number}`;
      
      // Generate QR code as data URL
      const qrCodeData = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return ctx.db.table.create({
        data: {
          number: input.number,
          restaurantId: input.restaurantId,
          qrCodeUrl: menuUrl,
          qrCodeData: qrCodeData,
        },
      });
    }),

  // Update table status
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      number: z.string().min(1).max(20),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get restaurant to rebuild QR code URL
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Generate new QR code URL
      const menuUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/menu/${restaurant.slug}/${input.number}`;
      
      // Generate QR code as data URL
      const qrCodeData = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return ctx.db.table.update({
        where: { id: input.id },
        data: {
          number: input.number,
          qrCodeUrl: menuUrl,
          qrCodeData: qrCodeData,
        },
      });
    }),

  // Delete a table
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.table.delete({
        where: { id: input.id },
      });
    }),

  // Get table statistics
  getStats: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const totalTables = await ctx.db.table.count({
        where: { restaurantId: input.restaurantId },
      });

      const tablesWithQR = await ctx.db.table.count({
        where: { 
          restaurantId: input.restaurantId,
          qrCodeData: { not: null },
        },
      });

      return {
        total: totalTables,
        withQR: tablesWithQR,
        withoutQR: totalTables - tablesWithQR,
      };
    }),

  regenerateQR: protectedProcedure
    .input(z.object({
      id: z.string(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get table and restaurant info
      const table = await ctx.db.table.findUnique({
        where: { id: input.id },
        include: { restaurant: true },
      });

      if (!table || table.restaurantId !== input.restaurantId) {
        throw new Error("Table not found");
      }

      // Generate new QR code URL
      const menuUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/menu/${table.restaurant.slug}/${table.number}`;
      
      // Generate QR code as data URL
      const qrCodeData = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return ctx.db.table.update({
        where: { id: input.id },
        data: {
          qrCodeUrl: menuUrl,
          qrCodeData: qrCodeData,
        },
      });
    }),
}); 