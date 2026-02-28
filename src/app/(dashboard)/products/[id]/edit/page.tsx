// src/app/(dashboard)/products/[id]/edit/page.tsx
// Page to edit an existing product.

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductForm from "@/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await db.product.findUnique({ where: { id: params.id } });

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      <ProductForm defaultValues={product} />
    </div>
  );
}
