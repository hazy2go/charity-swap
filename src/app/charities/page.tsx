import Link from "next/link";
import { prisma } from "@/lib/db";
import { WalletBalancePanel } from "@/components/WalletBalancePanel";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { RegMark, Slash, Reticle } from "@/components/hud";

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

      <main style={{ flex: 1 }} className="vh-section">
        <div className="vh-container">
          <div className="vh-rise" style={{ maxWidth: 920, marginInline: "auto" }}>
            <div className="vh-eyebrow" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ color: "var(--vh-magenta-500)" }}><RegMark size={12} /></span>
              Shortlist <Slash color="yellow" /> {rows.length} candidate{rows.length === 1 ? "" : "s"} <Slash color="yellow" /> Vote opens at threshold
            </div>
            <h1 className="vh-h1" style={{ marginBottom: 14 }}>
              Chari<span style={{ color: "var(--vh-magenta-500)" }}>ties.</span>
            </h1>
            <p className="vh-lede" style={{ maxWidth: 640 }}>
              The community-curated shortlist for the next payout cycle. When
              the public wallet crosses the community-set threshold, a vote
              opens — the winner receives the full balance. Payout addresses
              are placeholders until winners are locked in.
            </p>

            <div className="vh-rise-2" style={{ marginTop: 28 }}>
              <WalletBalancePanel />
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
                    No candidates seeded yet.
                  </div>
                </div>
              ) : (
                <ul
                  style={{
                    display: "grid",
                    gap: 14,
                    gridTemplateColumns: "1fr",
                    listStyle: "none",
                    padding: 0,
                  }}
                  className="sm:grid-cols-2"
                >
                  {rows.map((c, idx) => (
                    <CandidateCard key={c.id} c={c} idx={idx + 1} />
                  ))}
                </ul>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28, justifyContent: "flex-end" }}>
              <Link href="/" className="vh-btn vh-btn--ghost vh-btn--sm">← Swap</Link>
              <Link href="/leaderboard" className="vh-btn vh-btn--ghost vh-btn--sm">Leaderboard</Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function CandidateCard({ c, idx }: { c: Charity; idx: number }) {
  return (
    <li className="vh-card">
      <div className="vh-card__head">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--vh-cyan-500)" }}>
          <Reticle size={12} />
          <span className="vh-eyebrow" style={{ color: "var(--vh-cyan-500)" }}>
            Candidate {String(idx).padStart(2, "0")}
          </span>
        </span>
        <span style={{ marginLeft: "auto" }} className="vh-pill">{c.payoutKind}</span>
      </div>
      <div className="vh-card__body">
        <h3 className="vh-h3" style={{ marginBottom: 8 }}>{c.name}</h3>
        <p className="vh-body">{c.blurb}</p>

        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--vh-line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--vh-text-3)",
            flexWrap: "wrap",
            letterSpacing: "0.06em",
          }}
        >
          <span>
            target ·{" "}
            <span style={{ color: "var(--vh-text-2)" }}>
              {shortTarget(c.payoutTarget, c.payoutKind)}
            </span>
          </span>
          {c.website && (
            <a
              href={c.website}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--vh-cyan-500)" }}
            >
              {c.website.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
