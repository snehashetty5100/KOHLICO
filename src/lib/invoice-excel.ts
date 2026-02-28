// src/lib/invoice-excel.ts
// Builds an .xlsx workbook that mirrors the "Invoice Cum Packing List" Excel layout.

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
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

type WsType = ExcelJS.Worksheet;

function border(ws: WsType, row: number, fromCol: number, toCol: number) {
  for (let c = fromCol; c <= toCol; c++) {
    const cell = ws.getRow(row).getCell(c);
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  }
}

function boldCell(ws: WsType, row: number, col: number, value: string | number) {
  const cell = ws.getRow(row).getCell(col);
  cell.value = value;
  cell.font = { bold: true, size: 9 };
}

function labelCell(ws: WsType, row: number, col: number, value: string) {
  const cell = ws.getRow(row).getCell(col);
  cell.value = value;
  cell.font = { italic: true, size: 7, color: { argb: "FF555555" } };
}

function headerFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
}

function blueFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FFBDD7EE" } };
}

function allBorders(): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin" }, bottom: { style: "thin" },
    left: { style: "thin" }, right: { style: "thin" },
  };
}

// ── Main builder ──────────────────────────────────────────────────────────────

export async function buildInvoiceExcel(data: ExcelInvoiceData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Invoice Cum Packing List", {
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  // Column widths (A–M = 13 cols)
  ws.columns = [
    { width: 18 }, // A – Marks & Nos
    { width: 32 }, // B – Description
    { width: 8  }, // C – PKGS
    { width: 10 }, // D – Rate CAD
    { width: 12 }, // E – FOB CAD
    { width: 12 }, // F – C&I CAD
    { width: 14 }, // G – Taxable INR
    { width: 7  }, // H – IGST%
    { width: 14 }, // I – IGST Amt INR
    { width: 10 }, // J – Net Wt/Pkg
    { width: 12 }, // K – Total Net Wt
    { width: 10 }, // L – Gr Wt/Pkg
    { width: 12 }, // M – Total Gr Wt
  ];

  let r = 1;

  // ── Title ──────────────────────────────────────────────────────────────────
  ws.mergeCells(`A${r}:M${r}`);
  const titleCell = ws.getCell(`A${r}`);
  titleCell.value = "INVOICE CUM PACKING LIST";
  titleCell.font = { bold: true, size: 12, underline: true };
  titleCell.alignment = { horizontal: "center" };
  ws.getRow(r).height = 20;
  r++;

  // ── Row: Exporter | Invoice No | IEC ──────────────────────────────────────
  ws.mergeCells(`A${r}:B${r + 2}`);
  const expCell = ws.getCell(`A${r}`);
  expCell.value =
    "KOHLICO FOODS AND BEVERAGES PVT.LTD\n" +
    "391, NARSI NATHA STREET, MAHESH CHAMBER,\n" +
    "ROOM NO. 2, 1ST FLOOR, MUMBAI - 400009, INDIA";
  expCell.font = { size: 8 };
  expCell.alignment = { wrapText: true, vertical: "top" };
  expCell.border = allBorders();

  ws.mergeCells(`C${r}:J${r}`);
  ws.getCell(`C${r}`).value = "Invoice no. & Date / Proforma Inv. & Date";
  ws.getCell(`C${r}`).font = { italic: true, size: 7, color: { argb: "FF555555" } };
  ws.getCell(`C${r}`).border = allBorders();

  ws.mergeCells(`K${r}:M${r}`);
  ws.getCell(`K${r}`).value = "IEC NO.";
  ws.getCell(`K${r}`).font = { italic: true, size: 7, color: { argb: "FF555555" } };
  ws.getCell(`K${r}`).border = allBorders();
  r++;

  ws.mergeCells(`C${r}:J${r}`);
  const invNoCell = ws.getCell(`C${r}`);
  invNoCell.value =
    `${data.invoiceNo}` +
    (data.proformaInvNo ? `   PROFORMA: ${data.proformaInvNo}` : "");
  invNoCell.font = { bold: true, size: 9 };
  invNoCell.border = allBorders();

  ws.mergeCells(`K${r}:M${r}`);
  boldCell(ws, r, 11, data.iecCode);
  ws.getCell(`K${r}`).border = allBorders();
  r++;

  ws.mergeCells(`C${r}:J${r}`);
  ws.getCell(`C${r}`).value =
    `DTD: ${fmtDate(data.invoiceDate)}` +
    (data.proformaDate ? `   DT: ${fmtDate(data.proformaDate)}` : "");
  ws.getCell(`C${r}`).font = { size: 8 };
  ws.getCell(`C${r}`).border = allBorders();

  ws.mergeCells(`K${r}:M${r}`);
  ws.getCell(`K${r}`).border = allBorders();
  r++;

  // ── Row: Consignee | Buyer | PAN/GSTIN ────────────────────────────────────
  ws.mergeCells(`A${r}:B${r + 2}`);
  ws.getCell(`A${r}`).value =
    "Consignee :\n" +
    data.consigneeName + "\n" +
    data.consigneeAddress + "\n" +
    data.consigneeCountry;
  ws.getCell(`A${r}`).font = { size: 8 };
  ws.getCell(`A${r}`).alignment = { wrapText: true, vertical: "top" };
  ws.getCell(`A${r}`).border = allBorders();

  ws.mergeCells(`C${r}:F${r + 2}`);
  ws.getCell(`C${r}`).value =
    "Buyer (if other than consignee):\n" +
    (data.buyerName ?? data.consigneeName) + "\n" +
    (data.buyerAddress ?? data.consigneeAddress);
  ws.getCell(`C${r}`).font = { size: 8 };
  ws.getCell(`C${r}`).alignment = { wrapText: true, vertical: "top" };
  ws.getCell(`C${r}`).border = allBorders();

  ws.mergeCells(`G${r}:M${r}`);
  ws.getCell(`G${r}`).value = "Exporter's Ref. | PAN NO. | GSTIN NO. | END USE CODE";
  ws.getCell(`G${r}`).font = { italic: true, size: 7, color: { argb: "FF555555" } };
  ws.getCell(`G${r}`).border = allBorders();
  r++;

  ws.mergeCells(`G${r}:M${r}`);
  ws.getCell(`G${r}`).value =
    `${data.invoiceNo}  |  ${data.panNo}  |  ${data.gstinNo}` +
    (data.endUseCode ? `  |  ${data.endUseCode}` : "");
  ws.getCell(`G${r}`).font = { bold: true, size: 8 };
  ws.getCell(`G${r}`).border = allBorders();
  r += 2;

  // ── Row: Shipping ─────────────────────────────────────────────────────────
  // Labels
  ws.mergeCells(`A${r}:B${r}`); labelCell(ws, r, 1, "Pre-Carriage by");
  ws.mergeCells(`C${r}:D${r}`); labelCell(ws, r, 3, "Port of Receipt");
  ws.mergeCells(`E${r}:F${r}`); labelCell(ws, r, 5, "Country of Origin");
  ws.mergeCells(`G${r}:H${r}`); labelCell(ws, r, 7, "Country of Final Destination");
  r++;
  // Values
  ws.mergeCells(`A${r}:B${r}`); boldCell(ws, r, 1, data.preCarriage); ws.getCell(`A${r}`).border = allBorders();
  ws.mergeCells(`C${r}:D${r}`); boldCell(ws, r, 3, data.portOfReceipt); ws.getCell(`C${r}`).border = allBorders();
  ws.mergeCells(`E${r}:F${r}`); boldCell(ws, r, 5, data.countryOfOrigin); ws.getCell(`E${r}`).border = allBorders();
  ws.mergeCells(`G${r}:H${r}`); boldCell(ws, r, 7, data.countryOfDestination); ws.getCell(`G${r}`).border = allBorders();
  r++;

  // Labels
  ws.mergeCells(`A${r}:B${r}`); labelCell(ws, r, 1, "Vessel/Flight No.");
  ws.mergeCells(`C${r}:D${r}`); labelCell(ws, r, 3, "Port of Loading");
  ws.mergeCells(`E${r}:H${r}`); labelCell(ws, r, 5, "Terms of Delivery & Payment");
  ws.mergeCells(`I${r}:J${r}`); labelCell(ws, r, 9, "Port of Discharge");
  ws.mergeCells(`K${r}:M${r}`); labelCell(ws, r, 11, "Final Destination");
  r++;
  // Values
  ws.mergeCells(`A${r}:B${r}`); boldCell(ws, r, 1, data.vesselFlight ?? ""); ws.getCell(`A${r}`).border = allBorders();
  ws.mergeCells(`C${r}:D${r}`); boldCell(ws, r, 3, data.portOfLoading); ws.getCell(`C${r}`).border = allBorders();
  ws.mergeCells(`E${r}:H${r}`); boldCell(ws, r, 5, data.termsOfDelivery); ws.getCell(`E${r}`).border = allBorders();
  ws.mergeCells(`I${r}:J${r}`); boldCell(ws, r, 9, data.portOfDischarge); ws.getCell(`I${r}`).border = allBorders();
  ws.mergeCells(`K${r}:M${r}`);
  const exRateCell = ws.getCell(`K${r}`);
  exRateCell.value = `${data.finalDestination}   EX.RATE: ${data.exchangeRate.toFixed(2)}`;
  exRateCell.font = { bold: true, size: 9 };
  exRateCell.border = allBorders();
  r++;

  r++; // spacer

  // ── Table Header ──────────────────────────────────────────────────────────
  const thRow = ws.getRow(r);
  thRow.height = 30;
  const headers = [
    "Marks & Nos /\nKind of Pkgs",
    "Description of Goods",
    "PKGS",
    "Rate\n(CAD/Pkg)",
    "FOB\nCAD $",
    "C&I\nCAD $",
    "Taxable\nValue INR",
    "IGST\n%",
    "IGST\nAmount INR",
    "Net Wt\n/Pkg",
    "Total\nNet Wt",
    "Gr Wt\n/Pkg",
    "Total\nGr Wt",
  ];

  headers.forEach((h, i) => {
    const cell = thRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 8 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
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

  // ── Line Item Rows ────────────────────────────────────────────────────────
  data.items.forEach((item, idx) => {
    const itemRow = ws.getRow(r);
    const totalNetWt = item.quantity * item.netWeight;
    const totalGrossWt = item.quantity * item.grossWeight;
    const ciItem = item.fobCAD + insCAD / data.items.length;

    const altFill: ExcelJS.Fill = idx % 2 === 1
      ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } }
      : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };

    const values: (string | number)[] = [
      (item.marksAndNos ?? "") + (item.packageDescription ? "\n" + item.packageDescription : ""),
      item.description + "\n[HS: " + item.hsCode + "]",
      item.quantity,
      item.rate,
      item.fobCAD,
      ciItem,
      item.taxableValueINR,
      (item.igstRate * 100).toFixed(0) + "%",
      item.igstAmountINR,
      item.netWeight,
      totalNetWt,
      item.grossWeight,
      totalGrossWt,
    ];

    values.forEach((v, i) => {
      const cell = itemRow.getCell(i + 1);
      cell.value = v as ExcelJS.CellValue;
      cell.font = { size: 8 };
      cell.fill = altFill;
      cell.border = allBorders();
      if (i >= 2) cell.alignment = { horizontal: "right", vertical: "middle" };
      else cell.alignment = { wrapText: true, vertical: "top" };
      // Number formatting
      if ([4, 5, 6, 8].includes(i)) cell.numFmt = "#,##0.00";
      if ([3].includes(i)) cell.numFmt = "0.00";
      if ([9, 10, 11, 12].includes(i)) cell.numFmt = "0.000";
    });

    itemRow.height = 28;
    r++;
  });

  // ── Totals Row ────────────────────────────────────────────────────────────
  const totRow = ws.getRow(r);
  totRow.height = 18;
  ws.mergeCells(`A${r}:B${r}`);
  ws.getCell(`A${r}`).value = `TOTAL (${totals.pkgs} PKGS)`;
  ws.getCell(`A${r}`).font = { bold: true, size: 9 };
  ws.getCell(`A${r}`).fill = headerFill();
  ws.getCell(`A${r}`).border = allBorders();

  const totValues: (number | string)[] = [
    totals.pkgs, "", totals.fobCAD, ciCAD,
    totals.taxINR, "", totals.igstINR,
    "", totals.netWt, "", totals.grossWt,
  ];

  totValues.forEach((v, i) => {
    const cell = totRow.getCell(i + 3);
    cell.value = v as ExcelJS.CellValue;
    cell.font = { bold: true, size: 9 };
    cell.fill = headerFill();
    cell.border = allBorders();
    cell.alignment = { horizontal: "right" };
    if ([2, 3, 4, 6].includes(i)) cell.numFmt = "#,##0.00";
    if ([8, 10].includes(i)) cell.numFmt = "0.000";
  });
  r++;

  r++; // spacer

  // ── Footer Summary ────────────────────────────────────────────────────────
  const summaryData = [
    ["TTL NO. OF PK", totals.pkgs, "TOTAL FOB CAD $", totals.fobCAD, "TOTAL TAXABLE VALUE INR", totals.taxINR],
    ["TTL NET WT (KG)", totals.netWt, "INSURANCE CAD", insCAD, "TOTAL IGST INR", totals.igstINR],
    ["TTL GROSS WT (KG)", totals.grossWt, "TOTAL C&I CAD $", ciCAD, "EXCHANGE RATE", data.exchangeRate],
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
    ws.mergeCells(`E${r}:F${r}`);
    ws.getCell(`E${r}`).value = row[2] as string;
    ws.getCell(`E${r}`).font = { italic: true, size: 8 };
    ws.getCell(`E${r}`).border = allBorders();

    ws.mergeCells(`G${r}:H${r}`);
    ws.getCell(`G${r}`).value = row[3] as number;
    ws.getCell(`G${r}`).font = { bold: true, size: 9 };
    ws.getCell(`G${r}`).border = allBorders();
    ws.getCell(`G${r}`).alignment = { horizontal: "right" };
    ws.getCell(`G${r}`).numFmt = "#,##0.00";

    // Pair 3
    ws.mergeCells(`I${r}:J${r}`);
    ws.getCell(`I${r}`).value = row[4] as string;
    ws.getCell(`I${r}`).font = { italic: true, size: 8 };
    ws.getCell(`I${r}`).border = allBorders();

    ws.mergeCells(`K${r}:M${r}`);
    ws.getCell(`K${r}`).value = row[5] as number;
    ws.getCell(`K${r}`).font = { bold: true, size: 9 };
    ws.getCell(`K${r}`).border = allBorders();
    ws.getCell(`K${r}`).alignment = { horizontal: "right" };
    ws.getCell(`K${r}`).numFmt = "#,##0.00";

    sheetRow.height = 16;
    r++;
  });

  r++; // spacer

  // ── Declaration ───────────────────────────────────────────────────────────
  ws.mergeCells(`A${r}:M${r + 2}`);
  ws.getCell(`A${r}`).value =
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.\n" +
    "We intend to claim rewards under Remission of Duties & Taxes on Export Product (RODTEP).\n" +
    "SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX";
  ws.getCell(`A${r}`).font = { size: 7, italic: true };
  ws.getCell(`A${r}`).alignment = { wrapText: true, vertical: "top" };
  ws.getRow(r).height = 36;

  // ── Return buffer ─────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
