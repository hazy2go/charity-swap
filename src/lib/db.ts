import { PrismaClient } from "@prisma/client";

// Singleton — avoids spinning up new clients during hot-reload in dev,
// and avoids exhausting the Supabase pooler's connection cap in prod.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
