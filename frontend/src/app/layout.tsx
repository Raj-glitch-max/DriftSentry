/**
 * Root Layout - App wrapper with providers
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DriftSentry - Infrastructure Drift Detection",
  description: "Monitor, detect, and automatically remediate configuration drift across your cloud infrastructure in real-time.",
  keywords: ["infrastructure", "drift detection", "cloud", "DevOps", "monitoring", "remediation"],
  authors: [{ name: "DriftSentry Team" }],
  openGraph: {
    title: "DriftSentry - Infrastructure Drift Detection",
    description: "Monitor and remediate configuration drift in real-time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
