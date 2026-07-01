// src/lib/invoice-pdf.tsx
// @react-pdf/renderer template — matches the real "Invoice Cum Packing List" layout.
// Products are grouped by HS code with sub-rows per pack size.
// PORTRAIT VERSION: column widths scaled ~0.795x to fit A4 portrait width (~563pt usable).
// Only changes: orientation, column widths (C object), and body/table font sizes
// (8pt → 7pt) so narrower columns don't wrap/clip. No calculation, field, or
// structural logic was touched.

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Types (unchanged — must match API route data shape) ──────────────────────

export interface PdfInvoiceItem {
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

export interface PdfInvoiceData {
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
  items: PdfInvoiceItem[];
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
  items: PdfInvoiceItem[];
}

/** Find the longest common prefix of a list of strings, splitting on whitespace. */
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
  items: PdfInvoiceItem[],
  totalFob: number,
  insCAD: number,
): ProductGroup[] {
  const map = new Map<string, PdfInvoiceItem[]>();
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

function fmt(v: number, d = 2): string {
  return v.toFixed(d);
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Styles ──────────────────────────────────────────────────────────────────

const B = "0.5pt solid #333";
const BL = "0.5pt solid #999";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },

  // Title
  title: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 2,
  },

  // Header info grid
  grid: { border: B },
  row: { flexDirection: "row", borderBottom: BL },
  rowLast: { flexDirection: "row" },
  cell: { padding: "2 3", borderRight: BL },
  cellLast: { padding: "2 3" },
  lbl: { fontSize: 6, color: "#666", marginBottom: 1 },
  val: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  valN: { fontSize: 7 },

  // Table
  table: { border: B, marginTop: 3 },
  thRow: {
    flexDirection: "row",
    backgroundColor: "#e4e4e4",
    borderBottom: B,
  },
  th: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    padding: "2 1",
    borderRight: BL,
  },
  thLast: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    padding: "2 1",
  },

  // Table body: marks panel + groups panel
  tableBody: { flexDirection: "row" },
  marksPanel: { borderRight: BL, padding: "3 2", justifyContent: "flex-start" },
  groupsPanel: { flex: 1 },

  // Group header row
  ghRow: { flexDirection: "row", borderBottom: BL, backgroundColor: "#f2f2f2" },
  // Item data row
  dRow: { flexDirection: "row", borderBottom: BL },
  // Subtotal row
  stRow: { flexDirection: "row", borderBottom: BL, backgroundColor: "#f7f7f7" },
  // Weight row
  wtRow: { flexDirection: "row", borderBottom: BL },
  // Separator
  sep: { height: 3, borderBottom: BL },

  // Data cells
  dc: { padding: "1 2", borderRight: BL, fontSize: 7 },
  dcR: { padding: "1 2", borderRight: BL, fontSize: 7, textAlign: "right" },
  dcLast: { padding: "1 2", fontSize: 7, textAlign: "right" },
  dcBold: { padding: "1 2", borderRight: BL, fontSize: 7, fontFamily: "Helvetica-Bold" },
  dcBoldR: {
    padding: "1 2",
    borderRight: BL,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  // Totals row
  totRow: { flexDirection: "row", borderTop: B, backgroundColor: "#e4e4e4" },

  // Footer
  footerLine: { fontSize: 8, fontFamily: "Helvetica-Bold", marginTop: 1 },
  decl: { fontSize: 7, color: "#444", marginTop: 6, lineHeight: 1.5 },
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  sigBlock: { width: "45%" },
  sigLine: {
    borderTop: B,
    paddingTop: 2,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  sigSub: { fontSize: 7, color: "#666", marginTop: 1 },
});

// ── Column widths (A4 PORTRAIT ≈ 563pt usable — scaled ~0.795x from landscape) ─

const C = {
  marks: 53,
  pack: 49,
  desc: 108,
  qty: 25,
  rate: 41,
  fob: 46,
  ci: 46,
  tax: 52,
  igstP: 21,
  igstA: 44,
  netW: 38,
  grsW: 38,
};
// Total: 53+49+108+25+41+46+46+52+21+44+38+38 = 561pt (fits within ~563pt usable width)

// Widths for body rows (11 cols, no marks)
const BODY_COLS = [
  C.pack, C.desc, C.qty, C.rate, C.fob, C.ci, C.tax, C.igstP, C.igstA, C.netW, C.grsW,
];

// ── PDF Document ─────────────────────────────────────────────────────────────

export function InvoicePDF({ data }: { data: PdfInvoiceData }) {
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

  // ── Adaptive spacing: scale sizes based on item count ──────────────────────
  // Lerp between compact (10+ rows) and spacious (1 row) for visual balance.
  const totalItemRows = data.items.length;
  const COMPACT_THRESHOLD = 10;
  const t = Math.max(0, Math.min(1, (COMPACT_THRESHOLD - totalItemRows) / (COMPACT_THRESHOLD - 1)));
  const lerp = (compact: number, spacious: number) =>
    Math.round((compact + t * (spacious - compact)) * 100) / 100;

  // Scaled values — compact → spacious (capped)
  const bodyFs   = lerp(7, 8.5);   // table body font size
  const cellPadV = lerp(1, 4);     // data-cell vertical padding
  const cellPadH = lerp(2, 3);     // data-cell horizontal padding
  const ghPadV   = lerp(1, 3);     // group-header row vertical padding
  const tableMt  = lerp(3, 24);    // marginTop above product table
  const footerMt = lerp(4, 24);    // marginTop above footer summary
  const declMt   = lerp(6, 26);    // marginTop above declaration
  const declLh   = lerp(1.5, 2.0); // declaration line-height
  const sigMt    = lerp(28, 80);   // marginTop above signature block
  const sepH     = lerp(3, 12);    // separator height between groups
  const titleMb  = lerp(2, 10);    // title marginBottom
  // ──────────────────────────────────────────────────────────────────────────

  /** Render a cell in the 11-col body (index 0–10). */
  function BC(idx: number, text: string, bold = false, align: "left" | "right" = "right") {
    const isLast = idx === 10;
    return (
      <View
        key={idx}
        style={{
          width: BODY_COLS[idx],
          borderRight: isLast ? undefined : BL,
          padding: `${cellPadV} ${cellPadH}`,
        }}
      >
        <Text
          style={{
            fontSize: bodyFs,
            fontFamily: bold ? "Helvetica-Bold" : "Helvetica",
            textAlign: idx < 2 ? "left" : align,
          }}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={s.page}>
        {/* ═══ Title ═══ */}
        <Text style={[s.title, { marginBottom: titleMb }]}>INVOICE CUM PACKING LIST</Text>

        {/* ═══ Header Info Grid ═══ */}
        <View style={s.grid}>
          {/* Row 1: Exporter (left) | Invoice No, Date, Proforma, IEC (right) */}
          <View style={s.row}>
            <View style={[s.cell, { flex: 2 }]}>
              <Text style={s.lbl}>Exporter :</Text>
              <Text style={s.val}>KOHLICO FOODS AND BEVERAGES PVT.LTD</Text>
              <Text style={s.valN}>
                391, NARSI NATHA STREET, MAHESH CHAMBER,
              </Text>
              <Text style={s.valN}>
                ROOM NO. 2, 1ST FLOOR, MUMBAI - 400009, INDIA
              </Text>
            </View>
            <View style={[s.cell, { flex: 2.5 }]}>
              <Text style={s.lbl}>
                Invoice no. & Date{"          "}Proforma Inv. & Date
              </Text>
              <Text style={s.val}>
                {data.invoiceNo}
                {data.proformaInvNo
                  ? `          ${data.proformaInvNo}`
                  : ""}
              </Text>
              <Text style={s.valN}>
                DTD: {fmtDate(data.invoiceDate)}
                {data.proformaDate
                  ? `          DT: ${fmtDate(data.proformaDate)}`
                  : ""}
              </Text>
              <Text style={[s.lbl, { marginTop: 2 }]}>
                Exporter&apos;s Ref.{"      "}PAN NO.{"      "}GSTIN NO.
                {data.endUseCode ? "      END USE CODE:" : ""}
              </Text>
              <Text style={s.val}>
                {data.invoiceNo}{"  "}{data.panNo}{"  "}{data.gstinNo}
                {data.endUseCode ? `  ${data.endUseCode}` : ""}
              </Text>
            </View>
            <View style={[s.cellLast, { flex: 1 }]}>
              <Text style={s.lbl}>IEC NO.</Text>
              <Text style={s.val}>{data.iecCode}</Text>
            </View>
          </View>

          {/* Row 2: Consignee (left) | Buyer (right) */}
          <View style={s.row}>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.lbl}>Consignee :</Text>
              <Text style={s.val}>{data.consigneeName}</Text>
              <Text style={s.valN}>{data.consigneeAddress}</Text>
              <Text style={s.valN}>{data.consigneeCountry}</Text>
            </View>
            <View style={[s.cellLast, { flex: 1 }]}>
              <Text style={s.lbl}>Buyer (if other than consignee)</Text>
              <Text style={s.val}>
                {data.buyerName ?? data.consigneeName}
              </Text>
              <Text style={s.valN}>
                {data.buyerAddress ?? data.consigneeAddress}
              </Text>
            </View>
          </View>

          {/* Row 3: Pre-Carriage | Port of Receipt | Country of Origin | Country of Destination */}
          <View style={s.row}>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.lbl}>Pre-Carriage by</Text>
              <Text style={s.val}>{data.preCarriage}</Text>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.lbl}>Port of Receipt by Pre-Carriage</Text>
              <Text style={s.val}>{data.portOfReceipt}</Text>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.lbl}>Country of Origin</Text>
              <Text style={s.val}>{data.countryOfOrigin}</Text>
            </View>
            <View style={[s.cellLast, { flex: 1 }]}>
              <Text style={s.lbl}>Country of Final Destination</Text>
              <Text style={s.val}>{data.countryOfDestination}</Text>
            </View>
          </View>

          {/* Row 4: Vessel/Flight | Port of Loading | Port of Discharge | Final Destination */}
          <View style={s.row}>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.lbl}>Vessel/Flight No.</Text>
              <Text style={s.val}>{data.vesselFlight ?? ""}</Text>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.lbl}>Port of Loading</Text>
              <Text style={s.val}>{data.portOfLoading}</Text>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.lbl}>Port of Discharge</Text>
              <Text style={s.val}>{data.portOfDischarge}</Text>
            </View>
            <View style={[s.cellLast, { flex: 1 }]}>
              <Text style={s.lbl}>Final Destination</Text>
              <Text style={s.val}>{data.finalDestination}</Text>
            </View>
          </View>

          {/* Row 5: Terms of Delivery (left) | EX.RATE (right) */}
          <View style={s.rowLast}>
            <View style={[s.cell, { flex: 3 }]}>
              <Text style={s.lbl}>TERMS OF DELIVERY & PAYMENT</Text>
              <Text style={s.val}>{data.termsOfDelivery}</Text>
            </View>
            <View style={[s.cellLast, { flex: 1 }]}>
              <Text style={s.lbl}>EX.RATE</Text>
              <Text style={s.val}>{data.exchangeRate.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ═══ Product Table ═══ */}
        <View style={[s.table, { marginTop: tableMt }]}>
          {/* ── Table Header ── */}
          <View style={s.thRow}>
            <Text style={[s.th, { width: C.marks }]}>{"Marks &\nNos."}</Text>
            <Text style={[s.th, { width: C.pack }]}>
              {"No.& Kind\nof Pkgs"}
            </Text>
            <Text style={[s.th, { width: C.desc }]}>
              {"Description of Goods"}
            </Text>
            <Text style={[s.th, { width: C.qty }]}>{"Qty.\nPKGS"}</Text>
            <Text style={[s.th, { width: C.rate }]}>
              {"Rate\nFOB CAD $/PKG"}
            </Text>
            <Text style={[s.th, { width: C.fob }]}>
              {"Amount\nFOB CAD $"}
            </Text>
            <Text style={[s.th, { width: C.ci }]}>
              {"Amount\nC & I CAD $"}
            </Text>
            <Text style={[s.th, { width: C.tax }]}>{"Taxable\nValue"}</Text>
            <Text style={[s.th, { width: C.igstP }]}>
              {"Integrated\nTax Rate"}
            </Text>
            <Text style={[s.th, { width: C.igstA }]}>
              {"Integrated\nTax Amount"}
            </Text>
            <Text style={[s.th, { width: C.netW }]}>{"Net Wt\n(kg)"}</Text>
            <Text style={[s.thLast, { width: C.grsW }]}>
              {"Gross Wt\n(kg)"}
            </Text>
          </View>

          {/* ── Table Body: Marks panel + Groups panel ── */}
          <View style={s.tableBody}>
            {/* Left: Marks column (spans all group rows) */}
            <View style={[s.marksPanel, { width: C.marks }]}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: bodyFs }}>
                {marksText}
              </Text>
              <Text style={{ fontSize: bodyFs - 1 }}>CTNS NO.</Text>
            </View>

            {/* Right: Product groups */}
            <View style={s.groupsPanel}>
              {groups.map((g) => (
                <View key={g.hsCode}>
                  {/* Group header: [n] qty CTNS  PRODUCT NAME [HS CODE: xxx] */}
                  <View style={s.ghRow}>
                    <View style={{ width: C.pack + C.desc, padding: `${ghPadV} ${cellPadH}` }}>
                      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: bodyFs, textDecoration: "underline" }}>
                        [{g.index}]{"     "}{g.totalQty} CTNS{"  "}{g.name}{" "}
                        [HS CODE: {g.hsCode}]
                      </Text>
                    </View>
                    {/* Remaining cells empty */}
                    {[C.qty, C.rate, C.fob, C.ci, C.tax, C.igstP, C.igstA, C.netW].map(
                      (w, i) => (
                        <View key={i} style={{ width: w, borderRight: BL }} />
                      ),
                    )}
                    <View style={{ width: C.grsW }} />
                  </View>

                  {/* Sub-rows: one per pack-size variant */}
                  {g.items.map((item, ii) => {
                    const ciItem = item.fobCAD * (1 + insRate);
                    return (
                      <View key={ii} style={s.dRow}>
                        {BC(0, item.packageDescription)}
                        {BC(1, item.description)}
                        {BC(2, String(item.quantity))}
                        {BC(3, fmt(item.rate))}
                        {BC(4, fmt(item.fobCAD, 2))}
                        {BC(5, fmt(ciItem, 2))}
                        {BC(6, fmt(item.taxableValueINR, 2))}
                        {BC(7, `${(item.igstRate * 100).toFixed(0)}%`)}
                        {BC(8, fmt(item.igstAmountINR, 2))}
                        {BC(9, fmt(item.netWeight, 3))}
                        {BC(10, fmt(item.grossWeight, 3))}
                      </View>
                    );
                  })}

                  {/* Price-per-kg + group subtotals row */}
                  <View style={s.stRow}>
                    {BC(0, `$  ${fmt(g.ratePerKg, 3)}`, true, "left")}
                    {BC(1, "")}
                    {BC(2, "")}
                    {BC(3, "")}
                    {BC(4, fmt(g.totalFob, 2), true)}
                    {BC(5, "")}
                    {BC(6, fmt(g.totalCi, 2), true)}
                    {BC(7, fmt(g.totalTaxINR, 2), true)}
                    {BC(8, "")}
                    {BC(9, fmt(g.totalIgstINR, 2), true)}
                    {BC(10, "")}
                  </View>

                  {/* Weight summary row */}
                  <View style={s.wtRow}>
                    <View
                      style={{
                        width: C.pack + C.desc + C.qty + C.rate,
                        padding: `${cellPadV} ${cellPadH}`,
                      }}
                    >
                      <Text style={{ fontSize: bodyFs, fontFamily: "Helvetica-Bold" }}>
                        NT. WT. {fmt(g.totalNetWt, 3)} KGS{"    "}GR. WT.{" "}
                        {fmt(g.totalGrossWt, 3)} KGS
                      </Text>
                    </View>
                    {/* Fill remaining width */}
                    <View style={{ flex: 1 }} />
                  </View>

                  {/* Blank separator between groups */}
                  <View style={[s.sep, { height: sepH }]} />
                </View>
              ))}
            </View>
          </View>

          {/* ── Totals Row ── */}
          <View style={s.totRow}>
            {/* First 3 cols merged: marks + pack + desc */}
            <View
              style={{
                width: C.marks + C.pack + C.desc,
                padding: "2 3",
                borderRight: BL,
              }}
            >
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7 }}>
                (Amount Chargeable in Words) CAD $
              </Text>
            </View>
            {/* qty */}
            <View style={{ width: C.qty, padding: "2 2", borderRight: BL }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  textAlign: "right",
                }}
              >
                {totals.pkgs}
              </Text>
            </View>
            {/* rate → label */}
            <View style={{ width: C.rate, padding: "2 2", borderRight: BL }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 6,
                  textAlign: "center",
                }}
              >
                TOTAL CAD $
              </Text>
            </View>
            {/* fob */}
            <View style={{ width: C.fob, padding: "2 2", borderRight: BL }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  textAlign: "right",
                }}
              >
                {fmt(totals.fob)}
              </Text>
            </View>
            {/* ci */}
            <View style={{ width: C.ci, padding: "2 2", borderRight: BL }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  textAlign: "right",
                }}
              >
                {fmt(totalCi)}
              </Text>
            </View>
            {/* taxable INR */}
            <View style={{ width: C.tax, padding: "2 2", borderRight: BL }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  textAlign: "right",
                }}
              >
                {fmt(totals.tax)}
              </Text>
            </View>
            {/* igst % (blank) */}
            <View style={{ width: C.igstP, padding: "2 2", borderRight: BL }}>
              <Text />
            </View>
            {/* igst amount */}
            <View style={{ width: C.igstA, padding: "2 2", borderRight: BL }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  textAlign: "right",
                }}
              >
                {fmt(totals.igst)}
              </Text>
            </View>
            {/* net wt */}
            <View style={{ width: C.netW, padding: "2 2", borderRight: BL }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  textAlign: "right",
                }}
              >
                {fmt(totals.net, 3)}
              </Text>
            </View>
            {/* gross wt */}
            <View style={{ width: C.grsW, padding: "2 2" }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7,
                  textAlign: "right",
                }}
              >
                {fmt(totals.grs, 3)}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ Footer Summary ═══ */}
        <View style={{ marginTop: footerMt }}>
          <Text style={s.footerLine}>
            TTL NO.OF PKGS.{"  "}{totals.pkgs}
          </Text>
          <Text style={s.footerLine}>
            TTL NET WT.KGS.{"  "}{fmt(totals.net, 3)}
          </Text>
          <Text style={s.footerLine}>
            TTL GR. WT.KGS.{"  "}{fmt(totals.grs, 3)}
          </Text>
          {insCAD > 0 && (
            <Text style={s.footerLine}>
              INSU. CAD:{"  "}{fmt(insCAD, 3)}
            </Text>
          )}
        </View>

        {/* ═══ Declaration ═══ */}
        <Text style={[s.decl, { marginTop: declMt, lineHeight: declLh }]}>
          We declare that this invoice shows the actual price of the goods
          described and that all particulars are true and correct.{"\n"}
          We intend to claim rewards under Remission of Duties & Taxes on
          Export Product (RoDTEP).{"\n"}
          SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX
        </Text>

        {/* ═══ Signatory ═══ */}
        <View style={[s.sigRow, { marginTop: sigMt }]}>
          <View style={s.sigBlock}>
            <Text style={s.sigLine}>
              For KOHLICO FOODS AND BEVERAGES PVT. LTD
            </Text>
            <Text style={s.sigSub}>Authorized Signatory</Text>
          </View>
          <View style={[s.sigBlock, { alignItems: "flex-end" }]}>
            <Text style={s.sigLine}>
              Buyer&apos;s Signature & Stamp
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}