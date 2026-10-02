import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (all SIL Open Font License): no request to Google, preloaded
// with the page, and size-matched fallbacks so text doesn't jump on load.
const display = localFont({ src: "./fonts/limelight.woff2", variable: "--ff-display", display: "swap" });
const deco = localFont({ src: "./fonts/poiret-one.woff2", variable: "--ff-deco", display: "swap" });
const body = localFont({ src: "./fonts/josefin-sans.woff2", variable: "--ff-body", weight: "100 700", display: "swap" });
const neon = localFont({ src: "./fonts/neonderthaw.woff2", variable: "--ff-neon", display: "swap" });
const chalk = localFont({ src: "./fonts/caveat.woff2", variable: "--ff-chalk", weight: "400 700", display: "swap" });

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
    <html lang="en" className={`${display.variable} ${deco.variable} ${body.variable} ${neon.variable} ${chalk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
