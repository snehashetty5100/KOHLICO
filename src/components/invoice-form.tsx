"use client";
// src/components/invoice-form.tsx
// Full invoice creation / editing form with dynamic line items and auto-calculations.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

// ── Validation Schema ─────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  hsCode: z.string().min(1, "HS Code is required"),
  packageDescription: z.string().min(1, "Package description is required"),
  marksAndNos: z.string().optional(),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => {
      const parsed = parseInt(val, 10);
      return !isNaN(parsed) && Number.isInteger(parsed) && parsed >= 1;
    }, "Quantity must be an integer >= 1"),
  rate: z
    .string()
    .min(1, "Rate is required")
    .refine((val) => {
      const parsed = parseFloat(val);
      return !isNaN(parsed) && parsed >= 0;
    }, "Rate must be a non-negative number"),
  netWeight: z
    .string()
    .min(1, "Net weight is required")
    .refine((val) => {
      const parsed = parseFloat(val);
      return !isNaN(parsed) && parsed >= 0;
    }, "Net weight must be a non-negative number"),
  grossWeight: z
    .string()
    .min(1, "Gross weight is required")
    .refine((val) => {
      const parsed = parseFloat(val);
      return !isNaN(parsed) && parsed >= 0;
    }, "Gross weight must be a non-negative number"),
  igstRate: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 1), {
      message: "IGST rate must be between 0 and 1",
    }),
  district: z.string().optional(),
  state: z.string().optional(),
});

const invoiceSchema = z.object({
  invoiceNo: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  proformaInvNo: z.string().optional(),
  proformaDate: z.string().optional(),
  iecCode: z.string().min(1, "IEC Code is required"),
  panNo: z.string().min(1, "PAN No is required"),
  gstinNo: z.string().min(1, "GSTIN No is required"),
  endUseCode: z.string().optional(),
  consigneeId: z.string().min(1, "Consignee is required"),
  buyerId: z.string().optional(),
  preCarriage: z.string().min(1, "Pre-carriage is required"),
  portOfReceipt: z.string().min(1, "Port of receipt is required"),
  vesselFlight: z.string().optional(),
  portOfLoading: z.string().min(1, "Port of loading is required"),
  portOfDischarge: z.string().min(1, "Port of discharge is required"),
  finalDestination: z.string().min(1, "Final destination is required"),
  countryOfOrigin: z.string().optional(),
  countryOfDestination: z.string().optional(),
  termsOfDelivery: z.string().min(1, "Terms of delivery is required"),
  exchangeRate: z
    .string()
    .min(1, "Exchange rate is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Exchange rate must be a non-negative number"),
  insuranceCAD: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Insurance must be a non-negative number"),
  status: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "At least one item is required"),
});

type InvoiceValues = z.infer<typeof invoiceSchema>;

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

function blankItem() {
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

  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
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
      status: defaultValues?.status ?? "draft",
      items: defaultValues?.items.length
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
        : [blankItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // ── Product Catalog Auto-Fill ────────────────────────────────────────────────

  function selectProduct(index: number, productId: string) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) {
      setValue(`items.${index}.productId`, "");
      return;
    }
    setValue(`items.${index}.productId`, p.id);
    setValue(`items.${index}.description`, p.description, { shouldValidate: true });
    setValue(`items.${index}.hsCode`, p.hsCode, { shouldValidate: true });
    setValue(`items.${index}.packageDescription`, p.defaultPackaging ?? "", { shouldValidate: true });
    setValue(`items.${index}.rate`, p.defaultRate.toString(), { shouldValidate: true });
    setValue(`items.${index}.netWeight`, p.defaultNetWeight.toString(), { shouldValidate: true });
    setValue(`items.${index}.grossWeight`, p.defaultGrossWeight.toString(), { shouldValidate: true });
    setValue(`items.${index}.igstRate`, p.igstRate.toString(), { shouldValidate: true });
    setValue(`items.${index}.district`, p.originDistrict ?? "", { shouldValidate: true });
    setValue(`items.${index}.state`, p.originState ?? "", { shouldValidate: true });
  }

  // ── Calculations Watchers ────────────────────────────────────────────────────

  const exchangeRateWatch = watch("exchangeRate");
  const insuranceCADWatch = watch("insuranceCAD");
  const itemsWatch = watch("items");

  const exRate = parseFloat(exchangeRateWatch || "") || 0;

  function calcItem(it: any) {
    const qty = parseFloat(it?.quantity) || 0;
    const rate = parseFloat(it?.rate) || 0;
    const netWt = parseFloat(it?.netWeight) || 0;
    const grossWt = parseFloat(it?.grossWeight) || 0;
    const igst = parseFloat(it?.igstRate) || 0.05;
    const fobCAD = qty * rate;
    const taxableINR = fobCAD * exRate;
    const igstINR = taxableINR * igst;
    const totalNetWt = qty * netWt;
    const totalGrossWt = qty * grossWt;
    return { fobCAD, taxableINR, igstINR, totalNetWt, totalGrossWt };
  }

  const totals = (itemsWatch || []).reduce(
    (acc, it) => {
      const c = calcItem(it);
      return {
        fobCAD: acc.fobCAD + c.fobCAD,
        taxableINR: acc.taxableINR + c.taxableINR,
        igstINR: acc.igstINR + c.igstINR,
        netWt: acc.netWt + c.totalNetWt,
        grossWt: acc.grossWt + c.totalGrossWt,
        pkgs: acc.pkgs + (parseInt(it?.quantity, 10) || 0),
      };
    },
    { fobCAD: 0, taxableINR: 0, igstINR: 0, netWt: 0, grossWt: 0, pkgs: 0 }
  );

  const insCAD = parseFloat(insuranceCADWatch || "") || 0;
  const ciCAD = totals.fobCAD + insCAD;

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function onSubmit(data: InvoiceValues) {
    setError("");

    const url = isEditing ? `/api/invoices/${defaultValues.id}` : "/api/invoices";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        let message = "Something went wrong";
        try {
          const json = await res.json();
          message = json.error ?? message;
        } catch {
          // Response body was not valid JSON (e.g. HTML error page)
          message = `Server error (${res.status})`;
        }
        setError(message);
        return;
      }

      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputCls = "w-full disabled:opacity-50";
  const labelCls = "block text-[10px] font-semibold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8 font-sans">
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
            <input className={inputCls} {...register("invoiceNo")} placeholder="KF/1902/25-26" />
            {errors.invoiceNo && (
              <p className="mt-1 text-xs text-red-600">{errors.invoiceNo.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Invoice Date *</label>
            <input type="date" className={inputCls} {...register("invoiceDate")} />
            {errors.invoiceDate && (
              <p className="mt-1 text-xs text-red-600">{errors.invoiceDate.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Proforma Invoice No</label>
            <input className={inputCls} {...register("proformaInvNo")} />
            {errors.proformaInvNo && (
              <p className="mt-1 text-xs text-red-600">{errors.proformaInvNo.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Proforma Date</label>
            <input type="date" className={inputCls} {...register("proformaDate")} />
            {errors.proformaDate && (
              <p className="mt-1 text-xs text-red-600">{errors.proformaDate.message}</p>
            )}
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
            <input className={inputCls} {...register("iecCode")} />
            {errors.iecCode && (
              <p className="mt-1 text-xs text-red-600">{errors.iecCode.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>PAN No *</label>
            <input className={inputCls} {...register("panNo")} />
            {errors.panNo && (
              <p className="mt-1 text-xs text-red-600">{errors.panNo.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>GSTIN No *</label>
            <input className={inputCls} {...register("gstinNo")} />
            {errors.gstinNo && (
              <p className="mt-1 text-xs text-red-600">{errors.gstinNo.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>End Use Code</label>
            <input className={inputCls} {...register("endUseCode")} placeholder="FSH190, GNX100" />
            {errors.endUseCode && (
              <p className="mt-1 text-xs text-red-600">{errors.endUseCode.message}</p>
            )}
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
            <select className={inputCls} {...register("consigneeId")}>
              <option value="">— Select consignee —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
              ))}
            </select>
            {errors.consigneeId && (
              <p className="mt-1 text-xs text-red-600">{errors.consigneeId.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Buyer (if different from consignee)</label>
            <select className={inputCls} {...register("buyerId")}>
              <option value="">— Same as consignee —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
              ))}
            </select>
            {errors.buyerId && (
              <p className="mt-1 text-xs text-red-600">{errors.buyerId.message}</p>
            )}
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
            <input className={inputCls} {...register("preCarriage")} placeholder="BY SEA" />
            {errors.preCarriage && (
              <p className="mt-1 text-xs text-red-600">{errors.preCarriage.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Port of Receipt *</label>
            <input className={inputCls} {...register("portOfReceipt")} placeholder="JNPT" />
            {errors.portOfReceipt && (
              <p className="mt-1 text-xs text-red-600">{errors.portOfReceipt.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Vessel / Flight No</label>
            <input className={inputCls} {...register("vesselFlight")} />
            {errors.vesselFlight && (
              <p className="mt-1 text-xs text-red-600">{errors.vesselFlight.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Port of Loading *</label>
            <input className={inputCls} {...register("portOfLoading")} placeholder="JNPT" />
            {errors.portOfLoading && (
              <p className="mt-1 text-xs text-red-600">{errors.portOfLoading.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Port of Discharge *</label>
            <input className={inputCls} {...register("portOfDischarge")} placeholder="VANCOUVER" />
            {errors.portOfDischarge && (
              <p className="mt-1 text-xs text-red-600">{errors.portOfDischarge.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Final Destination *</label>
            <input className={inputCls} {...register("finalDestination")} placeholder="VANCOUVER" />
            {errors.finalDestination && (
              <p className="mt-1 text-xs text-red-600">{errors.finalDestination.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Country of Origin</label>
            <input className={inputCls} {...register("countryOfOrigin")} />
            {errors.countryOfOrigin && (
              <p className="mt-1 text-xs text-red-600">{errors.countryOfOrigin.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Country of Destination</label>
            <input className={inputCls} {...register("countryOfDestination")} />
            {errors.countryOfDestination && (
              <p className="mt-1 text-xs text-red-600">{errors.countryOfDestination.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-[#D8D3C8] dark:border-[#33312D]">
          <div className="sm:col-span-2">
            <label className={labelCls}>Terms of Delivery *</label>
            <input className={inputCls} {...register("termsOfDelivery")} placeholder="C & I CAD $ BY SEA" />
            {errors.termsOfDelivery && (
              <p className="mt-1 text-xs text-red-600">{errors.termsOfDelivery.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Exchange Rate (INR / CAD) *</label>
            <input type="number" step="0.01" className={inputCls} {...register("exchangeRate")} placeholder="64.45" />
            {errors.exchangeRate && (
              <p className="mt-1 text-xs text-red-600">{errors.exchangeRate.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Insurance (CAD)</label>
            <input type="number" step="0.001" className={inputCls} {...register("insuranceCAD")} placeholder="8.249" />
            {errors.insuranceCAD && (
              <p className="mt-1 text-xs text-red-600">{errors.insuranceCAD.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 5: Line Items ── */}
      <section className="border border-[#D8D3C8] dark:border-[#33312D] p-6 sm:p-8 rounded-none bg-transparent space-y-6">
        <div className="flex items-center justify-between border-b border-[#D8D3C8] dark:border-[#33312D] pb-3">
          <h2 className="text-xs font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider font-serif">
            Line Items
          </h2>
          <button type="button" onClick={() => append(blankItem())}
            className="inline-flex items-center justify-center gap-1.5 rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            + Add Item
          </button>
        </div>

        <div className="space-y-6">
          {fields.map((field, idx) => {
            const item = itemsWatch?.[idx];
            const calc = calcItem(item);
            return (
              <div key={idx} className="border border-[#D8D3C8] dark:border-[#33312D] p-6 space-y-5 bg-transparent rounded-none">
                <div className="flex items-center justify-between border-b border-[#D8D3C8] dark:border-[#33312D] pb-2">
                  <span className="text-[10px] font-mono font-bold text-[#7A756B] dark:text-[#9E998F] uppercase tracking-wider">Item {idx + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)}
                      className="text-xs font-semibold text-[#C1443C] dark:text-[#E8655E] hover:underline uppercase tracking-wider">
                      Remove Item
                    </button>
                  )}
                </div>

                {/* Product picker */}
                <div>
                  <label className={labelCls}>Select from Product Catalogue (auto-fills fields)</label>
                  <select
                    className={inputCls}
                    {...register(`items.${idx}.productId`, {
                      onChange: (e) => selectProduct(idx, e.target.value),
                    })}
                  >
                    <option value="">— Manual entry —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.description}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Description *</label>
                    <input
                      className={inputCls}
                      {...register(`items.${idx}.description`)}
                      placeholder="e.g. ROASTED CHANA W/H SKIN IN POUCH"
                    />
                    {errors.items?.[idx]?.description && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].description.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>HS Code *</label>
                    <input
                      className={inputCls}
                      {...register(`items.${idx}.hsCode`)}
                      placeholder="21069099"
                    />
                    {errors.items?.[idx]?.hsCode && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].hsCode.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Package Description *</label>
                    <input
                      className={inputCls}
                      {...register(`items.${idx}.packageDescription`)}
                      placeholder="20 X 400 GM"
                    />
                    {errors.items?.[idx]?.packageDescription && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].packageDescription.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Marks & Nos</label>
                    <input
                      className={inputCls}
                      {...register(`items.${idx}.marksAndNos`)}
                      placeholder="KFBPL/VANCOUVER CTNS NO."
                    />
                    {errors.items?.[idx]?.marksAndNos && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].marksAndNos.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Qty / Rate / Weights */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-[#D8D3C8] dark:border-[#33312D] pt-4">
                  <div>
                    <label className={labelCls}>Qty (pkgs) *</label>
                    <input
                      type="number"
                      className={inputCls}
                      {...register(`items.${idx}.quantity`)}
                    />
                    {errors.items?.[idx]?.quantity && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].quantity.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Rate (FOB CAD/pkg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputCls}
                      {...register(`items.${idx}.rate`)}
                    />
                    {errors.items?.[idx]?.rate && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].rate.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Net Wt/pkg (kg) *</label>
                    <input
                      type="number"
                      step="0.001"
                      className={inputCls}
                      {...register(`items.${idx}.netWeight`)}
                    />
                    {errors.items?.[idx]?.netWeight && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].netWeight.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Gross Wt/pkg (kg) *</label>
                    <input
                      type="number"
                      step="0.001"
                      className={inputCls}
                      {...register(`items.${idx}.grossWeight`)}
                    />
                    {errors.items?.[idx]?.grossWeight && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].grossWeight.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>IGST Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputCls}
                      {...register(`items.${idx}.igstRate`)}
                    />
                    {errors.items?.[idx]?.igstRate && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.items[idx].igstRate.message}
                      </p>
                    )}
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
        <button type="submit" disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-none bg-[#1C2B33] dark:bg-[#F7F5F1] text-[#F7F5F1] dark:text-[#1C2B33] border border-[#1C2B33] dark:border-[#F7F5F1] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50">
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Invoice"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-none border border-[#1C2B33] dark:border-[#F7F5F1] bg-transparent px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#1C2B33] dark:text-[#F7F5F1] hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}