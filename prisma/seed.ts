// prisma/seed.ts
// Seeds the database with an initial admin user so you can log in immediately.

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@kohlico.com";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`✔ Admin user already exists: ${email}`);
  } else {
    const hashed = await bcrypt.hash("admin123", 12);

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: "Admin",
        role: "admin",
      },
    });

    console.log(`✔ Created admin user: ${email} / admin123`);
  }

  // ── Seed Customers ─────────────────────────────────────────────────────────

  const customers = [
    {
      name: "VANCOUVER SPICE IMPORTS LTD",
      address: "1200 Granville St, Vancouver, BC V6Z 1M4, Canada",
      country: "CANADA",
      contactPerson: "James Wilson",
      phone: "+1-604-555-0101",
      email: "james@vanspice.ca",
    },
    {
      name: "TORONTO GLOBAL FOODS INC",
      address: "450 Queen St West, Toronto, ON M5V 2A8, Canada",
      country: "CANADA",
      contactPerson: "Priya Sharma",
      phone: "+1-416-555-0202",
      email: "priya@tgfoods.ca",
    },
    {
      name: "MAPLE LEAF TRADING CO",
      address: "780 Burrard St, Vancouver, BC V6Z 2H7, Canada",
      country: "CANADA",
      contactPerson: "David Chen",
      phone: "+1-604-555-0303",
      email: "david@mapleleaftrading.ca",
    },
    {
      name: "ALBERTA FOOD DISTRIBUTORS",
      address: "320 5th Ave SW, Calgary, AB T2P 0L3, Canada",
      country: "CANADA",
      contactPerson: "Sarah Thompson",
      phone: "+1-403-555-0404",
      email: "sarah@albertafoods.ca",
    },
  ];

  for (const c of customers) {
    const exists = await prisma.customer.findFirst({ where: { name: c.name } });
    if (!exists) {
      await prisma.customer.create({ data: c });
      console.log(`✔ Created customer: ${c.name}`);
    } else {
      console.log(`✔ Customer already exists: ${c.name}`);
    }
  }

  // ── Seed Products ──────────────────────────────────────────────────────────

  const products = [
    {
      description: "ROASTED CHANA W/H SKIN IN POUCH",
      hsCode: "21069099",
      defaultPackaging: "20 X 400 GM",
      defaultRate: 14.50,
      defaultNetWeight: 8.0,
      defaultGrossWeight: 8.8,
      igstRate: 0.05,
      originDistrict: "THANE",
      originState: "MAHARASHTRA",
    },
    {
      description: "ROASTED CHANA W/O SKIN IN POUCH",
      hsCode: "21069099",
      defaultPackaging: "20 X 400 GM",
      defaultRate: 15.00,
      defaultNetWeight: 8.0,
      defaultGrossWeight: 8.8,
      igstRate: 0.05,
      originDistrict: "THANE",
      originState: "MAHARASHTRA",
    },
    {
      description: "PUFFED RICE (MAMRA/MURMURA) IN POUCH",
      hsCode: "19041090",
      defaultPackaging: "30 X 200 GM",
      defaultRate: 12.00,
      defaultNetWeight: 6.0,
      defaultGrossWeight: 6.8,
      igstRate: 0.05,
      originDistrict: "THANE",
      originState: "MAHARASHTRA",
    },
    {
      description: "THIN POHA (FLATTENED RICE) IN POUCH",
      hsCode: "11042300",
      defaultPackaging: "20 X 500 GM",
      defaultRate: 13.00,
      defaultNetWeight: 10.0,
      defaultGrossWeight: 10.8,
      igstRate: 0.05,
      originDistrict: "VALSAD",
      originState: "MAHARASHTRA",
    },
    {
      description: "BESAN (GRAM FLOUR) IN POUCH",
      hsCode: "11061000",
      defaultPackaging: "10 X 1 KG",
      defaultRate: 16.00,
      defaultNetWeight: 10.0,
      defaultGrossWeight: 10.6,
      igstRate: 0.05,
      originDistrict: "HOSHIARPUR",
      originState: "PUNJAB",
    },
    {
      description: "TURMERIC POWDER IN POUCH",
      hsCode: "09103020",
      defaultPackaging: "24 X 200 GM",
      defaultRate: 18.00,
      defaultNetWeight: 4.8,
      defaultGrossWeight: 5.5,
      igstRate: 0.05,
      originDistrict: "MUMBAI CITY",
      originState: "MAHARASHTRA",
    },
  ];

  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { description: p.description } });
    if (!exists) {
      await prisma.product.create({ data: p });
      console.log(`✔ Created product: ${p.description}`);
    } else {
      await prisma.product.update({
        where: { id: exists.id },
        data: { originDistrict: p.originDistrict, originState: p.originState },
      });
      console.log(`✔ Updated product: ${p.description} (added district/state)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
