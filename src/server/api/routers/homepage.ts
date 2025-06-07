import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

const SliderSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  imageUrl: z.string(),
  order: z.number()
});

const TestimonialSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  order: z.number()
});

const SocialLinkSchema = z.object({
  platform: z.string(), // facebook, instagram, twitter, etc.
  url: z.string().refine((val) => val === "" || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL or empty string"
  }),
  enabled: z.boolean()
});

export const homepageRouter = createTRPCRouter({
  // Get homepage data for a restaurant (public)
  getByRestaurant: publicProcedure
    .input(z.object({ restaurantSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { slug: input.restaurantSlug },
        include: { homepage: true }
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      return restaurant.homepage;
    }),

  // Get homepage data for current user's restaurant (protected)
  getMine: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { 
          restaurant: {
            include: { homepage: true }
          }
        }
      });

      if (!user?.restaurant) {
        throw new Error("Restaurant not found");
      }

      return user.restaurant.homepage;
    }),

  // Create or update homepage
  createOrUpdate: protectedProcedure
    .input(z.object({
      sliders: z.array(SliderSchema).optional(),
      presentation: z.string().optional(),
      categories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        enabled: z.boolean()
      })).optional(),
      testimonials: z.array(TestimonialSchema).optional(),
      reservationBtnText: z.string().optional(),
      socialLinks: z.array(SocialLinkSchema).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { restaurant: true }
      });

      if (!user?.restaurant) {
        throw new Error("Restaurant not found");
      }

      const existingHomepage = await ctx.db.homepage.findUnique({
        where: { restaurantId: user.restaurant.id }
      });

      if (existingHomepage) {
        return await ctx.db.homepage.update({
          where: { restaurantId: user.restaurant.id },
          data: {
            sliders: input.sliders as any,
            presentation: input.presentation,
            categories: input.categories as any,
            testimonials: input.testimonials as any,
            reservationBtnText: input.reservationBtnText,
            socialLinks: input.socialLinks as any,
          }
        });
      } else {
        return await ctx.db.homepage.create({
          data: {
            restaurantId: user.restaurant.id,
            sliders: input.sliders as any,
            presentation: input.presentation,
            categories: input.categories as any,
            testimonials: input.testimonials as any,
            reservationBtnText: input.reservationBtnText || "Réserver une table",
            socialLinks: input.socialLinks as any,
          }
        });
      }
    }),

  // Add slider
  addSlider: protectedProcedure
    .input(z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      imageUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { restaurant: { include: { homepage: true } } }
      });

      if (!user?.restaurant) {
        throw new Error("Restaurant not found");
      }

      const homepage = user.restaurant.homepage;
      const currentSliders = (homepage?.sliders as any[]) || [];
      const newSlider = {
        id: `slider_${Date.now()}`,
        title: input.title,
        subtitle: input.subtitle,
        imageUrl: input.imageUrl,
        order: currentSliders.length
      };

      const updatedSliders = [...currentSliders, newSlider];

      if (homepage) {
        return await ctx.db.homepage.update({
          where: { id: homepage.id },
          data: { sliders: updatedSliders as any }
        });
      } else {
        return await ctx.db.homepage.create({
          data: {
            restaurantId: user.restaurant.id,
            sliders: updatedSliders as any,
            reservationBtnText: "Réserver une table"
          }
        });
      }
    }),

  // Add testimonial
  addTestimonial: protectedProcedure
    .input(z.object({
      customerName: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { restaurant: { include: { homepage: true } } }
      });

      if (!user?.restaurant) {
        throw new Error("Restaurant not found");
      }

      const homepage = user.restaurant.homepage;
      const currentTestimonials = (homepage?.testimonials as any[]) || [];
      const newTestimonial = {
        id: `testimonial_${Date.now()}`,
        customerName: input.customerName,
        rating: input.rating,
        comment: input.comment,
        order: currentTestimonials.length
      };

      const updatedTestimonials = [...currentTestimonials, newTestimonial];

      if (homepage) {
        return await ctx.db.homepage.update({
          where: { id: homepage.id },
          data: { testimonials: updatedTestimonials as any }
        });
      } else {
        return await ctx.db.homepage.create({
          data: {
            restaurantId: user.restaurant.id,
            testimonials: updatedTestimonials as any,
            reservationBtnText: "Réserver une table"
          }
        });
      }
    }),

  // Delete slider
  deleteSlider: protectedProcedure
    .input(z.object({ sliderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { restaurant: { include: { homepage: true } } }
      });

      if (!user?.restaurant?.homepage) {
        throw new Error("Homepage not found");
      }

      const currentSliders = (user.restaurant.homepage.sliders as any[]) || [];
      const updatedSliders = currentSliders.filter(s => s.id !== input.sliderId);

      return await ctx.db.homepage.update({
        where: { id: user.restaurant.homepage.id },
        data: { sliders: updatedSliders as any }
      });
    }),

  // Delete testimonial
  deleteTestimonial: protectedProcedure
    .input(z.object({ testimonialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { restaurant: { include: { homepage: true } } }
      });

      if (!user?.restaurant?.homepage) {
        throw new Error("Homepage not found");
      }

      const currentTestimonials = (user.restaurant.homepage.testimonials as any[]) || [];
      const updatedTestimonials = currentTestimonials.filter(t => t.id !== input.testimonialId);

      return await ctx.db.homepage.update({
        where: { id: user.restaurant.homepage.id },
        data: { testimonials: updatedTestimonials as any }
      });
    }),
}); 