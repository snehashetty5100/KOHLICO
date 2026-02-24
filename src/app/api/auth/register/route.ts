// src/app/api/auth/register/route.ts
// Creates a new user.
//
// Rules:
//   • If no users exist yet → the request is allowed (first-admin bootstrap).
//   • Otherwise → caller must be an authenticated admin.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user"]).default("user"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, password, role } = parsed.data;

    // Check if any users exist (bootstrap flow).
    const userCount = await db.user.count();

    if (userCount > 0) {
      // Subsequent registrations require an authenticated admin.
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can create new users" },
          { status: 403 },
        );
      }
    }

    // Check for duplicate email.
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashed,
        // First user is always an admin regardless of what was sent.
        role: userCount === 0 ? "admin" : role,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
