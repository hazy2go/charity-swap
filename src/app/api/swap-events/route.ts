import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usdValueOfSwap } from "@/lib/pricing";
import { DEFAULT_POINTS_PER_USD } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  wallet: string;
  presetId?: string;
  srcChain: string;
  dstChain: string;
  srcToken: string;
  dstToken: string;
  srcSymbol: string;
  dstSymbol: string;
  srcAmountRaw: string; // bigint as string
  srcDecimals: number;
  dstQuotedRaw?: string;
  dstDecimals: number;
  txHash?: string;
};

function isHexAddress(s: unknown): s is string {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Minimal validation — these are the fields the SwapEvent row needs.
  if (!isHexAddress(body.wallet)) {
    return NextResponse.json({ error: "wallet must be a 0x address" }, { status: 400 });
  }
  if (!body.srcChain || !body.dstChain || !body.srcSymbol || !body.dstSymbol) {
    return NextResponse.json({ error: "missing route fields" }, { status: 400 });
  }
  if (!/^\d+$/.test(body.srcAmountRaw ?? "")) {
    return NextResponse.json({ error: "srcAmountRaw must be a decimal string" }, { status: 400 });
  }
  if (typeof body.srcDecimals !== "number" || typeof body.dstDecimals !== "number") {
    return NextResponse.json({ error: "decimals must be numbers" }, { status: 400 });
  }

  // Snapshot USD price + compute points. Both can null out gracefully.
  let usdValue: number | null = null;
  let priceSource: string | null = null;
  try {
    const priced = await usdValueOfSwap({
      amountRaw: BigInt(body.srcAmountRaw),
      decimals: body.srcDecimals,
      symbol: body.srcSymbol,
    });
    if (priced) {
      usdValue = priced.usd;
      priceSource = priced.source;
    }
  } catch {
    // Pricing is a nice-to-have, never block the log.
  }

  const pointsAwarded = usdValue != null
    ? Math.max(0, Math.floor(usdValue * DEFAULT_POINTS_PER_USD))
    : 0;

  try {
    const row = await prisma.swapEvent.create({
      data: {
        wallet: body.wallet.toLowerCase(),
        presetId: body.presetId ?? null,
        srcChain: body.srcChain,
        dstChain: body.dstChain,
        srcToken: body.srcToken,
        dstToken: body.dstToken,
        srcSymbol: body.srcSymbol,
        dstSymbol: body.dstSymbol,
        srcAmountRaw: body.srcAmountRaw,
        srcDecimals: body.srcDecimals,
        dstQuotedRaw: body.dstQuotedRaw ?? null,
        dstDecimals: body.dstDecimals,
        usdValue: usdValue,
        priceSource: priceSource,
        pointsAwarded,
        txHash: body.txHash ?? null,
        status: "submitted",
      },
    });

    return NextResponse.json({
      ok: true,
      id: row.id,
      pointsAwarded: row.pointsAwarded,
      usdValue: row.usdValue,
      priceSource: row.priceSource,
    });
  } catch (err) {
    // Duplicate txHash (unique constraint) — treat as idempotent OK.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ ok: true, idempotent: true });
    }
    return NextResponse.json({ error: "db write failed", detail: msg }, { status: 500 });
  }
}
