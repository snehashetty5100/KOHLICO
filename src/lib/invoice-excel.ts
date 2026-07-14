// src/lib/invoice-excel.ts
// Builds an .xlsx workbook matching the real "Invoice Cum Packing List" layout.
// 17-column layout (A–Q) with merged header cells, product groups, weight/DIST/STATE
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

// Column indices (1-based) for the 17-column layout
const COL = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10,
  K: 11, L: 12, M: 13, N: 14, O: 15, P: 16, Q: 17,
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
    name: "Arial Narrow",
    bold: opts?.bold ?? false,
    italic: opts?.italic ?? false,
    size: opts?.size ?? 10,
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

/** Fill remaining columns (from startCol to Q) with empty bordered cells,
 *  applying standard grid merges at K:L and N:O. */
function fillGridTail(ws: WS, row: number, startCol: number) {
  for (let c = startCol; c <= COL.Q; c++) {
    if (c === COL.K) {
      ws.mergeCells(`K${row}:L${row}`);
      setCell(ws, row, COL.K, "", { border: allBorders() });
      c = COL.L;
    } else if (c === COL.N) {
      ws.mergeCells(`N${row}:O${row}`);
      setCell(ws, row, COL.N, "", { border: allBorders() });
      c = COL.O;
    } else {
      setCell(ws, row, c, "", { border: allBorders() });
    }
  }
}

function parseCell(addr: string): { row: number; col: number } {
  const match = addr.match(/^([A-Z]+)([0-9]+)$/i);
  if (!match) return { row: 0, col: 0 };
  const colStr = match[1].toUpperCase();
  const row = parseInt(match[2], 10);
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  return { row, col };
}

function formatNumberForLength(value: number, numFmt: string): string {
  const dotIndex = numFmt.indexOf(".");
  if (dotIndex !== -1) {
    const decimals = numFmt.substring(dotIndex + 1).length;
    let formatted = value.toFixed(decimals);
    if (numFmt.includes(",")) {
      const parts = formatted.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      formatted = parts.join(".");
    }
    return formatted;
  }
  return String(value);
}

/** Auto-fit column widths. Widens columns beyond baseline if cell content overflows. */
function autoFitColumns(ws: WS, mergeMap: Map<string, { startCol: number; endCol: number }>) {
  const MAX_WIDTH = 50;
  const PADDING = 2;

  for (let c = 1; c <= 17; c++) {
    const col = ws.getColumn(c);
    const baseline = (col.width as number) ?? 8;
    let maxLen = 0;

    ws.eachRow((row) => {
      const cell = row.getCell(c);
      if (cell.alignment?.wrapText) return;

      if (cell.isMerged) return;

      let str = "";
      if (typeof cell.value === "number") {
        if (cell.numFmt) {
          str = formatNumberForLength(cell.value, cell.numFmt);
        } else {
          str = String(cell.value);
        }
      } else {
        str = String(cell.value ?? "");
      }

      if (!str) return;
      for (const line of str.split("\n")) {
        maxLen = Math.max(maxLen, line.length);
      }
    });

    if (maxLen > 0) {
      col.width = Math.max(baseline, Math.min(MAX_WIDTH, maxLen + PADDING));
    }
  }
}

/** Auto-fit row heights for a range of rows. Expands rows if content needs more lines.
 *  Empty rows (separators) are skipped so their explicit heights are preserved. */
function autoFitRowHeights(
  ws: WS,
  fromRow: number,
  toRow: number,
  mergeMap: Map<string, { startCol: number; endCol: number }>,
) {
  const LINE_HEIGHT = 15;
  const MIN_HEIGHT = 14;

  for (let rowNum = fromRow; rowNum <= toRow; rowNum++) {
    const row = ws.getRow(rowNum);
    let maxLines = 1;
    let hasContent = false;

    for (let c = 1; c <= 17; c++) {
      const cell = row.getCell(c);
      if (cell.isMerged && cell.master.address !== cell.address) continue;

      const str = String(cell.value ?? "");
      if (!str) continue;
      hasContent = true;

      if (cell.alignment?.wrapText) {
        let effectiveWidth = (ws.getColumn(c).width as number) ?? 10;
        const span = mergeMap.get(`${rowNum}:${c}`);
        if (span) {
          effectiveWidth = 0;
          for (let colIdx = span.startCol; colIdx <= span.endCol; colIdx++) {
            effectiveWidth += (ws.getColumn(colIdx).width as number) ?? 10;
          }
        }
        const charsPerLine = Math.max(1, effectiveWidth - 2);
        let wrapLines = 0;
        for (const line of str.split("\n")) {
          wrapLines += Math.max(1, Math.ceil(line.length / charsPerLine));
        }
        maxLines = Math.max(maxLines, wrapLines);
      } else {
        maxLines = Math.max(maxLines, str.split("\n").length);
      }
    }

    if (!hasContent) continue;

    const autoHeight = Math.max(MIN_HEIGHT, maxLines * LINE_HEIGHT);
    row.height = Math.max(row.height ?? MIN_HEIGHT, autoHeight);
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

  const mergeMap = new Map<string, { startCol: number; endCol: number }>();
  const originalMergeCells = ws.mergeCells.bind(ws);
  (ws as any).mergeCells = (...args: any[]) => {
    let r1 = 0, c1 = 0, r2 = 0, c2 = 0;
    if (args.length === 1 && typeof args[0] === "string") {
      const parts = args[0].split(":");
      if (parts.length === 2) {
        const start = parseCell(parts[0]);
        const end = parseCell(parts[1]);
        r1 = start.row;
        c1 = start.col;
        r2 = end.row;
        c2 = end.col;
      }
    } else if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string") {
      const start = parseCell(args[0]);
      const end = parseCell(args[1]);
      r1 = start.row;
      c1 = start.col;
      r2 = end.row;
      c2 = end.col;
    } else if (args.length === 4 && typeof args[0] === "number" && typeof args[1] === "number" && typeof args[2] === "number" && typeof args[3] === "number") {
      r1 = args[0];
      c1 = args[1];
      r2 = args[2];
      c2 = args[3];
    }

    if (r1 && c1 && r2 && c2) {
      for (let rVal = r1; rVal <= r2; rVal++) {
        mergeMap.set(`${rVal}:${c1}`, { startCol: c1, endCol: c2 });
      }
    }
    return (originalMergeCells as any)(...args);
  };

  // ── Column widths (A=1 through Q=17) ────────────────────────────────────
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
    { width: 6 },  // M — IGST Rate (was N)
    { width: 10 }, // N — IGST Amount (left) (was O)
    { width: 5 },  // O — IGST Amount (right) (was P)
    { width: 10 }, // P — Net/Gross wt area (was R)
    { width: 10 }, // Q — Gross wt / insurance (was T)
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
  ws.mergeCells(`A${r}:Q${r}`);
  setCell(ws, r, COL.A, "INVOICE CUM PACKING LIST", {
    bold: true, size: 11, align: "center", underline: true, border: allBorders(),
  });
  ws.getRow(r).height = 22;
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 2–5: Exporter (left A–F) | Invoice/Proforma/IEC info (right G–Q)
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
    size: 8, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, "Proforma Inv. & Date", {
    size: 8, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`M${r}:Q${r}`);
  setCell(ws, r, COL.M, "IEC NO.", {
    size: 8, italic: true, color: "FF666666", border: allBorders(),
  });
  r++;

  // Row 3: Invoice No value | Proforma value | IEC value
  ws.mergeCells(`G${r}:J${r}`);
  setCell(ws, r, COL.G, data.invoiceNo, { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, data.proformaInvNo ?? "—", { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`M${r}:Q${r}`);
  setCell(ws, r, COL.M, data.iecCode, { bold: true, size: 10, border: allBorders() });
  r++;

  // Row 4: Dates
  ws.mergeCells(`G${r}:J${r}`);
  setCell(ws, r, COL.G, `DTD: ${fmtDate(data.invoiceDate)}`, { size: 8, border: allBorders() });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, data.proformaDate ? `DT: ${fmtDate(data.proformaDate)}` : "", {
    size: 8, border: allBorders(),
  });
  ws.mergeCells(`M${r}:Q${r}`);
  setCell(ws, r, COL.M, "", { border: allBorders() });
  r++;

  // Row 5: Exporter's Ref | PAN | GSTIN | End Use Code
  ws.mergeCells(`G${r}:H${r}`);
  setCell(ws, r, COL.G, "Exporter's Ref.", {
    size: 8, italic: true, color: "FF666666", border: allBorders(),
  });
  ws.mergeCells(`I${r}:K${r}`);
  setCell(ws, r, COL.I, `PAN NO.  ${data.panNo}`, { size: 8, bold: true, border: allBorders() });
  ws.mergeCells(`L${r}:M${r}`);
  setCell(ws, r, COL.L, `GSTIN NO.  ${data.gstinNo}`, { size: 8, bold: true, border: allBorders() });
  ws.mergeCells(`N${r}:Q${r}`);
  setCell(ws, r, COL.N, data.endUseCode ? `END USE CODE:\n${data.endUseCode}` : "", {
    size: 8, bold: true, wrap: true, border: allBorders(),
  });
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 6–8: Consignee (left A–J) | Buyer (right K–Q) (3 rows block)
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:J${r + 2}`);
  setCell(ws, r, COL.A,
    "Consignee:\n" + data.consigneeName + "\n" + data.consigneeAddress +
    (data.consigneeCountry ? ", " + data.consigneeCountry : ""),
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );
  ws.mergeCells(`K${r}:Q${r + 2}`);
  setCell(ws, r, COL.K,
    "Buyer (if other than consignee)\n" +
    (data.buyerName ?? data.consigneeName) + "\n" +
    (data.buyerAddress ?? data.consigneeAddress),
    { size: 8, wrap: true, vAlign: "top", border: allBorders() },
  );
  ws.getRow(r).height = 18;
  ws.getRow(r + 1).height = 18;
  ws.getRow(r + 2).height = 18;
  r += 3;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 9–10: Pre-Carriage | Port of Receipt | Country of Origin | Country Dest
  // ═════════════════════════════════════════════════════════════════════════
  // Labels
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, "Pre-Carriage by", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, "Port of Receipt by Pre-Carriage", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`I${r}:L${r}`);
  setCell(ws, r, COL.I, "Country of Origin", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`M${r}:Q${r}`);
  setCell(ws, r, COL.M, "Country of Final Destination", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  r++;
  // Values
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, data.preCarriage, { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, data.portOfReceipt, { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`I${r}:L${r}`);
  setCell(ws, r, COL.I, data.countryOfOrigin, { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`M${r}:Q${r}`);
  setCell(ws, r, COL.M, data.countryOfDestination, { bold: true, size: 10, border: allBorders() });
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 11–12: Vessel/Flight | Port of Loading | Terms of Delivery + EX.RATE
  // ═════════════════════════════════════════════════════════════════════════
  // Labels
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, "Vessel/Flight No.", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, "Port of Loading", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`I${r}:O${r}`);
  setCell(ws, r, COL.I, "TERMS OF DELIVERY & PAYMENT", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`P${r}:Q${r}`);
  setCell(ws, r, COL.P, "EX.RATE", { size: 8, italic: true, color: "FF666666", align: "right", border: allBorders() });
  r++;
  // Values
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, data.vesselFlight ?? "", { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, data.portOfLoading, { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`I${r}:O${r}`);
  setCell(ws, r, COL.I, data.termsOfDelivery, { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`P${r}:Q${r}`);
  setCell(ws, r, COL.P, data.exchangeRate, {
    bold: true, size: 10, numFmt: "0.00", align: "right", border: allBorders(),
  });
  r++;

  // ═════════════════════════════════════════════════════════════════════════
  // Rows 13–14: Port of Discharge | Final Destination
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, "Port of Discharge", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, "Final Destination", { size: 8, italic: true, color: "FF666666", border: allBorders() });
  for (let c = COL.I; c <= COL.Q; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  r++;
  ws.mergeCells(`A${r}:E${r}`);
  setCell(ws, r, COL.A, data.portOfDischarge, { bold: true, size: 10, border: allBorders() });
  ws.mergeCells(`F${r}:H${r}`);
  setCell(ws, r, COL.F, data.finalDestination, { bold: true, size: 10, border: allBorders() });
  for (let c = COL.I; c <= COL.Q; c++) {
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
    bold: true, size: 9, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  ws.mergeCells(`C${r}:D${r + 1}`);
  setCell(ws, r, COL.C, "No.& Kind\nof Pkgs", {
    bold: true, size: 9, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  ws.mergeCells(`E${r}:F${r + 1}`);
  setCell(ws, r, COL.E, "Description of Goods", {
    bold: true, size: 9, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  // Qty header spans 2 rows
  ws.mergeCells(`G${r}:G${r + 1}`);
  setCell(ws, r, COL.G, "Qty.\nPKGS", {
    bold: true, size: 9, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  // Rate header spans 2 rows
  ws.mergeCells(`H${r}:H${r + 1}`);
  setCell(ws, r, COL.H, "Rate\nFOB CAD\n$/PKG", {
    bold: true, size: 8, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  // Amount FOB — row 1 label "Amount", row 2 sub-label
  setCell(ws, r, COL.I, "Amount", {
    bold: true, size: 9, align: "center", vAlign: "middle", border: allBorders(),
  });
  // Amount C&I — row 1 label "Amount"
  setCell(ws, r, COL.J, "Amount", {
    bold: true, size: 9, align: "center", vAlign: "middle", border: allBorders(),
  });
  // Taxable — row 1 label
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, "Taxable", {
    bold: true, size: 9, align: "center", vAlign: "middle", border: allBorders(),
  });
  // Integrated Tax — parent header spanning M-O
  ws.mergeCells(`M${r}:O${r}`);
  setCell(ws, r, COL.M, "Integrated Tax", {
    bold: true, size: 9, align: "center", vAlign: "middle", border: allBorders(),
  });
  // Empty cell for weight column P (Net Wt area)
  setCell(ws, r, COL.P, "", { border: allBorders() });
  // Insurance rate value in Q
  setCell(ws, r, COL.Q, insRate > 0 ? insRate : "", {
    bold: true, size: 8, align: "right", numFmt: "0.0000000", border: allBorders(),
  });
  ws.getRow(r).height = 20;
  r++;

  // Row 2: sub-labels
  // A, B, C, D, E, F, G, H already merged above (span 2 rows)
  setCell(ws, r, COL.I, "FOB CAD $", {
    bold: true, size: 8, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  setCell(ws, r, COL.J, "C & I CAD $", {
    bold: true, size: 8, align: "center", vAlign: "middle", wrap: true, border: allBorders(),
  });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, "Value", {
    bold: true, size: 9, align: "center", vAlign: "middle", border: allBorders(),
  });
  setCell(ws, r, COL.M, "Rate", {
    bold: true, size: 8, align: "center", vAlign: "middle", border: allBorders(),
  });
  ws.mergeCells(`N${r}:O${r}`);
  setCell(ws, r, COL.N, "Amount", {
    bold: true, size: 8, align: "center", vAlign: "middle", border: allBorders(),
  });
  for (let c = COL.P; c <= COL.Q; c++) {
    setCell(ws, r, c, "", { border: allBorders() });
  }
  ws.getRow(r).height = 18;
  r++;

  // Sub-header: Marks text + CTNS NO.
  const dataStartRow = r;
  if (marksText && marksText.trim() !== "") {
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, marksText, { bold: true, size: 9, border: allBorders() });
    ws.mergeCells(`C${r}:D${r}`);
    setCell(ws, r, COL.C, "", { border: allBorders() });
    ws.mergeCells(`E${r}:F${r}`);
    setCell(ws, r, COL.E, "", { border: allBorders() });
    fillGridTail(ws, r, COL.G);
    r++;
  }
  // CTNS NO. row
  ws.mergeCells(`A${r}:B${r}`);
  setCell(ws, r, COL.A, "CTNS NO.", { bold: true, size: 9, border: allBorders() });
  ws.mergeCells(`C${r}:D${r}`);
  setCell(ws, r, COL.C, "", { border: allBorders() });
  ws.mergeCells(`E${r}:F${r}`);
  setCell(ws, r, COL.E, "", { border: allBorders() });
  fillGridTail(ws, r, COL.G);
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
      { bold: true, size: 10, underline: true, wrap: true, border: allBorders() },
    );
    fillGridTail(ws, r, COL.G);
    r++;

    // ── Sub-rows: one per pack-size variant ──
    for (const item of group.items) {
      const ciItem = item.fobCAD * (1 + insRate);

      ws.mergeCells(`A${r}:B${r}`);
      setCell(ws, r, COL.A, "", { border: allBorders() }); // marks column
      ws.mergeCells(`C${r}:D${r}`);
      setCell(ws, r, COL.C, item.packageDescription, { size: 9, wrap: true, border: allBorders() });
      ws.mergeCells(`E${r}:F${r}`);
      setCell(ws, r, COL.E, item.description, { size: 9, wrap: true, border: allBorders() });
      setCell(ws, r, COL.G, item.quantity, { size: 9, align: "right", border: allBorders() });
      setCell(ws, r, COL.H, item.rate, { size: 9, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.I, item.fobCAD, { size: 9, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.J, ciItem, { size: 9, align: "right", numFmt: "#,##0.00", border: allBorders() });
      ws.mergeCells(`K${r}:L${r}`);
      setCell(ws, r, COL.K, item.taxableValueINR, { size: 9, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.M, `${(item.igstRate * 100).toFixed(0)}%`, { size: 9, align: "center", border: allBorders() });
      ws.mergeCells(`N${r}:O${r}`);
      setCell(ws, r, COL.N, item.igstAmountINR, { size: 9, align: "right", numFmt: "#,##0.00", border: allBorders() });
      setCell(ws, r, COL.P, item.netWeight, { size: 9, align: "right", numFmt: "#,##0.000", border: allBorders() });
      setCell(ws, r, COL.Q, item.grossWeight, { size: 9, align: "right", numFmt: "#,##0.000", border: allBorders() });
      r++;
    }

    // ── Price-per-kg + group subtotals row ──
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:D${r}`);
    setCell(ws, r, COL.C, `$  ${group.ratePerKg.toFixed(3)}`, {
      bold: true, size: 9, border: allBorders(),
    });
    ws.mergeCells(`E${r}:F${r}`);
    setCell(ws, r, COL.E, "", { border: allBorders() });
    setCell(ws, r, COL.G, "", { border: allBorders() });
    setCell(ws, r, COL.H, "", { border: allBorders() });
    setCell(ws, r, COL.I, group.totalFob, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    setCell(ws, r, COL.J, group.totalCi, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    ws.mergeCells(`K${r}:L${r}`);
    setCell(ws, r, COL.K, group.totalTaxINR, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    setCell(ws, r, COL.M, "", { border: allBorders() });
    ws.mergeCells(`N${r}:O${r}`);
    setCell(ws, r, COL.N, group.totalIgstINR, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.00", border: allBorders(),
    });
    setCell(ws, r, COL.P, group.totalNetWt, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.000", border: allBorders(),
    });
    setCell(ws, r, COL.Q, group.totalGrossWt, {
      bold: true, size: 9, align: "right", numFmt: "#,##0.000", border: allBorders(),
    });
    r++;

    // ── Weight summary + DIST/STATE row ──
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:H${r}`);
    setCell(ws, r, COL.C,
      `NT. WT:  ${group.totalNetWt.toFixed(3)} KGS     GR. WT:  ${group.totalGrossWt.toFixed(3)} KGS`,
      { bold: true, size: 9, border: allBorders() },
    );
    fillGridTail(ws, r, COL.I);
    r++;

    // DIST / STATE row
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:H${r}`);
    setCell(ws, r, COL.C,
      `DIST:    ${group.district}            STATE:   ${group.state}`,
      { bold: true, size: 9, border: allBorders() },
    );
    fillGridTail(ws, r, COL.I);
    r++;

    // ── Blank separator row between groups ──
    ws.mergeCells(`A${r}:B${r}`);
    setCell(ws, r, COL.A, "", { border: allBorders() });
    ws.mergeCells(`C${r}:D${r}`);
    setCell(ws, r, COL.C, "", { border: allBorders() });
    ws.mergeCells(`E${r}:F${r}`);
    setCell(ws, r, COL.E, "", { border: allBorders() });
    fillGridTail(ws, r, COL.G);
    ws.getRow(r).height = 6;
    r++;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Totals Row
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `(Amount Chargeable in Words) CAD $`, {
    bold: true, size: 10, border: allBorders(),
  });
  setCell(ws, r, COL.G, totals.pkgs, {
    bold: true, size: 10, align: "right", border: allBorders(),
  });
  setCell(ws, r, COL.H, "TOTAL CAD $", {
    bold: true, size: 9, align: "center", border: allBorders(),
  });
  setCell(ws, r, COL.I, totals.fob, {
    bold: true, size: 10, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  setCell(ws, r, COL.J, totalCi, {
    bold: true, size: 10, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  ws.mergeCells(`K${r}:L${r}`);
  setCell(ws, r, COL.K, totals.tax, {
    bold: true, size: 10, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  setCell(ws, r, COL.M, "", { border: allBorders() });
  ws.mergeCells(`N${r}:O${r}`);
  setCell(ws, r, COL.N, totals.igst, {
    bold: true, size: 10, align: "right", numFmt: "#,##0.00", border: allBorders(),
  });
  setCell(ws, r, COL.P, totals.net, {
    bold: true, size: 10, align: "right", numFmt: "#,##0.000", border: allBorders(),
  });
  setCell(ws, r, COL.Q, totals.grs, {
    bold: true, size: 10, align: "right", numFmt: "#,##0.000", border: allBorders(),
  });
  ws.getRow(r).height = 20;
  r++;
  const dataEndRow = r - 1;

  // ═════════════════════════════════════════════════════════════════════════
  // Amount in Words row
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:Q${r}`);
  setCell(ws, r, COL.A, numberToWords(totals.fob), {
    bold: true, size: 9, wrap: true, border: allBorders(),
  });
  r++;

  r++; // spacer

  // ═════════════════════════════════════════════════════════════════════════
  // Footer Summary
  // ═════════════════════════════════════════════════════════════════════════
  // TTL NO. OF PKGS
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `TTL NO.OF PKGS.     ${totals.pkgs}`, { bold: true, size: 10 });
  r++;

  // TTL NET WT.KGS + Exchange Rate & Insurance Rate on the right
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `TTL NET WT.KGS.     ${totals.net.toFixed(3)}`, { bold: true, size: 10 });
  if (insCAD > 0) {
    setCell(ws, r, COL.P, insCAD, {
      bold: true, size: 10, align: "right", numFmt: "#,##0.000",
    });
    setCell(ws, r, COL.Q, insRate, {
      bold: true, size: 10, align: "right", numFmt: "0.0000000",
    });
  }
  r++;

  // TTL GR. WT.KGS
  ws.mergeCells(`A${r}:F${r}`);
  setCell(ws, r, COL.A, `TTL GR. WT.KGS.     ${totals.grs.toFixed(3)}`, { bold: true, size: 10 });
  r++;

  // INSU. CAD
  if (insCAD > 0) {
    ws.mergeCells(`N${r}:O${r}`);
    setCell(ws, r, COL.N, "INSU. CAD", { bold: true, size: 10, align: "right" });
    ws.mergeCells(`P${r}:Q${r}`);
    setCell(ws, r, COL.P, insCAD, {
      bold: true, size: 10, align: "right", numFmt: "#,##0.000",
    });
    r++;
  }

  r++; // spacer

  // ═════════════════════════════════════════════════════════════════════════
  // Declaration
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:Q${r + 2}`);
  setCell(ws, r, COL.A,
    "We declare that this invoice shows the actual price of the\n" +
    "goods described and that all particulars are true and correct.\n" +
    "We intend to claim rewards under Remission of Duties & Taxes on Export Product (RoDTEP)\n" +
    "SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX",
    { size: 8, italic: true, wrap: true, vAlign: "top" },
  );
  ws.getRow(r).height = 40;
  r += 3;

  r++; // spacer

  // ═════════════════════════════════════════════════════════════════════════
  // Signatory
  // ═════════════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${r}:J${r}`);
  setCell(ws, r, COL.A, "For KOHLICO FOODS AND BEVERAGES PVT. LTD", {
    bold: true, size: 10, border: { top: { style: "thin" } },
  });
  ws.mergeCells(`K${r}:Q${r}`);
  setCell(ws, r, COL.K, "", {
    border: { top: { style: "thin" } },
  });
  r++;
  ws.mergeCells(`A${r}:J${r}`);
  setCell(ws, r, COL.A, "Authorized Signatory", {
    size: 8, italic: true, color: "FF666666",
  });
  ws.mergeCells(`K${r}:Q${r}`);
  setCell(ws, r, COL.K, "Buyer's Signature & Stamp", {
    size: 8, italic: true, color: "FF666666", align: "right",
  });

  // ── Auto-fit column widths and row heights ─────────────────────────────
  autoFitColumns(ws, mergeMap);
  autoFitRowHeights(ws, dataStartRow, dataEndRow, mergeMap);

  // ── Return buffer ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
