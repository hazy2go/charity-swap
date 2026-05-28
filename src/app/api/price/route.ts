import { NextResponse } from "next/server";
import { priceOf } from "@/lib/pricing";

// Preview-only price endpoint. Public, GET-only, no body. Returns the
// same USD figure (and cache source tag) the server uses when logging a
// confirmed swap to the points ledger — so the SwapCard preview matches
// what hits the leaderboard.

// Accept letters, digits, and `.` (e.g. BTC.LL LightLink wrappers)
const SYMBOL_RX = /^[A-Za-z0-9.]{1,16}$/;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").trim();

  if (!SYMBOL_RX.test(symbol)) {
    return NextResponse.json({ error: "bad symbol" }, { status: 400 });
  }

  const price = await priceOf(symbol);
  if (!price) {
    return NextResponse.json(
      { symbol: symbol.toUpperCase(), usd: null, source: null },
      {
        status: 200,
        headers: { "cache-control": "public, max-age=30" },
      },
    );
  }

  return NextResponse.json(
    {
      symbol: symbol.toUpperCase(),
      usd: price.usdPerToken,
      source: price.source,
    },
    {
      status: 200,
      headers: { "cache-control": "public, max-age=30" },
    },
  );
}
