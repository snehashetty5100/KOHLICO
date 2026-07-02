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
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">Products</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your catalog of items, HS codes, weights, and CAD rates.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 hover:scale-[1.01] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Product</span>
        </Link>
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No products yet. Click above to add one.</p>
        </div>
      ) : (
        <div className="overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-900 text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">HS Code</th>
                  <th className="px-6 py-4">Packaging</th>
                  <th className="px-6 py-4 text-right">Rate (CAD)</th>
                  <th className="px-6 py-4 text-right">Net Wt (kg)</th>
                  <th className="px-6 py-4 text-right">Gross Wt (kg)</th>
                  <th className="px-6 py-4 text-right">IGST</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900 bg-white dark:bg-gray-950/20">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-950 dark:text-white">
                      {p.description}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono">
                      {p.hsCode}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {p.defaultPackaging ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-gray-200">
                      {p.defaultRate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400">
                      {p.defaultNetWeight.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400">
                      {p.defaultGrossWeight.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400">
                      {(p.igstRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-950 transition-all mr-2"
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
        </div>
      )}
    </div>
  );
}

