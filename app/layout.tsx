import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drink Palooza",
  description: "Make a cocktail. Present it. Get poured a score.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Drink Palooza", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0d0b09",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Josefin+Sans:wght@400;600;700&family=Limelight&family=Neonderthaw&family=Poiret+One&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
