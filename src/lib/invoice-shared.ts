// src/lib/invoice-shared.ts
// Shared data structures and calculations for PDF and Excel exports.

export interface SharedInvoiceItem {
  description: string;
  hsCode: string;
  packageDescription: string;
  marksAndNos: string | null;
  quantity: number;
  rate: number;
  fobCAD: number;
  netWeight: number;
  grossWeight: number;
  taxableValueINR: number;
  igstRate: number;
  igstAmountINR: number;
  district?: string | null;
  state?: string | null;
}

export interface SharedProductGroup<T extends SharedInvoiceItem = SharedInvoiceItem> {
  index: number;
  name: string;
  hsCode: string;
  totalQty: number;
  totalFob: number;
  totalCi: number;
  totalTaxINR: number;
  totalIgstINR: number;
  totalNetWt: number;
  totalGrossWt: number;
  ratePerKg: number;
  district: string;
  state: string;
  items: T[];
}

export interface SharedInvoiceTotals {
  pkgs: number;
  fob: number;
  tax: number;
  igst: number;
  net: number;
  grs: number;
  insRate: number;
  totalCi: number;
}

/** Formats a date to en-IN locale format (DD/MM/YYYY) */
export function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Formats a date to en-CA format (YYYY-MM-DD) and sanitizes year overflow bugs */
export function formatDateForUI(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  let year = date.getFullYear();
  if (year > 3000) {
    year = 2026;
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Find the longest common prefix of a list of strings, splitting on whitespace. */
export function commonPrefix(strs: string[]): string {
  if (strs.length === 0) return "";
  if (strs.length === 1) return strs[0];
  const words = strs.map((s) => s.trim().split(/\s+/));
  const result: string[] = [];
  for (let i = 0; i < Math.min(...words.map((w) => w.length)); i++) {
    if (words.every((w) => w[i].toUpperCase() === words[0][i].toUpperCase())) {
      result.push(words[0][i]);
    } else break;
  }
  return result.length > 0 ? result.join(" ") : strs[0];
}

/** Group items by their HS code, calculating group totals and common names */
export function buildGroups<T extends SharedInvoiceItem>(
  items: T[],
  totalFob: number,
  insCAD: number,
): SharedProductGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!map.has(item.hsCode)) map.set(item.hsCode, []);
    map.get(item.hsCode)!.push(item);
  }
  const insRate = totalFob > 0 ? insCAD / totalFob : 0;

  return Array.from(map.entries()).map(([hsCode, groupItems], idx) => {
    const totalQty = groupItems.reduce((s, i) => s + i.quantity, 0);
    const totalFobG = groupItems.reduce((s, i) => s + i.fobCAD, 0);
    const totalTaxINR = groupItems.reduce((s, i) => s + i.taxableValueINR, 0);
    const totalIgstINR = groupItems.reduce((s, i) => s + i.igstAmountINR, 0);
    const totalNetWt = groupItems.reduce((s, i) => s + i.netWeight, 0);
    const totalGrossWt = groupItems.reduce((s, i) => s + i.grossWeight, 0);
    const district = groupItems[0]?.district ?? "";
    const state = groupItems[0]?.state ?? "";
    return {
      index: idx + 1,
      name: commonPrefix(groupItems.map((i) => i.description)),
      hsCode,
      totalQty,
      totalFob: totalFobG,
      totalCi: totalFobG * (1 + insRate),
      totalTaxINR,
      totalIgstINR,
      totalNetWt,
      totalGrossWt,
      ratePerKg: totalNetWt > 0 ? totalFobG / totalNetWt : 0,
      district,
      state,
      items: groupItems,
    };
  });
}

/** Compute aggregate grand totals across all items */
export function calculateTotals<T extends SharedInvoiceItem>(
  items: T[],
  insCAD: number,
): SharedInvoiceTotals {
  const totals = items.reduce(
    (a, i) => ({
      pkgs: a.pkgs + i.quantity,
      fob: a.fob + i.fobCAD,
      tax: a.tax + i.taxableValueINR,
      igst: a.igst + i.igstAmountINR,
      net: a.net + i.netWeight,
      grs: a.grs + i.grossWeight,
    }),
    { pkgs: 0, fob: 0, tax: 0, igst: 0, net: 0, grs: 0 },
  );
  const insRate = totals.fob > 0 ? insCAD / totals.fob : 0;
  const totalCi = totals.fob * (1 + insRate);

  return {
    ...totals,
    insRate,
    totalCi,
  };
}
