import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages must run in Node.js directly (not bundled by webpack/turbopack)
  serverExternalPackages: [
    "@react-pdf/renderer",
    "exceljs",
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
};

export default nextConfig;
