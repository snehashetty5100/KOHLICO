// src/app/(dashboard)/invoices/new/page.tsx
// Page to create a new invoice — loads customers and products for dropdowns.

import { db } from "@/lib/db";
import InvoiceForm from "@/components/invoice-form";

export default async function NewInvoicePage() {
  const [customers, products] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({ orderBy: { description: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#D8D3C8] dark:border-[#33312D] pb-6">
        <h1 className="text-3xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1]">New Entry</h1>
        <p className="mt-1.5 text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-mono">
          Draft a shipping invoice
        </p>
      </div>
      <InvoiceForm customers={customers} products={products} />
    </div>
  );
}
