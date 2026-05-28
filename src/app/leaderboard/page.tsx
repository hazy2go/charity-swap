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
  if (rank === 1) return "01 ◆";
  if (rank === 2) return "02 ◇";
  if (rank === 3) return "03 ◈";
  return String(rank).padStart(2, "0");
}

function rankColor(rank: number) {
  if (rank === 1) return "var(--vc-yellow)";
  if (rank === 2) return "var(--vc-cyan)";
  if (rank === 3) return "var(--vc-magenta)";
  return "var(--vc-text-mute)";
}

export default async function LeaderboardPage() {
  const { rows, totals, error } = await loadLeaderboard();

  return (
    <div className="min-h-screen flex flex-col">
      <SubTopBar active="leaderboard" />

      <main className="flex-1 relative px-4 sm:px-8 py-10">
        <div className="max-w-[1080px] mx-auto vc-rise">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="vc-numplate">TYPE-LB.02</span>
            <span className="vc-chip vc-chip--live">
              <span className="vc-chip__dot vc-blink" />
              LIVE // READS FROM SUPABASE
            </span>
          </div>

          <h1
            className="vc-display"
            style={{
              fontWeight: 800,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              color: "var(--vc-text)",
            }}
          >
            LEADER<span style={{ color: "var(--vc-cyan)" }}>.</span>
            <br />
            <span style={{ color: "var(--vc-magenta)" }}>BOARD</span>
            <span style={{ color: "var(--vc-text-mute)", fontSize: "0.4em" }}>{" // TOP 100"}</span>
          </h1>

          {/* Totals strip */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="WALLETS" value={totals.walletCount} tone="cyan" />
            <Stat label="SWAPS"   value={totals.swapCount}   tone="magenta" />
            <Stat
              label="VOLUME USD"
              value={`$${totals.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              tone="yellow"
            />
            <Stat
              label="POINTS"
              value={formatPoints(totals.totalPoints)}
              tone="green"
            />
          </div>

          {/* Body */}
          <div className="mt-6 vc-panel">
            <div className="vc-panel__strip">
              <span
                className="vc-mono vc-caps"
                style={{ fontSize: 11, color: "var(--vc-cyan)" }}
              >
                LEDGER // RANKED BY POINTS
              </span>
              <span
                className="ml-auto vc-mono"
                style={{
                  fontSize: 10,
                  color: "var(--vc-text-mute)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {rows.length} entr{rows.length === 1 ? "y" : "ies"}
              </span>
            </div>

            <div className="px-4 sm:px-6 py-4 overflow-x-auto">
              {error ? (
                <div
                  className="vc-readout"
                  style={{
                    display: "block",
                    color: "var(--vc-magenta)",
                    borderColor: "var(--vc-magenta)",
                  }}
                >
                  <b className="vc-mono">ERR //</b> {error}
                  <div
                    className="vc-mono mt-2"
                    style={{ fontSize: 11, color: "var(--vc-text-mute)" }}
                  >
                    DATABASE_URL likely unset, or Supabase offline.
                  </div>
                </div>
              ) : rows.length === 0 ? (
                <div
                  className="vc-readout"
                  style={{
                    display: "block",
                    padding: "32px 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    className="vc-display"
                    style={{
                      fontSize: 32,
                      color: "var(--vc-text-faint)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    ◍
                  </div>
                  <div
                    className="vc-display mt-2"
                    style={{ fontSize: 16, color: "var(--vc-text)" }}
                  >
                    NO SWAPS LOGGED YET
                  </div>
                  <div
                    className="vc-mono mt-2"
                    style={{
                      fontSize: 11,
                      color: "var(--vc-text-mute)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Wired and listening. First confirmed swap lands here.
                  </div>
                </div>
              ) : (
                <table className="vc-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Wallet</th>
                      <th className="text-right">Swaps</th>
                      <th className="text-right">Volume</th>
                      <th className="text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.wallet}>
                        <td>
                          <span
                            className="vc-mono"
                            style={{
                              color: rankColor(r.rank),
                              letterSpacing: "0.06em",
                              fontWeight: 700,
                            }}
                          >
                            {medal(r.rank)}
                          </span>
                        </td>
                        <td className="vc-mono">{shortAddr(r.wallet)}</td>
                        <td className="vc-mono text-right">{r.swapCount}</td>
                        <td className="vc-mono text-right">
                          ${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="vc-mono text-right"
                          style={{ color: "var(--vc-cyan)", fontWeight: 700 }}
                        >
                          {formatPoints(r.totalPoints)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div
              className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3"
              style={{
                borderTop: "1px solid var(--vc-line-hi)",
                background: "var(--vc-ink)",
              }}
            >
              <span
                className="vc-mono"
                style={{
                  fontSize: 10,
                  color: "var(--vc-text-mute)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                POINTS FORMULA
              </span>
              <span
                className="vc-mono"
                style={{ fontSize: 12, color: "var(--vc-text)" }}
              >
                1 PT = $1 SWAPPED
              </span>
              <span
                className="ml-auto vc-mono"
                style={{
                  fontSize: 10,
                  color: "var(--vc-text-mute)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Final ratio: Day 11 community vote
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-end">
            <Link href="/" className="vc-btn vc-btn--ghost">
              ← Swap
            </Link>
            <Link href="/charities" className="vc-btn vc-btn--ghost">
              ◯ Charities
            </Link>
            <a
              href="https://github.com/hazy2go/swaps-without-borders/blob/main/prisma/schema.prisma"
              target="_blank"
              rel="noreferrer"
              className="vc-btn vc-btn--ghost"
            >
              ⌬ schema.prisma ↗
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function SubTopBar({ active }: { active: "leaderboard" | "charities" }) {
  return (
    <header className="vc-topbar">
      <Link href="/" className="vc-topbar__brand" style={{ textDecoration: "none" }}>
        <span className="vc-topbar__brand-mark">◢</span>
        <span className="vc-topbar__title">
          Swaps <span style={{ color: "var(--vc-yellow)" }}>{"//"}</span> Without Borders
        </span>
      </Link>
      <nav className="vc-topbar__nav hidden md:flex">
        <Link href="/">[01] Swap</Link>
        <Link href="/leaderboard" className={active === "leaderboard" ? "is-active" : ""}>
          [02] Leaderboard
        </Link>
        <Link href="/charities" className={active === "charities" ? "is-active" : ""}>
          [03] Charities
        </Link>
      </nav>
      <div className="vc-topbar__tail">
        <span className="vc-chip vc-chip--live">
          <span className="vc-chip__dot vc-blink" />
          MAINNET
        </span>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "cyan" | "magenta" | "yellow" | "green";
}) {
  const color =
    tone === "cyan"
      ? "var(--vc-cyan)"
      : tone === "magenta"
        ? "var(--vc-magenta)"
        : tone === "yellow"
          ? "var(--vc-yellow)"
          : "var(--vc-green)";
  return (
    <div className="vc-panel vc-panel--cut">
      <div className="px-4 py-3">
        <div
          className="vc-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--vc-text-mute)",
            textTransform: "uppercase",
          }}
        >
          [{label}]
        </div>
        <div
          className="vc-display mt-1"
          style={{
            fontSize: 24,
            fontWeight: 700,
            color,
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
