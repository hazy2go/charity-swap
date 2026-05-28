import { NextResponse } from "next/server";
import { Sodax, type SodaxConfig } from "@sodax/sdk";
import { sodaxConfig } from "@/lib/sodax";
import { priceOf } from "@/lib/pricing";

// Live read of the charity wallet's accrued partner fees.
//
// IMPORTANT: partner fees do NOT land in the wallet on each swap. They
// accumulate as wrapped ERC-20 tokens on the Sonic hub (the partner
// ProtocolIntents contract). The partner (us) reads accrued balances via
// `sodax.partners.feeClaim.fetchAssetsBalances(addr)` and triggers an
// on-chain `feeClaim` later to convert + deliver them.
//
// This endpoint shows what's actually accrued so the /charities panel
// reflects truth, not always-zero native S.

const CHARITY_WALLET =
  (process.env.NEXT_PUBLIC_CHARITY_FEE_ADDRESS ??
    "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD") as `0x${string}`;

// Lazy-init: keep one Sodax instance per server boot.
let _sodax: Sodax | null = null;
function getSodax() {
  if (!_sodax) _sodax = new Sodax(sodaxConfig as SodaxConfig);
  return _sodax;
}

export const dynamic = "force-dynamic";

type AssetRow = {
  symbol: string;
  name: string;
  originalChain: string;
  balance: string;          // raw bigint as string
  decimals: number;
  formatted: number;        // human float
  usd: number | null;
  priceSource: string | null;
};

export async function GET() {
  try {
    const sodax = getSodax();
    const result =
      await sodax.partners.feeClaim.fetchAssetsBalances(CHARITY_WALLET);

    if (!result.ok) {
      return NextResponse.json(
        {
          wallet: CHARITY_WALLET,
          chain: "sonic",
          model: "partner-accrual",
          error: result.error?.message ?? "fetchAssetsBalances failed",
        },
        { status: 200, headers: { "cache-control": "public, max-age=15" } },
      );
    }

    const assets: AssetRow[] = [];
    let totalUsd = 0;
    let anyPriced = false;

    for (const [_addr, b] of result.value.entries()) {
      const formatted = Number(b.balance) / 10 ** b.decimal;
      if (!Number.isFinite(formatted) || formatted <= 0) continue;
      const price = await priceOf(b.symbol);
      const usd = price ? formatted * price.usdPerToken : null;
      if (usd != null) {
        totalUsd += usd;
        anyPriced = true;
      }
      assets.push({
        symbol: b.symbol,
        name: b.name,
        originalChain: b.originalChain,
        balance: b.balance.toString(),
        decimals: b.decimal,
        formatted,
        usd,
        priceSource: price?.source ?? null,
      });
    }

    return NextResponse.json(
      {
        wallet: CHARITY_WALLET,
        chain: "sonic",
        model: "partner-accrual",
        // Back-compat shape so the existing UI keeps working: total USD
        // and a stand-in `balance` for the headline number. Native S is
        // not the right unit anymore — we keep it 0 to avoid confusion.
        balance: { raw: "0", symbol: "AGGREGATE", formatted: 0 },
        usd: {
          value: anyPriced ? totalUsd : null,
          price: null,
          source: anyPriced ? "partner-accrual" : null,
        },
        assets,
        ts: Date.now(),
      },
      { status: 200, headers: { "cache-control": "public, max-age=30, s-maxage=30" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        wallet: CHARITY_WALLET,
        chain: "sonic",
        model: "partner-accrual",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200, headers: { "cache-control": "public, max-age=10" } },
    );
  }
}
