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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p className="text-gray-500 text-sm">No invoices yet. Create one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Consignee</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Destination</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.consignee.name}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.finalDestination}</td>
                  <td className="px-4 py-3 text-gray-600">{inv._count.items}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.status === "final"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
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
