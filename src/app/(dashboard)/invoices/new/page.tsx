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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      <InvoiceForm customers={customers} products={products} />
    </div>
  );
}
