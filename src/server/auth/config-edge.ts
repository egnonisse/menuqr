import type { NextAuthConfig } from "next-auth";

/**
 * Configuration NextAuth optimisée pour l'Edge Runtime (middleware)
 * N'utilise pas Prisma pour éviter les conflits d'environnement
 */
export const authConfigEdge = {
  providers: [],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.restaurantId = user.restaurantId;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          restaurantId: token.restaurantId as string | undefined,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/signin"
  }
} satisfies NextAuthConfig; 