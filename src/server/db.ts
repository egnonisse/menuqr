import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Ensure proper cleanup in serverless environments (Node.js only)
if (typeof window === "undefined" && typeof process !== "undefined" && env.NODE_ENV === "production") {
  // Only add process handlers if not in Edge Runtime
  if (typeof process.on === "function") {
    process.on('SIGTERM', async () => {
      try {
        await db.$disconnect();
      } catch {
        // Ignore disconnect errors
      }
    });
    
    process.on('SIGINT', async () => {
      try {
        await db.$disconnect();
      } catch {
        // Ignore disconnect errors
      }
    });
  }
}
