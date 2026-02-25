// src/middleware.ts
// Protects all routes except the public auth pages.
// Unauthenticated users hitting a protected route get redirected to /login.

import { withAuth } from "next-auth/middleware";

export const middleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
