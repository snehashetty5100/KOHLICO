// prisma/seed.ts
// Seeds the initial admin user into the database.
// Run with: npx tsx prisma/seed.ts

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const adminEmail = "suvidhakarkera7@gmail.com";
  // Pre-hashed password (bcrypt, 12 rounds)
  const adminPasswordHash =
    "$2b$12$aNuHcFKppZM7uLMnXwHXUOi5WGEXarESgvSHwf9OBxbORyTugUFtq";

  const user = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPasswordHash,
      name: "Admin",
      role: "admin",
    },
  });

  console.log(`✅ Admin user seeded: ${user.email} (${user.id})`);

  await db.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
