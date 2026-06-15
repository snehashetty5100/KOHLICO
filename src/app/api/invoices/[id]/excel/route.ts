// src/app/api/invoices/[id]/excel/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildInvoiceExcel } from "@/lib/invoice-excel";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      consignee: true,
      buyer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await buildInvoiceExcel({
    invoiceNo: invoice.invoiceNo,
    invoiceDate: invoice.invoiceDate,
    proformaInvNo: invoice.proformaInvNo,
    proformaDate: invoice.proformaDate,
    iecCode: invoice.iecCode,
    panNo: invoice.panNo,
    gstinNo: invoice.gstinNo,
    endUseCode: invoice.endUseCode,
    consigneeName: invoice.consignee.name,
    consigneeAddress: invoice.consignee.address,
    consigneeCountry: invoice.consignee.country,
    buyerName: invoice.buyer?.name ?? null,
    buyerAddress: invoice.buyer?.address ?? null,
    preCarriage: invoice.preCarriage,
    portOfReceipt: invoice.portOfReceipt,
    vesselFlight: invoice.vesselFlight,
    portOfLoading: invoice.portOfLoading,
    portOfDischarge: invoice.portOfDischarge,
    finalDestination: invoice.finalDestination,
    countryOfOrigin: invoice.countryOfOrigin,
    countryOfDestination: invoice.countryOfDestination,
    termsOfDelivery: invoice.termsOfDelivery,
    exchangeRate: invoice.exchangeRate,
    insuranceCAD: invoice.insuranceCAD,
    items: invoice.items.map((it) => ({
      description: it.description,
      hsCode: it.hsCode,
      packageDescription: it.packageDescription,
      marksAndNos: it.marksAndNos,
      quantity: it.quantity,
      rate: it.rate,
      fobCAD: it.fobCAD,
      netWeight: it.netWeight,
      grossWeight: it.grossWeight,
      taxableValueINR: it.taxableValueINR,
      igstRate: it.igstRate,
      igstAmountINR: it.igstAmountINR,
    })),
  });

  const filename = `${invoice.invoiceNo.replace(/\//g, "-")}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}