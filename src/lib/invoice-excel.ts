// src/lib/invoice-excel.ts
// Builds an .xlsx workbook matching the real "Invoice Cum Packing List" layout.
// 20-column layout (A–T) with merged header cells, product groups, weight/DIST/STATE
// subtotals, and a footer with totals, insurance, and amount in words.

import ExcelJS from "exceljs";
import { numberToWords } from "./number-to-words";
import {
  fmtDate,
  buildGroups,
  calculateTotals,
  SharedInvoiceItem,
  SharedProductGroup,
} from "@/lib/invoice-shared";

// ── Types ────────────────────────────────────────────────────────────────────

export type ExcelInvoiceItem = SharedInvoiceItem;

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

type ProductGroup = SharedProductGroup<ExcelInvoiceItem>;

// ── Helpers ──────────────────────────────────────────────────────────────────

type WS = ExcelJS.Worksheet;

// Column indices (1-based) for the 20-column layout
const COL = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10,
  K: 11, L: 12, M: 13, N: 14, O: 15, P: 16, Q: 17, R: 18, S: 19, T: 20,
};

function allBorders(): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };
}

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

  // ── Column widths (A=1 through T=20) ────────────────────────────────────
  ws.columns = [
    { width: 8 },  // A — Marks & Nos (left)
    { width: 8 },  // B — Marks & Nos (right)
    { width: 12 }, // C — No. & Kind of Pkgs (left)
    { width: 8 },  // D — No. & Kind of Pkgs (right)
    { width: 20 }, // E — Description of Goods (left)
    { width: 6 },  // F — Description (right)
    { width: 7 },  // G — Qty PKGS
    { width: 9 },  // H — Rate FOB CAD $/PKG
    { width: 11 }, // I — Amount FOB CAD $
    { width: 11 }, // J — Amount C & I CAD $
    { width: 11 }, // K — Taxable Value (left)
    { width: 5 },  // L — Taxable Value (right)
    { width: 4 },  // M — spacer
    { width: 6 },  // N — IGST Rate
    { width: 10 }, // O — IGST Amount (left)
    { width: 5 },  // P — IGST Amount (right)
    { width: 7 },  // Q — spacer
    { width: 10 }, // R — Net/Gross wt area
    { width: 7 },  // S — spacer
    { width: 10 }, // T — Gross wt / insurance
  ];

  const insCAD = data.insuranceCAD ?? 0;

  // Grand totals
  const totals = calculateTotals(data.items, insCAD);
  const { insRate, totalCi } = totals;
  const groups = buildGroups(data.items, totals.fob, insCAD);
  const marksText = data.items[0]?.marksAndNos ?? "";

  let r = 1;

  // ═════════════════════════════════════════════════════════════════════════
  // Row 1: Title — "INVOICE CUM PACKING LIST" centered
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:T${r}`);
  setCell(ws, r, COL.A, "INVOICE CUM PACKING LIST", {
    bold: true, size: 12, align: "center", underline: true, border: allBorders(),
  });
  ws.getRow(r).height = 22;
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 2–5: Exporter (left A–F) | Invoice/Proforma/IEC info (right G–T)
  // ═════════════════════════════════════════════════════════════════════════
  // Exporter block spans 4 rows
  const exporterStart = r;
  ws.mergeCells(`A${r}:F${r + 3}`);
  setCell(ws, r, COL.A,
    "Exporter :\n" +
    "KOHLICO FOODS AND BEVERAGES PVT.LTD\n" +
    "391, NARSI NATHA STREET, MAHESH CHAMBER,\n" +
    "ROOM NO. 2, 1ST FLOOR, MUMBAI - 400009, INDIA",
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );

  // Row 2: Invoice No & Date label | Proforma label | IEC label
  ws.mergeCells(`G${r}:J${r}`);
  setCell(ws, r, COL.G, "Invoice no. & Date", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`K${r}:M${r}`);
  setCell(ws, r, COL.K, "Proforma Inv. & Date", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`N${r}:T${r}`);
  setCell(ws, r, COL.N, "IEC NO.", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  r++;

  // Row 3: Invoice No value | Proforma value | IEC value
  ws.mergeCells(`G${r}:J${r}`);
  setCell(ws, r, COL.G, data.invoiceNo, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`K${r}:M${r}`);
  setCell(ws, r, COL.K, data.proformaInvNo ?? "—", { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`N${r}:T${r}`);
  setCell(ws, r, COL.N, data.iecCode, { bold: true, size: 9, border: allBorders() });
  r++;

  // Row 4: Dates
  ws.mergeCells(`G${r}:J${r}`);
  setCell(ws, r, COL.G, `DTD: ${fmtDate(data.invoiceDate)}`, { size: 8, border: allBorders() });
  ws.mergeCells(`K${r}:M${r}`);
  setCell(ws, r, COL.K, data.proformaDate ? `DT: ${fmtDate(data.proformaDate)}` : "", {
    size: 8, border: allBorders(),
  });
  ws.mergeCells(`N${r}:T${r}`);
  setCell(ws, r, COL.N, "", { border: allBorders() });
  r++;

  // Row 5: Exporter's Ref | PAN | GSTIN | End Use Code
  ws.mergeCells(`G${r}:H${r}`);
  setCell(ws, r, COL.G, "Exporter's Ref.", {
    size: 7, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`I${r}:K${r}`);
  setCell(ws, r, COL.I, `PAN NO.  ${data.panNo}`, { size: 8, bold: true, border: allBorders() });
  ws.mergeCells(`L${r}:N${r}`);
  setCell(ws, r, COL.L, `GSTIN NO.  ${data.gstinNo}`, { size: 8, bold: true, border: allBorders() });
  ws.mergeCells(`O${r}:T${r}`);
  setCell(ws, r, COL.O, data.endUseCode ? `END USE CODE:\n${data.endUseCode}` : "", {
    size: 8, bold: true, wrap: true, border: allBorders(),
  });
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 6–7: Consignee (left A–J) | Buyer (right K–T)
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:J${r + 1}`);
  setCell(ws, r, COL.A,
    "Consignee:\n" + data.consigneeName + "\n" + data.consigneeAddress +
    (data.consigneeCountry ? ", " + data.consigneeCountry : ""),
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );
  ws.mergeCells(`K${r}:T${r + 1}`);
  setCell(ws, r, COL.K,
    "Buyer (if other than consignee)\n" +
    (data.buyerName ?? data.consigneeName) + "\n" +
    (data.buyerAddress ?? data.consigneeAddress),
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );
  ws.getRow(r).height = 18;
  ws.getRow(r + 1).height = 18;
  r += 2;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 8–9: Pre-Carriage | Port of Receipt | Country of Origin | Country Dest
  // ═════════════════════════════════════════════════════════════════════════
  // Labels
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, "Pre-Carriage by", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, "Port of Receipt by Pre-Carriage", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`I${r}:M${r}`);
  setCell(ws, r, COL.I, "Country of Origin", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`N${r}:T${r}`);
  setCell(ws, r, COL.N, "Country of Final Destination", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  r++;
  // Values
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, data.preCarriage, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, data.portOfReceipt, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`I${r}:M${r}`);
  setCell(ws, r, COL.I, data.countryOfOrigin, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`N${r}:T${r}`);
  setCell(ws, r, COL.N, data.countryOfDestination, { bold: true, size: 9, border: allBorders() });
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 10–11: Vessel/Flight | Port of Loading | Terms of Delivery + EX.RATE
  // ═════════════════════════════════════════════════════════════════════════
  // Labels
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, "Vessel/Flight No.", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, "Port of Loading", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`I${r}:Q${r}`);
  setCell(ws, r, COL.I, "TERMS OF DELIVERY & PAYMENT", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`R${r}:T${r}`);
  setCell(ws, r, COL.R, "EX.RATE", { size: 7, italic: true, color: "FF666666", align: "right", border: allBorders() });
  r++;
  // Values
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, data.vesselFlight ?? "", { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, data.portOfLoading, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`I${r}:Q${r}`);
  setCell(ws, r, COL.I, data.termsOfDelivery, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`R${r}:T${r}`);
  setCell(ws, r, COL.R, data.exchangeRate, {
    bold: true, size: 9, numFmt: "0.00", align: "right", border: allBorders(),
  });
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 12–13: Port of Discharge | Final Destination
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, "Port of Discharge", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, "Final Destination", { size: 7, italic: true, color: "FF666666", border: allBorders() });
  for (let c = COL.I; c <= COL.T; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  r++;
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, data.portOfDischarge, { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, data.finalDestination, { bold: true, size: 9, border: allBorders() });
  for (let c = COL.I; c <= COL.T; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Table Header (2 rows)
  // ═════════════════════════════════════════════════════════════════════════
  const tableHeaderRow1 = r;

  // Row 1: category labels
  ws.mergeCells(`A${r}:B${r + 1}`);
  setCell(ws, r, COL.A, "Marks &\nNos.", {
    bold: true, size: 8, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  ws.mergeCells(`C${r}:D${r + 1}`);
  setCell(ws, r, COL.C, "No.& Kind\nof Pkgs", {
    bold: true, size: 8, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  ws.mergeCells(`E${r}:F${r + 1}`);
  setCell(ws, r, COL.E, "Description of Goods", {
    bold: true, size: 8, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  // Qty header spans 2 rows
  ws.mergeCells(`G${r}:G${r + 1}`);
  setCell(ws, r, COL.G, "Qty.\nPKGS", {
    bold: true, size: 8, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  // Rate header spans 2 rows
  ws.mergeCells(`H${r}:H${r + 1}`);
  setCell(ws, r, COL.H, "Rate\nFOB CAD\n$/PKG", {
    bold: true, size: 7, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  // Amount FOB — row 1 label "Amount", row 2 sub-label
  setCell(ws, r, COL.I, "Amount", {
    bold: true, size: 8, align: "center", vAlign: "middle", border: allBorders(),
  });
  // Amount C&I — row 1 label "Amount"
  setCell(ws, r, COL.J, "Amount", {
    bold: true, size: 8, align: "center", vAlign: "middle", border: allBorders(),
  });
  // Taxable — row 1 label
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, "Taxable", {
    bold: true, size: 8, align: "center", vAlign: "middle", border: allBorders(),
  });
  // spacer M
  setCell(ws, r, COL.M, "", { border: allBorders() });
  // Integrated Tax — parent header spanning N-P
  ws.mergeCells(`N${r}:P${r}`);
  setCell(ws, r, COL.N, "Integrated Tax", {
    bold: true, size: 8, align: "center", vAlign: "middle", border: allBorders(),
  });
  // Empty cells for weight columns
  for (let c = COL.Q; c <= COL.S; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  // Insurance rate value in T
  setCell(ws, r, COL.T, insRate > 0 ? insRate : "", {
    bold: true, size: 7, align: "right", numFmt: "0.0000000", border: allBorders(),
  });
  ws.getRow(r).height = 20;
  r++;

  // Row 2: sub-labels
  // A, B, C, D, E, F, G, H already merged above (span 2 rows)
  setCell(ws, r, COL.I, "FOB CAD $", {
    bold: true, size: 7, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  setCell(ws, r, COL.J, "C & I CAD $", {
    bold: true, size: 7, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, "Value", {
    bold: true, size: 8, align: "center", vAlign: "middle", border: allBorders(),
  });
  setCell(ws, r, COL.M, "", { border: allBorders() });
  setCell(ws, r, COL.N, "Rate", {
    bold: true, size: 7, align: "center", vAlign: "middle", border: allBorders(),
  });
  ws.mergeCells(`O${r}:P${r}`);
  setCell(ws, r, COL.O, "Amount", {
    bold: true, size: 7, align: "center", vAlign: "middle", border: allBorders(),
  });
  for (let c = COL.Q; c <= COL.T; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  ws.getRow(r).height = 18;
  r++;

  // Sub-header: Marks text + CTNS NO.
  const dataStartRow = r;
  setCell(ws, r, COL.A, marksText, { bold: true, size: 8, border: allBorders() });
  setCell(ws, r, COL.B, "", { border: allBorders() });
  for (let c = COL.C; c <= COL.T; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  r++;
  // CTNS NO. row
  ws.mergeCells(`A${r}:B${r}`);
  setCell(ws, r, COL.A, "CTNS NO.", { bold: true, size: 8, border: allBorders() });
  for (let c = COL.C; c <= COL.T; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Product Groups
  // ═════════════════════════════════════════════════════════════════════════

  for (const group of groups) {
    // ── Group header row: (n)  qty CTNS  PRODUCT NAME [HS CODE: xxx] ──
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:F${r}`);
    setCell(ws, r, COL.C,
      `(${group.index})     ${group.totalQty} CTNS   ${group.name} [HS CODE: ${group.hsCode}]`,
      { bold: true, size: 9, underline: true, border: allBorders() },
    );
    for (let c = COL.G; c <= COL.T; c++) {
      setCell(ws, r, c, "", { border: allBorders() });
    }
    r++;

    // ── Sub-rows: one per pack-size variant ──
    for (const item of group.items) {
      const ciItem = item.fobCAD * (1 + insRate);

      ws.mergeCells(`A${r}:B${r}`);
      setCell(ws, r, COL.A, "", { border: allBorders() }); // marks column
      ws.mergeCells(`C${r}:D${r}`);
      setCell(ws, r, COL.C, item.packageDescription, { size: 8, border: allBorders() });
      ws.mergeCells(`E${r}:F${r}`);
      setCell(ws, r, COL.E, item.description, { size: 8, border: allBorders() });
      setCell(ws, r, COL.G, item.quantity, { size: 8, align: "right", border: allBorders() });
      setCell(ws, r, COL.H, item.rate, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.I, item.fobCAD, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.J, ciItem, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      ws.mergeCells(`K${r}:L${r}`);
      setCell(ws, r, COL.K, item.taxableValueINR, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.M, "", { border: allBorders() });
      setCell(ws, r, COL.N, `${(item.igstRate * 100).toFixed(0)}%`, { size: 8, align: "center", border: allBorders() });
      ws.mergeCells(`O${r}:P${r}`);
      setCell(ws, r, COL.O, item.igstAmountINR, { size: 8, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.Q, "", { border: allBorders() });
      setCell(ws, r, COL.R, item.netWeight, { size: 8, align: "right", numFmt: "#,##0.000", border: allBorders() });
      setCell(ws, r, COL.S, "", { border: allBorders() });
      setCell(ws, r, COL.T, item.grossWeight, { size: 8, align: "right", numFmt: "#,##0.000", border: allBorders() });
      r++;
    }

    // ── Price-per-kg + group subtotals row ──
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:D${r}`);
    setCell(ws, r, COL.C, `$  ${group.ratePerKg.toFixed(3)}`, {
      bold: true, size: 8, border: allBorders(),
    });
    ws.mergeCells(`E${r}:F${r}`);
    setCell(ws, r, COL.E, "", { border: allBorders() });
    setCell(ws, r, COL.G, "", { border: allBorders() });
    setCell(ws, r, COL.H, "", { border: allBorders() });
    setCell(ws, r, COL.I, group.totalFob, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    setCell(ws, r, COL.J, group.totalCi, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    ws.mergeCells(`K${r}:L${r}`);
    setCell(ws, r, COL.K, group.totalTaxINR, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    setCell(ws, r, COL.M, "", { border: allBorders() });
    setCell(ws, r, COL.N, "", { border: allBorders() });
    ws.mergeCells(`O${r}:P${r}`);
    setCell(ws, r, COL.O, group.totalIgstINR, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    setCell(ws, r, COL.Q, "", { border: allBorders() });
    setCell(ws, r, COL.R, group.totalNetWt, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.000", border: allBorders(),
    });
    setCell(ws, r, COL.S, "", { border: allBorders() });
    setCell(ws, r, COL.T, group.totalGrossWt, {
      bold: true, size: 8, align: "right", numFmt: "#,##0.000", border: allBorders(),
    });
    r++;

    // ── Weight summary + DIST/STATE row ──
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:H${r}`);
    setCell(ws, r, COL.C,
      `NT. WT:  ${group.totalNetWt.toFixed(3)} KGS     GR. WT:  ${group.totalGrossWt.toFixed(3)} KGS`,
      { bold: true, size: 8, border: allBorders() },
    );
    for (let c = COL.I; c <= COL.T; c++) {
      setCell(ws, r, c, "", { border: allBorders() });
    }
    r++;

    // DIST / STATE row
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:H${r}`);
    setCell(ws, r, COL.C,
      `DIST:    ${group.district}            STATE:   ${group.state}`,
      { bold: true, size: 8, border: allBorders() },
    );
    for (let c = COL.I; c <= COL.T; c++) {
      setCell(ws, r, c, "", { border: allBorders() });
    }
    r++;

    // ── Blank separator row between groups ──
    for (let c = COL.A; c <= COL.T; c++) {
      setCell(ws, r, c, "", { border: allBorders() });
    }
    ws.getRow(r).height = 6;
    r++;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Totals Row
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `(Amount Chargeable in Words) CAD $`, {
    bold: true, size: 9, border: allBorders(),
  });
  setCell(ws, r, COL.G, totals.pkgs, {
    bold: true, size: 9, align: "right", border: allBorders(),
  });
  setCell(ws, r, COL.H, "TOTAL CAD $", {
    bold: true, size: 8, align: "center", border: allBorders(),
  });
  setCell(ws, r, COL.I, totals.fob, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  setCell(ws, r, COL.J, totalCi, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, totals.tax, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  setCell(ws, r, COL.M, "", { border: allBorders() });
  setCell(ws, r, COL.N, "", { border: allBorders() });
  ws.mergeCells(`O${r}:P${r}`);
  setCell(ws, r, COL.O, totals.igst, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  setCell(ws, r, COL.Q, "", { border: allBorders() });
  setCell(ws, r, COL.R, totals.net, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.000", border: allBorders(),
  });
  setCell(ws, r, COL.S, "", { border: allBorders() });
  setCell(ws, r, COL.T, totals.grs, {
    bold: true, size: 9, align: "right", numFmt: "#,##0.000", border: allBorders(),
  });
  ws.getRow(r).height = 20;
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Amount in Words row
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:T${r}`);
  setCell(ws, r, COL.A, numberToWords(totals.fob), {
    bold: true, size: 8, wrap: true,
  });
  r++;

  r++; // spacer

  // ═════════════════════════════════════════════════════════════════════════
  // Footer Summary
  // ═════════════════════════════════════════════════════════════════════════
  // TTL NO. OF PKGS
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `TTL NO.OF PKGS.     ${totals.pkgs}`, { bold: true, size: 9 });
  r++;

  // TTL NET WT.KGS + Exchange Rate & Insurance Rate on the right
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `TTL NET WT.KGS.     ${totals.net.toFixed(3)}`, { bold: true, size: 9 });
  if (insCAD > 0) {
    ws.mergeCells(`R${r}:S${r}`);
    setCell(ws, r, COL.R, insCAD, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.000",
    });
    setCell(ws, r, COL.T, insRate, {
      bold: true, size: 9, align: "right", numFmt: "0.0000000",
    });
  }
  r++;

  // TTL GR. WT.KGS
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `TTL GR. WT.KGS.     ${totals.grs.toFixed(3)}`, { bold: true, size: 9 });
  r++;

  // INSU. CAD
  if (insCAD > 0) {
    ws.mergeCells(`O${r}:Q${r}`);
    setCell(ws, r, COL.O, "INSU. CAD", { bold: true, size: 9, align: "right" });
    ws.mergeCells(`R${r}:T${r}`);
    setCell(ws, r, COL.R, insCAD, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.000",
    });
    r++;
  }

  r++; // spacer

  // ═════════════════════════════════════════════════════════════════════════
  // Declaration
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:T${r + 2}`);
  setCell(ws, r, COL.A,
    "We declare that this invoice shows the actual price of the\n" +
    "goods described and that all particulars are true and correct.\n" +
    "We intend to claim rewards under Remission of Duties & Taxes on Export Product (RoDTEP)\n" +
    "SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX",
    { size: 7, italic: true, wrap: true, vAlign: "top" },
  );
  ws.getRow(r).height = 40;
  r += 3;

  r++; // spacer

  // ═════════════════════════════════════════════════════════════════════════
  // Signatory
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:J${r}`);
  setCell(ws, r, COL.A, "For KOHLICO FOODS AND BEVERAGES PVT. LTD", {
    bold: true, size: 9, border: { top: { style: "thin" } },
  });
  ws.mergeCells(`K${r}:T${r}`);
  setCell(ws, r, COL.K, "", {
    border: { top: { style: "thin" } },
  });
  r++;
  ws.mergeCells(`A${r}:J${r}`);
  setCell(ws, r, COL.A, "Authorized Signatory", {
    size: 8, italic: true, color: "FF666666",
  });
  ws.mergeCells(`K${r}:T${r}`);
  setCell(ws, r, COL.K, "Buyer's Signature & Stamp", {
    size: 8, italic: true, color: "FF666666", align: "right",
  });

  // ── Return buffer ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
