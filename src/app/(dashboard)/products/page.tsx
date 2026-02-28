// src/app/(dashboard)/products/page.tsx
// Lists all products with edit and delete actions.

import { db } from "@/lib/db";
import Link from "next/link";
import DeleteProductButton from "./delete-button";

export default async function ProductsPage() {
  const products = await db.product.findMany({ orderBy: { description: "asc" } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/products/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Product
        </Link>
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <p className="text-gray-500 text-sm">No products yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">HS Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Packaging</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Rate (CAD)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Net Wt (kg)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Gross Wt (kg)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">IGST</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.description}</td>
                  <td className="px-4 py-3 text-gray-600">{p.hsCode}</td>
                  <td className="px-4 py-3 text-gray-600">{p.defaultPackaging ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.defaultRate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.defaultNetWeight.toFixed(3)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.defaultGrossWeight.toFixed(3)}</td>
                  <td className="px-4 py-3 text-gray-600">{(p.igstRate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      href={`/products/${p.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
