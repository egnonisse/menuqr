import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			email: string;
			name: string;
			restaurantId?: string;
			isApproved?: boolean;
			role?: string;
		} & DefaultSession["user"];
	}

	interface User {
		restaurantId?: string;
		isApproved?: boolean;
		role?: string;
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	adapter: PrismaAdapter(db),
	providers: [
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const email = credentials.email as string;
				const password = credentials.password as string;

				// Chercher l'utilisateur dans la base de données
				const user = await db.user.findUnique({
					where: { email },
					include: { restaurant: true }
				}) as any; // Cast temporaire pour contourner les types

				if (!user || !user.password) {
					return null;
				}

				// Vérifier le mot de passe avec bcrypt
				const isPasswordValid = await bcrypt.compare(password, user.password);
				
				if (!isPasswordValid) {
					return null;
				}

				return {
					id: user.id,
					email: user.email!,
					name: user.name!,
					restaurantId: user.restaurant?.id,
					isApproved: user.isApproved,
					role: user.role
				};
			}
		})
	],
	session: {
		strategy: "jwt",
		maxAge: 8 * 60 * 60, // 8 heures
		updateAge: 60 * 60, // Mise à jour toutes les heures
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.restaurantId = user.restaurantId;
				token.isApproved = user.isApproved;
				token.role = user.role;
			}
			
			// Récupérer les données fraîches de l'utilisateur à chaque session
			if (token.sub) {
				const freshUser = await db.user.findUnique({
					where: { id: token.sub },
					select: {
						isApproved: true,
						role: true,
						restaurant: {
							select: { id: true }
						}
					}
				});
				
				if (freshUser) {
					token.isApproved = freshUser.isApproved;
					token.role = freshUser.role;
					token.restaurantId = freshUser.restaurant?.id;
				}
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
					isApproved: token.isApproved as boolean | undefined,
					role: token.role as string | undefined,
				},
			};
			},
	},
	pages: {
		signIn: "/auth/signin"
	}
} satisfies NextAuthConfig;
