// Points preview — Day 4 stub.
//
// The points-to-USD ratio is decided by a community vote (Day 4 poll
// closes Day 11). Default suggestion is 1 point per $1 swapped.
// Persistence lands Day 5 via the Prisma SwapEvent table — this file
// stays as the single source of truth for the formula.

import { formatUnits } from "viem";

export const DEFAULT_POINTS_PER_USD = 1;

/**
 * Quick & dirty USD estimate for the preview only. We assume stables
 * map 1:1 to USD; SODA is treated as ~$1 placeholder until the real
 * pricing helper lands Day 5 (CoinGecko at submit time).
 *
 * Day 5 deletes this and reads `usdValue` off the persisted SwapEvent.
 */
const PREVIEW_PRICE_USD: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  DAI: 1,
  // SODA — placeholder. Real price snapshot lands Day 5.
  SODA: 1,
};

export function previewUsdValue(
  amountRaw: bigint,
  decimals: number,
  symbol: string,
): number | null {
  const price = PREVIEW_PRICE_USD[symbol.toUpperCase()];
  if (price == null) return null;
  const amount = Number(formatUnits(amountRaw, decimals));
  if (!Number.isFinite(amount)) return null;
  return amount * price;
}

export function previewPoints(
  amountRaw: bigint,
  decimals: number,
  symbol: string,
): { points: number; usd: number } | null {
  const usd = previewUsdValue(amountRaw, decimals, symbol);
  if (usd == null) return null;
  return {
    // round (not floor) — matches the API route so the preview number
    // is what the user actually gets logged.
    points: Math.round(usd * DEFAULT_POINTS_PER_USD),
    usd,
  };
}

export function formatPoints(n: number): string {
  return n.toLocaleString("en-US");
}
