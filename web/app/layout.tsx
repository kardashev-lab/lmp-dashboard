import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lmp.kardashevlabs.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "LMP Dashboard | Kardashev Labs",
  description:
    "Real-time locational marginal prices across NYISO, PJM, CAISO, and SPP: energy, congestion, and loss components.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "LMP Dashboard | Kardashev Labs",
    description: "Electricity spot prices across major US grid operators, updated every 5 minutes.",
    url: siteUrl,
    siteName: "Kardashev Labs",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMP Dashboard | Kardashev Labs",
    description: "Electricity spot prices across major US grid operators, updated every 5 minutes.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "LMP Dashboard",
      url: siteUrl,
      description:
        "Real-time and day-ahead locational marginal prices across NYISO, PJM, CAISO, and SPP.",
      publisher: { "@id": "https://kardashevlabs.org#organization" },
    },
    {
      "@type": "Dataset",
      name: "LMP Dashboard Data",
      description:
        "Real-time and day-ahead locational marginal prices (LMP) across US ISOs, including energy, congestion, and loss components per pricing hub, updated every 5 minutes.",
      url: siteUrl,
      creator: {
        "@id": "https://kardashevlabs.org#organization",
        "@type": "Organization",
        name: "Kardashev Labs",
        url: "https://kardashevlabs.org",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
