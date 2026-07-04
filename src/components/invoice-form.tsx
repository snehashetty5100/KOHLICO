"use client";
// src/components/invoice-form.tsx
// Full invoice creation / editing form with dynamic line items and auto-calculations.

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  address: string;
  country: string;
}

interface Product {
  id: string;
  description: string;
  hsCode: string;
  defaultPackaging: string | null;
  defaultRate: number;
  defaultNetWeight: number;
  defaultGrossWeight: number;
  igstRate: number;
  originDistrict: string | null;
  originState: string | null;
}

interface LineItem {
  productId: string;
  description: string;
  hsCode: string;
  packageDescription: string;
  marksAndNos: string;
  quantity: string;
  rate: string;
  netWeight: string;    // per package
  grossWeight: string;  // per package
  igstRate: string;
  district: string;
  state: string;
}

interface InvoiceFormProps {
  customers: Customer[];
  products: Product[];
  defaultValues?: {
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    proformaInvNo?: string;
    proformaDate?: string;
    iecCode: string;
    panNo: string;
    gstinNo: string;
    endUseCode?: string;
    consigneeId: string;
    buyerId?: string;
    preCarriage: string;
    portOfReceipt: string;
    vesselFlight?: string;
    portOfLoading: string;
    portOfDischarge: string;
    finalDestination: string;
    countryOfOrigin: string;
    countryOfDestination: string;
    termsOfDelivery: string;
    exchangeRate: number;
    insuranceCAD?: number;
    status: string;
    items: {
      productId?: string | null;
      description: string;
      hsCode: string;
      packageDescription: string;
      marksAndNos?: string | null;
      quantity: number;
      rate: number;
      netWeight: number;
      grossWeight: number;
      igstRate: number;
      district?: string | null;
      state?: string | null;
    }[];
  };
}

// ── Blank line item ────────────────────────────────────────────────────────────

function blankItem(): LineItem {
  return {
    productId: "",
    description: "",
    hsCode: "",
    packageDescription: "",
    marksAndNos: "",
    quantity: "",
    rate: "",
    netWeight: "",
    grossWeight: "",
    igstRate: "0.05",
    district: "",
    state: "",
  };
}

// ── Helper: format number ──────────────────────────────────────────────────────

function n(val: string | number, decimals = 2): string {
  const num = parseFloat(String(val));
  return isNaN(num) ? "—" : num.toFixed(decimals);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvoiceForm({
  customers,
  products,
  defaultValues,
}: InvoiceFormProps) {
  const router = useRouter();
  const isEditing = !!defaultValues;

  // ── Header state ────────────────────────────────────────────────────────────
  const [header, setHeader] = useState({
    invoiceNo: defaultValues?.invoiceNo ?? "",
    invoiceDate: defaultValues?.invoiceDate?.slice(0, 10) ?? "",
    proformaInvNo: defaultValues?.proformaInvNo ?? "",
    proformaDate: defaultValues?.proformaDate?.slice(0, 10) ?? "",
    iecCode: defaultValues?.iecCode ?? "0302068180",
    panNo: defaultValues?.panNo ?? "AACCK0018J",
    gstinNo: defaultValues?.gstinNo ?? "27AACCK0018J1ZS",
    endUseCode: defaultValues?.endUseCode ?? "FSH190, GNX100",
    consigneeId: defaultValues?.consigneeId ?? "",
    buyerId: defaultValues?.buyerId ?? "",
    preCarriage: defaultValues?.preCarriage ?? "BY SEA",
    portOfReceipt: defaultValues?.portOfReceipt ?? "JNPT",
    vesselFlight: defaultValues?.vesselFlight ?? "",
    portOfLoading: defaultValues?.portOfLoading ?? "JNPT",
    portOfDischarge: defaultValues?.portOfDischarge ?? "VANCOUVER",
    finalDestination: defaultValues?.finalDestination ?? "VANCOUVER",
    countryOfOrigin: defaultValues?.countryOfOrigin ?? "INDIA",
    countryOfDestination: defaultValues?.countryOfDestination ?? "CANADA",
    termsOfDelivery: defaultValues?.termsOfDelivery ?? "C & I CAD $ BY SEA",
    exchangeRate: defaultValues?.exchangeRate?.toString() ?? "",
    insuranceCAD: defaultValues?.insuranceCAD?.toString() ?? "",
  });

  // ── Line items state ────────────────────────────────────────────────────────
  const [items, setItems] = useState<LineItem[]>(
    defaultValues?.items.length
      ? defaultValues.items.map((it) => ({
          productId: it.productId ?? "",
          description: it.description,
          hsCode: it.hsCode,
          packageDescription: it.packageDescription,
          marksAndNos: it.marksAndNos ?? "",
          quantity: it.quantity.toString(),
          rate: it.rate.toString(),
          netWeight: it.netWeight.toString(),
          grossWeight: it.grossWeight.toString(),
          igstRate: it.igstRate.toString(),
          district: it.district ?? "",
          state: it.state ?? "",
        }))
      : [blankItem()]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Header change handler ───────────────────────────────────────────────────
  function setH(field: string, value: string) {
    setHeader((prev) => ({ ...prev, [field]: value }));
  }

  // ── Line item handlers ──────────────────────────────────────────────────────
  function setItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  }

  function selectProduct(index: number, productId: string) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) {
      setItem(index, "productId", "");
      return;
    }
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              productId: p.id,
              description: p.description,
              hsCode: p.hsCode,
              packageDescription: p.defaultPackaging ?? "",
              rate: p.defaultRate.toString(),
              netWeight: p.defaultNetWeight.toString(),
              grossWeight: p.defaultGrossWeight.toString(),
              igstRate: p.igstRate.toString(),
              district: p.originDistrict ?? "",
              state: p.originState ?? "",
            }
          : it
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, blankItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Calculated values ───────────────────────────────────────────────────────
  const exRate = parseFloat(header.exchangeRate) || 0;

  function calcItem(it: LineItem) {
    const qty = parseFloat(it.quantity) || 0;
    const rate = parseFloat(it.rate) || 0;
    const netWt = parseFloat(it.netWeight) || 0;
    const grossWt = parseFloat(it.grossWeight) || 0;
    const igst = parseFloat(it.igstRate) || 0.05;
    const fobCAD = qty * rate;
    const taxableINR = fobCAD * exRate;
    const igstINR = taxableINR * igst;
    const totalNetWt = qty * netWt;
    const totalGrossWt = qty * grossWt;
    return { fobCAD, taxableINR, igstINR, totalNetWt, totalGrossWt };
  }

  const totals = items.reduce(
    (acc, it) => {
      const c = calcItem(it);
      return {
        fobCAD: acc.fobCAD + c.fobCAD,
        taxableINR: acc.taxableINR + c.taxableINR,
        igstINR: acc.igstINR + c.igstINR,
        netWt: acc.netWt + c.totalNetWt,
        grossWt: acc.grossWt + c.totalGrossWt,
        pkgs: acc.pkgs + (parseInt(it.quantity) || 0),
      };
    },
    { fobCAD: 0, taxableINR: 0, igstINR: 0, netWt: 0, grossWt: 0, pkgs: 0 }
  );

  const insCAD = parseFloat(header.insuranceCAD) || 0;
  const ciCAD = totals.fobCAD + insCAD;

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = { ...header, items };
    const url = isEditing ? `/api/invoices/${defaultValues.id}` : "/api/invoices";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Something went wrong";
        try {
          const data = await res.json();
          message = data.error ?? message;
        } catch {
          // Response body was not valid JSON (e.g. HTML error page)
          message = `Server error (${res.status})`;
        }
        setError(message);
        setLoading(false);
        return;
      }

      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputCls = "w-full disabled:opacity-50";
  const labelCls = "block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
      {error && (
        <p className="rounded-none bg-[#C1443C]/10 dark:bg-[#E8655E]/10 px-4 py-2.5 text-xs text-[#C1443C] dark:text-[#E8655E] border border-[#C1443C]/20 dark:border-[#E8655E]/20 font-mono">
          {error}
        </p>
      )}

      {/* ── Section 1: Invoice Identity ── */}
      <section className="border border-[#D8D3C8] dark:border-[#33312D] p-6 sm:p-8 rounded-none bg-transparent space-y-6">
        <h2 className="text-xs font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider border-b border-[#D8D3C8] dark:border-[#33312D] pb-3 font-serif">
          Invoice Details
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Invoice No *</label>
            <input className={inputCls} required value={header.invoiceNo}
              onChange={(e) => setH("invoiceNo", e.target.value)}
              placeholder="KF/1902/25-26" />
          </div>
          <div>
            <label className={labelCls}>Invoice Date *</label>
            <input type="date" className={inputCls} required value={header.invoiceDate}
              onChange={(e) => setH("invoiceDate", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Proforma Invoice No</label>
            <input className={inputCls} value={header.proformaInvNo}
              onChange={(e) => setH("proformaInvNo", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Proforma Date</label>
            <input type="date" className={inputCls} value={header.proformaDate}
              onChange={(e) => setH("proformaDate", e.target.value)} />
          </div>
        </div>
      </section>

      {/* ── Section 2: Exporter Details ── */}
      <section className="border border-[#D8D3C8] dark:border-[#33312D] p-6 sm:p-8 rounded-none bg-transparent space-y-6">
        <h2 className="text-xs font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider border-b border-[#D8D3C8] dark:border-[#33312D] pb-3 font-serif">
          Exporter Details
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <div>
            <label className={labelCls}>IEC Code *</label>
            <input className={inputCls} required value={header.iecCode}
              onChange={(e) => setH("iecCode", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>PAN No *</label>
            <input className={inputCls} required value={header.panNo}
              onChange={(e) => setH("panNo", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>GSTIN No *</label>
            <input className={inputCls} required value={header.gstinNo}
              onChange={(e) => setH("gstinNo", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>End Use Code</label>
            <input className={inputCls} value={header.endUseCode}
              onChange={(e) => setH("endUseCode", e.target.value)}
              placeholder="FSH190, GNX100" />
          </div>
        </div>
      </section>

      {/* ── Section 3: Parties ── */}
      <section className="border border-[#D8D3C8] dark:border-[#33312D] p-6 sm:p-8 rounded-none bg-transparent space-y-6">
        <h2 className="text-xs font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider border-b border-[#D8D3C8] dark:border-[#33312D] pb-3 font-serif">
          Parties
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Consignee *</label>
            <select className={inputCls} required value={header.consigneeId}
              onChange={(e) => setH("consigneeId", e.target.value)}>
              <option value="">— Select consignee —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Buyer (if different from consignee)</label>
            <select className={inputCls} value={header.buyerId}
              onChange={(e) => setH("buyerId", e.target.value)}>
              <option value="">— Same as consignee —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Section 4: Shipping ── */}
      <section className="border border-[#D8D3C8] dark:border-[#33312D] p-6 sm:p-8 rounded-none bg-transparent space-y-6">
        <h2 className="text-xs font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider border-b border-[#D8D3C8] dark:border-[#33312D] pb-3 font-serif">
          Shipping Details
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Pre-Carriage *</label>
            <input className={inputCls} required value={header.preCarriage}
              onChange={(e) => setH("preCarriage", e.target.value)} placeholder="BY SEA" />
          </div>
          <div>
            <label className={labelCls}>Port of Receipt *</label>
            <input className={inputCls} required value={header.portOfReceipt}
              onChange={(e) => setH("portOfReceipt", e.target.value)} placeholder="JNPT" />
          </div>
          <div>
            <label className={labelCls}>Vessel / Flight No</label>
            <input className={inputCls} value={header.vesselFlight}
              onChange={(e) => setH("vesselFlight", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Port of Loading *</label>
            <input className={inputCls} required value={header.portOfLoading}
              onChange={(e) => setH("portOfLoading", e.target.value)} placeholder="JNPT" />
          </div>
          <div>
            <label className={labelCls}>Port of Discharge *</label>
            <input className={inputCls} required value={header.portOfDischarge}
              onChange={(e) => setH("portOfDischarge", e.target.value)} placeholder="VANCOUVER" />
          </div>
          <div>
            <label className={labelCls}>Final Destination *</label>
            <input className={inputCls} required value={header.finalDestination}
              onChange={(e) => setH("finalDestination", e.target.value)} placeholder="VANCOUVER" />
          </div>
          <div>
            <label className={labelCls}>Country of Origin</label>
            <input className={inputCls} value={header.countryOfOrigin}
              onChange={(e) => setH("countryOfOrigin", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Country of Destination</label>
            <input className={inputCls} value={header.countryOfDestination}
              onChange={(e) => setH("countryOfDestination", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-[#D8D3C8] dark:border-[#33312D]">
          <div className="sm:col-span-2">
            <label className={labelCls}>Terms of Delivery *</label>
            <input className={inputCls} required value={header.termsOfDelivery}
              onChange={(e) => setH("termsOfDelivery", e.target.value)}
              placeholder="C & I CAD $ BY SEA" />
          </div>
          <div>
            <label className={labelCls}>Exchange Rate (INR / CAD) *</label>
            <input type="number" step="0.01" className={inputCls} required value={header.exchangeRate}
              onChange={(e) => setH("exchangeRate", e.target.value)} placeholder="64.45" />
          </div>
          <div>
            <label className={labelCls}>Insurance (CAD)</label>
            <input type="number" step="0.001" className={inputCls} value={header.insuranceCAD}
              onChange={(e) => setH("insuranceCAD", e.target.value)} placeholder="8.249" />
          </div>
        </div>
      </section>

      {/* ── Section 5: Line Items ── */}
      <section className="border border-[#D8D3C8] dark:border-[#33312D] p-6 sm:p-8 rounded-none bg-transparent space-y-6">
        <div className="flex items-center justify-between border-b border-[#D8D3C8] dark:border-[#33312D] pb-3">
          <h2 className="text-xs font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-serif">
            Line Items
          </h2>
          <button type="button" onClick={addItem}
            className="inline-flex items-center justify-center gap-1.5 rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            + Add Item
          </button>
        </div>

        <div className="space-y-6">
          {items.map((item, idx) => {
            const calc = calcItem(item);
            return (
              <div key={idx} className="border border-[#D8D3C8] dark:border-[#33312D] p-6 space-y-5 bg-transparent rounded-none">
                <div className="flex items-center justify-between border-b border-[#D8D3C8] dark:border-[#33312D] pb-2">
                  <span className="text-[10px] font-mono font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="text-xs font-semibold text-[#C1443C] dark:text-[#E8655E] hover:underline uppercase tracking-wider">
                      Remove Item
                    </button>
                  )}
                </div>

                {/* Product picker */}
                <div>
                  <label className={labelCls}>Select from Product Catalogue (auto-fills fields)</label>
                  <select className={inputCls} value={item.productId}
                    onChange={(e) => selectProduct(idx, e.target.value)}>
                    <option value="">— Manual entry —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.description}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Description *</label>
                    <input className={inputCls} required value={item.description}
                      onChange={(e) => setItem(idx, "description", e.target.value)}
                      placeholder="e.g. ROASTED CHANA W/H SKIN IN POUCH" />
                  </div>
                  <div>
                    <label className={labelCls}>HS Code *</label>
                    <input className={inputCls} required value={item.hsCode}
                      onChange={(e) => setItem(idx, "hsCode", e.target.value)}
                      placeholder="21069099" />
                  </div>
                  <div>
                    <label className={labelCls}>Package Description *</label>
                    <input className={inputCls} required value={item.packageDescription}
                      onChange={(e) => setItem(idx, "packageDescription", e.target.value)}
                      placeholder="20 X 400 GM" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Marks & Nos</label>
                    <input className={inputCls} value={item.marksAndNos}
                      onChange={(e) => setItem(idx, "marksAndNos", e.target.value)}
                      placeholder="KFBPL/VANCOUVER CTNS NO." />
                  </div>
                </div>

                {/* Qty / Rate / Weights */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-[#D8D3C8] dark:border-[#33312D] pt-4">
                  <div>
                    <label className={labelCls}>Qty (pkgs) *</label>
                    <input type="number" min="1" className={inputCls} required value={item.quantity}
                      onChange={(e) => setItem(idx, "quantity", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Rate (FOB CAD/pkg) *</label>
                    <input type="number" step="0.01" className={inputCls} required value={item.rate}
                      onChange={(e) => setItem(idx, "rate", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Net Wt/pkg (kg) *</label>
                    <input type="number" step="0.001" className={inputCls} required value={item.netWeight}
                      onChange={(e) => setItem(idx, "netWeight", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Gross Wt/pkg (kg) *</label>
                    <input type="number" step="0.001" className={inputCls} required value={item.grossWeight}
                      onChange={(e) => setItem(idx, "grossWeight", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>IGST Rate</label>
                    <input type="number" step="0.01" min="0" max="1" className={inputCls} value={item.igstRate}
                      onChange={(e) => setItem(idx, "igstRate", e.target.value)} />
                  </div>
                </div>

                {/* Calculated row */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 border border-[#D8D3C8] dark:border-[#33312D] p-4 text-xs mt-3 font-mono bg-transparent rounded-none">
                  <div>
                    <p className="font-semibold text-[#7A756B] dark:text-[#9E998F] text-[9px] uppercase tracking-wider">FOB CAD</p>
                    <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-sm">{n(calc.fobCAD)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#7A756B] dark:text-[#9E998F] text-[9px] uppercase tracking-wider">Taxable INR</p>
                    <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-sm">{n(calc.taxableINR, 2)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#7A756B] dark:text-[#9E998F] text-[9px] uppercase tracking-wider">IGST (INR)</p>
                    <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-sm">{n(calc.igstINR, 2)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#7A756B] dark:text-[#9E998F] text-[9px] uppercase tracking-wider">Net Wt (kg)</p>
                    <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-sm">{n(calc.totalNetWt, 3)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#7A756B] dark:text-[#9E998F] text-[9px] uppercase tracking-wider">Gross Wt (kg)</p>
                    <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-sm">{n(calc.totalGrossWt, 3)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Totals ── */}
        <div className="border border-[#D8D3C8] dark:border-[#33312D] bg-transparent p-6 mt-8 rounded-none">
          <h3 className="text-xs font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-4 border-b border-[#D8D3C8] dark:border-[#33312D] pb-2 font-serif">Invoice Totals</h3>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 text-sm font-mono">
            <div>
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Total Pkgs</p>
              <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-base">{totals.pkgs}</p>
            </div>
            <div>
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Total FOB CAD</p>
              <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-base">{n(totals.fobCAD)}</p>
            </div>
            <div>
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Insurance (CAD)</p>
              <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-base">{n(insCAD)}</p>
            </div>
            <div className="border border-[#D8D3C8] dark:border-[#33312D] bg-black/[0.01] dark:bg-white/[0.01] p-3 rounded-none -m-3">
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Total C&I CAD</p>
              <p className="font-extrabold text-[#2E5E4E] dark:text-[#49826D] text-lg">{n(ciCAD)}</p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Total Taxable INR</p>
              <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-base">{n(totals.taxableINR, 2)}</p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Total IGST INR</p>
              <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-base">{n(totals.igstINR, 2)}</p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Total Net Wt (kg)</p>
              <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-base">{n(totals.netWt, 3)}</p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-sans font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1">Total Gross Wt (kg)</p>
              <p className="font-bold text-[#1C2B33] dark:text-[#F7F5F1] text-base">{n(totals.grossWt, 3)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Submit ── */}
      <div className="flex gap-3 pt-4 border-t border-[#D8D3C8] dark:border-[#33312D]">
        <button type="submit" disabled={loading}
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50">
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Invoice"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}