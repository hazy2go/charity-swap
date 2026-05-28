import type { Metadata, Viewport } from "next";
import { Fraunces, Mona_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Fraunces — characterful contemporary serif, variable weights for headlines.
// Using variable mode so we get full 100-900 weight axis without static cuts.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-fraunces",
  display: "swap",
});

// Mona Sans — GitHub's variable grotesque, characterful but legible. Not Inter.
const monaSans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona",
  display: "swap",
});

// JetBrains Mono — best slashed zero, tnum, reads as credible data.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

// SODAX wallet store reads persisted Zustand state at module load; that
// trips Next's SSG of `/_not-found` with hydration errors. Forcing dynamic
// rendering skips static prerender — the app is a dapp anyway.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15110D",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://swaps-without-borders.vercel.app"),
  title: "Swaps without Borders — a public ledger that quietly funds charity",
  description:
    "A cross-chain swap dapp built in public on SODAX. Every fee — 0.1% — routes to a public charity wallet on Sonic. 100% to the community-voted cause. Mainnet from day one.",
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
      className={`${fraunces.variable} ${monaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
