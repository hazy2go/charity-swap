import Link from "next/link";
import { prisma } from "@/lib/db";
import { WalletBalancePanel } from "@/components/WalletBalancePanel";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Charity = {
  id: string;
  name: string;
  blurb: string;
  website: string | null;
  payoutKind: "wallet" | "offramp";
  payoutTarget: string;
  active: boolean;
  createdAt: Date;
};

async function loadCharities(): Promise<{ rows: Charity[]; error: string | null }> {
  try {
    const rows = await prisma.charity.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    return { rows: rows as Charity[], error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err) };
  }
}

function shortTarget(target: string, kind: "wallet" | "offramp"): string {
  if (kind === "wallet" && target.startsWith("0x") && target.length >= 10) {
    return `${target.slice(0, 6)}…${target.slice(-4)}`;
  }
  return target;
}

export default async function CharitiesPage() {
  const { rows, error } = await loadCharities();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="charities" />

      <main style={{ flex: 1 }} className="ol-section">
        <div className="ol-container">
          <div className="ol-rise" style={{ maxWidth: 920, marginInline: "auto" }}>
            <p className="ol-eyebrow" style={{ marginBottom: 14 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 1,
                  background: "var(--ol-persimmon)",
                  marginRight: 10,
                  verticalAlign: "middle",
                }}
              />
              Shortlist · {rows.length} candidate{rows.length === 1 ? "" : "s"}
            </p>
            <h1 className="ol-h1" style={{ marginBottom: 12 }}>
              Charities.
            </h1>
            <p className="ol-lede" style={{ maxWidth: 640 }}>
              The community-curated shortlist for the next payout cycle. When
              the public wallet crosses the community-set threshold, a vote
              opens — the winner receives the full balance. Payout addresses
              are placeholders until winners are locked in.
            </p>

            {/* Wallet panel — live */}
            <div className="ol-rise-2" style={{ marginTop: 32 }}>
              <WalletBalancePanel />
            </div>

            {/* Candidate cards */}
            <div style={{ marginTop: 40 }}>
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
                    style={{ fontSize: 22, color: "var(--ol-text)" }}
                  >
                    No candidates seeded yet.
                  </div>
                </div>
              ) : (
                <ul
                  className="grid gap-4 sm:grid-cols-2"
                  style={{ listStyle: "none", padding: 0 }}
                >
                  {rows.map((c, idx) => (
                    <CandidateCard key={c.id} c={c} idx={idx + 1} />
                  ))}
                </ul>
              )}
            </div>

            <div
              className="flex flex-wrap gap-2"
              style={{ marginTop: 32, justifyContent: "flex-end" }}
            >
              <Link href="/" className="ol-btn ol-btn--ghost ol-btn--sm">
                Back to swap
              </Link>
              <Link href="/leaderboard" className="ol-btn ol-btn--ghost ol-btn--sm">
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CandidateCard({ c, idx }: { c: Charity; idx: number }) {
  return (
    <li className="ol-card">
      <div className="ol-card__body">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span className="ol-eyebrow">
            Candidate {String(idx).padStart(2, "0")}
          </span>
          <span className="ol-tag">{c.payoutKind}</span>
        </div>
        <h3
          className="ol-serif"
          style={{
            fontSize: 24,
            color: "var(--ol-text)",
            marginBottom: 8,
            letterSpacing: "-0.012em",
            lineHeight: 1.15,
          }}
        >
          {c.name}
        </h3>
        <p
          className="ol-body"
          style={{ fontSize: 14, color: "var(--ol-text-2)" }}
        >
          {c.blurb}
        </p>
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--ol-line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--ol-text-3)",
            flexWrap: "wrap",
          }}
        >
          <span className="ol-mono">
            target ·{" "}
            <span style={{ color: "var(--ol-text-2)" }}>
              {shortTarget(c.payoutTarget, c.payoutKind)}
            </span>
          </span>
          {c.website && (
            <a
              href={c.website}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--ol-jade)" }}
            >
              {c.website.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
