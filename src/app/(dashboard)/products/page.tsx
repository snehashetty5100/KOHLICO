// src/app/(dashboard)/products/page.tsx
// Lists all products with edit and delete actions.

import { db } from "@/lib/db";
import Link from "next/link";
import DeleteProductButton from "./delete-button";

function formatCategoryName(cat: string) {
  if (!cat) return "";
  if (cat.toUpperCase() === "ALL") return "All Products";
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const { q, cat } = await searchParams;
  const query = q?.trim() || "";
  const activeCategory = cat?.trim() || "ALL";

  // Fetch all distinct categories for filters
  const distinctCategoriesRes = await db.product.findMany({
    select: {
      category: true,
    },
    distinct: ["category"],
  });

  const rawCategories = distinctCategoriesRes
    .map((p) => p.category?.trim() || "")
    .filter(Boolean);

  // Case-insensitive unique list
  const uniqueCategories = Array.from(new Set(rawCategories.map((c) => c.toUpperCase())))
    .map((upperCat) => {
      const original = rawCategories.find((c) => c.toUpperCase() === upperCat);
      return original || upperCat;
    });

  const sortedCategories = ["ALL", ...uniqueCategories.sort()];

  // Build prisma where clause
  const whereClause: any = {};

  if (query) {
    whereClause.OR = [
      { description: { contains: query } },
      { hsCode: { contains: query } },
    ];
  }

  if (activeCategory.toUpperCase() !== "ALL") {
    whereClause.category = {
      equals: activeCategory,
    };
  }

  const products = await db.product.findMany({
    where: whereClause,
    orderBy: { description: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[#D8D6D3] pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C335E]">Products</h1>
          <p className="mt-1.5 text-xs text-[#6F7B8E] uppercase tracking-wider font-mono">
            Shipping catalog default values
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
        >
          <span>+ New Product</span>
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D8D6D3] pb-4">
        {sortedCategories.map((catName) => {
          const isActive = catName === activeCategory;
          const displayLabel = formatCategoryName(catName);

          return (
            <Link
              key={catName}
              href={{
                pathname: "/products",
                query: {
                  ...(query ? { q: query } : {}),
                  cat: catName,
                },
              }}
              className={`inline-flex items-center justify-center rounded-none px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border ${
                isActive
                  ? "bg-[#1C335E] text-white border-[#1C335E]"
                  : "border-[#D8D6D3] text-[#6F7B8E] bg-transparent hover:text-[#1C335E] hover:border-[#1C335E]"
              }`}
            >
              {displayLabel}
            </Link>
          );
        })}
      </div>

      {/* Active search filter details */}
      {query && (
        <div className="flex items-center justify-between bg-[#F7F5F2] border border-[#D8D6D3] px-4 py-2.5 text-xs text-[#1C335E] font-mono rounded-none">
          <span>
            SHOWING SEARCH RESULTS FOR: <span className="font-bold">"{query}"</span>
            {activeCategory !== "ALL" && (
              <span> IN CATEGORY: <span className="font-bold">"{formatCategoryName(activeCategory)}"</span></span>
            )}
            {` (${products.length} ${products.length === 1 ? "match" : "matches"} found)`}
          </span>
          <Link
            href={{
              pathname: "/products",
              query: {
                ...(activeCategory !== "ALL" ? { cat: activeCategory } : {}),
              },
            }}
            className="font-semibold text-[#E28924] hover:underline uppercase tracking-wider font-sans"
          >
            Clear Search
          </Link>
        </div>
      )}

      {/* Table / Empty State */}
      {products.length === 0 ? (
        <div className="border border-dashed border-[#D8D6D3] p-12 text-center bg-transparent">
          <p className="text-sm font-serif text-[#1C335E] mb-2">
            No Products Found
          </p>
          <p className="text-xs text-[#6F7B8E] max-w-sm mx-auto mb-6">
            {query
              ? `We couldn't find any products matching "${query}"${
                  activeCategory !== "ALL" ? ` in the "${formatCategoryName(activeCategory)}" category` : ""
                }.`
              : activeCategory !== "ALL"
              ? `No products found in the "${formatCategoryName(activeCategory)}" category.`
              : "No products yet. Click above to add one."}
          </p>
          {(query || activeCategory !== "ALL") && (
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
            >
              <span>Show All Products</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8D6D3] text-xs font-semibold text-[#6F7B8E] uppercase tracking-wider">
                <th className="py-3 pr-4">Description</th>
                {activeCategory === "ALL" && <th className="py-3 px-4">Category</th>}
                <th className="py-3 px-4">HS Code</th>
                <th className="py-3 px-4">Packaging</th>
                <th className="py-3 px-4 text-right">Rate (CAD)</th>
                <th className="py-3 px-4 text-right">Net Wt (kg)</th>
                <th className="py-3 px-4 text-right">Gross Wt (kg)</th>
                <th className="py-3 px-4 text-right">IGST</th>
                <th className="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D6D3]">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-[#F7F5F2] transition-colors duration-100"
                >
                  <td className="py-3 pr-4 font-bold text-[#1C335E]">
                    {p.description}
                  </td>
                  {activeCategory === "ALL" && (
                    <td className="py-3 px-4 text-xs text-[#E28924] font-semibold font-mono">
                      {p.category ? formatCategoryName(p.category) : "GENERAL"}
                    </td>
                  )}
                  <td className="py-3 px-4 text-[#6F7B8E] font-mono text-xs">
                    {p.hsCode}
                  </td>
                  <td className="py-3 px-4 text-[#1C335E]">
                    {p.defaultPackaging ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#1C335E]">
                    {p.defaultRate.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#6F7B8E]">
                    {p.defaultNetWeight.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#6F7B8E]">
                    {p.defaultGrossWeight.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#6F7B8E]">
                    {(p.igstRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="inline-flex items-center justify-center rounded-none border border-[#1C335E] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1C335E] hover:bg-[#1C335E]/5 transition-all"
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
