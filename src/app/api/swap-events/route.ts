import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usdValueOfSwap } from "@/lib/pricing";
import { DEFAULT_POINTS_PER_USD } from "@/lib/points";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Caps and limits ------------------------------------------------------
// Anti-abuse bounds. None of these are tight in normal usage — they exist
// to keep a malicious POST from bloating the DB or poisoning the points
// ledger if our pricing source ever returns nonsense.
const MAX_STR_LEN = 128;             // any single string field
const MAX_DECIMALS = 36;             // realistic upper bound for ERC-20
const MAX_USD_VALUE = 10_000_000;    // $10M per swap — anyone above this is a pricing attack
const MAX_POINTS = 10_000_000;       // same, points-side cap

// --- Validators -----------------------------------------------------------
const RX_ADDR_40 = /^0x[a-fA-F0-9]{40}$/;
const RX_TXHASH = /^0x[a-fA-F0-9]{64}$/;
const RX_HEX = /^0x[a-fA-F0-9]{1,128}$/; // solver intent_hash (length varies)
const RX_DECIMAL_STR = /^\d{1,80}$/;
const RX_CHAIN_KEY = /^[a-zA-Z0-9._:-]{1,64}$/;
const RX_SYMBOL = /^[A-Za-z0-9._-]{1,32}$/;
const RX_PRESET = /^[A-Za-z0-9._-]{1,64}$/;
// Wallets and token ids span ecosystems: EVM 0x-hex, Solana/Stellar base58/32,
// Sui `0x…::mod::TYPE`, NEAR `name.near`, ICON `cx…`, Injective `factory/inj…/x`.
// Safe allowlist of the characters those formats use, length-capped.
const RX_CHAIN_ADDR = /^[A-Za-z0-9:._/-]{1,128}$/;

// Only EVM 0x addresses are case-folded for canonical dedupe. Base58 (Solana),
// Sui type tags, and Stellar keys are CASE-SENSITIVE — lowercasing corrupts them.
function canonAddr(v: string): string {
  return RX_ADDR_40.test(v) ? v.toLowerCase() : v;
}

type Body = {
  wallet?: unknown;
  presetId?: unknown;
  srcChain?: unknown;
  dstChain?: unknown;
  srcToken?: unknown;
  dstToken?: unknown;
  srcSymbol?: unknown;
  dstSymbol?: unknown;
  srcAmountRaw?: unknown;
  srcDecimals?: unknown;
  dstQuotedRaw?: unknown;
  dstDecimals?: unknown;
  txHash?: unknown;
  dstTxHash?: unknown;
  intentHash?: unknown;
};

function isStr(v: unknown, max = MAX_STR_LEN): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}
function isInt(v: unknown, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
}

export async function POST(req: Request) {
  // 1. Rate limit per IP — 30 writes/min is way above a real user, way below a bot.
  const ip = clientIp(req);
  const rl = rateLimit(`swap-events:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  // 2. Reject obviously oversized bodies before JSON parse.
  const lenHeader = req.headers.get("content-length");
  if (lenHeader && Number(lenHeader) > 4_096) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  // 3. Parse JSON.
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // 4. Validate every field with strict regex + bounds.
  if (typeof body.wallet !== "string" || !RX_CHAIN_ADDR.test(body.wallet)) {
    return NextResponse.json({ error: "invalid wallet address" }, { status: 400 });
  }
  if (!isStr(body.srcChain) || !RX_CHAIN_KEY.test(body.srcChain)) {
    return NextResponse.json({ error: "invalid srcChain" }, { status: 400 });
  }
  if (!isStr(body.dstChain) || !RX_CHAIN_KEY.test(body.dstChain)) {
    return NextResponse.json({ error: "invalid dstChain" }, { status: 400 });
  }
  if (typeof body.srcToken !== "string" || !RX_CHAIN_ADDR.test(body.srcToken)) {
    return NextResponse.json({ error: "invalid srcToken" }, { status: 400 });
  }
  if (typeof body.dstToken !== "string" || !RX_CHAIN_ADDR.test(body.dstToken)) {
    return NextResponse.json({ error: "invalid dstToken" }, { status: 400 });
  }
  if (!isStr(body.srcSymbol, 32) || !RX_SYMBOL.test(body.srcSymbol)) {
    return NextResponse.json({ error: "invalid srcSymbol" }, { status: 400 });
  }
  if (!isStr(body.dstSymbol, 32) || !RX_SYMBOL.test(body.dstSymbol)) {
    return NextResponse.json({ error: "invalid dstSymbol" }, { status: 400 });
  }
  if (typeof body.srcAmountRaw !== "string" || !RX_DECIMAL_STR.test(body.srcAmountRaw)) {
    return NextResponse.json({ error: "srcAmountRaw must be a decimal string" }, { status: 400 });
  }
  if (!isInt(body.srcDecimals, MAX_DECIMALS)) {
    return NextResponse.json({ error: "invalid srcDecimals" }, { status: 400 });
  }
  if (!isInt(body.dstDecimals, MAX_DECIMALS)) {
    return NextResponse.json({ error: "invalid dstDecimals" }, { status: 400 });
  }
  if (body.dstQuotedRaw != null && (typeof body.dstQuotedRaw !== "string" || !RX_DECIMAL_STR.test(body.dstQuotedRaw))) {
    return NextResponse.json({ error: "invalid dstQuotedRaw" }, { status: 400 });
  }
  if (body.presetId != null && (typeof body.presetId !== "string" || !RX_PRESET.test(body.presetId))) {
    return NextResponse.json({ error: "invalid presetId" }, { status: 400 });
  }
  if (body.txHash != null && (typeof body.txHash !== "string" || !RX_TXHASH.test(body.txHash))) {
    return NextResponse.json({ error: "txHash must be 0x + 64 hex" }, { status: 400 });
  }
  if (body.dstTxHash != null && (typeof body.dstTxHash !== "string" || !RX_HEX.test(body.dstTxHash))) {
    return NextResponse.json({ error: "invalid dstTxHash" }, { status: 400 });
  }
  if (body.intentHash != null && (typeof body.intentHash !== "string" || !RX_HEX.test(body.intentHash))) {
    return NextResponse.json({ error: "invalid intentHash" }, { status: 400 });
  }

  // 5. Price the swap. Pricing failure is non-fatal; cap the result so
  //    nonsense from CoinGecko (or a MITM) can't poison the leaderboard.
  let usdValue: number | null = null;
  let priceSource: string | null = null;
  try {
    const priced = await usdValueOfSwap({
      amountRaw: BigInt(body.srcAmountRaw),
      decimals: body.srcDecimals,
      symbol: body.srcSymbol,
    });
    if (priced && Number.isFinite(priced.usd) && priced.usd >= 0) {
      usdValue = Math.min(priced.usd, MAX_USD_VALUE);
      priceSource = priced.source;
    }
  } catch {
    // pricing is a nice-to-have, never block the log
  }

  const pointsAwarded = usdValue != null
    ? Math.min(MAX_POINTS, Math.max(0, Math.round(usdValue * DEFAULT_POINTS_PER_USD)))
    : 0;

  // 6. Persist. Prisma queries are parameterized — no SQL injection surface.
  try {
    const row = await prisma.swapEvent.create({
      data: {
        wallet: canonAddr(body.wallet),
        presetId: (body.presetId as string | undefined) ?? null,
        srcChain: body.srcChain,
        dstChain: body.dstChain,
        srcToken: canonAddr(body.srcToken),
        dstToken: canonAddr(body.dstToken),
        srcSymbol: body.srcSymbol,
        dstSymbol: body.dstSymbol,
        srcAmountRaw: body.srcAmountRaw,
        srcDecimals: body.srcDecimals,
        dstQuotedRaw: (body.dstQuotedRaw as string | undefined) ?? null,
        dstDecimals: body.dstDecimals,
        usdValue: usdValue,
        priceSource: priceSource,
        pointsAwarded,
        txHash: (body.txHash as string | undefined) ?? null,
        dstTxHash: (body.dstTxHash as string | undefined) ?? null,
        intentHash: (body.intentHash as string | undefined) ?? null,
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
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ ok: true, idempotent: true });
    }
    // Don't echo internal error detail to anonymous clients.
    console.error("[/api/swap-events] write failed:", msg);
    return NextResponse.json({ error: "write failed" }, { status: 500 });
  }
}
