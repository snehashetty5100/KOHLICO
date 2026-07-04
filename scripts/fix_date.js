const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: "./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const invoices = await prisma.invoice.findMany();
  let count = 0;
  for (const inv of invoices) {
    const d = new Date(inv.invoiceDate);
    if (d.getFullYear() > 3000) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { invoiceDate: new Date('2026-07-04') }
      });
      count++;
    }
  }
  console.log('Fixed invoices count:', count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
