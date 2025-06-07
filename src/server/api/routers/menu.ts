import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const menuRouter = createTRPCRouter({
  // Get all menu items for a restaurant
  getItems: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.menuItem.findMany({
        where: { restaurantId: input.restaurantId },
        include: {
          category: true,
        },
        orderBy: { name: "asc" },
      });
    }),

  // Get categories with item count
  getCategories: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const categories = await ctx.db.category.findMany({
        where: { restaurantId: input.restaurantId },
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
        orderBy: { order: "asc" },
      });

      return categories.map(category => ({
        id: category.id,
        name: category.name,
        emoji: category.emoji,
        description: category.description,
        order: category.order,
        items: category._count.menuItems,
      }));
    }),

  // Create a new menu item
  createItem: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().positive(),
      image: z.string().optional(), // Base64 encoded image or URL
      categoryName: z.string().min(1),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find or create category
      let category = await ctx.db.category.findFirst({
        where: {
          name: input.categoryName,
          restaurantId: input.restaurantId,
        },
      });

      if (!category) {
        // Get the next order for this restaurant's categories
        const lastCategory = await ctx.db.category.findFirst({
          where: { restaurantId: input.restaurantId },
          orderBy: { order: "desc" },
        });

        category = await ctx.db.category.create({
          data: {
            name: input.categoryName,
            restaurantId: input.restaurantId,
            order: (lastCategory?.order ?? 0) + 1,
          },
        });
      }

      return ctx.db.menuItem.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          image: input.image,
          restaurantId: input.restaurantId,
          categoryId: category.id,
        },
        include: {
          category: true,
        },
      });
    }),

  // Update menu item availability
  updateItemAvailability: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      available: z.boolean(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItem.update({
        where: { 
          id: input.itemId,
          restaurantId: input.restaurantId,
        },
        data: { available: input.available },
      });
    }),

  // Update menu item
  updateItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      image: z.string().optional(),
      categoryName: z.string().optional(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { itemId, categoryName, restaurantId, ...updateData } = input;
      
      let categoryId;
      if (categoryName) {
        // Find or create category
        let category = await ctx.db.category.findFirst({
          where: {
            name: categoryName,
            restaurantId: restaurantId,
          },
        });

        if (!category) {
          const lastCategory = await ctx.db.category.findFirst({
            where: { restaurantId: restaurantId },
            orderBy: { order: "desc" },
          });

          category = await ctx.db.category.create({
            data: {
              name: categoryName,
              restaurantId: restaurantId,
              order: (lastCategory?.order ?? 0) + 1,
            },
          });
        }
        categoryId = category.id;
      }

      return ctx.db.menuItem.update({
        where: { 
          id: itemId,
          restaurantId: restaurantId,
        },
        data: {
          ...updateData,
          ...(categoryId && { categoryId }),
        },
        include: {
          category: true,
        },
      });
    }),

  // Delete menu item
  deleteItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItem.delete({
        where: { 
          id: input.itemId,
          restaurantId: input.restaurantId,
        },
      });
    }),

  // Get menu statistics
  getStats: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [totalItems, availableItems, categories] = await Promise.all([
        ctx.db.menuItem.count({
          where: { restaurantId: input.restaurantId },
        }),
        ctx.db.menuItem.count({
          where: { 
            restaurantId: input.restaurantId,
            available: true,
          },
        }),
        ctx.db.category.count({
          where: { restaurantId: input.restaurantId },
        }),
      ]);

      return {
        totalItems,
        availableItems,
        unavailableItems: totalItems - availableItems,
        categories,
      };
    }),

  // Create category
  createCategory: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      emoji: z.string().optional(),
      description: z.string().optional(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if category already exists
      const existingCategory = await ctx.db.category.findFirst({
        where: {
          name: input.name,
          restaurantId: input.restaurantId,
        },
      });

      if (existingCategory) {
        throw new Error("Category already exists");
      }

      // Get the next order
      const lastCategory = await ctx.db.category.findFirst({
        where: { restaurantId: input.restaurantId },
        orderBy: { order: "desc" },
      });

      return ctx.db.category.create({
        data: {
          name: input.name,
          emoji: input.emoji,
          description: input.description,
          restaurantId: input.restaurantId,
          order: (lastCategory?.order ?? 0) + 1,
        },
      });
    }),

  // Update category
  updateCategory: protectedProcedure
    .input(z.object({
      categoryId: z.string(),
      name: z.string().min(1).optional(),
      emoji: z.string().optional(),
      description: z.string().optional(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { categoryId, restaurantId, ...updateData } = input;
      
      return ctx.db.category.update({
        where: { 
          id: categoryId,
          restaurantId: restaurantId,
        },
        data: updateData,
      });
    }),

  // Delete category
  deleteCategory: protectedProcedure
    .input(z.object({
      categoryId: z.string(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if category has items
      const itemCount = await ctx.db.menuItem.count({
        where: { categoryId: input.categoryId },
      });

      if (itemCount > 0) {
        throw new Error("Cannot delete category with menu items");
      }

      return ctx.db.category.delete({
        where: { 
          id: input.categoryId,
          restaurantId: input.restaurantId,
        },
      });
    }),
}); 