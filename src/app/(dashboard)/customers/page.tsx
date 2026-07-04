// src/app/(dashboard)/customers/page.tsx
// Lists all customers with links to edit and a delete button.

import { db } from "@/lib/db";
import Link from "next/link";
import DeleteCustomerButton from "./delete-button";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const customers = await db.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { country: { contains: query } },
            { contactPerson: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[#D8D6D3] pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C335E]">Customers</h1>
          <p className="mt-1.5 text-xs text-[#6F7B8E] uppercase tracking-wider font-mono">
            Consignee and buyer account directory
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
        >
          <span>+ New Customer</span>
        </Link>
      </div>

      {/* Active search filter details */}
      {query && customers.length > 0 && (
        <div className="flex items-center justify-between bg-[#F7F5F2] border border-[#D8D6D3] px-4 py-2.5 text-xs text-[#1C335E] font-mono rounded-none">
          <span>
            SHOWING SEARCH RESULTS FOR: <span className="font-bold">"{query}"</span> ({customers.length} {customers.length === 1 ? "match" : "matches"} found)
          </span>
          <Link href="/customers" className="font-semibold text-[#E28924] hover:underline uppercase tracking-wider font-sans">
            Clear Search
          </Link>
        </div>
      )}

      {/* Table */}
      {customers.length === 0 ? (
        <div className="border border-dashed border-[#D8D6D3] p-12 text-center">
          <p className="text-sm font-serif text-[#1C335E] mb-2">
            {query ? "No Search Results" : "No Customers Yet"}
          </p>
          <p className="text-xs text-[#6F7B8E] max-w-sm mx-auto mb-6">
            {query
              ? `We couldn't find any customers matching "${query}".`
              : "No customers yet. Click above to add one."}
          </p>
          {query && (
            <Link
              href="/customers"
              className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
            >
              <span>Clear Search</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8D6D3] text-xs font-semibold text-[#6F7B8E] uppercase tracking-wider">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D6D3]">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#F7F5F2] transition-colors duration-100"
                >
                  <td className="py-3 pr-4 font-bold text-[#1C335E]">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-[#1C335E]">
                    {c.country}
                  </td>
                  <td className="py-3 px-4 text-[#6F7B8E]">
                    {c.contactPerson ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-[#6F7B8E] font-mono text-xs">
                    {c.email ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-[#6F7B8E] font-mono text-xs">
                    {c.phone ?? "—"}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="inline-flex items-center justify-center rounded-none border border-[#1C335E] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1C335E] hover:bg-[#1C335E]/5 transition-all"
                      >
                        Edit
                      </Link>
                      <DeleteCustomerButton id={c.id} />
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
