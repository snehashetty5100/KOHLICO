// src/app/api/invoices/route.ts
// GET  /api/invoices  — list all invoices (summary)
// POST /api/invoices  — create invoice + line items in one transaction

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await db.invoice.findMany({
    orderBy: { invoiceDate: "desc" },
    include: {
      consignee: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    invoiceNo, invoiceDate, proformaInvNo, proformaDate,
    iecCode, panNo, gstinNo, endUseCode,
    consigneeId, buyerId,
    preCarriage, portOfReceipt, vesselFlight,
    portOfLoading, portOfDischarge, finalDestination,
    countryOfOrigin, countryOfDestination,
    termsOfDelivery, exchangeRate,
    insuranceCAD,
    items, // array of line items
  } = body;

  if (!invoiceNo || !invoiceDate || !iecCode || !panNo || !gstinNo ||
      !consigneeId || !preCarriage || !portOfReceipt || !portOfLoading ||
      !portOfDischarge || !finalDestination || !termsOfDelivery || !exchangeRate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
  }

  const rate = parseFloat(exchangeRate);

  try {
    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          invoiceDate: new Date(invoiceDate),
          proformaInvNo: proformaInvNo || null,
          proformaDate: proformaDate ? new Date(proformaDate) : null,
          iecCode, panNo, gstinNo,
          endUseCode: endUseCode || null,
          consigneeId,
          buyerId: buyerId || null,
          preCarriage, portOfReceipt,
          vesselFlight: vesselFlight || null,
          portOfLoading, portOfDischarge, finalDestination,
          countryOfOrigin: countryOfOrigin || "INDIA",
          countryOfDestination: countryOfDestination || "CANADA",
          termsOfDelivery,
          exchangeRate: rate,
          insuranceCAD: insuranceCAD ? parseFloat(insuranceCAD) : null,
          status: "draft",
          createdById: session.user.id,
        },
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const qty = parseInt(item.quantity);
        const itemRate = parseFloat(item.rate);
        const fobCAD = qty * itemRate;
        const igstRate = parseFloat(item.igstRate ?? "0.05");
        const taxableValueINR = fobCAD * rate;
        const igstAmountINR = taxableValueINR * igstRate;

        await tx.invoiceItem.create({
          data: {
            invoiceId: inv.id,
            productId: item.productId || null,
            description: item.description,
            hsCode: item.hsCode,
            packageDescription: item.packageDescription,
            marksAndNos: item.marksAndNos || null,
            quantity: qty,
            rate: itemRate,
            fobCAD,
            netWeight: parseFloat(item.netWeight),
            grossWeight: parseFloat(item.grossWeight),
            district: item.district || null,
            state: item.state || null,
            taxableValueINR,
            igstRate,
            igstAmountINR,
            sortOrder: i,
          },
        });
      }

      return inv;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("Invoice creation failed:", err);
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
