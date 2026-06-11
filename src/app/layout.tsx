import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Sun-bleached editorial identity: Fraunces is a warm, high-contrast optical
// serif for headlines + quest titles (italics for editorial flourish); Hanken
// Grotesk is a clean humanist grotesque for body + UI. Consumers read the CSS
// variables, never the imports.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Summer Quest NYC",
  description: "One real NYC summer activity a day. Spin, go, share.",
};

export const viewport: Viewport = {
  themeColor: "#C2562E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} grain font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
