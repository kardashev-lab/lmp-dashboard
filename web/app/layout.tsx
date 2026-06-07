import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lmp.kardashevlabs.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "LMP Dashboard — Kardashev Labs",
  description:
    "Real-time locational marginal prices across NYISO, PJM, CAISO, and SPP — energy, congestion, and loss components.",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "LMP Dashboard — Kardashev Labs",
    description: "Electricity spot prices across major US grid operators, updated every 5 minutes.",
    url: siteUrl,
    siteName: "Kardashev Labs",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMP Dashboard — Kardashev Labs",
    description: "Electricity spot prices across major US grid operators, updated every 5 minutes.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', system-ui, sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
