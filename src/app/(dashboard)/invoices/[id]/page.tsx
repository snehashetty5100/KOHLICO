// src/app/(dashboard)/invoices/[id]/page.tsx
// Invoice detail view — shows all header info, line items, totals, and actions.

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import FinalizeButton from "./finalize-button";
import DeleteInvoiceButton from "./delete-button";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
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
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNo}</h1>
          <p className="text-sm text-gray-500">
            {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")} ·{" "}
            <span
              className={`font-medium ${
                isDraft ? "text-yellow-600" : "text-green-600"
              }`}
            >
              {invoice.status.toUpperCase()}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isDraft && (
            <>
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </Link>
              <FinalizeButton id={invoice.id} />
            </>
          )}
          <a
            href={`/api/invoices/${invoice.id}/excel`}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Download Excel
          </a>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            Download PDF
          </a>
          <DeleteInvoiceButton id={invoice.id} />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Exporter / Invoice Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2 text-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Invoice Info</h2>
          <Row label="Invoice No" value={invoice.invoiceNo} />
          <Row label="Invoice Date" value={new Date(invoice.invoiceDate).toLocaleDateString("en-IN")} />
          {invoice.proformaInvNo && <Row label="Proforma No" value={invoice.proformaInvNo} />}
          <Row label="IEC Code" value={invoice.iecCode} />
          <Row label="PAN No" value={invoice.panNo} />
          <Row label="GSTIN" value={invoice.gstinNo} />
          {invoice.endUseCode && <Row label="End Use Code" value={invoice.endUseCode} />}
        </div>

        {/* Parties */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2 text-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Parties</h2>
          <Row label="Consignee" value={invoice.consignee.name} />
          <Row label="Consignee Country" value={invoice.consignee.country} />
          <Row label="Consignee Address" value={invoice.consignee.address} />
          {invoice.buyer && (
            <>
              <Row label="Buyer" value={invoice.buyer.name} />
              <Row label="Buyer Address" value={invoice.buyer.address} />
            </>
          )}
        </div>

        {/* Shipping */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2 text-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Shipping</h2>
          <Row label="Pre-Carriage" value={invoice.preCarriage} />
          <Row label="Port of Receipt" value={invoice.portOfReceipt} />
          {invoice.vesselFlight && <Row label="Vessel / Flight" value={invoice.vesselFlight} />}
          <Row label="Port of Loading" value={invoice.portOfLoading} />
          <Row label="Port of Discharge" value={invoice.portOfDischarge} />
          <Row label="Final Destination" value={invoice.finalDestination} />
          <Row label="Country of Origin" value={invoice.countryOfOrigin} />
          <Row label="Country of Destination" value={invoice.countryOfDestination} />
        </div>

        {/* Terms / Financials */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2 text-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Terms & Financials</h2>
          <Row label="Terms of Delivery" value={invoice.termsOfDelivery} />
          <Row label="Exchange Rate (INR/CAD)" value={invoice.exchangeRate.toFixed(2)} />
          <Row label="Insurance (CAD)" value={insCAD.toFixed(3)} />
          <Row label="Total FOB CAD" value={totals.fobCAD.toFixed(2)} />
          <Row label="Total C&I CAD" value={ciCAD.toFixed(2)} />
          <Row label="Total Taxable INR" value={totals.taxableINR.toFixed(2)} />
          <Row label="Total IGST INR" value={totals.igstINR.toFixed(2)} />
          <Row label="Total Net Wt (kg)" value={totals.netWt.toFixed(3)} />
          <Row label="Total Gross Wt (kg)" value={totals.grossWt.toFixed(3)} />
          <Row label="Total Pkgs (CTNS)" value={totals.pkgs.toString()} />
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">HS Code</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Packaging</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Rate (CAD)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">FOB CAD</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Taxable INR</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">IGST INR</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Net Wt (kg)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Gross Wt (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item, i) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                  {item.description}
                  {item.marksAndNos && (
                    <p className="text-xs text-gray-400">{item.marksAndNos}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.hsCode}</td>
                <td className="px-4 py-3 text-gray-600">{item.packageDescription}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.rate.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">{item.fobCAD.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.taxableValueINR.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.igstAmountINR.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.netWeight.toFixed(3)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.grossWeight.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold text-sm">
            <tr>
              <td className="px-4 py-3 text-gray-700" colSpan={4}>Totals</td>
              <td className="px-4 py-3 text-right">{totals.pkgs}</td>
              <td />
              <td className="px-4 py-3 text-right">{totals.fobCAD.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{totals.taxableINR.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{totals.igstINR.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{totals.netWt.toFixed(3)}</td>
              <td className="px-4 py-3 text-right">{totals.grossWt.toFixed(3)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-44 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
