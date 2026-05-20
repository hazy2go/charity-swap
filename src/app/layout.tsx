import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SODAX wallet store reads persisted Zustand state at module load; that
// trips Next's SSG of `/_not-found` (and any other static route) with
// "Cannot read properties of undefined (reading 'hasHydrated')". Forcing
// dynamic rendering skips static prerender — the app is a dapp anyway,
// nothing to gain from SSG.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Charity Swap — built in public on SODAX",
  description:
    "A cross-chain swap app where every fee goes to charity. Community votes the payouts. Built in public over two weeks on the SODAX SDK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
