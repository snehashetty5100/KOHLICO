// src/app/api/customers/route.ts
// GET  /api/customers  — list all customers
// POST /api/customers  — create a new customer

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customers = await db.customer.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, country, contactPerson, phone, email } = body;

  if (!name || !address || !country) {
    return NextResponse.json(
      { error: "name, address and country are required" },
      { status: 400 }
    );
  }

  const customer = await db.customer.create({
    data: { name, address, country, contactPerson, phone, email },
  });

  return NextResponse.json(customer, { status: 201 });
}
