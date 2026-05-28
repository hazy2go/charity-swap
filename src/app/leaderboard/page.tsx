import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/points";
import { TopBar } from "@/components/TopBar";

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

function rankPrefix(rank: number) {
  return String(rank).padStart(2, "0");
}

function rankColor(rank: number) {
  if (rank === 1) return "var(--ol-persimmon)";
  if (rank === 2) return "var(--ol-jade)";
  if (rank === 3) return "var(--ol-honey)";
  return "var(--ol-text-3)";
}

export default async function LeaderboardPage() {
  const { rows, totals, error } = await loadLeaderboard();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="leaderboard" />

      <main style={{ flex: 1 }} className="ol-section">
        <div className="ol-container">
          <div className="ol-rise" style={{ maxWidth: 920, marginInline: "auto" }}>
            <p className="ol-eyebrow" style={{ marginBottom: 14 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 1,
                  background: "var(--ol-jade)",
                  marginRight: 10,
                  verticalAlign: "middle",
                }}
              />
              Top 100 · ranked by points · live from Supabase
            </p>
            <h1 className="ol-h1" style={{ marginBottom: 12 }}>
              Leaderboard.
            </h1>
            <p className="ol-lede" style={{ maxWidth: 580 }}>
              Every confirmed swap earns points proportional to its USD value
              at submit time. The points-to-USD ratio will be set by community
              vote — for now, <strong style={{ color: "var(--ol-text)" }}>1 pt = $1 swapped</strong>.
            </p>

            {/* Totals */}
            <div
              className="ol-data-band"
              style={{
                marginTop: 28,
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              <Stat label="Wallets" value={totals.walletCount} />
              <Stat label="Swaps" value={totals.swapCount} />
              <Stat
                label="Volume USD"
                value={`$${totals.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              />
              <Stat label="Points" value={formatPoints(totals.totalPoints)} highlight />
            </div>

            {/* Body */}
            <div style={{ marginTop: 36 }}>
              {error ? (
                <div
                  style={{
                    padding: 16,
                    border: "1px solid rgba(232,100,60,0.4)",
                    background: "var(--ol-persimmon-soft)",
                    color: "var(--ol-persimmon)",
                    borderRadius: "var(--ol-r-lg)",
                  }}
                >
                  <strong>Error · </strong>
                  {error}
                </div>
              ) : rows.length === 0 ? (
                <div
                  className="ol-card"
                  style={{ padding: "44px 24px", textAlign: "center" }}
                >
                  <div
                    className="ol-serif"
                    style={{
                      fontSize: 24,
                      color: "var(--ol-text)",
                      marginBottom: 8,
                    }}
                  >
                    No swaps logged yet.
                  </div>
                  <p
                    className="ol-body"
                    style={{ fontSize: 14, color: "var(--ol-text-3)" }}
                  >
                    The ledger is wired up and listening. The first confirmed
                    swap on the dapp will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile card list */}
                  <div className="sm:hidden">
                    {rows.map((r) => (
                      <div key={r.wallet} className="ol-row-card">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            className="ol-serif"
                            style={{
                              fontSize: 22,
                              fontWeight: 600,
                              color: rankColor(r.rank),
                            }}
                          >
                            {rankPrefix(r.rank)}
                          </span>
                          <span
                            className="ol-mono"
                            style={{
                              fontSize: 14,
                              color: "var(--ol-persimmon)",
                            }}
                          >
                            {formatPoints(r.totalPoints)} pts
                          </span>
                        </div>
                        <div
                          className="ol-mono"
                          style={{
                            fontSize: 13,
                            color: "var(--ol-text)",
                          }}
                        >
                          {shortAddr(r.wallet)}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: "var(--ol-text-3)",
                          }}
                        >
                          <span>
                            {r.swapCount} swap{r.swapCount === 1 ? "" : "s"}
                          </span>
                          <span>
                            ${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                            volume
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tablet+ table */}
                  <div
                    className="ol-card hidden sm:block"
                    style={{ overflow: "auto" }}
                  >
                    <table className="ol-table">
                      <thead>
                        <tr>
                          <th style={{ width: 64 }}>#</th>
                          <th>Wallet</th>
                          <th style={{ textAlign: "right" }}>Swaps</th>
                          <th style={{ textAlign: "right" }}>Volume</th>
                          <th style={{ textAlign: "right" }}>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.wallet}>
                            <td
                              className="ol-serif"
                              style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: rankColor(r.rank),
                              }}
                            >
                              {rankPrefix(r.rank)}
                            </td>
                            <td className="ol-mono" style={{ color: "var(--ol-text)" }}>
                              {shortAddr(r.wallet)}
                            </td>
                            <td className="ol-mono" style={{ textAlign: "right" }}>
                              {r.swapCount}
                            </td>
                            <td className="ol-mono" style={{ textAlign: "right" }}>
                              ${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td
                              className="ol-mono"
                              style={{
                                textAlign: "right",
                                color: "var(--ol-persimmon)",
                                fontWeight: 700,
                              }}
                            >
                              {formatPoints(r.totalPoints)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div
              className="flex flex-wrap gap-2"
              style={{ marginTop: 32, justifyContent: "flex-end" }}
            >
              <Link href="/" className="ol-btn ol-btn--ghost ol-btn--sm">
                Back to swap
              </Link>
              <Link href="/charities" className="ol-btn ol-btn--ghost ol-btn--sm">
                Charities
              </Link>
              <a
                href="https://github.com/hazy2go/swaps-without-borders/blob/main/prisma/schema.prisma"
                target="_blank"
                rel="noreferrer"
                className="ol-btn ol-btn--ghost ol-btn--sm"
              >
                View schema.prisma ↗
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="ol-data-band__cell">
      <div className="ol-data-band__label">{label}</div>
      <div
        className="ol-data-band__value"
        style={highlight ? { color: "var(--ol-persimmon)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
