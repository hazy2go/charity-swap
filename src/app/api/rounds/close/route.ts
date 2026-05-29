import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_WALLET, verifyAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/rounds/close
 * Body: { roundId: string, winnerId: string, nonce: string, signature: 0x… }
 *
 * Admin closes the current open round and declares the winning charity.
 *
 * Signed message:
 *   CLOSE_ROUND::{nonce}::{roundId}::{winnerId}
 */
export async function POST(req: Request) {
  let body: {
    roundId?: unknown;
    winnerId?: unknown;
    nonce?: unknown;
    signature?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { roundId, winnerId, nonce, signature } = body;
  if (typeof roundId !== "string" || !roundId) {
    return NextResponse.json({ error: "bad roundId" }, { status: 400 });
  }
  if (typeof winnerId !== "string" || !winnerId) {
    return NextResponse.json({ error: "bad winnerId" }, { status: 400 });
  }
  if (typeof nonce !== "string" || nonce.length < 4 || nonce.length > 64) {
    return NextResponse.json({ error: "bad nonce" }, { status: 400 });
  }
  if (typeof signature !== "string" || !signature.startsWith("0x")) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const round = await prisma.voteRound.findUnique({ where: { id: roundId } });
  if (!round) return NextResponse.json({ error: "round not found" }, { status: 404 });
  if (round.status !== "open") {
    return NextResponse.json({ error: "round not open" }, { status: 400 });
  }
  if (!round.candidateIds.includes(winnerId)) {
    return NextResponse.json({ error: "winner not in candidates" }, { status: 400 });
  }

  const message = `CLOSE_ROUND::${nonce}::${roundId}::${winnerId}`;
  const v = await verifyAdmin({ message, signature: signature as `0x${string}` });
  if (!v.ok) {
    return NextResponse.json(
      { error: "unauthorized", recovered: v.recovered },
      { status: 401 },
    );
  }

  // Replay guard: burn the nonce (unique PK rejects a reused signature).
  try {
    await prisma.usedNonce.create({
      data: { nonce, action: "CLOSE_ROUND", usedBy: ADMIN_WALLET },
    });
  } catch {
    return NextResponse.json({ error: "nonce already used (replay)" }, { status: 409 });
  }

  await prisma.voteRound.update({
    where: { id: roundId },
    data: {
      status: "closed",
      closedAt: new Date(),
      closedBy: ADMIN_WALLET,
      winnerId,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
