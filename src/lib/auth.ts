// src/lib/auth.ts
// Shared NextAuth configuration — imported by both the route handler and
// server-side helpers (getServerSession).

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  // Use JSON Web Tokens (no DB-backed sessions needed for credentials auth).
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },

  pages: {
    signIn: "/login",
    error: "/login", // Auth errors redirect back to login with ?error=
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // Persist `id` and `role` into the JWT after sign-in.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // Expose `id` and `role` on the client-side session object.
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
