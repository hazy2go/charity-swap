import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifySwapStatus } from "@/lib/sodax-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reconcile a submitted swap against the solver. Points only count once a
// swap reaches `confirmed` (see the leaderboard/ballots queries), so this
// is the trust boundary: the server independently asks the solver whether
// the intent actually executed — the client cannot self-confirm.
//
// Body: { id: string }  — the SwapEvent row id returned by POST /api/swap-events
// The row already carries the candidate hashes (txHash + intentHash) it was
// logged with; we verify against those rather than anything the client sends
// now, so a forged request can't confirm a swap that didn't happen.

const RX_CUID = /^[a-z0-9]{20,40}$/;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`swap-confirm:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      { status: 429, headers: { "retry-after": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: { id?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (typeof body.id !== "string" || !RX_CUID.test(body.id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const row = await prisma.swapEvent.findUnique({ where: { id: body.id } });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Already settled — idempotent.
  if (row.status === "confirmed" || row.status === "failed") {
    return NextResponse.json({ ok: true, status: row.status, settled: true });
  }

  const { verdict, matchedHash } = await verifySwapStatus([
    row.dstTxHash,
    row.txHash,
    row.intentHash,
  ]);

  if (verdict === "confirmed" || verdict === "failed") {
    // Log which hash the solver recognised — invaluable for validating the
    // candidate-hash choice on the first real mainnet swap.
    console.log(`[/api/swap-events/confirm] ${row.id} → ${verdict} via ${matchedHash}`);
    const updated = await prisma.swapEvent.update({
      where: { id: row.id },
      data: { status: verdict, confirmedAt: verdict === "confirmed" ? new Date() : null },
    });
    return NextResponse.json({
      ok: true,
      status: updated.status,
      pointsAwarded: updated.status === "confirmed" ? updated.pointsAwarded : 0,
    });
  }

  // pending (in flight) or unknown (no candidate matched yet) — client retries.
  return NextResponse.json({ ok: true, status: "submitted", verdict });
}
