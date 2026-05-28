import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/points";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { RegMark, Slash } from "@/components/hud";

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
function rankPrefix(rank: number) { return String(rank).padStart(2, "0"); }
function rankColor(rank: number) {
  if (rank === 1) return "var(--vh-magenta-500)";
  if (rank === 2) return "var(--vh-cyan-500)";
  if (rank === 3) return "var(--vh-yellow-500)";
  return "var(--vh-text-3)";
}

export default async function LeaderboardPage() {
  const { rows, totals, error } = await loadLeaderboard();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="leaderboard" />

      <main style={{ flex: 1 }} className="vh-section">
        <div className="vh-container">
          <div className="vh-rise" style={{ maxWidth: 920, marginInline: "auto" }}>
            <div className="vh-eyebrow" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ color: "var(--vh-cyan-500)" }}><RegMark size={12} /></span>
              Top 100 <Slash color="yellow" /> Ranked by points <Slash color="yellow" /> Live from Supabase
            </div>
            <h1 className="vh-h1" style={{ marginBottom: 14 }}>
              Leader<span style={{ color: "var(--vh-magenta-500)" }}>board.</span>
            </h1>
            <p className="vh-lede" style={{ maxWidth: 580 }}>
              Every confirmed swap earns points proportional to its USD value
              at submit time. Points-to-USD ratio is community-vote-pinned —
              today, <strong style={{ color: "var(--vh-text)" }}>1 pt = $1 swapped</strong>.
            </p>

            <div className="vh-data-band" style={{ marginTop: 24, gridTemplateColumns: "repeat(2, 1fr)" }}>
              <Stat label="Wallets" value={totals.walletCount} />
              <Stat label="Swaps" value={totals.swapCount} />
              <Stat label="Volume USD" value={`$${totals.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              <Stat label="Points" value={formatPoints(totals.totalPoints)} accent />
            </div>

            <div style={{ marginTop: 32 }}>
              {error ? (
                <div
                  style={{
                    padding: 14,
                    border: "1px solid var(--vh-magenta-soft)",
                    background: "var(--vh-magenta-soft)",
                    color: "var(--vh-magenta-500)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <strong>Error · </strong>
                  {error}
                </div>
              ) : rows.length === 0 ? (
                <div className="vh-card" style={{ padding: "40px 22px", textAlign: "center" }}>
                  <div className="vh-h3" style={{ marginBottom: 8 }}>
                    No swaps logged yet.
                  </div>
                  <p className="vh-body" style={{ fontSize: 13, color: "var(--vh-text-3)" }}>
                    The ledger is wired up and listening. The first confirmed
                    swap on the dapp will land here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="sm:hidden">
                    {rows.map((r) => (
                      <div key={r.wallet} className="vh-row">
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                          <span
                            className="vh-display"
                            style={{ fontSize: 22, color: rankColor(r.rank) }}
                          >
                            {rankPrefix(r.rank)}
                          </span>
                          <span
                            className="vh-mono"
                            style={{ fontSize: 13, color: "var(--vh-cyan-500)" }}
                          >
                            {formatPoints(r.totalPoints)} pts
                          </span>
                        </div>
                        <div className="vh-mono" style={{ fontSize: 13, color: "var(--vh-text)" }}>
                          {shortAddr(r.wallet)}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--vh-text-3)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          <span>{r.swapCount} swap{r.swapCount === 1 ? "" : "s"}</span>
                          <span>${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="vh-card hidden sm:block" style={{ overflow: "auto" }}>
                    <table className="vh-table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>#</th>
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
                              className="vh-display"
                              style={{ fontSize: 18, color: rankColor(r.rank) }}
                            >
                              {rankPrefix(r.rank)}
                            </td>
                            <td className="vh-mono" style={{ color: "var(--vh-text)" }}>
                              {shortAddr(r.wallet)}
                            </td>
                            <td className="vh-mono" style={{ textAlign: "right" }}>
                              {r.swapCount}
                            </td>
                            <td className="vh-mono" style={{ textAlign: "right" }}>
                              ${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td
                              className="vh-mono"
                              style={{ textAlign: "right", color: "var(--vh-cyan-500)", fontWeight: 700 }}
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28, justifyContent: "flex-end" }}>
              <Link href="/" className="vh-btn vh-btn--ghost vh-btn--sm">← Swap</Link>
              <Link href="/charities" className="vh-btn vh-btn--ghost vh-btn--sm">Charities</Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="vh-data-band__cell">
      <div className="vh-data-band__label">{label}</div>
      <div
        className="vh-data-band__value"
        style={accent ? { color: "var(--vh-cyan-500)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
