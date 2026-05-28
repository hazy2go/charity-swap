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
// Map covers the full SODAX swap-token catalog so the points ledger
// captures USD value for every supported asset. Wrapped/pegged variants
// (BTC.LL, rBTC, ETHB, etc.) price as their underlying asset; liquid-staked
// SUI variants price as SUI (approximation — minor peg drift is acceptable
// for the points formula).
const COIN_ID_BY_SYMBOL: Record<string, string> = {
  // ── Stables ──
  USDC: "usd-coin",
  USDT: "tether",
  DAI:  "dai",
  BNUSD: "balanced-dollar",
  // ── SODAX gov ──
  SODA: "sodax",
  // ── Native L1/L2s ──
  S:     "sonic-3", // Sonic native (rebrand of Fantom FTM)
  WS:    "sonic-3",
  ETH:   "ethereum",
  WETH:  "weth",
  ETHB:  "ethereum", // ETH on BNB Chain
  SOL:   "solana",
  BNB:   "binancecoin",
  AVAX:  "avalanche-2",
  POL:   "polygon-ecosystem-token",
  HYPE:  "hyperliquid",
  KAIA:  "kaia",
  ICX:   "icon",
  WICX:  "icon",
  INJ:   "injective-protocol",
  XLM:   "stellar",
  NEAR:  "near",
  SUI:   "sui",
  LL:    "lightlink",
  // ── BTC family ──
  BTC:   "bitcoin",   // native BTC via Radfi trading wallet
  WBTC:  "wrapped-bitcoin",
  BTCB:  "bitcoin",   // BTC on BNB Chain
  WEETH: "wrapped-eeth",
  WSTETH: "wrapped-steth",
  TBTC:  "tbtc",
  CBBTC: "coinbase-wrapped-btc",
  // ── Sui liquid-staked variants (price-as-SUI approximation) ──
  AFSUI:     "sui",
  MSUI:      "sui",
  HASUI:     "sui",
  VSUI:      "sui",
  YAPSUI:    "sui",
  TREVINSUI: "sui",
  // ── Sui ecosystem tokens ──
  DEEP: "deep",
  WAL:  "walrus-2",
  NAVX: "navi-protocol",
  // ── Solana ecosystem tokens ──
  BONK:    "bonk",
  JUP:     "jupiter-exchange-solana",
  RAY:     "raydium",
  PYTH:    "pyth-network",
  JTO:     "jito-governance-token",
  JITOSOL: "jito-staked-sol",
  MSOL:    "msol",
  // ── ICON ecosystem ──
  BALN: "balance-token",
  // ── NEAR ecosystem ──
  WNEAR: "wrapped-near",
  // ── LightLink wrappers (1:1 to underlying) ──
  "BTC.LL":  "bitcoin",
  "AVAX.LL": "avalanche-2",
  "BNB.LL":  "binancecoin",
  "SOL.LL":  "solana",
  "XLM.LL":  "stellar",
  "INJ.LL":  "injective-protocol",
  "SUI.LL":  "sui",
  "S.LL":    "sonic-3",
  "POL.LL":  "polygon-ecosystem-token",
  "HYPE.LL": "hyperliquid",
  // ── Redbelly synthetic wrappers (1:1 to underlying) ──
  RBTC:  "bitcoin",
  RETH:  "ethereum",
  RSOL:  "solana",
  RBNB:  "binancecoin",
  RHYPE: "hyperliquid",
  RAVAX: "avalanche-2",
  RXLM:  "stellar",
  RSUI:  "sui",
  RS:    "sonic-3",
  RPOL:  "polygon-ecosystem-token",
  // RBNT (Redbelly native gas token) intentionally omitted — no reliable
  // CoinGecko id; falls through to null and logs 0 points (rare swap).
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
