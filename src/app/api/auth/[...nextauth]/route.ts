import { handlers } from "@/server/auth";

export const { GET, POST } = handlers;

// Force Node.js runtime for auth routes (Prisma compatibility)
export const runtime = 'nodejs';
