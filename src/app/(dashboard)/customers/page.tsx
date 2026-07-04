// src/app/(dashboard)/customers/page.tsx
// Lists all customers with links to edit and a delete button.

import { db } from "@/lib/db";
import Link from "next/link";
import DeleteCustomerButton from "./delete-button";

export default async function CustomersPage() {
  const customers = await db.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[#D8D3C8] dark:border-[#33312D] pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1]">Customers</h1>
          <p className="mt-1.5 text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-mono">
            Consignee and buyer account directory
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          <span>+ New Customer</span>
        </Link>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="border border-dashed border-[#D8D3C8] dark:border-[#33312D] p-12 text-center">
          <p className="text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">No customers yet. Click above to add one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8D3C8] dark:border-[#33312D] text-xs font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D3C8] dark:divide-[#33312D]">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors duration-100"
                >
                  <td className="py-3 pr-4 font-bold text-[#1C2B33] dark:text-[#F7F5F1]">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-[#1C2B33] dark:text-[#F7F5F1]">
                    {c.country}
                  </td>
                  <td className="py-3 px-4 text-[#7A756B] dark:text-[#9E998F]">
                    {c.contactPerson ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-[#7A756B] dark:text-[#9E998F] font-mono text-xs">
                    {c.email ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-[#7A756B] dark:text-[#9E998F] font-mono text-xs">
                    {c.phone ?? "—"}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="inline-flex items-center justify-center rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
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
