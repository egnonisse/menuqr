import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const settingsRouter = createTRPCRouter({
  // Get restaurant settings
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const restaurant = await ctx.db.restaurant.findUnique({
      where: { ownerId: ctx.session.user.id },
      include: { settings: true },
    });

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

          // Create default settings if they don't exist
      if (!restaurant.settings) {
        const defaultSettings = await ctx.db.restaurantSettings.create({
          data: {
            restaurantId: restaurant.id,
            primaryColor: "#FF6600",
            commandeATable: false,
            showRating: true,
            showReviews: true,
            currency: "FCFA",
          },
        });
        return defaultSettings;
      }

    return restaurant.settings;
  }),

  // Update restaurant settings
  update: protectedProcedure
    .input(
      z.object({
        logoUrl: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
        commandeATable: z.boolean(),
        showRating: z.boolean().optional(),
        showReviews: z.boolean().optional(),
        currency: z.enum(["USD", "EUR", "FCFA"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
        include: { settings: true },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Upsert settings (create if doesn't exist, update if exists)
      const settings = await ctx.db.restaurantSettings.upsert({
        where: { restaurantId: restaurant.id },
        create: {
          restaurantId: restaurant.id,
          logoUrl: input.logoUrl,
          primaryColor: input.primaryColor,
          commandeATable: input.commandeATable,
          showRating: input.showRating ?? true,
          showReviews: input.showReviews ?? true,
          currency: input.currency ?? "FCFA",
        },
        update: {
          logoUrl: input.logoUrl,
          primaryColor: input.primaryColor,
          commandeATable: input.commandeATable,
          showRating: input.showRating,
          showReviews: input.showReviews,
          currency: input.currency,
        },
      });

      return settings;
    }),

  // Get public settings (for menu pages)
  getPublic: publicProcedure
    .input(z.object({ restaurantSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { slug: input.restaurantSlug },
        include: { settings: true },
      });

      if (!restaurant?.settings) {
        return {
          primaryColor: "#FF6600",
          commandeATable: false,
          logoUrl: null,
          showRating: true,
          showReviews: true,
          currency: "FCFA",
        };
      }

      return {
        primaryColor: restaurant.settings.primaryColor,
        commandeATable: restaurant.settings.commandeATable,
        logoUrl: restaurant.settings.logoUrl,
        showRating: restaurant.settings.showRating,
        showReviews: restaurant.settings.showReviews,
        currency: restaurant.settings.currency,
      };
    }),
}); 