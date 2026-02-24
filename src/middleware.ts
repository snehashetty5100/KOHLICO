// src/middleware.ts
// Protects all routes except the public auth pages.
// Unauthenticated users hitting a protected route get redirected to /login.

export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect everything EXCEPT:
     *   /login              – sign-in page
     *   /register           – first-admin bootstrap (API enforces the rule)
     *   /api/auth/**        – NextAuth internal endpoints
     *   /_next/**           – Next.js internals
     *   /favicon.ico
     */
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
