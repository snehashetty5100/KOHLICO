// src/middleware.ts
// Protects all routes except the public auth pages.
// Unauthenticated users hitting a protected route get redirected to /login.

import { withAuth } from "next-auth/middleware";

export const middleware = withAuth({
  pages: {
    signIn: "/login",
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "kohlico-super-secret-production-key-fallback-32chars-min",
});

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
