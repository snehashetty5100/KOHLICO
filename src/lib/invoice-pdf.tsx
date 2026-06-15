// src/lib/invoice-pdf.tsx
// @react-pdf/renderer template — "Invoice Cum Packing List" with letterhead & footer.

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Styles ─────────────────────────────────────────────────────────────────────

const BORDER = "0.5pt solid #666";
const BORDER_LIGHT = "0.5pt solid #bbb";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },

  // ── Letterhead ──
  letterhead: {
    borderBottom: "1pt solid #1a1a1a",
    paddingBottom: 6,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  companyDetail: { fontSize: 7, color: "#444", lineHeight: 1.5 },
  companyDetailBold: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#333" },

  // ── Title ──
  title: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 4,
    textDecoration: "underline",
    color: "#222",
  },

  // ── Info grid ──
  outerBorder: { border: BORDER },
  infoRow: { flexDirection: "row", borderBottom: BORDER_LIGHT },
  infoRowLast: { flexDirection: "row" },
  infoCell: { flex: 1, borderRight: BORDER_LIGHT, padding: 3 },
  infoCellLast: { flex: 1, padding: 3 },
  infoLabel: { fontSize: 5.5, color: "#777", marginBottom: 1, textTransform: "uppercase" },
  infoValue: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#222" },
  infoValueNormal: { fontSize: 7, color: "#333" },

  // ── Table ──
  tableWrapper: { marginTop: 5, border: BORDER },
  thead: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderBottom: BORDER,
  },
  th: {
    padding: "2 2",
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    borderRight: BORDER_LIGHT,
    textAlign: "center",
    color: "#333",
  },
  thLast: {
    padding: "2 2",
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#333",
  },
  tr: { flexDirection: "row", borderBottom: BORDER_LIGHT },
  trAlt: {
    flexDirection: "row",
    borderBottom: BORDER_LIGHT,
    backgroundColor: "#f7f7f7",
  },
  td: { padding: "2 3", fontSize: 7, borderRight: BORDER_LIGHT, color: "#333" },
  tdRight: {
    padding: "2 3",
    fontSize: 7,
    borderRight: BORDER_LIGHT,
    textAlign: "right",
    color: "#333",
  },
  tdLast: { padding: "2 3", fontSize: 7, textAlign: "right", color: "#333" },
  tfoot: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderTop: BORDER,
  },
  tdBold: {
    padding: "2 3",
    fontSize: 7,
    borderRight: BORDER_LIGHT,
    fontFamily: "Helvetica-Bold",
    color: "#222",
  },
  tdBoldRight: {
    padding: "2 3",
    fontSize: 7,
    borderRight: BORDER_LIGHT,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#222",
  },

  // ── Totals section ──
  totalsWrapper: {
    marginTop: 6,
    border: BORDER,
  },
  totalsRow: {
    flexDirection: "row",
    borderBottom: BORDER_LIGHT,
  },
  totalsRowLast: {
    flexDirection: "row",
  },
  totalsLabel: {
    flex: 3,
    padding: "2 4",
    fontSize: 7,
    color: "#555",
    borderRight: BORDER_LIGHT,
  },
  totalsCAD: {
    flex: 1.5,
    padding: "2 4",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    borderRight: BORDER_LIGHT,
    color: "#222",
  },
  totalsINR: {
    flex: 1.5,
    padding: "2 4",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#222",
  },
  totalsHighlight: {
    backgroundColor: "#e0e0e0",
  },

  // ── Footer summary boxes ──
  footerRow: { flexDirection: "row", marginTop: 5 },
  footerBox: {
    flex: 1,
    border: BORDER,
    padding: 4,
    marginRight: 3,
  },
  footerBoxLast: { flex: 1, border: BORDER, padding: 4 },
  footerLabel: { fontSize: 5.5, color: "#777", textTransform: "uppercase" },
  footerValue: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#222",
    marginBottom: 2,
  },

  // ── Bank details ──
  bankSection: {
    marginTop: 6,
    border: BORDER,
    padding: 5,
  },
  bankTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#222",
    marginBottom: 3,
    textDecoration: "underline",
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bankLabel: { fontSize: 6, color: "#555", width: 90 },
  bankValue: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#222" },

  // ── Declaration & signatory ──
  declaration: {
    marginTop: 6,
    fontSize: 6,
    color: "#444",
    lineHeight: 1.4,
  },
  signatoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  signatoryBlock: { width: "45%" },
  signatoryLine: {
    borderTop: "0.5pt solid #333",
    paddingTop: 2,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#222",
  },
  signatorySubtext: { fontSize: 6, color: "#555", marginTop: 1 },

  // ── Page footer ──
  pageFooter: {
    position: "absolute",
    bottom: 8,
    left: 18,
    right: 18,
    borderTop: "0.5pt solid #ccc",
    paddingTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageFooterText: { fontSize: 5.5, color: "#999" },
});

// ── Column widths (landscape A4 ≈ 800pt usable) ──────────────────────────────

const COL = {
  marks: 52,
  desc: 100,
  pkgs: 26,
  rate: 30,
  fob: 36,
  ci: 36,
  taxINR: 40,
  igstPct: 20,
  igstAmt: 36,
  netPkg: 26,
  netTot: 32,
  grsPkg: 26,
  grsTot: 32,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number, dec = 2) {
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── PDF Document ──────────────────────────────────────────────────────────────

export function InvoicePDF({ data }: { data: PdfInvoiceData }) {
  const { items, exchangeRate, insuranceCAD } = data;

  // Totals
  const totals = items.reduce(
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

  const insCAD = insuranceCAD ?? 0;
  const ciCAD = totals.fobCAD + insCAD;

  // Grand totals (subtotal + IGST) in both currencies
  const subtotalCAD = totals.fobCAD;
  const subtotalINR = totals.taxINR;
  const igstINR = totals.igstINR;
  const igstCAD = exchangeRate > 0 ? igstINR / exchangeRate : 0;
  const grandTotalINR = subtotalINR + igstINR;
  const grandTotalCAD = subtotalCAD + igstCAD;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* ── Company Letterhead ── */}
        <View style={s.letterhead}>
          <View style={{ flex: 3 }}>
            <Text style={s.companyName}>KOHLICO FOODS AND BEVERAGES PVT. LTD</Text>
            <Text style={s.companyDetail}>
              391, Narsi Natha Street, Mahesh Chamber, Room No. 2, 1st Floor
            </Text>
            <Text style={s.companyDetail}>Mumbai – 400009, Maharashtra, India</Text>
            <Text style={s.companyDetail}>
              Phone: +91 22 XXXX XXXX  |  Email: exports@kohlico.com
            </Text>
          </View>
          <View style={{ flex: 2, alignItems: "flex-end" }}>
            <View style={{ flexDirection: "row", marginBottom: 1 }}>
              <Text style={s.companyDetail}>IEC: </Text>
              <Text style={s.companyDetailBold}>{data.iecCode}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 1 }}>
              <Text style={s.companyDetail}>PAN: </Text>
              <Text style={s.companyDetailBold}>{data.panNo}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 1 }}>
              <Text style={s.companyDetail}>GSTIN: </Text>
              <Text style={s.companyDetailBold}>{data.gstinNo}</Text>
            </View>
            {data.endUseCode && (
              <View style={{ flexDirection: "row" }}>
                <Text style={s.companyDetail}>End Use: </Text>
                <Text style={s.companyDetailBold}>{data.endUseCode}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Title ── */}
        <Text style={s.title}>INVOICE CUM PACKING LIST</Text>

        {/* ── Row 1: Invoice No & Date ── */}
        <View style={s.outerBorder}>
          <View style={s.infoRow}>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>Invoice No.</Text>
              <Text style={s.infoValue}>{data.invoiceNo}</Text>
            </View>
            <View style={[s.infoCell, { flex: 1.5 }]}>
              <Text style={s.infoLabel}>Invoice Date</Text>
              <Text style={s.infoValue}>{fmtDate(data.invoiceDate)}</Text>
            </View>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>Proforma Inv. No.</Text>
              <Text style={s.infoValue}>{data.proformaInvNo ?? "—"}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1.5 }]}>
              <Text style={s.infoLabel}>Proforma Date</Text>
              <Text style={s.infoValue}>
                {data.proformaDate ? fmtDate(data.proformaDate) : "—"}
              </Text>
            </View>
          </View>

          {/* ── Row 2: Consignee & Buyer ── */}
          <View style={s.infoRow}>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoLabel}>Consignee</Text>
              <Text style={s.infoValue}>{data.consigneeName}</Text>
              <Text style={s.infoValueNormal}>{data.consigneeAddress}</Text>
              <Text style={s.infoValueNormal}>{data.consigneeCountry}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoLabel}>Buyer (if other than consignee)</Text>
              <Text style={s.infoValue}>
                {data.buyerName ?? data.consigneeName}
              </Text>
              <Text style={s.infoValueNormal}>
                {data.buyerAddress ?? data.consigneeAddress}
              </Text>
            </View>
          </View>

          {/* ── Row 3: Shipping ── */}
          <View style={s.infoRow}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Pre-Carriage By</Text>
              <Text style={s.infoValue}>{data.preCarriage}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Port of Receipt</Text>
              <Text style={s.infoValue}>{data.portOfReceipt}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Country of Origin</Text>
              <Text style={s.infoValue}>{data.countryOfOrigin}</Text>
            </View>
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>Country of Destination</Text>
              <Text style={s.infoValue}>{data.countryOfDestination}</Text>
            </View>
          </View>

          {/* ── Row 4: Vessel / Port / Terms / ExRate ── */}
          <View style={s.infoRowLast}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Vessel / Flight No.</Text>
              <Text style={s.infoValue}>{data.vesselFlight ?? "—"}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Port of Loading</Text>
              <Text style={s.infoValue}>{data.portOfLoading}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Port of Discharge</Text>
              <Text style={s.infoValue}>{data.portOfDischarge}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Final Destination</Text>
              <Text style={s.infoValue}>{data.finalDestination}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Terms of Delivery</Text>
              <Text style={s.infoValue}>{data.termsOfDelivery}</Text>
            </View>
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>Exchange Rate (INR/CAD)</Text>
              <Text style={s.infoValue}>{exchangeRate.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ── Line Items Table ── */}
        <View style={s.tableWrapper}>
          {/* Header */}
          <View style={s.thead}>
            <Text style={[s.th, { width: COL.marks }]}>
              {"Marks & Nos /\nKind of Pkgs"}
            </Text>
            <Text style={[s.th, { width: COL.desc }]}>
              {"Description of Goods\n(HS Code)"}
            </Text>
            <Text style={[s.th, { width: COL.pkgs }]}>{"Pack\nSize"}</Text>
            <Text style={[s.th, { width: COL.pkgs }]}>{"Qty\n(Pkgs)"}</Text>
            <Text style={[s.th, { width: COL.rate }]}>{"FOB Rate\nCAD/Pkg"}</Text>
            <Text style={[s.th, { width: COL.fob }]}>{"FOB Value\nCAD $"}</Text>
            <Text style={[s.th, { width: COL.ci }]}>{"C&I\nCAD $"}</Text>
            <Text style={[s.th, { width: COL.taxINR }]}>{"INR\nEquivalent"}</Text>
            <Text style={[s.th, { width: COL.igstPct }]}>{"IGST\n%"}</Text>
            <Text style={[s.th, { width: COL.igstAmt }]}>{"IGST Amt\nINR"}</Text>
            <Text style={[s.th, { width: COL.netPkg }]}>{"Net Wt\n(kg)"}</Text>
            <Text style={[s.thLast, { width: COL.grsPkg }]}>{"Gross Wt\n(kg)"}</Text>
          </View>

          {/* Items */}
          {items.map((item, idx) => {
            const ciItem = item.fobCAD + insCAD / items.length;
            return (
              <View key={idx} style={idx % 2 === 0 ? s.tr : s.trAlt}>
                <View style={[s.td, { width: COL.marks }]}>
                  <Text>{item.marksAndNos ?? ""}</Text>
                </View>
                <View style={[s.td, { width: COL.desc }]}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {item.description}
                  </Text>
                  <Text style={{ fontSize: 5.5, color: "#777" }}>
                    [HS: {item.hsCode}]
                  </Text>
                </View>
                <View style={[s.td, { width: COL.pkgs }]}>
                  <Text style={{ fontSize: 6 }}>{item.packageDescription}</Text>
                </View>
                <Text style={[s.tdRight, { width: COL.pkgs }]}>
                  {item.quantity}
                </Text>
                <Text style={[s.tdRight, { width: COL.rate }]}>
                  {fmt(item.rate)}
                </Text>
                <Text style={[s.tdRight, { width: COL.fob }]}>
                  {fmt(item.fobCAD)}
                </Text>
                <Text style={[s.tdRight, { width: COL.ci }]}>
                  {fmt(ciItem)}
                </Text>
                <Text style={[s.tdRight, { width: COL.taxINR }]}>
                  {fmt(item.taxableValueINR)}
                </Text>
                <Text style={[s.tdRight, { width: COL.igstPct }]}>
                  {(item.igstRate * 100).toFixed(0)}%
                </Text>
                <Text style={[s.tdRight, { width: COL.igstAmt }]}>
                  {fmt(item.igstAmountINR)}
                </Text>
                <Text style={[s.tdRight, { width: COL.netPkg }]}>
                  {fmt(item.netWeight, 3)}
                </Text>
                <Text style={[s.tdLast, { width: COL.grsPkg }]}>
                  {fmt(item.grossWeight, 3)}
                </Text>
              </View>
            );
          })}

          {/* Totals row */}
          <View style={s.tfoot}>
            <View style={[s.tdBold, { width: COL.marks + COL.desc }]}>
              <Text>TOTAL ({totals.pkgs} PKGS)</Text>
            </View>
            <Text style={[s.tdBoldRight, { width: COL.pkgs }]} />
            <Text style={[s.tdBoldRight, { width: COL.pkgs }]}>
              {totals.pkgs}
            </Text>
            <Text style={[s.tdBoldRight, { width: COL.rate }]} />
            <Text style={[s.tdBoldRight, { width: COL.fob }]}>
              {fmt(totals.fobCAD)}
            </Text>
            <Text style={[s.tdBoldRight, { width: COL.ci }]}>
              {fmt(ciCAD)}
            </Text>
            <Text style={[s.tdBoldRight, { width: COL.taxINR }]}>
              {fmt(totals.taxINR)}
            </Text>
            <Text style={[s.tdBoldRight, { width: COL.igstPct }]} />
            <Text style={[s.tdBoldRight, { width: COL.igstAmt }]}>
              {fmt(totals.igstINR)}
            </Text>
            <Text style={[s.tdBoldRight, { width: COL.netPkg }]}>
              {fmt(totals.netWt, 3)}
            </Text>
            <Text
              style={[
                { ...s.tdLast, fontFamily: "Helvetica-Bold" },
                { width: COL.grsPkg },
              ]}
            >
              {fmt(totals.grossWt, 3)}
            </Text>
          </View>
        </View>

        {/* ── Subtotal → IGST → Grand Total (CAD & INR) ── */}
        <View style={s.totalsWrapper}>
          {/* Header row */}
          <View style={[s.totalsRow, s.totalsHighlight]}>
            <Text style={[s.totalsLabel, { fontFamily: "Helvetica-Bold" }]} />
            <Text style={[s.totalsCAD, { fontSize: 6, color: "#555" }]}>CAD $</Text>
            <Text style={[s.totalsINR, { fontSize: 6, color: "#555" }]}>INR ₹</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Subtotal (FOB)</Text>
            <Text style={s.totalsCAD}>{fmt(subtotalCAD)}</Text>
            <Text style={s.totalsINR}>{fmt(subtotalINR)}</Text>
          </View>
          {insCAD > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Insurance</Text>
              <Text style={s.totalsCAD}>{fmt(insCAD)}</Text>
              <Text style={s.totalsINR}>{fmt(insCAD * exchangeRate)}</Text>
            </View>
          )}
          {insCAD > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>C&I Total</Text>
              <Text style={s.totalsCAD}>{fmt(ciCAD)}</Text>
              <Text style={s.totalsINR}>{fmt(ciCAD * exchangeRate)}</Text>
            </View>
          )}
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>IGST @ 5%</Text>
            <Text style={s.totalsCAD}>{fmt(igstCAD)}</Text>
            <Text style={s.totalsINR}>{fmt(igstINR)}</Text>
          </View>
          <View style={[s.totalsRowLast, s.totalsHighlight]}>
            <Text style={[s.totalsLabel, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
              GRAND TOTAL
            </Text>
            <Text style={[s.totalsCAD, { fontSize: 8 }]}>{fmt(grandTotalCAD)}</Text>
            <Text style={[s.totalsINR, { fontSize: 8 }]}>{fmt(grandTotalINR)}</Text>
          </View>
        </View>

        {/* ── Packing Summary ── */}
        <View style={s.footerRow}>
          <View style={s.footerBox}>
            <Text style={s.footerLabel}>Total Packages</Text>
            <Text style={s.footerValue}>{totals.pkgs} CTNS</Text>
            <Text style={s.footerLabel}>Total Net Weight</Text>
            <Text style={s.footerValue}>{fmt(totals.netWt, 3)} KG</Text>
            <Text style={s.footerLabel}>Total Gross Weight</Text>
            <Text style={s.footerValue}>{fmt(totals.grossWt, 3)} KG</Text>
          </View>
          <View style={s.footerBox}>
            <Text style={s.footerLabel}>Total FOB CAD $</Text>
            <Text style={s.footerValue}>{fmt(totals.fobCAD)}</Text>
            <Text style={s.footerLabel}>Insurance CAD</Text>
            <Text style={s.footerValue}>{fmt(insCAD, 3)}</Text>
            <Text style={s.footerLabel}>Total C&I CAD $</Text>
            <Text style={s.footerValue}>{fmt(ciCAD)}</Text>
          </View>
          <View style={s.footerBoxLast}>
            <Text style={s.footerLabel}>Exchange Rate (INR/CAD)</Text>
            <Text style={s.footerValue}>{exchangeRate.toFixed(2)}</Text>
            <Text style={s.footerLabel}>Total Taxable Value INR</Text>
            <Text style={s.footerValue}>{fmt(totals.taxINR)}</Text>
            <Text style={s.footerLabel}>Total IGST INR</Text>
            <Text style={s.footerValue}>{fmt(totals.igstINR)}</Text>
          </View>
        </View>

        {/* ── Bank Details ── */}
        <View style={s.bankSection}>
          <Text style={s.bankTitle}>BANK DETAILS FOR REMITTANCE</Text>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>Bank Name:</Text>
            <Text style={s.bankValue}>HDFC BANK LTD</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>Branch:</Text>
            <Text style={s.bankValue}>PRINCESS STREET, MUMBAI – 400002</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>A/C No.:</Text>
            <Text style={s.bankValue}>XXXXXXXXXXXX</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>IFSC Code:</Text>
            <Text style={s.bankValue}>HDFC0000XXX</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>Swift Code:</Text>
            <Text style={s.bankValue}>HDFCINBBXXX</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>AD Code:</Text>
            <Text style={s.bankValue}>XXXXXXXXXX</Text>
          </View>
        </View>

        {/* ── Declaration ── */}
        <Text style={s.declaration}>
          We declare that this invoice shows the actual price of the goods
          described and that all particulars are true and correct.{"\n"}
          We intend to claim rewards under Remission of Duties & Taxes on Export
          Product (RoDTEP).{"\n"}
          SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX.
        </Text>

        {/* ── Signatory ── */}
        <View style={s.signatoryRow}>
          <View style={s.signatoryBlock}>
            <Text style={s.signatoryLine}>
              For KOHLICO FOODS AND BEVERAGES PVT. LTD
            </Text>
            <Text style={s.signatorySubtext}>Authorized Signatory</Text>
          </View>
          <View style={[s.signatoryBlock, { alignItems: "flex-end" }]}>
            <Text style={s.signatoryLine}>Received the goods in good order</Text>
            <Text style={s.signatorySubtext}>Buyer's Signature & Stamp</Text>
          </View>
        </View>

        {/* ── Page Footer ── */}
        <View style={s.pageFooter} fixed>
          <Text style={s.pageFooterText}>
            Kohlico Foods and Beverages Pvt. Ltd — Invoice {data.invoiceNo}
          </Text>
          <Text style={s.pageFooterText}>
            Generated on {new Date().toLocaleDateString("en-IN")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
