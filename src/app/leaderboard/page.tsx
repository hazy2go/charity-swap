import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/points";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  rank: number;
  wallet: string;
  swapCount: number;
  totalUsd: number;
  totalPoints: number;
};

async function loadLeaderboard(): Promise<{
  rows: Row[];
  totals: { swapCount: number; totalUsd: number; totalPoints: number; walletCount: number };
  error: string | null;
}> {
  try {
    const grouped = await prisma.swapEvent.groupBy({
      by: ["wallet"],
      _sum: { pointsAwarded: true, usdValue: true },
      _count: { _all: true },
      orderBy: { _sum: { pointsAwarded: "desc" } },
      take: 100,
    });

    const rows: Row[] = grouped.map((r, i) => ({
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

    return { rows, totals, error: null };
  } catch (err) {
    return {
      rows: [],
      totals: { swapCount: 0, totalUsd: 0, totalPoints: 0, walletCount: 0 },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default async function LeaderboardPage() {
  const { rows, totals, error } = await loadLeaderboard();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="xp-taskbar">
        <Link href="/" className="xp-start h-full" aria-label="Back to desktop">
          <span className="xp-start__flag">⟁</span>
          <span>Back</span>
        </Link>
        <span className="xp-taskbar__task xp-taskbar__task--active">
          <span aria-hidden>🏆</span>
          <span>Leaderboard.exe</span>
        </span>
        <div className="xp-tray text-[10px] sm:text-[11px]">
          <a
            href="https://builders.sodax.com/mcp"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            <span className="xp-tray__icon" aria-hidden>🔌</span>
            <span className="hidden sm:inline">builders.sodax.com/mcp</span>
            <span className="sm:hidden">MCP</span>
          </a>
        </div>
      </header>

      <main
        className="flex-1 p-3 sm:p-6 md:p-8 grid place-items-center"
        style={{
          backgroundImage:
            "radial-gradient(circle at 8% 12%, rgba(255,255,255,0.06) 0%, transparent 22%), radial-gradient(circle at 92% 88%, rgba(0,0,0,0.18) 0%, transparent 28%)",
        }}
      >
        <div className="xp-window w-[640px] max-w-[95vw]">
          <div className="xp-titlebar">
            <span className="xp-titlebar__icon" aria-hidden>🏆</span>
            <span className="xp-titlebar__title">
              Leaderboard.exe — Swaps without Borders
            </span>
            <div className="xp-titlebar__controls">
              <Link
                href="/"
                className="xp-ctrl xp-ctrl--close"
                aria-label="Close"
                tabIndex={-1}
              >
                <span style={{ fontWeight: "bold", lineHeight: 1 }}>×</span>
              </Link>
            </div>
          </div>

          <div className="xp-menubar">
            <span className="xp-menubar__item"><u>F</u>ile</span>
            <span className="xp-menubar__item"><u>V</u>iew</span>
            <span className="xp-menubar__item"><u>S</u>ort</span>
            <span className="xp-menubar__item"><u>H</u>elp</span>
            <span className="ml-auto self-center pr-1">
              <span className="xp-pill xp-pill--ok">LIVE · reads from Supabase</span>
            </span>
          </div>

          <div className="bg-[var(--xp-face)] px-4 py-4">
            {/* Totals strip */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
              <div className="xp-readout !block !min-h-0 !py-[6px]">
                <div className="text-[10px] uppercase tracking-wider text-[#666]">Wallets</div>
                <div className="font-mono text-[15px] font-bold">{totals.walletCount}</div>
              </div>
              <div className="xp-readout !block !min-h-0 !py-[6px]">
                <div className="text-[10px] uppercase tracking-wider text-[#666]">Swaps</div>
                <div className="font-mono text-[15px] font-bold">{totals.swapCount}</div>
              </div>
              <div className="xp-readout !block !min-h-0 !py-[6px]">
                <div className="text-[10px] uppercase tracking-wider text-[#666]">Volume</div>
                <div className="font-mono text-[15px] font-bold">
                  ${totals.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {error ? (
              <div className="xp-readout !block !text-[11px] !text-[#7a0a0a]">
                <strong>Error reading leaderboard:</strong> {error}
                <div className="mt-1 text-[10px] text-[#666]">
                  Likely the DATABASE_URL env isn&apos;t set, or Supabase is offline.
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="xp-readout !block !py-8 text-center text-[#666]">
                <div className="text-[24px] mb-2" aria-hidden>📋</div>
                <div className="font-bold text-[13px] text-[#111]">
                  No swaps logged yet
                </div>
                <div className="mt-1 text-[11px]">
                  The leaderboard is wired up and listening. The first swap that
                  goes through will appear here.
                </div>
              </div>
            ) : (
              <table className="w-full text-[11px] mb-3">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[#666] border-b border-[#aaa]">
                    <th className="py-1 pr-2">#</th>
                    <th className="py-1 pr-2">Wallet</th>
                    <th className="py-1 pr-2 text-right">Swaps</th>
                    <th className="py-1 pr-2 text-right">Volume (USD)</th>
                    <th className="py-1 pr-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.wallet} className="border-b border-[#ddd] hover:bg-[#dde8f6]">
                      <td className="py-1 pr-2 font-mono">
                        {medal(r.rank) ?? r.rank}
                      </td>
                      <td className="py-1 pr-2 font-mono">{shortAddr(r.wallet)}</td>
                      <td className="py-1 pr-2 text-right font-mono">{r.swapCount}</td>
                      <td className="py-1 pr-2 text-right font-mono">
                        ${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-1 pr-2 text-right font-mono font-bold text-[#0a2a6b]">
                        {formatPoints(r.totalPoints)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="xp-readout !block !text-[11px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[#666]">Points formula</span>
                <span className="font-mono">1 pt = $1 swapped</span>
              </div>
              <div className="mt-1 text-[10px] text-[#666]">
                Final ratio decided by the Day 11 community vote. Whatever the
                community picks lands as a single config flip — no silent
                weighting, no rounding.
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Link href="/" className="xp-button">
                Back to Swap.exe
              </Link>
              <Link href="/charities" className="xp-button">
                Charities
              </Link>
              <a
                href="https://github.com/hazy2go/swaps-without-borders/blob/main/prisma/schema.prisma"
                target="_blank"
                rel="noreferrer"
                className="xp-button"
              >
                View schema.prisma
              </a>
            </div>
          </div>

          <div className="xp-statusbar">
            <span className="xp-statusbar__cell">
              {totals.swapCount} swap(s) · {totals.walletCount} wallet(s)
            </span>
            <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
              Day 8 · live
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
