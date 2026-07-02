// src/app/(dashboard)/customers/page.tsx
// Lists all customers with links to edit and a delete button.

import { db } from "@/lib/db";
import Link from "next/link";
import DeleteCustomerButton from "./delete-button";

export default async function CustomersPage() {
  const customers = await db.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your global consignee and buyer database.
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 hover:scale-[1.01] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Customer</span>
        </Link>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No customers yet. Click above to add one.</p>
        </div>
      ) : (
        <div className="overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-900 text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900 bg-white dark:bg-gray-950/20">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-950 dark:text-white">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {c.country}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {c.contactPerson ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono">
                      {c.email ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono">
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-950 transition-all mr-2"
                      >
                        Edit
                      </Link>
                      <DeleteCustomerButton id={c.id} />
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

