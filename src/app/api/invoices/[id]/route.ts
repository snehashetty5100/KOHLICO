// src/app/api/invoices/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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
      items: { orderBy: { sortOrder: "asc" }, include: { product: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(invoice);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.status && Object.keys(body).length === 1) {
    const invoice = await db.invoice.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json(invoice);
  }

  const {
    invoiceNo, invoiceDate, proformaInvNo, proformaDate,
    iecCode, panNo, gstinNo, endUseCode,
    consigneeId, buyerId,
    preCarriage, portOfReceipt, vesselFlight,
    portOfLoading, portOfDischarge, finalDestination,
    countryOfOrigin, countryOfDestination,
    termsOfDelivery, exchangeRate,
    insuranceCAD, status,
    items,
  } = body;

  const rate = parseFloat(exchangeRate);

  try {
    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id },
        data: {
          invoiceNo, iecCode, panNo, gstinNo,
          invoiceDate: new Date(invoiceDate),
          proformaInvNo: proformaInvNo || null,
          proformaDate: proformaDate ? new Date(proformaDate) : null,
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
          status: status || "draft",
        },
      });

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

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

    return NextResponse.json(invoice);
  } catch (err) {
    console.error("Invoice update failed:", err);
    const message = err instanceof Error ? err.message : "Failed to update invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}