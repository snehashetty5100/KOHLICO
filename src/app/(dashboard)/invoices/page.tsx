// src/app/(dashboard)/invoices/page.tsx
// Lists all invoices with status badges.

import { db } from "@/lib/db";
import Link from "next/link";
import { formatDateForUI } from "@/lib/invoice-shared";

export default async function InvoicesPage() {
  const invoices = await db.invoice.findMany({
    orderBy: { invoiceDate: "desc" },
    include: {
      consignee: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[#D8D3C8] dark:border-[#33312D] pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1]">Ledger Entries</h1>
          <p className="mt-1.5 text-xs text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-mono">
            Archived and active shipping invoices
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all"
        >
          <span>+ New Entry</span>
        </Link>
      </div>

      {/* Main content table */}
      {invoices.length === 0 ? (
        <div className="border border-dashed border-[#D8D3C8] dark:border-[#384F5B] py-16 px-4 text-center bg-transparent">
          <p className="text-sm font-serif text-[#1C2B33] dark:text-[#F7F5F1] mb-2">No Ledger Entries</p>
          <p className="text-xs text-[#7A756B] dark:text-[#9E998F] max-w-sm mx-auto mb-6">
            There are no shipping invoices recorded in the system.
          </p>
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <span>+ Record First Invoice</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8D3C8] dark:border-[#33312D] text-xs font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Consignee</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4 text-right">Post Date</th>
                <th className="py-3.5 px-4 text-right">Items</th>
                <th className="py-3.5 px-4 text-right">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D3C8] dark:divide-[#33312D]">
              {invoices.map((inv) => {
                const isFinal = inv.status === "final";
                const isOverdue = !isFinal && new Date(inv.invoiceDate) < thirtyDaysAgo;
                const statusLabel = isFinal ? "[PAID]" : isOverdue ? "[OVERDUE]" : "[DRAFT]";
                const statusColor = isFinal 
                  ? "text-[#2E5E4E] dark:text-[#49826D]" 
                  : isOverdue 
                    ? "text-[#C1443C] dark:text-[#E8655E]" 
                    : "text-[#7A756B]";

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1C2B33] dark:text-[#F7F5F1]">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1C2B33] dark:text-[#F7F5F1] max-w-[200px] truncate">
                      {inv.consignee.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#7A756B] dark:text-[#9E998F] max-w-[150px] truncate">
                      {inv.finalDestination}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#7A756B] dark:text-[#9E998F] font-mono text-xs">
                      {formatDateForUI(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#7A756B] dark:text-[#9E998F] font-mono text-xs">
                      {inv._count.items}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-mono text-xs font-semibold tracking-wider ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center justify-center rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
