import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer must run in Node.js directly (not bundled by webpack)
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
};

export default nextConfig;
