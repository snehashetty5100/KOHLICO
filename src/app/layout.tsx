import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ibmSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Kohlico Invoices",
  description: "Export invoice generation for Kohlico Foods",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${ibmSans.variable} ${ibmMono.variable} ${sourceSerif.variable} antialiased bg-[#F7F5F1] text-[#1C2B33] font-sans transition-colors duration-100`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
