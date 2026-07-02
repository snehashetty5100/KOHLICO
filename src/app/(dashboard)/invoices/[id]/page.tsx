// src/app/(dashboard)/invoices/[id]/page.tsx
// Invoice detail view — shows all header info, line items, totals, and actions.

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import FinalizeButton from "./finalize-button";
import DeleteInvoiceButton from "./delete-button";

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
    <div className="space-y-8">
      {/* Breadcrumb + Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 dark:border-gray-900 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
            <Link href="/invoices" className="hover:text-primary-600 transition-colors">Invoices</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 dark:text-white font-mono">{invoice.invoiceNo}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">{invoice.invoiceNo}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isDraft
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50"
              }`}
            >
              {isDraft ? "Draft" : "Finalized"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <>
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-950 transition-all shadow-xs"
              >
                Edit Draft
              </Link>
              <FinalizeButton id={invoice.id} />
            </>
          )}
          <a
            href={`/api/invoices/${invoice.id}/excel`}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all shadow-xs"
          >
            Excel
          </a>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 dark:bg-gray-800 hover:bg-gray-850 dark:hover:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-xs"
          >
            PDF Preview
          </a>
          <DeleteInvoiceButton id={invoice.id} />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Exporter / Invoice Info */}
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-900 pb-2">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Invoice Information</h2>
          </div>
          <div className="space-y-2.5 text-sm">
            <Row label="Invoice Number" value={invoice.invoiceNo} />
            <Row label="Invoice Date" value={new Date(invoice.invoiceDate).toLocaleDateString("en-IN")} />
            {invoice.proformaInvNo && <Row label="Proforma Number" value={invoice.proformaInvNo} />}
            {invoice.proformaDate && <Row label="Proforma Date" value={new Date(invoice.proformaDate).toLocaleDateString("en-IN")} />}
            <Row label="IEC Code" value={invoice.iecCode} />
            <Row label="PAN Number" value={invoice.panNo} />
            <Row label="GSTIN Number" value={invoice.gstinNo} />
            {invoice.endUseCode && <Row label="End Use Code" value={invoice.endUseCode} />}
          </div>
        </div>

        {/* Parties */}
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-900 pb-2">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Parties & Destinations</h2>
          </div>
          <div className="space-y-2.5 text-sm">
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
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-900 pb-2">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Shipping & Vessel Details</h2>
          </div>
          <div className="space-y-2.5 text-sm">
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
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-900 pb-2">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Terms & Financial Calculations</h2>
          </div>
          <div className="space-y-2.5 text-sm">
            <Row label="Terms of Delivery" value={invoice.termsOfDelivery} />
            <Row label="Exchange Rate (INR/CAD)" value={`${invoice.exchangeRate.toFixed(2)} INR`} />
            <Row label="Insurance (CAD)" value={`${insCAD.toFixed(3)} CAD`} className="font-mono text-gray-950 dark:text-white" />
            <Row label="Total FOB CAD" value={`${totals.fobCAD.toFixed(2)} CAD`} className="font-mono font-bold text-primary-600 dark:text-primary-400" />
            <Row label="Total C&I CAD" value={`${ciCAD.toFixed(2)} CAD`} className="font-mono font-bold text-gray-950 dark:text-white" />
            <Row label="Total Taxable INR" value={`${totals.taxableINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR`} className="font-mono" />
            <Row label="Total IGST INR" value={`${totals.igstINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR`} className="font-mono" />
            <Row label="Total Net Wt (kg)" value={`${totals.netWt.toFixed(3)} kg`} className="font-mono" />
            <Row label="Total Gross Wt (kg)" value={`${totals.grossWt.toFixed(3)} kg`} className="font-mono" />
            <Row label="Total Packages" value={`${totals.pkgs} CTNS`} className="font-mono font-bold" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-gray-950 dark:text-white">Line Items</h2>
        
        <div className="overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-900 text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-4 w-12 text-center">#</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">HS Code</th>
                  <th className="px-6 py-4">Packaging</th>
                  <th className="px-4 py-4 text-right">Qty</th>
                  <th className="px-4 py-4 text-right">Rate (CAD)</th>
                  <th className="px-4 py-4 text-right">FOB CAD</th>
                  <th className="px-4 py-4 text-right">Taxable INR</th>
                  <th className="px-4 py-4 text-right">IGST INR</th>
                  <th className="px-4 py-4 text-right">Net Wt</th>
                  <th className="px-4 py-4 text-right">Gross Wt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900 bg-white dark:bg-gray-950/20">
                {invoice.items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-4 text-center font-mono text-gray-400">{i + 1}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white max-w-xs">
                      {item.description}
                      {item.marksAndNos && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">{item.marksAndNos}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{item.hsCode}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.packageDescription}</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-900 dark:text-gray-200">{item.quantity}</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-600 dark:text-gray-400">{item.rate.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-primary-600 dark:text-primary-400">{item.fobCAD.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-600 dark:text-gray-400">{item.taxableValueINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-600 dark:text-gray-400">{item.igstAmountINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-600 dark:text-gray-400">{item.netWeight.toFixed(3)}</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-600 dark:text-gray-400">{item.grossWeight.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50/50 dark:bg-gray-900/10 font-bold text-sm border-t border-gray-100 dark:border-gray-900">
                <tr>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300" colSpan={4}>Totals</td>
                  <td className="px-4 py-4 text-right font-mono">{totals.pkgs}</td>
                  <td />
                  <td className="px-4 py-4 text-right font-mono text-primary-600 dark:text-primary-400">{totals.fobCAD.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right font-mono">{totals.taxableINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4 text-right font-mono">{totals.igstINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4 text-right font-mono">{totals.netWt.toFixed(3)}</td>
                  <td className="px-4 py-4 text-right font-mono">{totals.grossWt.toFixed(3)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-gray-50/50 dark:border-gray-900/50 last:border-b-0">
      <span className="text-gray-400 dark:text-gray-500 font-semibold">{label}</span>
      <span className={`text-gray-900 dark:text-gray-250 font-medium sm:text-right ${className}`}>{value}</span>
    </div>
  );
}

