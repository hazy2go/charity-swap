import Link from "next/link";
import { prisma } from "@/lib/db";
import { WalletBalancePanel } from "@/components/WalletBalancePanel";

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
    <div className="min-h-screen flex flex-col">
      <SubTopBar active="charities" />

      <main className="flex-1 relative px-4 sm:px-8 py-10">
        <div className="max-w-[1080px] mx-auto vc-rise">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="vc-numplate">TYPE-CH.03</span>
            <span className="vc-chip vc-chip--mag">
              SHORTLIST // {rows.length} CANDIDATE{rows.length === 1 ? "" : "S"}
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
            CHARI<span style={{ color: "var(--vc-magenta)" }}>.</span>
            <br />
            <span style={{ color: "var(--vc-cyan)" }}>TIES</span>
            <span
              style={{
                color: "var(--vc-text-mute)",
                fontSize: "0.4em",
                marginLeft: 8,
              }}
            >
              {"// CANDIDATE POOL"}
            </span>
          </h1>

          <p
            className="mt-6 max-w-[680px]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 17,
              lineHeight: 1.5,
              color: "var(--vc-text-mute)",
            }}
          >
            The community-curated shortlist eligible for the next payout. The
            poll opened <b style={{ color: "var(--vc-text)" }}>Mon 2026-05-25 (Day 8)</b> with
            these <b style={{ color: "var(--vc-cyan)" }}>5 candidates</b>. When the
            charity wallet crosses the community-set threshold,{" "}
            <b style={{ color: "var(--vc-magenta)" }}>Discord</b> opens a
            points-weighted vote per cycle. Payout addresses are placeholders
            until winners are locked in.
          </p>

          {/* Live wallet balance — see fees stacking in real time */}
          <div className="mt-8">
            <WalletBalancePanel />
          </div>

          {/* Body */}
          <div className="mt-8">
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
              </div>
            ) : rows.length === 0 ? (
              <div
                className="vc-panel vc-panel--cut"
                style={{ padding: "40px 24px", textAlign: "center" }}
              >
                <div
                  className="vc-display"
                  style={{ fontSize: 36, color: "var(--vc-text-faint)" }}
                >
                  ◌
                </div>
                <div
                  className="vc-display mt-3"
                  style={{ fontSize: 18, color: "var(--vc-text)" }}
                >
                  NO CANDIDATES SEEDED YET
                </div>
                <div
                  className="vc-mono mt-2"
                  style={{
                    fontSize: 11,
                    color: "var(--vc-text-mute)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Schema in <span style={{ color: "var(--vc-cyan)" }}>prisma/schema.prisma</span> · seed in <span style={{ color: "var(--vc-cyan)" }}>prisma/seed.ts</span>
                </div>
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-4">
                {rows.map((c, idx) => (
                  <CandidateCard key={c.id} c={c} index={idx + 1} />
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-2 justify-end">
            <Link href="/" className="vc-btn vc-btn--ghost">
              ← Swap
            </Link>
            <Link href="/leaderboard" className="vc-btn vc-btn--ghost">
              ◯ Leaderboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function CandidateCard({ c, index }: { c: Charity; index: number }) {
  const tone = index % 2 === 0 ? "var(--vc-magenta)" : "var(--vc-cyan)";
  return (
    <li className="vc-panel vc-panel--cut">
      <div className="vc-panel__strip">
        <span
          className="vc-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: tone,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          CANDIDATE / {String(index).padStart(2, "0")}
        </span>
        <span
          className="ml-auto vc-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--vc-text-mute)",
            textTransform: "uppercase",
          }}
        >
          {c.payoutKind}
        </span>
      </div>
      <div className="px-4 py-4">
        <div
          className="vc-display"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--vc-text)",
            letterSpacing: "-0.005em",
          }}
        >
          {c.name}
        </div>
        <p
          className="mt-2"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.45,
            color: "var(--vc-text-mute)",
          }}
        >
          {c.blurb}
        </p>

        <div
          className="mt-4 vc-mono flex items-center justify-between gap-2"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--vc-text-mute)",
            borderTop: "1px solid var(--vc-line)",
            paddingTop: 12,
          }}
        >
          <span>
            Target <span style={{ color: "var(--vc-cyan)" }}>{shortTarget(c.payoutTarget, c.payoutKind)}</span>
          </span>
          {c.website && (
            <a
              href={c.website}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--vc-cyan)" }}
            >
              {c.website.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
        </div>
      </div>
    </li>
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
      <nav className="vc-topbar__nav flex">
        <Link href="/">
          <span className="md:hidden">[01]</span>
          <span className="hidden md:inline">[01] Swap</span>
        </Link>
        <Link href="/leaderboard" className={active === "leaderboard" ? "is-active" : ""}>
          <span className="md:hidden">[02]</span>
          <span className="hidden md:inline">[02] Leaderboard</span>
        </Link>
        <Link href="/charities" className={active === "charities" ? "is-active" : ""}>
          <span className="md:hidden">[03]</span>
          <span className="hidden md:inline">[03] Charities</span>
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
