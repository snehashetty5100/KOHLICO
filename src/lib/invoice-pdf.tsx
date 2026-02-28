// src/lib/invoice-pdf.tsx
// @react-pdf/renderer template that recreates the "Invoice Cum Packing List" layout.

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

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
    textDecoration: "underline",
  },

  // ── Info grid ──
  infoRow: { flexDirection: "row", borderBottom: "0.5pt solid #999" },
  infoCell: {
    flex: 1,
    borderRight: "0.5pt solid #999",
    padding: 3,
  },
  infoCellLast: { flex: 1, padding: 3 },
  infoLabel: { fontSize: 6, color: "#555", marginBottom: 1 },
  infoValue: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  infoValueNormal: { fontSize: 7 },

  // ── Table ──
  tableWrapper: { marginTop: 6, border: "0.5pt solid #999" },
  thead: { flexDirection: "row", backgroundColor: "#e8e8e8", borderBottom: "0.5pt solid #999" },
  th: {
    padding: "2 3",
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    borderRight: "0.5pt solid #999",
    textAlign: "center",
  },
  thLast: { padding: "2 3", fontSize: 6, fontFamily: "Helvetica-Bold", textAlign: "center" },
  tr: { flexDirection: "row", borderBottom: "0.5pt solid #ddd" },
  trAlt: { flexDirection: "row", borderBottom: "0.5pt solid #ddd", backgroundColor: "#fafafa" },
  tfoot: { flexDirection: "row", backgroundColor: "#e8e8e8", borderTop: "0.5pt solid #999" },
  td: { padding: "2 3", fontSize: 7, borderRight: "0.5pt solid #ddd" },
  tdRight: { padding: "2 3", fontSize: 7, borderRight: "0.5pt solid #ddd", textAlign: "right" },
  tdLast: { padding: "2 3", fontSize: 7, textAlign: "right" },
  tdBold: { padding: "2 3", fontSize: 7, borderRight: "0.5pt solid #ddd", fontFamily: "Helvetica-Bold" },
  tdBoldRight: {
    padding: "2 3",
    fontSize: 7,
    borderRight: "0.5pt solid #ddd",
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  // ── Footer ──
  footerRow: { flexDirection: "row", marginTop: 6 },
  footerBox: { flex: 1, border: "0.5pt solid #999", padding: 4, marginRight: 4 },
  footerBoxLast: { flex: 1, border: "0.5pt solid #999", padding: 4 },
  footerLabel: { fontSize: 6, color: "#555" },
  footerValue: { fontSize: 7, fontFamily: "Helvetica-Bold", marginBottom: 2 },

  declaration: {
    marginTop: 8,
    fontSize: 6,
    color: "#444",
    lineHeight: 1.4,
  },
  declarationBold: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#222",
    marginBottom: 2,
  },

  outerBorder: {
    border: "0.5pt solid #999",
    marginBottom: 0,
  },
});

// ── Column widths (points, landscape A4 ≈ 800pt usable) ──────────────────────

const COL = {
  marks: 55,
  desc: 105,
  pkgs: 28,
  rate: 32,
  fob: 38,
  ci: 38,
  taxINR: 42,
  igstPct: 22,
  igstAmt: 38,
  netPkg: 28,
  netTot: 34,
  grsPkg: 28,
  grsTot: 34,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number, dec = 2) {
  return val.toFixed(dec);
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
  const {
    items,
    exchangeRate,
    insuranceCAD,
  } = data;

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

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* ── Title ── */}
        <Text style={s.title}>INVOICE CUM PACKING LIST</Text>

        {/* ── Row 1: Exporter | Invoice No | IEC ── */}
        <View style={[s.outerBorder]}>
          <View style={s.infoRow}>
            <View style={[s.infoCell, { flex: 2.5 }]}>
              <Text style={s.infoLabel}>Exporter :</Text>
              <Text style={s.infoValue}>KOHLICO FOODS AND BEVERAGES PVT.LTD</Text>
              <Text style={s.infoValueNormal}>391, NARSI NATHA STREET, MAHESH CHAMBER,</Text>
              <Text style={s.infoValueNormal}>ROOM NO. 2, 1ST FLOOR, MUMBAI - 400009, INDIA</Text>
            </View>
            <View style={[s.infoCell, { flex: 2.5 }]}>
              <Text style={s.infoLabel}>Invoice no. & Da Proforma Inv. & Date</Text>
              <Text style={s.infoValue}>
                {data.invoiceNo}
                {data.proformaInvNo ? `   PROFORMA: ${data.proformaInvNo}` : ""}
              </Text>
              <Text style={s.infoValueNormal}>
                DTD: {fmtDate(data.invoiceDate)}
                {data.proformaDate ? `   DT: ${fmtDate(data.proformaDate)}` : ""}
              </Text>
            </View>
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>IEC NO.</Text>
              <Text style={s.infoValue}>{data.iecCode}</Text>
            </View>
          </View>

          {/* ── Row 2: Consignee | Buyer | PAN / GSTIN / END USE ── */}
          <View style={s.infoRow}>
            <View style={[s.infoCell, { flex: 2.5 }]}>
              <Text style={s.infoLabel}>Consignee :</Text>
              <Text style={s.infoValue}>{data.consigneeName}</Text>
              <Text style={s.infoValueNormal}>{data.consigneeAddress}</Text>
              <Text style={s.infoValueNormal}>{data.consigneeCountry}</Text>
            </View>
            <View style={[s.infoCell, { flex: 2.5 }]}>
              <Text style={s.infoLabel}>Buyer (if other than consignee)</Text>
              <Text style={s.infoValue}>{data.buyerName ?? data.consigneeName}</Text>
              <Text style={s.infoValueNormal}>{data.buyerAddress ?? data.consigneeAddress}</Text>
            </View>
            <View style={s.infoCellLast}>
              <View style={{ flexDirection: "row", marginBottom: 3 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>Exporter's Ref.</Text>
                  <Text style={s.infoValue}>{data.invoiceNo}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>PAN NO.</Text>
                  <Text style={s.infoValue}>{data.panNo}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>GSTIN NO.</Text>
                  <Text style={s.infoValue}>{data.gstinNo}</Text>
                </View>
              </View>
              {data.endUseCode && (
                <View>
                  <Text style={s.infoLabel}>END USE CODE:</Text>
                  <Text style={s.infoValue}>{data.endUseCode}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Row 3: Shipping ── */}
          <View style={s.infoRow}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Pre-Carriage by</Text>
              <Text style={s.infoValue}>{data.preCarriage}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Port of Receipt by Pre-Carriage</Text>
              <Text style={s.infoValue}>{data.portOfReceipt}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Country of Origin</Text>
              <Text style={s.infoValue}>{data.countryOfOrigin}</Text>
            </View>
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>Country of Final Destination</Text>
              <Text style={s.infoValue}>{data.countryOfDestination}</Text>
            </View>
          </View>

          {/* ── Row 4: Vessel / Port / Terms / ExRate ── */}
          <View style={[s.infoRow, { borderBottom: "none" }]}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Vessel/Flight No.</Text>
              <Text style={s.infoValue}>{data.vesselFlight ?? ""}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Port of Loading</Text>
              <Text style={s.infoValue}>{data.portOfLoading}</Text>
            </View>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>TERMS OF DELIVERY &amp; PAYMENT</Text>
              <Text style={s.infoValue}>{data.termsOfDelivery}</Text>
            </View>
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>EX.RATE</Text>
              <Text style={s.infoValue}>{exchangeRate.toFixed(2)}</Text>
            </View>
          </View>

          {/* Port of Discharge row */}
          <View style={[s.infoRow, { borderBottom: "none" }]}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Port of Discharge</Text>
              <Text style={s.infoValue}>{data.portOfDischarge}</Text>
            </View>
            <View style={s.infoCellLast}>
              <Text style={s.infoLabel}>Final Destination</Text>
              <Text style={s.infoValue}>{data.finalDestination}</Text>
            </View>
          </View>
        </View>

        {/* ── Line Items Table ── */}
        <View style={s.tableWrapper}>
          {/* Header */}
          <View style={s.thead}>
            <Text style={[s.th, { width: COL.marks }]}>Marks & Nos / Kind of Pkgs</Text>
            <Text style={[s.th, { width: COL.desc }]}>Description of Goods</Text>
            <Text style={[s.th, { width: COL.pkgs }]}>PKGS</Text>
            <Text style={[s.th, { width: COL.rate }]}>Rate{"\n"}CAD/Pkg</Text>
            <Text style={[s.th, { width: COL.fob }]}>FOB{"\n"}CAD $</Text>
            <Text style={[s.th, { width: COL.ci }]}>C&I{"\n"}CAD $</Text>
            <Text style={[s.th, { width: COL.taxINR }]}>Taxable{"\n"}Value INR</Text>
            <Text style={[s.th, { width: COL.igstPct }]}>IGST{"\n"}%</Text>
            <Text style={[s.th, { width: COL.igstAmt }]}>IGST{"\n"}Amount INR</Text>
            <Text style={[s.th, { width: COL.netPkg }]}>Net Wt{"\n"}/Pkg</Text>
            <Text style={[s.th, { width: COL.netTot }]}>Total{"\n"}Net Wt</Text>
            <Text style={[s.th, { width: COL.grsPkg }]}>Gr Wt{"\n"}/Pkg</Text>
            <Text style={[s.thLast, { width: COL.grsTot }]}>Total{"\n"}Gr Wt</Text>
          </View>

          {/* Items */}
          {items.map((item, idx) => {
            const totalNetWt = item.quantity * item.netWeight;
            const totalGrossWt = item.quantity * item.grossWeight;
            const ciItem = item.fobCAD + (insCAD / items.length); // distribute insurance
            return (
              <View key={idx} style={idx % 2 === 0 ? s.tr : s.trAlt}>
                <View style={[s.td, { width: COL.marks }]}>
                  <Text>{item.marksAndNos ?? ""}</Text>
                  <Text style={{ fontSize: 6, color: "#555" }}>{item.packageDescription}</Text>
                </View>
                <View style={[s.td, { width: COL.desc }]}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{item.description}</Text>
                  <Text style={{ fontSize: 6, color: "#555" }}>[HS: {item.hsCode}]</Text>
                </View>
                <Text style={[s.tdRight, { width: COL.pkgs }]}>{item.quantity}</Text>
                <Text style={[s.tdRight, { width: COL.rate }]}>{fmt(item.rate)}</Text>
                <Text style={[s.tdRight, { width: COL.fob }]}>{fmt(item.fobCAD)}</Text>
                <Text style={[s.tdRight, { width: COL.ci }]}>{fmt(ciItem)}</Text>
                <Text style={[s.tdRight, { width: COL.taxINR }]}>{fmt(item.taxableValueINR, 2)}</Text>
                <Text style={[s.tdRight, { width: COL.igstPct }]}>{(item.igstRate * 100).toFixed(0)}%</Text>
                <Text style={[s.tdRight, { width: COL.igstAmt }]}>{fmt(item.igstAmountINR, 2)}</Text>
                <Text style={[s.tdRight, { width: COL.netPkg }]}>{fmt(item.netWeight, 3)}</Text>
                <Text style={[s.tdRight, { width: COL.netTot }]}>{fmt(totalNetWt, 3)}</Text>
                <Text style={[s.tdRight, { width: COL.grsPkg }]}>{fmt(item.grossWeight, 3)}</Text>
                <Text style={[s.tdLast, { width: COL.grsTot }]}>{fmt(totalGrossWt, 3)}</Text>
              </View>
            );
          })}

          {/* Totals row */}
          <View style={s.tfoot}>
            <View style={[s.tdBold, { width: COL.marks + COL.desc }]}>
              <Text>TOTAL ({totals.pkgs} PKGS)</Text>
            </View>
            <Text style={[s.tdBoldRight, { width: COL.pkgs }]}>{totals.pkgs}</Text>
            <Text style={[s.tdBoldRight, { width: COL.rate }]} />
            <Text style={[s.tdBoldRight, { width: COL.fob }]}>{fmt(totals.fobCAD)}</Text>
            <Text style={[s.tdBoldRight, { width: COL.ci }]}>{fmt(ciCAD)}</Text>
            <Text style={[s.tdBoldRight, { width: COL.taxINR }]}>{fmt(totals.taxINR, 2)}</Text>
            <Text style={[s.tdBoldRight, { width: COL.igstPct }]} />
            <Text style={[s.tdBoldRight, { width: COL.igstAmt }]}>{fmt(totals.igstINR, 2)}</Text>
            <Text style={[s.tdBoldRight, { width: COL.netPkg }]} />
            <Text style={[s.tdBoldRight, { width: COL.netTot }]}>{fmt(totals.netWt, 3)}</Text>
            <Text style={[s.tdBoldRight, { width: COL.grsPkg }]} />
            <Text style={[{ ...s.tdLast, fontFamily: "Helvetica-Bold" }, { width: COL.grsTot }]}>
              {fmt(totals.grossWt, 3)}
            </Text>
          </View>
        </View>

        {/* ── Footer totals ── */}
        <View style={s.footerRow}>
          <View style={s.footerBox}>
            <Text style={s.footerLabel}>TTL NO. OF PK</Text>
            <Text style={s.footerValue}>{totals.pkgs}</Text>
            <Text style={s.footerLabel}>TTL NET WT (KG)</Text>
            <Text style={s.footerValue}>{fmt(totals.netWt, 3)}</Text>
            <Text style={s.footerLabel}>TTL GROSS WT (KG)</Text>
            <Text style={s.footerValue}>{fmt(totals.grossWt, 3)}</Text>
          </View>
          <View style={s.footerBox}>
            <Text style={s.footerLabel}>TOTAL FOB CAD $</Text>
            <Text style={s.footerValue}>{fmt(totals.fobCAD)}</Text>
            <Text style={s.footerLabel}>INSURANCE CAD</Text>
            <Text style={s.footerValue}>{fmt(insCAD, 3)}</Text>
            <Text style={s.footerLabel}>TOTAL C&I CAD $</Text>
            <Text style={s.footerValue}>{fmt(ciCAD)}</Text>
          </View>
          <View style={s.footerBox}>
            <Text style={s.footerLabel}>TOTAL TAXABLE VALUE INR</Text>
            <Text style={s.footerValue}>{fmt(totals.taxINR, 2)}</Text>
            <Text style={s.footerLabel}>TOTAL IGST INR</Text>
            <Text style={s.footerValue}>{fmt(totals.igstINR, 2)}</Text>
          </View>
          <View style={s.footerBoxLast}>
            <Text style={s.footerLabel}>EXCHANGE RATE</Text>
            <Text style={s.footerValue}>{exchangeRate.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Declaration ── */}
        <View style={{ marginTop: 8 }}>
          <Text style={s.declaration}>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.{"\n"}
            We intend to claim rewards under Remission of Duties &amp; Taxes on Export Product (RODTEP).{"\n"}
            SUPPLY MEANT FOR EXPORTS ON PAYMENT OF INTEGRATED TAX
          </Text>
        </View>
      </Page>
    </Document>
  );
}
