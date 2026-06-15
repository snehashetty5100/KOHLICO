// src/app/api/customers/[id]/route.ts
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
  const { name, address, country, contactPerson, phone, email } = body;

  if (!name || !address || !country) {
    return NextResponse.json(
      { error: "name, address and country are required" },
      { status: 400 }
    );
  }

  const customer = await db.customer.update({
    where: { id },
    data: { name, address, country, contactPerson, phone, email },
  });

  return NextResponse.json(customer);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.customer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}