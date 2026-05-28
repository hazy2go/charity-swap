import type { Metadata, Viewport } from "next";
import { Audiowide, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Audiowide — late-90s tech caps, single-weight display face. The WipEout 3 /
// Designers Republic anchor. Use only for headlines, eyebrows, big numbers.
const audiowide = Audiowide({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-audiowide",
  display: "swap",
});

// DM Sans — modern grotesque for body + UI labels. Not Inter.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
});

// JetBrains Mono — best slashed zero, tnum, technical credibility.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

// SODAX wallet store reads persisted Zustand state at module load; that trips
// Next's SSG of /_not-found. Force dynamic — the app is a dapp anyway.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06080F",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://swaps-without-borders.vercel.app"),
  title: "Swaps without Borders — public ledger that funds charity",
  description:
    "A cross-chain swap dapp built in public on SODAX. 0.1% of every swap routes to a public charity wallet on Sonic. 100% to the community-voted cause.",
  openGraph: {
    title: "Swaps without Borders",
    description:
      "Every cross-chain swap routes 0.1% to a public charity wallet. 100% to charity. Mainnet on SODAX V2.",
    siteName: "Swaps without Borders",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swaps without Borders",
    description:
      "Every cross-chain swap routes 0.1% to a public charity wallet. 100% to charity. Mainnet on SODAX V2.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${audiowide.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
