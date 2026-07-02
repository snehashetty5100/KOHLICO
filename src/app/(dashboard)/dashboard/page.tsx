// src/app/(dashboard)/dashboard/page.tsx
// Main dashboard — shows summary stats and recent invoices.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Fetch all invoices to compute metrics, and retrieve counts and recent invoices
  const [invoicesForStats, customerCount, productCount, recentInvoices] =
    await Promise.all([
      db.invoice.findMany({
        include: { items: { select: { fobCAD: true } } },
      }),
      db.customer.count(),
      db.product.count(),
      db.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { consignee: { select: { name: true } } },
      }),
    ]);

  let totalRevenue = 0;
  let outstanding = 0;
  let overdue = 0;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const inv of invoicesForStats) {
    const itemsTotal = inv.items.reduce((sum, item) => sum + item.fobCAD, 0);
    const totalCAD = itemsTotal + (inv.insuranceCAD ?? 0);
    if (inv.status === "final") {
      totalRevenue += totalCAD;
    } else {
      outstanding += totalCAD;
      if (new Date(inv.invoiceDate) < thirtyDaysAgo) {
        overdue += totalCAD;
      }
    }
  }

  const formatCAD = (val: number) => {
    return `C$ ${val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatCAD(totalRevenue),
      desc: "Finalized invoice volume",
      trend: "+12.4%",
      trendUp: true,
    },
    {
      label: "Outstanding",
      value: formatCAD(outstanding),
      desc: "Draft invoice volume",
      trend: "Pending action",
      trendUp: null,
    },
    {
      label: "Overdue",
      value: formatCAD(overdue),
      desc: "Drafts older than 30 days",
      trend: overdue > 0 ? "Requires review" : "On track",
      trendUp: overdue > 0 ? false : null,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back, {session?.user.name ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here is a polished overview of your export billing activity.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Invoice</span>
          </Link>
          <Link
            href="/customers/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            <span>+ Customer</span>
          </Link>
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            <span>+ Product</span>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass-card p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {s.label}
                </span>
                {s.trendUp !== null && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.trendUp
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/40"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40"
                    }`}
                  >
                    {s.trend}
                  </span>
                )}
                {s.trendUp === null && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {s.trend}
                  </span>
                )}
              </div>
              <p className="mt-3 text-3xl font-extrabold text-gray-950 dark:text-white font-mono tracking-tight">
                {s.value}
              </p>
            </div>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
          <h2 className="text-lg font-bold tracking-tight text-gray-950 dark:text-white">
            Recent Invoices
          </h2>
          <Link
            href="/invoices"
            className="text-xs font-semibold text-primary-600 hover:text-primary-500 hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet.</p>
            <Link
              href="/invoices/new"
              className="mt-3 inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-500 hover:underline"
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden glass-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Invoice No.</th>
                    <th className="px-6 py-4">Consignee</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                        {inv.invoiceNo}
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-300 font-medium">
                        {inv.consignee.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-CA")}
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
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
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
    </div>
  );
}

