// src/app/api/invoices/[id]/pdf/route.ts
// GET /api/invoices/:id/pdf — generates and returns the Invoice Cum Packing List PDF.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/invoice-pdf";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: {
      consignee: true,
      buyer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = {
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
  };

  const buffer = await renderToBuffer(
    // @ts-expect-error — InvoicePDF wraps Document; types mismatch between app React and renderer React
    React.createElement(InvoicePDF, { data })
  );

  const filename = `${invoice.invoiceNo.replace(/\//g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(buffer) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
