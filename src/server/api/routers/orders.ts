import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const ordersRouter = createTRPCRouter({
  // Get all orders for a restaurant (admin)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const restaurant = await ctx.db.restaurant.findUnique({
      where: { ownerId: ctx.session.user.id },
    });

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const orders = await ctx.db.order.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  }),

  // Create a new order (public - from menu)
  create: publicProcedure
    .input(
      z.object({
        restaurantSlug: z.string(),
        tableNumber: z.string().min(1).max(20),
        customerName: z.string().optional(),
        items: z.array(
          z.object({
            menuItemId: z.string(),
            quantity: z.number().min(1),
            notes: z.string().optional(),
          })
        ),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { slug: input.restaurantSlug },
        include: {
          tables: true,
          menuItems: true,
        },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Find the table
      const table = restaurant.tables.find(t => t.number === input.tableNumber);
      if (!table) {
        throw new Error("Table not found");
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of input.items) {
        const menuItem = restaurant.menuItems.find(mi => mi.id === item.menuItemId);
        if (menuItem) {
          totalAmount += menuItem.price * item.quantity;
        }
      }

      // Create the order
      const order = await ctx.db.order.create({
        data: {
          restaurantId: restaurant.id,
          tableId: table.id,
          tableNumber: input.tableNumber,
          customerName: input.customerName,
          notes: input.notes,
          totalAmount,
          orderItems: {
            create: input.items.map(item => {
              const menuItem = restaurant.menuItems.find(mi => mi.id === item.menuItemId);
              return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: menuItem?.price || 0,
                notes: item.notes,
              };
            }),
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      return order;
    }),

  // Update order status (admin)
  updateStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(["pending", "preparing", "served", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      const order = await ctx.db.order.update({
        where: {
          id: input.orderId,
          restaurantId: restaurant.id, // Ensure order belongs to this restaurant
        },
        data: {
          status: input.status,
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          table: true,
        },
      });

      return order;
    }),

  // Get orders by status
  getByStatus: protectedProcedure
    .input(z.object({ status: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      const orders = await ctx.db.order.findMany({
        where: {
          restaurantId: restaurant.id,
          status: input.status,
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          table: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return orders;
    }),

  // Get order statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const restaurant = await ctx.db.restaurant.findUnique({
      where: { ownerId: ctx.session.user.id },
    });

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const [total, pending, preparing, served] = await Promise.all([
      ctx.db.order.count({ where: { restaurantId: restaurant.id } }),
      ctx.db.order.count({ where: { restaurantId: restaurant.id, status: "pending" } }),
      ctx.db.order.count({ where: { restaurantId: restaurant.id, status: "preparing" } }),
      ctx.db.order.count({ where: { restaurantId: restaurant.id, status: "served" } }),
    ]);

    return { total, pending, preparing, served };
  }),
}); 