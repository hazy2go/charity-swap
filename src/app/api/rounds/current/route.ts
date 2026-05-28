import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/rounds/current
 * Returns the currently-open vote round + 3 candidates resolved + tallies.
 * If no open round, returns { round: null }.
 */
export async function GET() {
  try {
    const round = await prisma.voteRound.findFirst({
      where: { status: "open" },
      orderBy: { openedAt: "desc" },
      include: { ballots: true },
    });

    if (!round) {
      return NextResponse.json({ round: null }, { status: 200 });
    }

    const charities = await prisma.charity.findMany({
      where: { id: { in: round.candidateIds } },
    });

    // Tally per candidate from ballots
    const tally: Record<string, { voters: number; points: number }> = {};
    for (const cid of round.candidateIds) {
      tally[cid] = { voters: 0, points: 0 };
    }
    for (const b of round.ballots) {
      const t = tally[b.candidateId];
      if (t) {
        t.voters += 1;
        t.points += b.pointsSnapshot;
      }
    }

    const totalPoints = Object.values(tally).reduce((s, t) => s + t.points, 0);

    return NextResponse.json(
      {
        round: {
          id: round.id,
          status: round.status,
          openedAt: round.openedAt,
          openedBy: round.openedBy,
          thresholdUsd: Number(round.thresholdUsd),
          candidates: round.candidateIds.map((id) => {
            const c = charities.find((c) => c.id === id);
            return c
              ? {
                  id: c.id,
                  name: c.name,
                  blurb: c.blurb,
                  website: c.website,
                  payoutKind: c.payoutKind,
                  tally: tally[id] ?? { voters: 0, points: 0 },
                }
              : { id, name: "(unknown)", blurb: "", website: null, payoutKind: "offramp", tally: tally[id] ?? { voters: 0, points: 0 } };
          }),
          totals: {
            voters: round.ballots.length,
            points: totalPoints,
          },
        },
      },
      {
        status: 200,
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
