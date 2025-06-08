import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = () =>
	new PrismaClient({
		log:
			env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
		datasourceUrl: env.DATABASE_URL,
	});

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Force disconnect on serverless environments
if (env.NODE_ENV === "production") {
	// Périodiquement nettoyer les connexions
	setInterval(() => {
		db.$disconnect().catch(() => {
			// Ignore les erreurs de déconnexion
		});
	}, 30000); // Toutes les 30 secondes
}
