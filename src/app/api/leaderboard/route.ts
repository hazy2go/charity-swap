import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export type LeaderboardRow = {
  rank: number;
  wallet: string;
  swapCount: number;
  totalUsd: number;
  totalPoints: number;
};

export type LeaderboardResponse = {
  rows: LeaderboardRow[];
  totals: {
    swapCount: number;
    totalUsd: number;
    totalPoints: number;
    walletCount: number;
  };
};

export async function GET(req: Request) {
  // Generous limit — leaderboard reads cache well on the edge, but we
  // still don't want one client looping unbounded.
  const ip = clientIp(req);
  const rl = rateLimit(`leaderboard:${ip}`, { limit: 120, windowMs: 60_000 });
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

  const url = new URL(req.url);
  // Garbage like ?limit=abc → NaN → Prisma 500. Coerce safely.
  const rawLimit = Number(url.searchParams.get("limit"));
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50;
  const limit = Math.min(Math.max(1, Math.floor(safeLimit)), 250);

  // groupBy returns one row per wallet with summed _ stats. Decimal columns
  // come back as Prisma Decimal — coerce to number for the JSON response.
  try {
    const grouped = await prisma.swapEvent.groupBy({
      by: ["wallet"],
      _sum: { pointsAwarded: true, usdValue: true },
      _count: { _all: true },
      orderBy: { _sum: { pointsAwarded: "desc" } },
      take: limit,
    });

    const rows: LeaderboardRow[] = grouped.map((r, i) => ({
      rank: i + 1,
      wallet: r.wallet,
      swapCount: r._count._all,
      totalUsd: Number(r._sum.usdValue ?? 0),
      totalPoints: r._sum.pointsAwarded ?? 0,
    }));

    const totals = rows.reduce(
      (acc, r) => {
        acc.swapCount += r.swapCount;
        acc.totalUsd += r.totalUsd;
        acc.totalPoints += r.totalPoints;
        return acc;
      },
      { swapCount: 0, totalUsd: 0, totalPoints: 0, walletCount: rows.length },
    );

    const res: LeaderboardResponse = { rows, totals };
    return NextResponse.json(res);
  } catch (err) {
    // Don't echo internal error detail to anonymous clients.
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/leaderboard] read failed:", msg);
    return NextResponse.json({ error: "leaderboard read failed" }, { status: 500 });
  }
}
