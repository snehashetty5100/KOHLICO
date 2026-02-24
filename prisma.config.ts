// prisma.config.ts — Prisma 7 configuration
// DATABASE_URL  = pooled connection URL  (used by the app at runtime via PrismaClient)
// DIRECT_URL    = direct (non-pooled) URL (used only by Prisma Migrate)
//
// On Neon these are two different URLs (pooled vs. non-pooled endpoint).
// For a basic self-hosted Postgres you can set both to the same connection string.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL is used by Migrate; falls back to DATABASE_URL when not set.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
