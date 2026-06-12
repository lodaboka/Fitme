// ============================================================
// Fit Me v3 — Root Layout (Liquid Glass Theme)
// ============================================================

import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import LiquidBackground from "@/components/LiquidBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fit Me — Smart Dietary Tracking",
  description:
    "Snap a photo of your meal and get instant AI-powered nutritional analysis. Track your calories, protein, carbs, and fats effortlessly.",
  keywords: [
    "diet tracker",
    "calorie counter",
    "nutrition",
    "Indian food",
    "AI food recognition",
    "macro tracking",
  ],
  authors: [{ name: "Fit Me" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8fafc",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="Fit Me" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased min-h-screen`}
      >
        <LiquidBackground />
        {children}
      </body>
    </html>
  );
}
