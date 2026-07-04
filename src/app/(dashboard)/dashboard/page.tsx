// src/app/(dashboard)/dashboard/page.tsx
// Main dashboard — shows summary stats and recent invoices.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatDateForUI } from "@/lib/invoice-shared";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch recent invoices and data for summary stats
  const [recentInvoices, invoicesForStats] = await Promise.all([
    db.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { consignee: { select: { name: true } } },
    }),
    db.invoice.findMany({
      select: {
        status: true,
        invoiceDate: true,
        insuranceCAD: true,
        items: {
          select: {
            fobCAD: true,
          },
        },
      },
    }),
  ]);

  // Compute summary stats quietly
  let outstandingAmount = 0;
  let draftCount = 0;
  let paidCount = 0;
  let overdueCount = 0;

  for (const inv of invoicesForStats) {
    const itemsTotal = inv.items.reduce((sum, item) => sum + item.fobCAD, 0);
    const totalCAD = itemsTotal + (inv.insuranceCAD ?? 0);
    
    if (inv.status === "final") {
      paidCount++;
    } else {
      draftCount++;
      outstandingAmount += totalCAD;
      if (new Date(inv.invoiceDate) < thirtyDaysAgo) {
        overdueCount++;
      }
    }
  }

  const formatCAD = (val: number) => {
    return `C$ ${val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-12">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4 border-b border-[#D8D6D3] pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C335E]">
            Ledger Overview
          </h1>
          <p className="mt-1.5 text-xs text-[#6F7B8E] uppercase tracking-wider font-mono">
            Active User: {session?.user.name ?? "Staff"}
          </p>
        </div>

        {/* Quick actions - Establish visual hierarchy */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
          >
            <span>+ Invoice</span>
          </Link>
          <Link
            href="/customers/new"
            className="inline-flex items-center justify-center rounded-none border border-[#D8D6D3] text-[#6F7B8E] bg-transparent px-4 py-2 text-xs font-medium uppercase tracking-wider hover:text-[#1C335E] hover:border-[#1C335E] transition-all"
          >
            <span>+ Customer</span>
          </Link>
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center rounded-none border border-[#D8D6D3] text-[#6F7B8E] bg-transparent px-4 py-2 text-xs font-medium uppercase tracking-wider hover:text-[#1C335E] hover:border-[#1C335E] transition-all"
          >
            <span>+ Product</span>
          </Link>
        </div>
      </div>

      {/* Quiet stats metadata below header */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 py-4 border-b border-[#D8D6D3] text-xs font-mono text-[#6F7B8E]">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-sans font-semibold text-[#6F7B8E]/80 mr-2">Outstanding CAD:</span>
          <span className="text-[#1C335E] font-bold">{formatCAD(outstandingAmount)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-sans font-semibold text-[#6F7B8E]/80 mr-2">Overdue CAD Count:</span>
          <span className="text-[#EF4444] font-bold">{overdueCount}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-sans font-semibold text-[#6F7B8E]/80 mr-2">Draft Invoices:</span>
          <span className="text-[#F59E0B] font-bold">{draftCount}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-sans font-semibold text-[#6F7B8E]/80 mr-2">Paid/Finalized:</span>
          <span className="text-[#22C55E] font-bold">{paidCount}</span>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-[#D8D6D3] pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C335E]">
            Recent Ledger Entries
          </h2>
          <Link
            href="/invoices"
            className="text-xs font-semibold text-[#1C335E] uppercase tracking-wider hover:underline"
          >
            View All Entries →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="border border-dashed border-[#D8D6D3] py-16 px-4 text-center bg-transparent">
            <p className="text-sm font-serif text-[#1C335E] mb-2">No Entries Recorded</p>
            <p className="text-xs text-[#6F7B8E] max-w-sm mx-auto mb-6">
              Get started by recording your first export shipment invoice in the financial ledger.
            </p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center justify-center rounded-none bg-[#1C335E] text-white border border-[#1C335E] px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#16294C] transition-all"
            >
              <span>+ Record First Invoice</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D8D6D3] text-xs font-semibold text-[#6F7B8E] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice No.</th>
                  <th className="py-3.5 px-4">Consignee</th>
                  <th className="py-3.5 px-4 text-right">Post Date</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D6D3] text-sm">
                {recentInvoices.map((inv) => {
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
                      <td className="py-3.5 px-4 text-[#1C335E] max-w-[200px] truncate">
                        {inv.consignee.name}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#6F7B8E] font-mono text-xs">
                        {formatDateForUI(inv.invoiceDate)}
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
    </div>
  );
}

