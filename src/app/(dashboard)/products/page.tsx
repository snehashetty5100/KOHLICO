// src/app/(dashboard)/products/page.tsx
// Lists all products with edit and delete actions.

import { db } from "@/lib/db";
import Link from "next/link";
import DeleteProductButton from "./delete-button";

export default async function ProductsPage() {
  const products = await db.product.findMany({ orderBy: { description: "asc" } });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[#D8D3C8] dark:border-[#33312D] pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1]">Products</h1>
          <p className="mt-1.5 text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-mono">
            Shipping catalog default values
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          <span>+ New Product</span>
        </Link>
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="border border-dashed border-[#D8D3C8] dark:border-[#33312D] p-12 text-center">
          <p className="text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">No products yet. Click above to add one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8D3C8] dark:border-[#33312D] text-xs font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 px-4">HS Code</th>
                <th className="py-3 px-4">Packaging</th>
                <th className="py-3 px-4 text-right">Rate (CAD)</th>
                <th className="py-3 px-4 text-right">Net Wt (kg)</th>
                <th className="py-3 px-4 text-right">Gross Wt (kg)</th>
                <th className="py-3 px-4 text-right">IGST</th>
                <th className="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D3C8] dark:divide-[#33312D]">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors duration-100"
                >
                  <td className="py-3 pr-4 font-bold text-[#1C2B33] dark:text-[#F7F5F1]">
                    {p.description}
                  </td>
                  <td className="py-3 px-4 text-[#7A756B] dark:text-[#9E998F] font-mono text-xs">
                    {p.hsCode}
                  </td>
                  <td className="py-3 px-4 text-[#1C2B33] dark:text-[#F7F5F1]">
                    {p.defaultPackaging ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#1C2B33] dark:text-[#F7F5F1]">
                    {p.defaultRate.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#7A756B] dark:text-[#9E998F]">
                    {p.defaultNetWeight.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#7A756B] dark:text-[#9E998F]">
                    {p.defaultGrossWeight.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#7A756B] dark:text-[#9E998F]">
                    {(p.igstRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="inline-flex items-center justify-center rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} />
                    </div>
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
