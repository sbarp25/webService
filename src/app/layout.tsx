import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: "Photo Studio - Professional Photo Editing & QR Code Tools Online",
    template: "%s | Photo Studio"
  },
  description: "Free online photo editing tools: Create custom stickers, crop perfect circles, generate dynamic QR codes, make passport photos, add watermarks, create collages, and convert image formats. Professional results in seconds.",
  keywords: [
    "photo editor",
    "sticker maker",
    "circle crop",
    "QR code generator",
    "dynamic QR codes",
    "passport photo maker",
    "watermark tool",
    "collage maker",
    "image converter",
    "online photo tools",
    "free photo editor",
    "PNG to JPEG converter",
    "bio page QR",
    "vCard QR code"
  ],
  authors: [{ name: "Photo Studio" }],
  creator: "Photo Studio",
  publisher: "Photo Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Photo Studio",
    title: "Photo Studio - Professional Photo Editing & QR Code Tools",
    description: "Free online photo editing tools: Create stickers, crop circles, generate QR codes, make passport photos, and more. Professional results instantly.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Photo Studio - Professional Photo Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo Studio - Professional Photo Editing Tools",
    description: "Free online photo editing: Stickers, QR codes, passport photos, watermarks & more",
    images: ["/og-image.png"],
    creator: "@photostudio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  verification: {
    google: "your-google-verification-code",
  },
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
        <Providers>
          {children}
        </Providers>
        {/* <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6439540601394099"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        /> */}
      </body>
    </html>
  );
}
