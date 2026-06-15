// src/lib/invoice-excel.ts
// Builds an .xlsx workbook — "Invoice Cum Packing List" with letterhead & footer.

import ExcelJS from "exceljs";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type WsType = ExcelJS.Worksheet;

function allBorders(): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };
}

function headerFill(): ExcelJS.Fill {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9D9D9" },
  };
}

function brandFill(): ExcelJS.Fill {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A3C5E" },
  };
}

function accentFill(): ExcelJS.Fill {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF2F7" },
  };
}

function labelCell(ws: WsType, row: number, col: number, value: string) {
  const cell = ws.getRow(row).getCell(col);
  cell.value = value;
  cell.font = { italic: true, size: 7, color: { argb: "FF777777" } };
}

function boldCell(
  ws: WsType,
  row: number,
  col: number,
  value: string | number
) {
  const cell = ws.getRow(row).getCell(col);
  cell.value = value;
  cell.font = { bold: true, size: 9 };
}

function setBorders(ws: WsType, row: number, fromCol: number, toCol: number) {
  for (let c = fromCol; c <= toCol; c++) {
    ws.getRow(row).getCell(c).border = allBorders();
  }
}

// ── Main builder ──────────────────────────────────────────────────────────────

export async function buildInvoiceExcel(
  data: ExcelInvoiceData
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kohlico Invoice App";
  wb.created = new Date();

  const ws = wb.addWorksheet("Invoice Cum Packing List", {
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  // Column widths (A–N = 14 cols)
  ws.columns = [
    { width: 16 }, // A – Marks & Nos
    { width: 30 }, // B – Description
    { width: 10 }, // C – Pack Size
    { width: 8 }, // D – Qty (PKGS)
    { width: 10 }, // E – FOB Rate CAD
    { width: 12 }, // F – FOB Value CAD
    { width: 12 }, // G – C&I CAD
    { width: 14 }, // H – INR Equivalent
    { width: 7 }, // I – IGST %
    { width: 14 }, // J – IGST Amt INR
    { width: 10 }, // K – Net Wt (kg)
    { width: 10 }, // L – Gross Wt (kg)
    { width: 12 }, // M – (used for summary)
    { width: 12 }, // N – (used for summary)
  ];

  let r = 1;

  // ── Company Letterhead ────────────────────────────────────────────────────
  ws.mergeCells(`A${r}:H${r}`);
  const nameCell = ws.getCell(`A${r}`);
  nameCell.value = "KOHLICO FOODS AND BEVERAGES PVT. LTD";
  nameCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  nameCell.fill = brandFill();
  nameCell.alignment = { vertical: "middle" };
  nameCell.border = allBorders();

  ws.mergeCells(`I${r}:N${r}`);
  const regCell = ws.getCell(`I${r}`);
  regCell.value = `IEC: ${data.iecCode}  |  PAN: ${data.panNo}  |  GSTIN: ${data.gstinNo}`;
  regCell.font = { bold: true, size: 8, color: { argb: "FFFFFFFF" } };
  regCell.fill = brandFill();
  regCell.alignment = { horizontal: "right", vertical: "middle" };
  regCell.border = allBorders();
  ws.getRow(r).height = 28;
  r++;

  ws.mergeCells(`A${r}:H${r}`);
  const addrCell = ws.getCell(`A${r}`);
  addrCell.value =
    "391, Narsi Natha Street, Mahesh Chamber, Room No. 2, 1st Floor, Mumbai – 400009, India";
  addrCell.font = { size: 8, color: { argb: "FF444444" } };
  addrCell.alignment = { vertical: "middle" };
  addrCell.border = allBorders();

  ws.mergeCells(`I${r}:N${r}`);
  const contactCell = ws.getCell(`I${r}`);
  contactCell.value =
    "Phone: +91 22 XXXX XXXX  |  Email: exports@kohlico.com";
  contactCell.font = { size: 8, color: { argb: "FF444444" } };
  contactCell.alignment = { horizontal: "right", vertical: "middle" };
  contactCell.border = allBorders();
  ws.getRow(r).height = 18;
  r++;

  r++; // spacer

  // ── Title ─────────────────────────────────────────────────────────────────
  ws.mergeCells(`A${r}:N${r}`);
  const titleCell = ws.getCell(`A${r}`);
  titleCell.value = "INVOICE CUM PACKING LIST";
  titleCell.font = { bold: true, size: 12, underline: true };
  titleCell.alignment = { horizontal: "center" };
  ws.getRow(r).height = 22;
  r++;

  r++; // spacer

  // ── Invoice Info Row ──────────────────────────────────────────────────────
  const infoLabels = [
    "Invoice No.",
    "Invoice Date",
    "Proforma Inv. No.",
    "Proforma Date",
  ];
  const infoValues = [
    data.invoiceNo,
    fmtDate(data.invoiceDate),
    data.proformaInvNo ?? "—",
    data.proformaDate ? fmtDate(data.proformaDate) : "—",
  ];

  // Labels
  ws.mergeCells(`A${r}:B${r}`);
  labelCell(ws, r, 1, infoLabels[0]);
  ws.mergeCells(`C${r}:E${r}`);
  labelCell(ws, r, 3, infoLabels[1]);
  ws.mergeCells(`F${r}:I${r}`);
  labelCell(ws, r, 6, infoLabels[2]);
  ws.mergeCells(`J${r}:N${r}`);
  labelCell(ws, r, 10, infoLabels[3]);
  setBorders(ws, r, 1, 14);
  r++;
  // Values
  ws.mergeCells(`A${r}:B${r}`);
  boldCell(ws, r, 1, infoValues[0]);
  ws.mergeCells(`C${r}:E${r}`);
  boldCell(ws, r, 3, infoValues[1]);
  ws.mergeCells(`F${r}:I${r}`);
  boldCell(ws, r, 6, infoValues[2]);
  ws.mergeCells(`J${r}:N${r}`);
  boldCell(ws, r, 10, infoValues[3]);
  setBorders(ws, r, 1, 14);
  r++;

  // ── Consignee & Buyer ─────────────────────────────────────────────────────
  ws.mergeCells(`A${r}:G${r + 2}`);
  ws.getCell(`A${r}`).value =
    "Consignee:\n" +
    data.consigneeName +
    "\n" +
    data.consigneeAddress +
    "\n" +
    data.consigneeCountry;
  ws.getCell(`A${r}`).font = { size: 8 };
  ws.getCell(`A${r}`).alignment = { wrapText: true, vertical: "top" };
  ws.getCell(`A${r}`).border = allBorders();

  ws.mergeCells(`H${r}:N${r + 2}`);
  ws.getCell(`H${r}`).value =
    "Buyer (if other than consignee):\n" +
    (data.buyerName ?? data.consigneeName) +
    "\n" +
    (data.buyerAddress ?? data.consigneeAddress);
  ws.getCell(`H${r}`).font = { size: 8 };
  ws.getCell(`H${r}`).alignment = { wrapText: true, vertical: "top" };
  ws.getCell(`H${r}`).border = allBorders();
  r += 3;

  // ── Shipping Details ──────────────────────────────────────────────────────
  const shipLabels = [
    ["Pre-Carriage By", "Port of Receipt", "Country of Origin", "Country of Destination"],
    ["Vessel / Flight", "Port of Loading", "Port of Discharge", "Final Destination"],
    ["Terms of Delivery", "", "Exchange Rate (INR/CAD)", ""],
  ];
  const shipValues = [
    [data.preCarriage, data.portOfReceipt, data.countryOfOrigin, data.countryOfDestination],
    [data.vesselFlight ?? "—", data.portOfLoading, data.portOfDischarge, data.finalDestination],
    [data.termsOfDelivery, "", data.exchangeRate.toFixed(2), ""],
  ];

  for (let si = 0; si < shipLabels.length; si++) {
    const labels = shipLabels[si];
    const values = shipValues[si];

    // Labels row
    if (labels[0]) { ws.mergeCells(`A${r}:C${r}`); labelCell(ws, r, 1, labels[0]); }
    if (labels[1]) { ws.mergeCells(`D${r}:G${r}`); labelCell(ws, r, 4, labels[1]); }
    if (labels[2]) { ws.mergeCells(`H${r}:K${r}`); labelCell(ws, r, 8, labels[2]); }
    if (labels[3]) { ws.mergeCells(`L${r}:N${r}`); labelCell(ws, r, 12, labels[3]); }
    r++;

    // Values row
    if (values[0]) { ws.mergeCells(`A${r}:C${r}`); boldCell(ws, r, 1, values[0]); ws.getCell(`A${r}`).border = allBorders(); }
    if (values[1]) { ws.mergeCells(`D${r}:G${r}`); boldCell(ws, r, 4, values[1]); ws.getCell(`D${r}`).border = allBorders(); }
    if (values[2]) { ws.mergeCells(`H${r}:K${r}`); boldCell(ws, r, 8, values[2]); ws.getCell(`H${r}`).border = allBorders(); }
    if (values[3]) { ws.mergeCells(`L${r}:N${r}`); boldCell(ws, r, 12, values[3]); ws.getCell(`L${r}`).border = allBorders(); }
    r++;
  }

  r++; // spacer

  // ── Table Header ──────────────────────────────────────────────────────────
  const thRow = ws.getRow(r);
  thRow.height = 30;
  const headers = [
    "Marks & Nos /\nKind of Pkgs",
    "Description of Goods\n(HS Code)",
    "Pack\nSize",
    "Qty\n(Pkgs)",
    "FOB Rate\n(CAD/Pkg)",
    "FOB Value\nCAD $",
    "C&I\nCAD $",
    "INR\nEquivalent",
    "IGST\n%",
    "IGST Amt\nINR",
    "Net Wt\n(kg)",
    "Gross Wt\n(kg)",
  ];

  headers.forEach((h, i) => {
    const cell = thRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 8, color: { argb: "FF333333" } };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.fill = headerFill();
    cell.border = allBorders();
  });
  r++;

  // ── Totals accumulators ───────────────────────────────────────────────────
  const totals = data.items.reduce(
    (acc, it) => ({
      pkgs: acc.pkgs + it.quantity,
      fobCAD: acc.fobCAD + it.fobCAD,
      taxINR: acc.taxINR + it.taxableValueINR,
      igstINR: acc.igstINR + it.igstAmountINR,
      netWt: acc.netWt + it.netWeight,
      grossWt: acc.grossWt + it.grossWeight,
    }),
    { pkgs: 0, fobCAD: 0, taxINR: 0, igstINR: 0, netWt: 0, grossWt: 0 }
  );

  const insCAD = data.insuranceCAD ?? 0;
  const ciCAD = totals.fobCAD + insCAD;
  const igstCAD =
    data.exchangeRate > 0 ? totals.igstINR / data.exchangeRate : 0;
  const grandTotalCAD = totals.fobCAD + igstCAD;
  const grandTotalINR = totals.taxINR + totals.igstINR;

  // ── Line Item Rows ────────────────────────────────────────────────────────
  data.items.forEach((item, idx) => {
    const itemRow = ws.getRow(r);
    const ciItem = item.fobCAD + insCAD / data.items.length;

    const altFill: ExcelJS.Fill =
      idx % 2 === 1
        ? {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF7F7F7" },
          }
        : {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" },
          };

    const values: (string | number)[] = [
      item.marksAndNos ?? "",
      item.description + "\n[HS: " + item.hsCode + "]",
      item.packageDescription,
      item.quantity,
      item.rate,
      item.fobCAD,
      ciItem,
      item.taxableValueINR,
      (item.igstRate * 100).toFixed(0) + "%",
      item.igstAmountINR,
      item.netWeight,
      item.grossWeight,
    ];

    values.forEach((v, i) => {
      const cell = itemRow.getCell(i + 1);
      cell.value = v as ExcelJS.CellValue;
      cell.font = { size: 8 };
      cell.fill = altFill;
      cell.border = allBorders();
      if (i >= 3) cell.alignment = { horizontal: "right", vertical: "middle" };
      else cell.alignment = { wrapText: true, vertical: "top" };
      // Number formatting
      if ([4, 5, 6, 7, 9].includes(i)) cell.numFmt = "#,##0.00";
      if ([10, 11].includes(i)) cell.numFmt = "0.000";
    });

    itemRow.height = 28;
    r++;
  });

  // ── Totals Row ────────────────────────────────────────────────────────────
  const totRow = ws.getRow(r);
  totRow.height = 20;
  ws.mergeCells(`A${r}:C${r}`);
  ws.getCell(`A${r}`).value = `TOTAL (${totals.pkgs} PKGS)`;
  ws.getCell(`A${r}`).font = { bold: true, size: 9 };
  ws.getCell(`A${r}`).fill = headerFill();
  ws.getCell(`A${r}`).border = allBorders();

  const totValues: (number | string)[] = [
    totals.pkgs,
    "",
    totals.fobCAD,
    ciCAD,
    totals.taxINR,
    "",
    totals.igstINR,
    totals.netWt,
    totals.grossWt,
  ];

  totValues.forEach((v, i) => {
    const cell = totRow.getCell(i + 4);
    cell.value = v as ExcelJS.CellValue;
    cell.font = { bold: true, size: 9 };
    cell.fill = headerFill();
    cell.border = allBorders();
    cell.alignment = { horizontal: "right" };
    if ([2, 3, 4, 6].includes(i)) cell.numFmt = "#,##0.00";
    if ([7, 8].includes(i)) cell.numFmt = "0.000";
  });
  r++;

  r++; // spacer

  // ── Subtotal → IGST → Grand Total (CAD & INR) ────────────────────────────
  // Column headers
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).fill = accentFill();
  ws.getCell(`A${r}`).border = allBorders();
  ws.mergeCells(`G${r}:H${r}`);
  ws.getCell(`G${r}`).value = "CAD $";
  ws.getCell(`G${r}`).font = { bold: true, size: 8, color: { argb: "FF555555" } };
  ws.getCell(`G${r}`).fill = accentFill();
  ws.getCell(`G${r}`).border = allBorders();
  ws.getCell(`G${r}`).alignment = { horizontal: "center" };
  ws.mergeCells(`I${r}:J${r}`);
  ws.getCell(`I${r}`).value = "INR ₹";
  ws.getCell(`I${r}`).font = { bold: true, size: 8, color: { argb: "FF555555" } };
  ws.getCell(`I${r}`).fill = accentFill();
  ws.getCell(`I${r}`).border = allBorders();
  ws.getCell(`I${r}`).alignment = { horizontal: "center" };
  r++;

  // Subtotal
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = "Subtotal (FOB)";
  ws.getCell(`A${r}`).font = { size: 9 };
  ws.getCell(`A${r}`).border = allBorders();
  ws.mergeCells(`G${r}:H${r}`);
  ws.getCell(`G${r}`).value = totals.fobCAD;
  ws.getCell(`G${r}`).font = { bold: true, size: 9 };
  ws.getCell(`G${r}`).numFmt = "#,##0.00";
  ws.getCell(`G${r}`).alignment = { horizontal: "right" };
  ws.getCell(`G${r}`).border = allBorders();
  ws.mergeCells(`I${r}:J${r}`);
  ws.getCell(`I${r}`).value = totals.taxINR;
  ws.getCell(`I${r}`).font = { bold: true, size: 9 };
  ws.getCell(`I${r}`).numFmt = "#,##0.00";
  ws.getCell(`I${r}`).alignment = { horizontal: "right" };
  ws.getCell(`I${r}`).border = allBorders();
  r++;

  // Insurance (if applicable)
  if (insCAD > 0) {
    ws.mergeCells(`A${r}:F${r}`);
    ws.getCell(`A${r}`).value = "Insurance";
    ws.getCell(`A${r}`).font = { size: 9 };
    ws.getCell(`A${r}`).border = allBorders();
    ws.mergeCells(`G${r}:H${r}`);
    ws.getCell(`G${r}`).value = insCAD;
    ws.getCell(`G${r}`).font = { bold: true, size: 9 };
    ws.getCell(`G${r}`).numFmt = "#,##0.00";
    ws.getCell(`G${r}`).alignment = { horizontal: "right" };
    ws.getCell(`G${r}`).border = allBorders();
    ws.mergeCells(`I${r}:J${r}`);
    ws.getCell(`I${r}`).value = insCAD * data.exchangeRate;
    ws.getCell(`I${r}`).font = { bold: true, size: 9 };
    ws.getCell(`I${r}`).numFmt = "#,##0.00";
    ws.getCell(`I${r}`).alignment = { horizontal: "right" };
    ws.getCell(`I${r}`).border = allBorders();
    r++;

    ws.mergeCells(`A${r}:F${r}`);
    ws.getCell(`A${r}`).value = "C&I Total";
    ws.getCell(`A${r}`).font = { size: 9 };
    ws.getCell(`A${r}`).border = allBorders();
    ws.mergeCells(`G${r}:H${r}`);
    ws.getCell(`G${r}`).value = ciCAD;
    ws.getCell(`G${r}`).font = { bold: true, size: 9 };
    ws.getCell(`G${r}`).numFmt = "#,##0.00";
    ws.getCell(`G${r}`).alignment = { horizontal: "right" };
    ws.getCell(`G${r}`).border = allBorders();
    ws.mergeCells(`I${r}:J${r}`);
    ws.getCell(`I${r}`).value = ciCAD * data.exchangeRate;
    ws.getCell(`I${r}`).font = { bold: true, size: 9 };
    ws.getCell(`I${r}`).numFmt = "#,##0.00";
    ws.getCell(`I${r}`).alignment = { horizontal: "right" };
    ws.getCell(`I${r}`).border = allBorders();
    r++;
  }

  // IGST @ 5%
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = "IGST @ 5%";
  ws.getCell(`A${r}`).font = { size: 9 };
  ws.getCell(`A${r}`).border = allBorders();
  ws.mergeCells(`G${r}:H${r}`);
  ws.getCell(`G${r}`).value = igstCAD;
  ws.getCell(`G${r}`).font = { bold: true, size: 9 };
  ws.getCell(`G${r}`).numFmt = "#,##0.00";
  ws.getCell(`G${r}`).alignment = { horizontal: "right" };
  ws.getCell(`G${r}`).border = allBorders();
  ws.mergeCells(`I${r}:J${r}`);
  ws.getCell(`I${r}`).value = totals.igstINR;
  ws.getCell(`I${r}`).font = { bold: true, size: 9 };
  ws.getCell(`I${r}`).numFmt = "#,##0.00";
  ws.getCell(`I${r}`).alignment = { horizontal: "right" };
  ws.getCell(`I${r}`).border = allBorders();
  r++;

  // Grand Total
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = "GRAND TOTAL";
  ws.getCell(`A${r}`).font = { bold: true, size: 10 };
  ws.getCell(`A${r}`).fill = headerFill();
  ws.getCell(`A${r}`).border = allBorders();
  ws.mergeCells(`G${r}:H${r}`);
  ws.getCell(`G${r}`).value = grandTotalCAD;
  ws.getCell(`G${r}`).font = { bold: true, size: 10 };
  ws.getCell(`G${r}`).numFmt = "#,##0.00";
  ws.getCell(`G${r}`).alignment = { horizontal: "right" };
  ws.getCell(`G${r}`).fill = headerFill();
  ws.getCell(`G${r}`).border = allBorders();
  ws.mergeCells(`I${r}:J${r}`);
  ws.getCell(`I${r}`).value = grandTotalINR;
  ws.getCell(`I${r}`).font = { bold: true, size: 10 };
  ws.getCell(`I${r}`).numFmt = "#,##0.00";
  ws.getCell(`I${r}`).alignment = { horizontal: "right" };
  ws.getCell(`I${r}`).fill = headerFill();
  ws.getCell(`I${r}`).border = allBorders();
  ws.getRow(r).height = 20;
  r++;

  r++; // spacer

  // ── Packing Summary ───────────────────────────────────────────────────────
  const summaryData = [
    [
      "TOTAL PACKAGES",
      totals.pkgs,
      "TOTAL FOB CAD $",
      totals.fobCAD,
      "TOTAL TAXABLE VALUE INR",
      totals.taxINR,
    ],
    [
      "TTL NET WT (KG)",
      totals.netWt,
      "INSURANCE CAD",
      insCAD,
      "TOTAL IGST INR",
      totals.igstINR,
    ],
    [
      "TTL GROSS WT (KG)",
      totals.grossWt,
      "TOTAL C&I CAD $",
      ciCAD,
      "EXCHANGE RATE",
      data.exchangeRate,
    ],
  ];

  summaryData.forEach((row) => {
    const sheetRow = ws.getRow(r);
    // Pair 1
    ws.mergeCells(`A${r}:B${r}`);
    ws.getCell(`A${r}`).value = row[0] as string;
    ws.getCell(`A${r}`).font = { italic: true, size: 8 };
    ws.getCell(`A${r}`).border = allBorders();

    ws.mergeCells(`C${r}:D${r}`);
    ws.getCell(`C${r}`).value = row[1] as number;
    ws.getCell(`C${r}`).font = { bold: true, size: 9 };
    ws.getCell(`C${r}`).border = allBorders();
    ws.getCell(`C${r}`).alignment = { horizontal: "right" };
    ws.getCell(`C${r}`).numFmt = "#,##0.000";

    // Pair 2
    ws.mergeCells(`E${r}:G${r}`);
    ws.getCell(`E${r}`).value = row[2] as string;
    ws.getCell(`E${r}`).font = { italic: true, size: 8 };
    ws.getCell(`E${r}`).border = allBorders();

    ws.mergeCells(`H${r}:I${r}`);
    ws.getCell(`H${r}`).value = row[3] as number;
    ws.getCell(`H${r}`).font = { bold: true, size: 9 };
    ws.getCell(`H${r}`).border = allBorders();
    ws.getCell(`H${r}`).alignment = { horizontal: "right" };
    ws.getCell(`H${r}`).numFmt = "#,##0.00";

    // Pair 3
    ws.mergeCells(`J${r}:L${r}`);
    ws.getCell(`J${r}`).value = row[4] as string;
    ws.getCell(`J${r}`).font = { italic: true, size: 8 };
    ws.getCell(`J${r}`).border = allBorders();

    ws.mergeCells(`M${r}:N${r}`);
    ws.getCell(`M${r}`).value = row[5] as number;
    ws.getCell(`M${r}`).font = { bold: true, size: 9 };
    ws.getCell(`M${r}`).border = allBorders();
    ws.getCell(`M${r}`).alignment = { horizontal: "right" };
    ws.getCell(`M${r}`).numFmt = "#,##0.00";

    sheetRow.height = 16;
    r++;
  });

  r++; // spacer

  // ── Bank Details ──────────────────────────────────────────────────────────
  ws.mergeCells(`A${r}:N${r}`);
  ws.getCell(`A${r}`).value = "BANK DETAILS FOR REMITTANCE";
  ws.getCell(`A${r}`).font = { bold: true, size: 9, underline: true };
  ws.getCell(`A${r}`).border = allBorders();
  ws.getCell(`A${r}`).fill = accentFill();
  r++;

  const bankDetails = [
    ["Bank Name:", "HDFC BANK LTD"],
    ["Branch:", "PRINCESS STREET, MUMBAI – 400002"],
    ["A/C No.:", "XXXXXXXXXXXX"],
    ["IFSC Code:", "HDFC0000XXX"],
    ["Swift Code:", "HDFCINBBXXX"],
    ["AD Code:", "XXXXXXXXXX"],
  ];

  bankDetails.forEach(([label, value]) => {
    ws.mergeCells(`A${r}:C${r}`);
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).font = { size: 8, color: { argb: "FF555555" } };
    ws.getCell(`A${r}`).border = allBorders();

    ws.mergeCells(`D${r}:N${r}`);
    ws.getCell(`D${r}`).value = value;
    ws.getCell(`D${r}`).font = { bold: true, size: 8 };
    ws.getCell(`D${r}`).border = allBorders();
    r++;
  });

  r++; // spacer

  // ── Declaration ───────────────────────────────────────────────────────────
  ws.mergeCells(`A${r}:N${r + 2}`);
  ws.getCell(`A${r}`).value =
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.\n" +
    "We intend to claim rewards under Remission of Duties & Taxes on Export Product (RoDTEP).\n" +
    "SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX.";
  ws.getCell(`A${r}`).font = { size: 7, italic: true };
  ws.getCell(`A${r}`).alignment = { wrapText: true, vertical: "top" };
  ws.getRow(r).height = 36;
  r += 3;

  // ── Signatory ─────────────────────────────────────────────────────────────
  r++; // spacer
  ws.mergeCells(`A${r}:G${r}`);
  ws.getCell(`A${r}`).value = "For KOHLICO FOODS AND BEVERAGES PVT. LTD";
  ws.getCell(`A${r}`).font = { bold: true, size: 9 };
  ws.getCell(`A${r}`).border = { top: { style: "thin" } };

  ws.mergeCells(`H${r}:N${r}`);
  ws.getCell(`H${r}`).value = "Received the goods in good order";
  ws.getCell(`H${r}`).font = { bold: true, size: 9 };
  ws.getCell(`H${r}`).alignment = { horizontal: "right" };
  ws.getCell(`H${r}`).border = { top: { style: "thin" } };
  r++;

  ws.mergeCells(`A${r}:G${r}`);
  ws.getCell(`A${r}`).value = "Authorized Signatory";
  ws.getCell(`A${r}`).font = {
    size: 8,
    italic: true,
    color: { argb: "FF555555" },
  };

  ws.mergeCells(`H${r}:N${r}`);
  ws.getCell(`H${r}`).value = "Buyer's Signature & Stamp";
  ws.getCell(`H${r}`).font = {
    size: 8,
    italic: true,
    color: { argb: "FF555555" },
  };
  ws.getCell(`H${r}`).alignment = { horizontal: "right" };

  // ── Return buffer ─────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
