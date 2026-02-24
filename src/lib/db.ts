// src/lib/db.ts
// Prisma client singleton — prevents exhausting DB connections in development
// (Next.js hot-reload creates new module instances; the global keeps one client).
//
// Prisma 7 reads DATABASE_URL from process.env automatically — no datasourceUrl
// option is needed in the constructor.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In Prisma 7 the client reads DATABASE_URL from process.env automatically.
// No datasourceUrl option needed — the env var is sufficient.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
