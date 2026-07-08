// src/app/(dashboard)/invoices/page.tsx
// Lists all invoices with status badges.

import { db } from "@/lib/db";
import Link from "next/link";
import { formatDateForUI } from "@/lib/invoice-shared";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const invoices = await db.invoice.findMany({
    where: query
      ? {
          deletedAt: null,
          OR: [
            { invoiceNo: { contains: query } },
            { consignee: { name: { contains: query } } },
            { finalDestination: { contains: query } },
          ],
        }
      : { deletedAt: null },
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
      <div className="flex items-baseline justify-between border-b border-[#D8D6D3] pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C335E]">Ledger Entries</h1>
          <p className="mt-1.5 text-xs text-[#6F7B8E] uppercase tracking-wider font-mono">
            Archived and active shipping invoices
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
        >
          <span>+ New Entry</span>
        </Link>
      </div>

      {/* Active search filter details */}
      {query && invoices.length > 0 && (
        <div className="flex items-center justify-between bg-[#F7F5F2] border border-[#D8D6D3] px-4 py-2.5 text-xs text-[#1C335E] font-mono rounded-none">
          <span>
            SHOWING SEARCH RESULTS FOR: <span className="font-bold">"{query}"</span> ({invoices.length} {invoices.length === 1 ? "match" : "matches"} found)
          </span>
          <Link href="/invoices" className="font-semibold text-[#E28924] hover:underline uppercase tracking-wider font-sans">
            Clear Search
          </Link>
        </div>
      )}

      {/* Main content table */}
      {invoices.length === 0 ? (
        <div className="border border-dashed border-[#D8D6D3] py-16 px-4 text-center bg-transparent">
          <p className="text-sm font-serif text-[#1C335E] mb-2">
            {query ? "No Search Results" : "No Ledger Entries"}
          </p>
          <p className="text-xs text-[#6F7B8E] max-w-sm mx-auto mb-6">
            {query
              ? `We couldn't find any invoices matching "${query}".`
              : "There are no shipping invoices recorded in the system."}
          </p>
          {query ? (
            <Link
              href="/invoices"
              className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
            >
              <span>Clear Search</span>
            </Link>
          ) : (
            <Link
              href="/invoices/new"
              className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
            >
              <span>+ Record First Invoice</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8D6D3] text-xs font-semibold text-[#6F7B8E] uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Consignee</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4 text-right">Post Date</th>
                <th className="py-3.5 px-4 text-right">Items</th>
                <th className="py-3.5 px-4 text-right">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D6D3]">
              {invoices.map((inv) => {
                const isFinal = inv.status === "final";
                const isOverdue = !isFinal && new Date(inv.invoiceDate) < thirtyDaysAgo;
                const statusLabel = isFinal ? "Paid" : isOverdue ? "Overdue" : "Draft";
                const statusCls = isFinal 
                  ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" 
                  : isOverdue 
                    ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" 
                    : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#F7F5F2] transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1C335E]">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1C335E] max-w-[200px] truncate">
                      {inv.consignee.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#6F7B8E] max-w-[150px] truncate">
                      {inv.finalDestination}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#6F7B8E] font-mono text-xs">
                      {formatDateForUI(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#6F7B8E] font-mono text-xs">
                      {inv._count.items}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center justify-center rounded-none border border-[#1C335E] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1C335E] hover:bg-[#1C335E]/5 transition-all"
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
