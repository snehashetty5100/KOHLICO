// src/app/(dashboard)/products/new/page.tsx
// Page to create a new product.

import ProductForm from "@/components/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Product</h1>
      <ProductForm />
    </div>
  );
}
