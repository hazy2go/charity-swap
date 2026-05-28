import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-orbitron",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

// SODAX wallet store reads persisted Zustand state at module load; that
// trips Next's SSG of `/_not-found` (and any other static route) with
// "Cannot read properties of undefined (reading 'hasHydrated')". Forcing
// dynamic rendering skips static prerender — the app is a dapp anyway,
// nothing to gain from SSG.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SWAPS // WITHOUT BORDERS — built in public on SODAX",
  description:
    "A cross-chain swap app where every fee goes to charity. Community votes the payouts. Built in public over two weeks on the SODAX SDK V2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${jetbrainsMono.variable} ${barlow.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
