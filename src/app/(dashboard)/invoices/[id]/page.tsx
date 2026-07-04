// src/app/(dashboard)/invoices/[id]/page.tsx
// Invoice detail view — shows all header info, line items, totals, and actions.

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import FinalizeButton from "./finalize-button";
import DeleteInvoiceButton from "./delete-button";
import { formatDateForUI } from "@/lib/invoice-shared";

export default async function InvoiceDetailPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      consignee: true,
      buyer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice) notFound();

  // Totals
  const totals = invoice.items.reduce(
    (acc, it) => ({
      pkgs: acc.pkgs + it.quantity,
      fobCAD: acc.fobCAD + it.fobCAD,
      taxableINR: acc.taxableINR + it.taxableValueINR,
      igstINR: acc.igstINR + it.igstAmountINR,
      netWt: acc.netWt + it.netWeight,
      grossWt: acc.grossWt + it.grossWeight,
    }),
    { pkgs: 0, fobCAD: 0, taxableINR: 0, igstINR: 0, netWt: 0, grossWt: 0 }
  );

  const insCAD = invoice.insuranceCAD ?? 0;
  const ciCAD = totals.fobCAD + insCAD;
  const isDraft = invoice.status === "draft";
  return (
    <div className="space-y-10 font-sans">
      {/* Breadcrumb + Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#D8D3C8] dark:border-[#33312D] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#7A756B] mb-1.5">
            <Link href="/invoices" className="hover:underline">Invoices</Link>
            <span className="text-[#7A756B]/55">/</span>
            <span className="text-[#1C2B33] dark:text-[#F7F5F1]">{invoice.invoiceNo}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1]">{invoice.invoiceNo}</h1>
            <span
              className={`font-mono text-xs font-semibold tracking-wider ${
                isDraft
                  ? "text-[#7A756B]"
                  : "text-[#2E5E4E] dark:text-[#49826D]"
              }`}
            >
              {isDraft ? "[DRAFT]" : "[FINALIZED]"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <>
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="inline-flex items-center justify-center rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Edit Draft
              </Link>
              <FinalizeButton id={invoice.id} />
            </>
          )}
          <a
            href={`/api/invoices/${invoice.id}/excel`}
            className="inline-flex items-center justify-center rounded-none border border-[#2E5E4E] dark:border-[#49826D] bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#2E5E4E] dark:text-[#49826D] hover:bg-[#2E5E4E]/5 dark:hover:bg-[#49826D]/5 transition-all"
          >
            Excel Export
          </a>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all"
          >
            PDF Preview
          </a>
          <DeleteInvoiceButton id={invoice.id} />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Exporter / Invoice Info */}
        <div className="border border-[#D8D3C8] dark:border-[#33312D] p-6 space-y-4 rounded-none bg-transparent">
          <div className="border-b border-[#D8D3C8] dark:border-[#33312D] pb-2">
            <h2 className="font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-xs uppercase tracking-wider">Invoice Information</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Invoice Number" value={invoice.invoiceNo} />
            <Row label="Invoice Date" value={formatDateForUI(invoice.invoiceDate)} />
            {invoice.proformaInvNo && <Row label="Proforma Number" value={invoice.proformaInvNo} />}
            {invoice.proformaDate && <Row label="Proforma Date" value={formatDateForUI(invoice.proformaDate)} />}
            <Row label="IEC Code" value={invoice.iecCode} />
            <Row label="PAN Number" value={invoice.panNo} />
            <Row label="GSTIN Number" value={invoice.gstinNo} />
            {invoice.endUseCode && <Row label="End Use Code" value={invoice.endUseCode} />}
          </div>
        </div>

        {/* Parties */}
        <div className="border border-[#D8D3C8] dark:border-[#33312D] p-6 space-y-4 rounded-none bg-transparent">
          <div className="border-b border-[#D8D3C8] dark:border-[#33312D] pb-2">
            <h2 className="font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-xs uppercase tracking-wider">Parties & Destinations</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Consignee Name" value={invoice.consignee.name} />
            <Row label="Consignee Country" value={invoice.consignee.country} />
            <Row label="Consignee Address" value={invoice.consignee.address} />
            {invoice.buyer ? (
              <>
                <Row label="Buyer Name" value={invoice.buyer.name} />
                <Row label="Buyer Address" value={invoice.buyer.address} />
              </>
            ) : (
              <Row label="Buyer Name" value="Same as consignee" />
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="border border-[#D8D3C8] dark:border-[#33312D] p-6 space-y-4 rounded-none bg-transparent">
          <div className="border-b border-[#D8D3C8] dark:border-[#33312D] pb-2">
            <h2 className="font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-xs uppercase tracking-wider">Shipping & Vessel Details</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Pre-Carriage By" value={invoice.preCarriage} />
            <Row label="Port of Receipt" value={invoice.portOfReceipt} />
            {invoice.vesselFlight && <Row label="Vessel / Flight" value={invoice.vesselFlight} />}
            <Row label="Port of Loading" value={invoice.portOfLoading} />
            <Row label="Port of Discharge" value={invoice.portOfDischarge} />
            <Row label="Final Destination" value={invoice.finalDestination} />
            <Row label="Country of Origin" value={invoice.countryOfOrigin} />
            <Row label="Country of Destination" value={invoice.countryOfDestination} />
          </div>
        </div>

        {/* Terms / Financials */}
        <div className="border border-[#D8D3C8] dark:border-[#33312D] p-6 space-y-4 rounded-none bg-transparent">
          <div className="border-b border-[#D8D3C8] dark:border-[#33312D] pb-2">
            <h2 className="font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-xs uppercase tracking-wider">Terms & Financial Calculations</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Terms of Delivery" value={invoice.termsOfDelivery} />
            <Row label="Exchange Rate" value={`${invoice.exchangeRate.toFixed(2)} INR/CAD`} className="font-mono" />
            <Row label="Insurance" value={`${insCAD.toFixed(3)} CAD`} className="font-mono" />
            <Row label="Total FOB CAD" value={`${totals.fobCAD.toFixed(2)} CAD`} className="font-mono font-bold text-[#2E5E4E] dark:text-[#49826D]" />
            <Row label="Total C&I CAD" value={`${ciCAD.toFixed(2)} CAD`} className="font-mono font-bold text-[#1C2B33] dark:text-[#F7F5F1]" />
            <Row label="Total Taxable INR" value={`${totals.taxableINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR`} className="font-mono" />
            <Row label="Total IGST INR" value={`${totals.igstINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR`} className="font-mono" />
            <Row label="Total Net Wt" value={`${totals.netWt.toFixed(3)} kg`} className="font-mono" />
            <Row label="Total Gross Wt" value={`${totals.grossWt.toFixed(3)} kg`} className="font-mono" />
            <Row label="Total Packages" value={`${totals.pkgs} CTNS`} className="font-mono font-bold" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1]">Line Items</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8D3C8] dark:border-[#33312D] text-[10px] font-sans font-semibold text-[#7A756B] uppercase tracking-wider">
                <th className="py-2 pr-2 w-6 text-center">#</th>
                <th className="py-2 px-2">Description</th>
                <th className="py-2 px-2">HS Code</th>
                <th className="py-2 px-2">Packaging</th>
                <th className="py-2 px-2 text-right">Qty</th>
                <th className="py-2 px-2 text-right">Rate</th>
                <th className="py-2 px-2 text-right">FOB CAD</th>
                <th className="py-2 px-2 text-right">Taxable INR</th>
                <th className="py-2 px-2 text-right">IGST INR</th>
                <th className="py-2 px-2 text-right">Net Wt</th>
                <th className="py-2 px-2 text-right">Gross Wt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D3C8]/40 dark:divide-[#33312D]/40 font-mono text-xs">
              {invoice.items.map((item, i) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-2 text-center text-[#7A756B]">{i + 1}</td>
                  <td className="py-2.5 px-2 font-serif font-bold text-[#1C2B33] dark:text-[#F7F5F1] max-w-xs leading-normal">
                    {item.description}
                    {item.marksAndNos && (
                      <p className="text-[10px] text-[#7A756B] font-sans font-normal mt-0.5">{item.marksAndNos}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-[#7A756B]">{item.hsCode}</td>
                  <td className="py-2.5 px-2 font-serif text-[#7A756B]">{item.packageDescription}</td>
                  <td className="py-2.5 px-2 text-right text-[#1C2B33] dark:text-[#F7F5F1]">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-right text-[#7A756B]">{item.rate.toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-right text-[#1C2B33] dark:text-[#F7F5F1] font-bold">{item.fobCAD.toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-right text-[#7A756B]">{item.taxableValueINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-2 text-right text-[#7A756B]">{item.igstAmountINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-2 text-right text-[#7A756B]">{item.netWeight.toFixed(3)}</td>
                  <td className="py-2.5 px-2 text-right text-[#7A756B]">{item.grossWeight.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-[#D8D3C8] dark:border-[#33312D] font-bold font-mono text-xs">
              <tr className="text-[#1C2B33] dark:text-[#F7F5F1]">
                <td className="py-3 px-2 font-serif font-bold" colSpan={4}>Totals</td>
                <td className="py-3 px-2 text-right">{totals.pkgs}</td>
                <td />
                <td className="py-3 px-2 text-right text-[#2E5E4E] dark:text-[#49826D]">{totals.fobCAD.toFixed(2)}</td>
                <td className="py-3 px-2 text-right">{totals.taxableINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-right">{totals.igstINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-right">{totals.netWt.toFixed(3)}</td>
                <td className="py-3 px-2 text-right">{totals.grossWt.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}



function Row({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="flex justify-between py-1.5 font-sans text-xs border-b border-dashed border-[#D8D3C8]/40 dark:border-[#33312D]/40 last:border-b-0">
      <span className="text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider text-[9px] font-semibold">{label}</span>
      <span className={`text-[#1C2B33] dark:text-[#F7F5F1] ${className}`}>{value}</span>
    </div>
  );
}
