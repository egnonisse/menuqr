import { authRouter } from "@/server/api/routers/auth";
import { restaurantRouter } from "@/server/api/routers/restaurant";
import { tablesRouter } from "@/server/api/routers/tables";
import { menuRouter } from "@/server/api/routers/menu";
import { reservationsRouter } from "@/server/api/routers/reservations";
import { feedbacksRouter } from "@/server/api/routers/feedbacks";
import { homepageRouter } from "@/server/api/routers/homepage";
import { settingsRouter } from "@/server/api/routers/settings";
import { ordersRouter } from "@/server/api/routers/orders";
import { postRouter } from "@/server/api/routers/post";
import { reservationRouter } from "@/server/api/routers/reservation";
import { subscriptionRouter } from "@/server/api/routers/subscription";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	auth: authRouter,
	restaurant: restaurantRouter,
	tables: tablesRouter,
	menu: menuRouter,
	reservations: reservationsRouter,
	feedbacks: feedbacksRouter,
	homepage: homepageRouter,
	settings: settingsRouter,
	orders: ordersRouter,
	post: postRouter,
	reservation: reservationRouter,
	subscription: subscriptionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
