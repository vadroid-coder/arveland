import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "./db-url.mjs";

// An integration may have provisioned the database under POSTGRES_URL or a
// similar name. Normalise onto DATABASE_URL before the client reads the schema.
if (!process.env.DATABASE_URL) {
  const { url } = resolveDatabaseUrl();
  if (url) process.env.DATABASE_URL = url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
