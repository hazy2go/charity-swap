import { NextResponse } from "next/server";
import { isAddress, getAddress } from "viem";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/ballots
 * Body: { roundId: string, wallet: 0x…, candidateId: string }
 *
 * A wallet casts a vote in the current open round. We snapshot their
 * current points balance (sum of pointsAwarded from confirmed swaps).
 * Unique constraint [roundId, wallet] prevents double-voting.
 *
 * Note: this is intentionally NOT signature-gated. A wallet only "votes"
 * with the points it has earned through real on-chain swaps under that
 * address — Sybiling means buying yourself in via gas + fees, so the
 * Sybil resistance is the same as Sybil-resistance on the leaderboard.
 */
export async function POST(req: Request) {
  let body: { roundId?: unknown; wallet?: unknown; candidateId?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { roundId, wallet, candidateId } = body;
  if (typeof roundId !== "string" || !roundId) {
    return NextResponse.json({ error: "bad roundId" }, { status: 400 });
  }
  if (typeof wallet !== "string" || !isAddress(wallet)) {
    return NextResponse.json({ error: "bad wallet (must be EVM 0x)" }, { status: 400 });
  }
  if (typeof candidateId !== "string" || !candidateId) {
    return NextResponse.json({ error: "bad candidateId" }, { status: 400 });
  }

  const round = await prisma.voteRound.findUnique({ where: { id: roundId } });
  if (!round) return NextResponse.json({ error: "round not found" }, { status: 404 });
  if (round.status !== "open") {
    return NextResponse.json({ error: "round closed" }, { status: 400 });
  }
  if (!round.candidateIds.includes(candidateId)) {
    return NextResponse.json({ error: "candidate not in round" }, { status: 400 });
  }

  const normalized = getAddress(wallet); // checksummed
  const lowercased = normalized.toLowerCase();

  // Snapshot current points = sum of pointsAwarded for this wallet
  // (case-insensitive match on the leaderboard wallet column).
  const grouped = await prisma.swapEvent.groupBy({
    by: ["wallet"],
    where: { wallet: { in: [normalized, lowercased] } },
    _sum: { pointsAwarded: true },
  });
  const points = grouped.reduce(
    (acc, g) => acc + (g._sum.pointsAwarded ?? 0),
    0,
  );

  if (points <= 0) {
    return NextResponse.json(
      { error: "no points — earn by swapping first" },
      { status: 400 },
    );
  }

  try {
    const ballot = await prisma.voteBallot.create({
      data: {
        roundId,
        wallet: lowercased,
        candidateId,
        pointsSnapshot: points,
      },
    });
    return NextResponse.json(
      { ok: true, ballotId: ballot.id, pointsCast: points },
      { status: 200 },
    );
  } catch (e) {
    // unique constraint violation = wallet already voted
    return NextResponse.json(
      { error: "already voted in this round" },
      { status: 409 },
    );
  }
}
