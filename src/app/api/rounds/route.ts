import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_WALLET, verifyAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/rounds
 * Body: { candidateIds: string[3], thresholdUsd: number, nonce: string, signature: 0x… }
 *
 * Admin opens a new vote round. Signature must recover to ADMIN_WALLET.
 * Closes any other open round first (one active round at a time).
 *
 * Signed message format:
 *   OPEN_ROUND::{nonce}::{candidateIds.join(",")}::{thresholdUsd}
 */
export async function POST(req: Request) {
  let body: {
    candidateIds?: unknown;
    thresholdUsd?: unknown;
    nonce?: unknown;
    signature?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const candidateIds = body.candidateIds;
  const thresholdUsd = body.thresholdUsd;
  const nonce = body.nonce;
  const signature = body.signature;

  if (!Array.isArray(candidateIds) || candidateIds.length !== 3) {
    return NextResponse.json({ error: "need exactly 3 candidateIds" }, { status: 400 });
  }
  if (!candidateIds.every((id) => typeof id === "string" && id.length > 0 && id.length < 64)) {
    return NextResponse.json({ error: "bad candidateIds" }, { status: 400 });
  }
  if (new Set(candidateIds).size !== 3) {
    return NextResponse.json({ error: "candidateIds must be unique" }, { status: 400 });
  }
  if (typeof thresholdUsd !== "number" || !Number.isFinite(thresholdUsd) || thresholdUsd <= 0) {
    return NextResponse.json({ error: "bad thresholdUsd" }, { status: 400 });
  }
  if (typeof nonce !== "string" || nonce.length < 4 || nonce.length > 64) {
    return NextResponse.json({ error: "bad nonce" }, { status: 400 });
  }
  if (typeof signature !== "string" || !signature.startsWith("0x")) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  // Verify charities exist
  const found = await prisma.charity.findMany({
    where: { id: { in: candidateIds as string[] } },
  });
  if (found.length !== 3) {
    return NextResponse.json({ error: "one or more charities not found" }, { status: 400 });
  }

  const message = `OPEN_ROUND::${nonce}::${(candidateIds as string[]).join(",")}::${thresholdUsd}`;
  const v = await verifyAdmin({ message, signature: signature as `0x${string}` });
  if (!v.ok) {
    return NextResponse.json(
      { error: "unauthorized", recovered: v.recovered },
      { status: 401 },
    );
  }

  // Close any other open rounds (one active at a time)
  await prisma.voteRound.updateMany({
    where: { status: "open" },
    data: { status: "closed", closedAt: new Date(), closedBy: ADMIN_WALLET },
  });

  const round = await prisma.voteRound.create({
    data: {
      candidateIds: candidateIds as string[],
      thresholdUsd,
      openedBy: ADMIN_WALLET,
      status: "open",
    },
  });

  return NextResponse.json({ ok: true, roundId: round.id }, { status: 200 });
}
