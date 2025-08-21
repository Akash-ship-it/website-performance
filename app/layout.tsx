import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perfex Pro - Advanced Performance Analyzer",
  description: "Professional website performance analysis tool powered by Perfex Performance Engine. Analyze Core Web Vitals, accessibility, SEO, and get actionable optimization recommendations.",
  keywords: ["performance", "web vitals", "LCP", "INP", "CLS", "accessibility", "SEO", "website optimization", "Perfex"],
  authors: [{ name: "Perfex" }],
  creator: "Perfex",
  publisher: "Perfex",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Perfex Pro - Advanced Performance Analyzer",
    description: "Professional website performance analysis tool powered by Perfex Performance Engine",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Perfex Pro Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perfex Pro - Advanced Performance Analyzer",
    description: "Professional website performance analysis tool powered by Perfex Performance Engine",
    images: ["/icon.svg"],
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0f172a",
  colorScheme: "dark",
  category: "productivity",
  classification: "Web Performance Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
