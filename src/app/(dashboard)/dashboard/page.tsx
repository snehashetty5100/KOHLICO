// src/app/(dashboard)/dashboard/page.tsx
// Main dashboard — shows summary stats and recent invoices.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [invoiceCount, customerCount, productCount, recentInvoices] =
    await Promise.all([
      db.invoice.count(),
      db.customer.count(),
      db.product.count(),
      db.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { consignee: { select: { name: true } } },
      }),
    ]);

  const stats = [
    { label: "Total invoices", value: invoiceCount, href: "/invoices" },
    { label: "Customers", value: customerCount, href: "/customers" },
    { label: "Products", value: productCount, href: "/products" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user.name ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your invoice system.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">{s.label}</p>
            <p className="mt-2 text-4xl font-bold text-gray-900">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
        >
          + New invoice
        </Link>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          + New customer
        </Link>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          + New product
        </Link>
      </div>

      {/* Recent invoices */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Recent invoices
        </h2>

        {recentInvoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-sm text-gray-500">No invoices yet.</p>
            <Link
              href="/invoices/new"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Consignee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inv.consignee.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
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
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
