// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    description, hsCode, defaultPackaging,
    defaultRate, defaultNetWeight, defaultGrossWeight, igstRate,
  } = body;

  if (!description || !hsCode || defaultRate == null || defaultNetWeight == null || defaultGrossWeight == null) {
    return NextResponse.json(
      { error: "description, hsCode, defaultRate, defaultNetWeight and defaultGrossWeight are required" },
      { status: 400 }
    );
  }

  const product = await db.product.update({
    where: { id },
    data: {
      description, hsCode,
      defaultPackaging: defaultPackaging || null,
      defaultRate: parseFloat(defaultRate),
      defaultNetWeight: parseFloat(defaultNetWeight),
      defaultGrossWeight: parseFloat(defaultGrossWeight),
      igstRate: igstRate != null ? parseFloat(igstRate) : 0.05,
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}