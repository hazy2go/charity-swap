// USD pricing for the points ledger.
//
// Strategy: snapshot the input token's USD price at swap-submit time via
// CoinGecko's free /simple/price endpoint, with a 60-second in-memory
// cache so a busy stage doesn't burn through their rate limit. The price
// + the source ("coingecko" | "cached" | "fallback") is stored on the
// SwapEvent row for audit.

import { formatUnits } from "viem";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const CACHE_TTL_MS = 60_000;

// Token symbol → CoinGecko coin id. Exotic LightLink (.LL) and Redbelly
// (r*) wrappers are intentionally omitted — better unpriced (0 pts) than
// mispriced. Stable-ish dollar tokens also covered by the $1 fallback below.
// Keys are UPPERCASE — priceOf() uppercases the symbol before lookup.
const COIN_ID_BY_SYMBOL: Record<string, string> = {
  USDC: "usd-coin",
  USDT: "tether",
  DAI: "dai",
  BNUSD: "balanced-dollar",
  SODA: "sodax", // CoinGecko id for SODAX governance token
  S:    "sonic-3", // Sonic native token (rebrand of Fantom FTM)
  WS:   "sonic-3", // wrapped S
  ETH: "ethereum",
  WETH: "weth",
  ETHB: "ethereum", // ETH on BNB Chain
  SOL: "solana",
  BNB: "binancecoin",
  AVAX: "avalanche-2",
  POL: "polygon-ecosystem-token",
  HYPE: "hyperliquid",
  KAIA: "kaia",
  WBTC: "wrapped-bitcoin",
  BTCB: "bitcoin", // BTC on BNB Chain
  WEETH: "wrapped-eeth",
  WSTETH: "wrapped-steth",
  TBTC: "tbtc",
  CBBTC: "coinbase-wrapped-btc",
};

type CacheEntry = { usd: number; fetchedAt: number };
const priceCache = new Map<string, CacheEntry>();

export type PriceLookup = {
  usdPerToken: number;
  source: "coingecko" | "cached" | "fallback";
};

/**
 * Fetch USD price for one token symbol. Returns null if we can't price it.
 */
export async function priceOf(symbol: string): Promise<PriceLookup | null> {
  const upper = symbol.toUpperCase();
  const coinId = COIN_ID_BY_SYMBOL[upper];
  if (!coinId) return null;

  const cached = priceCache.get(coinId);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { usdPerToken: cached.usd, source: "cached" };
  }

  try {
    const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      // Don't let a slow CoinGecko hang the swap log forever
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const json = (await res.json()) as Record<string, { usd?: number }>;
    const usd = json?.[coinId]?.usd;
    if (typeof usd !== "number") throw new Error("CoinGecko returned no usd");

    priceCache.set(coinId, { usd, fetchedAt: now });
    return { usdPerToken: usd, source: "coingecko" };
  } catch {
    // If we have a stale cache entry, use it as a fallback rather than 0.
    if (cached) {
      return { usdPerToken: cached.usd, source: "cached" };
    }
    // Final fallback — dollar stables we still pin to $1, anything else null.
    if (upper === "USDC" || upper === "USDT" || upper === "DAI" || upper === "BNUSD") {
      return { usdPerToken: 1, source: "fallback" };
    }
    return null;
  }
}

/**
 * Convert a raw on-chain amount to USD using the priced token.
 */
export async function usdValueOfSwap(params: {
  amountRaw: bigint;
  decimals: number;
  symbol: string;
}): Promise<{ usd: number; source: PriceLookup["source"] } | null> {
  const price = await priceOf(params.symbol);
  if (!price) return null;
  const amount = Number(formatUnits(params.amountRaw, params.decimals));
  if (!Number.isFinite(amount)) return null;
  return { usd: amount * price.usdPerToken, source: price.source };
}
