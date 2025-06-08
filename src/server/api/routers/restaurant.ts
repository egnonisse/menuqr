import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

// Schema for opening hours
const openingHoursSchema = z.object({
  monday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  tuesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  wednesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  thursday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  friday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  saturday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
  sunday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }),
});

export const restaurantRouter = createTRPCRouter({
  // Create a new restaurant for the current user
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a restaurant
      const existingRestaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (existingRestaurant) {
        throw new Error("You already have a restaurant");
      }

      // Generate slug from name
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      // Check if slug is already taken and make it unique if needed
      let finalSlug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existingSlug = await ctx.db.restaurant.findUnique({
          where: { slug: finalSlug },
        });

        if (!existingSlug) {
          break;
        }

        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      return ctx.db.restaurant.create({
        data: {
          ...input,
          slug: finalSlug,
          ownerId: ctx.session.user.id,
        },
      });
    }),

  // Get restaurant for current user
  getMine: protectedProcedure
    .query(async ({ ctx }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
        include: {
          tables: {
            orderBy: { number: "asc" },
          },
          categories: {
            orderBy: { order: "asc" },
            include: {
              menuItems: {
                orderBy: { name: "asc" },
              },
            },
          },
        },
      });

      return restaurant;
    }),

  // Update restaurant
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      return ctx.db.restaurant.update({
        where: { id: restaurant.id },
        data: input,
      });
    }),

  // Update opening hours
  updateOpeningHours: protectedProcedure
    .input(
      z.record(
        z.object({
          isOpen: z.boolean(),
          openTime: z.string().optional(),
          closeTime: z.string().optional(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      return ctx.db.restaurant.update({
        where: { id: restaurant.id },
        data: {
          openingHours: input,
        },
      });
    }),

  // Get opening hours
  getOpeningHours: protectedProcedure
    .query(async ({ ctx }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
        select: { openingHours: true },
      });

      return restaurant?.openingHours;
    }),

  // Get restaurant by slug (public)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { slug: input.slug },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          phone: true,
          email: true,
          openingHours: true,
          createdAt: true,
          updatedAt: true,
          categories: {
            orderBy: { order: "asc" },
            include: {
              menuItems: {
                where: { available: true },
                orderBy: { name: "asc" },
              },
            },
          },
        },
      });

      return restaurant;
    }),

  // Get restaurant statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      const [tablesCount, menuItemsCount, reservationsCount, feedbacksCount] =
        await Promise.all([
          ctx.db.table.count({
            where: { restaurantId: restaurant.id },
          }),
          ctx.db.menuItem.count({
            where: { restaurantId: restaurant.id },
          }),
          ctx.db.reservation.count({
            where: { restaurantId: restaurant.id },
          }),
          ctx.db.feedback.count({
            where: { restaurantId: restaurant.id },
          }),
        ]);

      return {
        tables: tablesCount,
        menuItems: menuItemsCount,
        reservations: reservationsCount,
        feedbacks: feedbacksCount,
      };
    }),

  // Get QR scan statistics
  getScanStats: protectedProcedure
    .query(async ({ ctx }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Get current month start and end
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [totalScans, monthlyScans, todayScans, weeklyScans] = await Promise.all([
        // Total scans all time
        ctx.db.qRScan.count({
          where: { restaurantId: restaurant.id },
        }),
        // Scans this month
        ctx.db.qRScan.count({
          where: {
            restaurantId: restaurant.id,
            scannedAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        }),
        // Scans today
        ctx.db.qRScan.count({
          where: {
            restaurantId: restaurant.id,
            scannedAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
            },
          },
        }),
        // Scans this week
        ctx.db.qRScan.count({
          where: {
            restaurantId: restaurant.id,
            scannedAt: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Get user's subscription limits
      const userStats = await ctx.db.usageStats.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const subscription = await ctx.db.subscription.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const maxScansPerMonth = subscription?.maxScansPerMonth ?? 50; // Default to freemium limit

      return {
        totalScans,
        monthlyScans,
        todayScans,
        weeklyScans,
        maxScansPerMonth,
        percentageUsed: Math.round((monthlyScans / maxScansPerMonth) * 100),
        remainingScans: Math.max(0, maxScansPerMonth - monthlyScans),
      };
    }),
}); 