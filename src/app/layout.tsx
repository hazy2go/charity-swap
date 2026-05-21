import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// SODAX wallet store reads persisted Zustand state at module load; that
// trips Next's SSG of `/_not-found` (and any other static route) with
// "Cannot read properties of undefined (reading 'hasHydrated')". Forcing
// dynamic rendering skips static prerender — the app is a dapp anyway,
// nothing to gain from SSG.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Swaps without Borders — built in public on SODAX",
  description:
    "A cross-chain swap app where every fee goes to charity. Community votes the payouts. Built in public over two weeks on the SODAX SDK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
