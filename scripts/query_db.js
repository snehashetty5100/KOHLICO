const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: "./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const invoices = await prisma.invoice.findMany({
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true
    }
  });
  console.log('Invoices in DB:', JSON.stringify(invoices, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
