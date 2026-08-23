// src/app/page.tsx
// Root page — redirects authenticated users to /dashboard,
// unauthenticated users to /login.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  try {
    const session = await getServerSession(authOptions);

    if (session) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  } catch (err) {
    if ((err as Error)?.message?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    redirect("/login");
  }
}
