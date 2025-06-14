import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Obtenir tous les utilisateurs en attente de validation
  getPendingUsers: protectedProcedure
    .query(async ({ ctx }) => {
      // Vérifier que l'utilisateur est super admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true }
      });

      if (currentUser?.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous devez être super-administrateur pour accéder à cette fonctionnalité"
        });
      }

      return ctx.db.user.findMany({
        where: {
          role: "PENDING"
        },
        include: {
          restaurant: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    }),

  // Obtenir tous les utilisateurs
  getAllUsers: protectedProcedure
    .query(async ({ ctx }) => {
      // Vérifier que l'utilisateur est super admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true }
      });

      if (currentUser?.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous devez être super-administrateur pour accéder à cette fonctionnalité"
        });
      }

      return ctx.db.user.findMany({
        include: {
          restaurant: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    }),

  // Approuver un utilisateur
  approveUser: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est super admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true }
      });

      if (currentUser?.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous devez être super-administrateur pour approuver des utilisateurs"
        });
      }

      // Vérifier que l'utilisateur à approuver existe
      const userToApprove = await ctx.db.user.findUnique({
        where: { id: input.userId }
      });

      if (!userToApprove) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur introuvable"
        });
      }

      if (userToApprove.role !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cet utilisateur n'est pas en attente de validation"
        });
      }

      // Approuver l'utilisateur
      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          isApproved: true,
          role: "ADMIN",
          approvedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null
        }
      });
    }),

  // Rejeter un utilisateur
  rejectUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().min(1, "Une raison est requise")
    }))
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est super admin
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true }
      });

      if (currentUser?.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous devez être super-administrateur pour rejeter des utilisateurs"
        });
      }

      // Vérifier que l'utilisateur à rejeter existe
      const userToReject = await ctx.db.user.findUnique({
        where: { id: input.userId }
      });

      if (!userToReject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur introuvable"
        });
      }

      if (userToReject.role !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cet utilisateur n'est pas en attente de validation"
        });
      }

      // Rejeter l'utilisateur
      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          isApproved: false,
          role: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason: input.reason,
          approvedAt: null
        }
      });
    })
}); 