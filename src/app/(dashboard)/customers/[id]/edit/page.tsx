// src/app/(dashboard)/customers/[id]/edit/page.tsx
// Page to edit an existing customer.

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CustomerForm from "@/components/customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await db.customer.findUnique({ where: { id: params.id } });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
      <CustomerForm defaultValues={customer} />
    </div>
  );
}
