import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

// Playful summer identity (TECH_SPEC §9): Fredoka is a chunky, rounded display
// face for quest titles and headings; Nunito is its friendly, soft-cornered
// body companion. Consumers read the CSS variables, never the imports.
const display = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});
const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
