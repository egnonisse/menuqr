import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { compare, hash } from "bcryptjs";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Le nom est requis"),
        email: z.string().email("Email invalide"),
        password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
        restaurantName: z.string().min(1, "Le nom du restaurant est requis"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("Un compte avec cet email existe déjà");
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Créer le slug du restaurant
      const slug = input.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // Vérifier si le slug existe déjà
      const existingRestaurant = await ctx.db.restaurant.findUnique({
        where: { slug },
      });

      let finalSlug = slug;
      if (existingRestaurant) {
        finalSlug = `${slug}-${Date.now()}`;
      }

      // Créer l'utilisateur avec Prisma (gère automatiquement tous les champs requis)
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
      });

      // Créer le restaurant associé
      const restaurant = await ctx.db.restaurant.create({
        data: {
          name: input.restaurantName,
          slug: finalSlug,
          ownerId: user.id,
        },
      });

      return {
        success: true,
        message: "Compte créé avec succès",
        userId: user.id,
        restaurantId: restaurant.id,
      };
    }),

  // Obtenir le profil de l'utilisateur connecté
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return user;
  }),

  // Mettre à jour le profil de l'utilisateur
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Le nom est requis"),
        email: z.string().email("Email invalide"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const existingUser = await ctx.db.user.findFirst({
        where: {
          email: input.email,
          id: { not: ctx.session.user.id },
        },
      });

      if (existingUser) {
        throw new Error("Cet email est déjà utilisé par un autre compte");
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          email: input.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return updatedUser;
    }),

  // Changer le mot de passe
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
        newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Récupérer l'utilisateur avec son mot de passe
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user || !user.password) {
        throw new Error("Utilisateur non trouvé ou mot de passe non défini");
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await compare(input.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error("Le mot de passe actuel est incorrect");
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await hash(input.newPassword, 12);

      // Mettre à jour le mot de passe
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          password: hashedNewPassword,
        },
      });

      return { success: true };
    }),
}); 