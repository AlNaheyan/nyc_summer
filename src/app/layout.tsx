import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Phase 0 uses the bundled Geist faces mapped to display/body roles.
// TECH_SPEC §9 calls for a distinct display font for quest titles — swap in
// Phase 3 polish without touching consumers (they read the CSS variables).
const display = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-display",
  weight: "100 900",
});
const body = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Summer Quest NYC",
  description: "One real NYC summer activity a day. Spin, go, share.",
};

export const viewport: Viewport = {
  themeColor: "#FF5E5B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
