// src/lib/invoice-excel.ts
// Builds an .xlsx workbook matching the real "Invoice Cum Packing List" layout.
// Products grouped by HS code with sub-rows per pack size.

import ExcelJS from "exceljs";

// ── Types (unchanged — must match API route data shape) ──────────────────────

export interface ExcelInvoiceItem {
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
}

export interface ExcelInvoiceData {
  invoiceNo: string;
  invoiceDate: Date;
  proformaInvNo: string | null;
  proformaDate: Date | null;
  iecCode: string;
  panNo: string;
  gstinNo: string;
  endUseCode: string | null;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCountry: string;
  buyerName: string | null;
  buyerAddress: string | null;
  preCarriage: string;
  portOfReceipt: string;
  vesselFlight: string | null;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  countryOfOrigin: string;
  countryOfDestination: string;
  termsOfDelivery: string;
  exchangeRate: number;
  insuranceCAD: number | null;
  items: ExcelInvoiceItem[];
}

// ── Internal: product grouping ───────────────────────────────────────────────

interface ProductGroup {
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
  items: ExcelInvoiceItem[];
}

function commonPrefix(strs: string[]): string {
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

function buildGroups(
  items: ExcelInvoiceItem[],
  totalFob: number,
  insCAD: number,
): ProductGroup[] {
  const map = new Map<string, ExcelInvoiceItem[]>();
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
      items: groupItems,
    };
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type WS = ExcelJS.Worksheet;

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function allBorders(): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };
}



const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE4E4E4" },
};

const GROUP_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
};

const SUBTOTAL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF7F7F7" },
};

/** Set value + style on a single cell. */
function setCell(
  ws: WS,
  row: number,
  col: number,
  value: string | number,
  opts?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    align?: "left" | "center" | "right";
    vAlign?: "top" | "middle" | "bottom";
    wrap?: boolean;
    numFmt?: string;
    fill?: ExcelJS.Fill;
    border?: Partial<ExcelJS.Borders>;
    underline?: boolean;
    color?: string;
  },
) {
  const cell = ws.getRow(row).getCell(col);
  cell.value = value as ExcelJS.CellValue;
  cell.font = {
    bold: opts?.bold ?? false,
    italic: opts?.italic ?? false,
    size: opts?.size ?? 9,
    underline: opts?.underline ?? false,
    color: opts?.color ? { argb: opts.color } : undefined,
  };
  cell.alignment = {
    horizontal: opts?.align ?? "left",
    vertical: opts?.vAlign ?? "middle",
    wrapText: opts?.wrap ?? false,
  };
  if (opts?.numFmt) cell.numFmt = opts.numFmt;
  if (opts?.fill) cell.fill = opts.fill;
  if (opts?.border) cell.border = opts.border;
}

/** Apply borders to a range of cells in a row. */
function borderRow(ws: WS, row: number, from: number, to: number) {
  for (let c = from; c <= to; c++) {
    ws.getRow(row).getCell(c).border = allBorders();
  }
}

// ── Main builder ─────────────────────────────────────────────────────────────

export async function buildInvoiceExcel(
  data: ExcelInvoiceData,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kohlico Invoice App";
  wb.created = new Date();

  const ws = wb.addWorksheet("Invoice Cum Packing List", {
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  // ── Column widths (A=1 through L=12) ──────────────────────────────────────
  // A: Marks & Nos
  // B: No.& Kind of Pkgs (Pack Size)
  // C: Description of Goods
  // D: Qty PKGS
  // E: Rate FOB CAD $/PKG
  // F: Amount FOB CAD $
  // G: Amount C & I CAD $
  // H: Taxable Value
  // I: IGST Rate
  // J: IGST Amount
  // K: Net Wt (kg)
  // L: Gross Wt (kg)
  ws.columns = [
    { width: 18 }, // A
    { width: 16 }, // B
    { width: 34 }, // C
    { width: 8 },  // D
    { width: 14 }, // E
    { width: 14 }, // F
    { width: 14 }, // G
    { width: 16 }, // H
    { width: 7 },  // I
    { width: 14 }, // J
    { width: 12 }, // K
    { width: 12 }, // L
  ];

  const insCAD = data.insuranceCAD ?? 0;

  // Grand totals
  const totals = data.items.reduce(
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
  const groups = buildGroups(data.items, totals.fob, insCAD);
  const marksText = data.items[0]?.marksAndNos ?? "";

  let r = 1;

  // ═══════════════════════════════════════════════════════════════════════════
  // Row 1: Title — "INVOICE CUM PACKING LIST" centered
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:L${r}`);
  setCell(ws, r, 1, "INVOICE CUM PACKING LIST", {
    bold: true,
    size: 12,
    align: "center",
    underline: true,
    border: allBorders(),
  });
  ws.getRow(r).height = 22;
  r++;

  // ═══════════════════════════════════════════════════════════════════════════
  // Row 2: Exporter (left A-D) | Invoice Info (right E-J) | IEC (K-L)
  // ═══════════════════════════════════════════════════════════════════════════
  // Exporter block spans 4 rows (r to r+3)
  ws.mergeCells(`A${r}:D${r + 3}`);
  setCell(
    ws, r, 1,
    "Exporter :\n" +
    "KOHLICO FOODS AND BEVERAGES PVT.LTD\n" +
    "391, NARSI NATHA STREET, MAHESH CHAMBER,\n" +
    "ROOM NO. 2, 1ST FLOOR, MUMBAI - 400009, INDIA",
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );
  // Make company name bold via rich text
  ws.getRow(r).getCell(1).font = { size: 8 };

  // Invoice no & Date (E-G)
  ws.mergeCells(`E${r}:G${r}`);
  setCell(ws, r, 5, "Invoice no. & Date", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  // Proforma Inv. & Date (H-I)
  ws.mergeCells(`H${r}:I${r}`);
  setCell(ws, r, 8, "Proforma Inv. & Date", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  // IEC NO. (K-L)
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, 11, "IEC NO.", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  // J column for this row
  setCell(ws, r, 10, "", { border: allBorders() });
  r++;

  // Values row
  ws.mergeCells(`E${r}:G${r}`);
  setCell(ws, r, 5, data.invoiceNo, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`H${r}:I${r}`);
  setCell(ws, r, 8, data.proformaInvNo ?? "—", { bold: true, size: 9, border: allBorders() });
  setCell(ws, r, 10, "", { border: allBorders() });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, 11, data.iecCode, { bold: true, size: 9, border: allBorders() });
  r++;

  // Date row
  ws.mergeCells(`E${r}:G${r}`);
  setCell(ws, r, 5, `DTD: ${fmtDate(data.invoiceDate)}`, { size: 8, border: allBorders() });
  ws.mergeCells(`H${r}:I${r}`);
  setCell(ws, r, 8, data.proformaDate ? `DT: ${fmtDate(data.proformaDate)}` : "", {
    size: 8, border: allBorders(),
  });
  setCell(ws, r, 10, "", { border: allBorders() });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, 11, "", { border: allBorders() });
  r++;

  // Exporter's Ref / PAN / GSTIN / End Use Code row
  ws.mergeCells(`E${r}:F${r}`);
  setCell(ws, r, 5, "Exporter's Ref.", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`G${r}:H${r}`);
  setCell(ws, r, 7, `PAN NO.  ${data.panNo}`, { size: 8, bold: true, border: allBorders() });
  ws.mergeCells(`I${r}:J${r}`);
  setCell(ws, r, 9, `GSTIN NO.  ${data.gstinNo}`, { size: 8, bold: true, border: allBorders() });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, 11, data.endUseCode ? `END USE CODE:\n${data.endUseCode}` : "", {
    size: 8, bold: true, wrap: true, border: allBorders(),
  });
  r++;

  // ═══════════════════════════════════════════════════════════════════════════
  // Row 3: Consignee (left A-F) | Buyer (right G-L)
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:F${r + 1}`);
  setCell(
    ws, r, 1,
    "Consignee:\n" + data.consigneeName + "\n" + data.consigneeAddress +
    (data.consigneeCountry ? ", " + data.consigneeCountry : ""),
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );
  ws.mergeCells(`G${r}:L${r + 1}`);
  setCell(
    ws, r, 7,
    "Buyer (if other than consignee)\n" +
    (data.buyerName ?? data.consigneeName) + "\n" +
    (data.buyerAddress ?? data.consigneeAddress),
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );
  ws.getRow(r).height = 18;
  ws.getRow(r + 1).height = 18;
  r += 2;

  // ═══════════════════════════════════════════════════════════════════════════
  // Row 4: Pre-Carriage | Port of Receipt | Country of Origin | Country of Dest
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:C${r}`);
  setCell(ws, r, 1, "Pre-Carriage by", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`D${r}:F${r}`);
  setCell(ws, r, 4, "Port of Receipt by Pre-Carriage", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`G${r}:I${r}`);
  setCell(ws, r, 7, "Country of Origin", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`J${r}:L${r}`);
  setCell(ws, r, 10, "Country of Final Destination", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  r++;
  // Values
  ws.mergeCells(`A${r}:C${r}`);
  setCell(ws, r, 1, data.preCarriage, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`D${r}:F${r}`);
  setCell(ws, r, 4, data.portOfReceipt, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`G${r}:I${r}`);
  setCell(ws, r, 7, data.countryOfOrigin, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`J${r}:L${r}`);
  setCell(ws, r, 10, data.countryOfDestination, { bold: true, size: 9, border: allBorders() });
  r++;

  // ═══════════════════════════════════════════════════════════════════════════
  // Row 5: Vessel/Flight | Port of Loading | Port of Discharge | Final Dest
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:C${r}`);
  setCell(ws, r, 1, "Vessel/Flight No.", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`D${r}:F${r}`);
  setCell(ws, r, 4, "Port of Loading", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`G${r}:I${r}`);
  setCell(ws, r, 7, "Port of Discharge", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`J${r}:L${r}`);
  setCell(ws, r, 10, "Final Destination", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  r++;
  // Values
  ws.mergeCells(`A${r}:C${r}`);
  setCell(ws, r, 1, data.vesselFlight ?? "", { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`D${r}:F${r}`);
  setCell(ws, r, 4, data.portOfLoading, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`G${r}:I${r}`);
  setCell(ws, r, 7, data.portOfDischarge, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`J${r}:L${r}`);
  setCell(ws, r, 10, data.finalDestination, { bold: true, size: 9, border: allBorders() });
  r++;

  // ═══════════════════════════════════════════════════════════════════════════
  // Row 6: Terms of Delivery (left) | EX.RATE (right)
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:I${r}`);
  setCell(ws, r, 1, "TERMS OF DELIVERY & PAYMENT", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`J${r}:L${r}`);
  setCell(ws, r, 10, "EX.RATE", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  r++;
  ws.mergeCells(`A${r}:I${r}`);
  setCell(ws, r, 1, data.termsOfDelivery, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`J${r}:L${r}`);
  setCell(ws, r, 10, data.exchangeRate, {
    bold: true, size: 9, numFmt: "0.00", border: allBorders(),
  });
  r++;

  // ═══════════════════════════════════════════════════════════════════════════
  // Table Header
  // ═══════════════════════════════════════════════════════════════════════════
  const tableHeaderRow = r;
  const headers = [
    "Marks &\nNos.",
    "No.& Kind\nof Pkgs",
    "Description of Goods",
    "Qty.\nPKGS",
    "Rate\nFOB CAD\n$/PKG",
    "Amount\nFOB CAD $",
    "Amount\nC & I CAD $",
    "Taxable\nValue",
    "Integrated\nTax Rate",
    "Integrated\nTax Amount",
    "Net Wt\n(kg)",
    "Gross Wt\n(kg)",
  ];

  headers.forEach((h, i) => {
    setCell(ws, r, i + 1, h, {
      bold: true,
      size: 8,
      align: "center",
      vAlign: "middle",
      wrap: true,
      fill: HEADER_FILL,
      border: allBorders(),
    });
  });
  ws.getRow(r).height = 32;
  r++;

  // Track the first and last data rows for marks column merge
  const dataStartRow = r;

  // ═══════════════════════════════════════════════════════════════════════════
  // Product Groups
  // ═══════════════════════════════════════════════════════════════════════════

  for (const group of groups) {
    // ── Group header row: [n]  qty CTNS  PRODUCT NAME [HS CODE: xxx] ──
    ws.mergeCells(`B${r}:C${r}`);
    setCell(ws, r, 2, `[${group.index}]     ${group.totalQty} CTNS   ${group.name} [HS CODE: ${group.hsCode}]`, {
      bold: true,
      size: 9,
      underline: true,
      fill: GROUP_FILL,
      border: allBorders(),
    });
    // Empty cells for the rest of the row
    for (let c = 4; c <= 12; c++) {
      setCell(ws, r, c, "", { fill: GROUP_FILL, border: allBorders() });
    }
    // A column (marks) — leave empty, will be merged later
    setCell(ws, r, 1, "", { border: allBorders() });
    r++;

    // ── Sub-rows: one per pack-size variant ──
    for (const item of group.items) {
      const ciItem = item.fobCAD * (1 + insRate);

      setCell(ws, r, 1, "", { border: allBorders() }); // marks (merged later)
      setCell(ws, r, 2, item.packageDescription, { size: 8, border: allBorders() });
      setCell(ws, r, 3, item.description, { size: 8, border: allBorders() });
      setCell(ws, r, 4, item.quantity, { size: 8, align: "right", border: allBorders() });
      setCell(ws, r, 5, item.rate, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, 6, item.fobCAD, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, 7, ciItem, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, 8, item.taxableValueINR, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, 9, `${(item.igstRate * 100).toFixed(0)}%`, { size: 8, align: "center", border: allBorders() });
      setCell(ws, r, 10, item.igstAmountINR, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, 11, item.netWeight, { size: 8, align: "right", numFmt: "0.000", border: allBorders() });
      setCell(ws, r, 12, item.grossWeight, { size: 8, align: "right", numFmt: "0.000", border: allBorders() });
      r++;
    }

    // ── Price-per-kg + group subtotals row ──
    // Cols: B=rate/kg label, F=FOB total, G=C&I total, H=Taxable INR, I=blank, J=IGST total
    setCell(ws, r, 1, "", { border: allBorders() }); // marks (merged later)
    setCell(ws, r, 2, `$  ${group.ratePerKg.toFixed(3)}`, {
      bold: true, size: 8, fill: SUBTOTAL_FILL, border: allBorders(),
    });
    setCell(ws, r, 3, "", { fill: SUBTOTAL_FILL, border: allBorders() });
    setCell(ws, r, 4, "", { fill: SUBTOTAL_FILL, border: allBorders() });
    setCell(ws, r, 5, "", { fill: SUBTOTAL_FILL, border: allBorders() });
    setCell(ws, r, 6, group.totalFob, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00",
      fill: SUBTOTAL_FILL, border: allBorders(),
    });
    setCell(ws, r, 7, group.totalCi, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00",
      fill: SUBTOTAL_FILL, border: allBorders(),
    });
    setCell(ws, r, 8, group.totalTaxINR, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00",
      fill: SUBTOTAL_FILL, border: allBorders(),
    });
    setCell(ws, r, 9, "", { fill: SUBTOTAL_FILL, border: allBorders() });
    setCell(ws, r, 10, group.totalIgstINR, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00",
      fill: SUBTOTAL_FILL, border: allBorders(),
    });
    setCell(ws, r, 11, "", { fill: SUBTOTAL_FILL, border: allBorders() });
    setCell(ws, r, 12, "", { fill: SUBTOTAL_FILL, border: allBorders() });
    r++;

    // ── Weight summary row ──
    ws.mergeCells(`B${r}:F${r}`);
    setCell(
      ws, r, 2,
      `NT. WT. ${group.totalNetWt.toFixed(3)} KGS     GR. WT. ${group.totalGrossWt.toFixed(3)} KGS`,
      { bold: true, size: 8, border: allBorders() },
    );
    setCell(ws, r, 1, "", { border: allBorders() }); // marks
    for (let c = 7; c <= 12; c++) {
      setCell(ws, r, c, "", { border: allBorders() });
    }
    r++;

    // ── Blank separator row between groups ──
    for (let c = 1; c <= 12; c++) {
      setCell(ws, r, c, "", { border: allBorders() });
    }
    ws.getRow(r).height = 6;
    r++;
  }

  const dataEndRow = r - 1; // last data row (before totals)

  // ── Merge marks column (A) across all data rows ──
  if (dataEndRow > dataStartRow) {
    ws.mergeCells(`A${dataStartRow}:A${dataEndRow}`);
    setCell(ws, dataStartRow, 1, marksText + "\nCTNS NO.", {
      bold: true, size: 8, vAlign: "top", wrap: true, border: allBorders(),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Totals Row
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:C${r}`);
  setCell(ws, r, 1, "(Amount Chargeable in Words) CAD $", {
    bold: true, size: 9, fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 4, totals.pkgs, {
    bold: true, size: 9, align: "right", fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 5, "TOTAL CAD $", {
    bold: true, size: 8, align: "center", fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 6, totals.fob, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00",
    fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 7, totalCi, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00",
    fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 8, totals.tax, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00",
    fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 9, "", { fill: HEADER_FILL, border: allBorders() });
  setCell(ws, r, 10, totals.igst, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00",
    fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 11, totals.net, {
    bold: true, size: 9, align: "right", numFmt: "0.000",
    fill: HEADER_FILL, border: allBorders(),
  });
  setCell(ws, r, 12, totals.grs, {
    bold: true, size: 9, align: "right", numFmt: "0.000",
    fill: HEADER_FILL, border: allBorders(),
  });
  ws.getRow(r).height = 20;
  r++;

  r++; // spacer

  // ═══════════════════════════════════════════════════════════════════════════
  // Footer Summary
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, 1, `TTL NO.OF PKGS.  ${totals.pkgs}`, { bold: true, size: 9 });
  r++;
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, 1, `TTL NET WT.KGS.  ${totals.net.toFixed(3)}`, { bold: true, size: 9 });
  r++;
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, 1, `TTL GR. WT.KGS.  ${totals.grs.toFixed(3)}`, { bold: true, size: 9 });
  r++;
  if (insCAD > 0) {
    ws.mergeCells(`A${r}:F${r}`);
    setCell(ws, r, 1, `INSU. CAD:  ${insCAD.toFixed(3)}`, { bold: true, size: 9 });
    r++;
  }

  r++; // spacer

  // ═══════════════════════════════════════════════════════════════════════════
  // Declaration
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:L${r + 2}`);
  setCell(
    ws, r, 1,
    "We declare that this invoice shows the actual price of the\n" +
    "goods described and that all particulars are true and correct.\n" +
    "We intend to claim rewards under Remission of Duties & Taxes on Export Product (RoDTEP)\n" +
    "SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX",
    { size: 7, italic: true, wrap: true, vAlign: "top" },
  );
  ws.getRow(r).height = 40;
  r += 3;

  r++; // spacer

  // ═══════════════════════════════════════════════════════════════════════════
  // Signatory
  // ═══════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, 1, "For KOHLICO FOODS AND BEVERAGES PVT. LTD", {
    bold: true, size: 9, border: { top: { style: "thin" } },
  });
  ws.mergeCells(`G${r}:L${r}`);
  setCell(ws, r, 7, "", {
    border: { top: { style: "thin" } },
  });
  r++;
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, 1, "Authorized Signatory", {
    size: 8, italic: true, color: "FF666666",
  });
  ws.mergeCells(`G${r}:L${r}`);
  setCell(ws, r, 7, "Buyer's Signature & Stamp", {
    size: 8, italic: true, color: "FF666666", align: "right",
  });

  // ── Return buffer ─────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
