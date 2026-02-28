// src/app/api/products/route.ts
// GET  /api/products  — list all products
// POST /api/products  — create a new product

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await db.product.findMany({ orderBy: { description: "asc" } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    description,
    hsCode,
    defaultPackaging,
    defaultRate,
    defaultNetWeight,
    defaultGrossWeight,
    igstRate,
  } = body;

  if (!description || !hsCode || defaultRate == null || defaultNetWeight == null || defaultGrossWeight == null) {
    return NextResponse.json(
      { error: "description, hsCode, defaultRate, defaultNetWeight and defaultGrossWeight are required" },
      { status: 400 }
    );
  }

  const product = await db.product.create({
    data: {
      description,
      hsCode,
      defaultPackaging: defaultPackaging || null,
      defaultRate: parseFloat(defaultRate),
      defaultNetWeight: parseFloat(defaultNetWeight),
      defaultGrossWeight: parseFloat(defaultGrossWeight),
      igstRate: igstRate != null ? parseFloat(igstRate) : 0.05,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
