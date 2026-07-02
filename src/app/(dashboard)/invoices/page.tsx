// src/app/(dashboard)/invoices/page.tsx
// Lists all invoices with status badges.

import { db } from "@/lib/db";
import Link from "next/link";

export default async function InvoicesPage() {
  const invoices = await db.invoice.findMany({
    orderBy: { invoiceDate: "desc" },
    include: {
      consignee: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View, track, and manage all export shipments and draft invoices.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 hover:scale-[1.01] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Main content table */}
      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet. Click above to create one.</p>
        </div>
      ) : (
        <div className="overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-900 text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Consignee</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900 bg-white dark:bg-gray-950/20">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-gray-950 dark:text-white">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                      {inv.consignee.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {inv.finalDestination}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono">
                      {inv._count.items}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          inv.status === "final"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50"
                        }`}
                      >
                        {inv.status === "final" ? "Finalized" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-950 transition-all"
                      >
                        View
                      </Link>
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

