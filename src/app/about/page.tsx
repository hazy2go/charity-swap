import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { RegMark, Slash } from "@/components/hud";

const CHARITY_WALLET = "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="about" />

      <main style={{ flex: 1 }} className="vh-section">
        <div className="vh-container">
          <div className="vh-rise" style={{ maxWidth: 920, marginInline: "auto" }}>
            <div
              className="vh-eyebrow"
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}
            >
              <span style={{ color: "var(--vh-cyan-500)" }}>
                <RegMark size={12} />
              </span>
              About <Slash color="yellow" /> Built in public <Slash color="yellow" /> Mainnet
            </div>

            <h1 className="vh-h1" style={{ marginBottom: 14 }}>
              The <span style={{ color: "var(--vh-cyan-500)" }}>system</span>.
            </h1>

            <p className="vh-lede" style={{ maxWidth: 640 }}>
              How Swaps without Borders works, why it exists, and where the
              money goes. Open source. Mainnet from day one. Every milestone
              is a commit.
            </p>

            {/* The system — three pillars */}
            <div
              style={{ marginTop: 40, display: "grid", gap: 28, gridTemplateColumns: "1fr" }}
              className="md:grid-cols-3"
            >
              <Pillar
                index="01"
                title="You swap."
                body={
                  <>
                    Pick any two tokens across{" "}
                    <strong style={{ color: "var(--vh-text)" }}>18 networks</strong>. The
                    SODAX solver routes the swap. A 0.1% partner fee is
                    deducted in the input token and forwarded to a public
                    wallet on Sonic.
                  </>
                }
              />
              <Pillar
                index="02"
                title="The wallet is public."
                accent="cyan"
                body={
                  <>
                    Audit it on{" "}
                    <a
                      href={`https://sonicscan.org/address/${CHARITY_WALLET}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      sonicscan
                    </a>{" "}
                    any time. When it crosses a community-set threshold, the
                    next charity vote opens.
                  </>
                }
              />
              <Pillar
                index="03"
                title="Community votes."
                accent="magenta"
                body={
                  <>
                    A shortlist of <Link href="/charities">charities</Link> is
                    curated and voted on. The winner of each cycle receives
                    the full balance.{" "}
                    <strong style={{ color: "var(--vh-text)" }}>
                      100% to charity.
                    </strong>{" "}
                    No skim, no ops cut.
                  </>
                }
              />
            </div>

            {/* Built in public */}
            <div
              style={{
                marginTop: 56,
                padding: "28px 0",
                borderTop: "1px solid var(--vh-line)",
                borderBottom: "1px solid var(--vh-line)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 24,
                  gridTemplateColumns: "1fr",
                  alignItems: "center",
                }}
                className="md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="vh-eyebrow" style={{ marginBottom: 8 }}>
                    Built in public on SODAX SDK V2
                  </div>
                  <p
                    className="vh-display"
                    style={{
                      fontSize: "clamp(20px, 3.2vw, 28px)",
                      color: "var(--vh-text)",
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    Two weeks. <Slash /> Mainnet from day one. Every milestone
                    is a commit.
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <a
                    href="https://github.com/hazy2go/swaps-without-borders"
                    target="_blank"
                    rel="noreferrer"
                    className="vh-btn vh-btn--ghost vh-btn--sm"
                  >
                    Source
                  </a>
                  <a
                    href="https://github.com/hazy2go/swaps-without-borders/blob/main/BUILD-LOG.md"
                    target="_blank"
                    rel="noreferrer"
                    className="vh-btn vh-btn--ghost vh-btn--sm"
                  >
                    Build log
                  </a>
                  <a
                    href="https://github.com/hazy2go/swaps-without-borders/blob/main/CHANGELOG.md"
                    target="_blank"
                    rel="noreferrer"
                    className="vh-btn vh-btn--ghost vh-btn--sm"
                  >
                    Changelog
                  </a>
                </div>
              </div>
            </div>

            {/* Colophon */}
            <div style={{ marginTop: 40 }}>
              <div className="vh-eyebrow" style={{ marginBottom: 8 }}>
                Colophon
              </div>
              <p className="vh-body" style={{ maxWidth: 640 }}>
                Built by{" "}
                <a href="https://sodaxpay.vercel.app" target="_blank" rel="noreferrer">
                  Hazy
                </a>{" "}
                with the{" "}
                <a
                  href="https://builders.sodax.com/mcp"
                  target="_blank"
                  rel="noreferrer"
                >
                  SODAX Builders MCP
                </a>
                . Open source · MIT. Type system: Audiowide (display), DM Sans
                (UI), JetBrains Mono (data). Hosted on Vercel. Postgres on
                Supabase. Mainnet on Sonic chain 146.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 40,
                justifyContent: "flex-end",
              }}
            >
              <Link href="/" className="vh-btn vh-btn--ghost vh-btn--sm">
                ← Swap
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Pillar({
  index,
  title,
  body,
  accent = "default",
}: {
  index: string;
  title: string;
  body: React.ReactNode;
  accent?: "default" | "cyan" | "magenta";
}) {
  const c =
    accent === "cyan"
      ? "var(--vh-cyan-500)"
      : accent === "magenta"
        ? "var(--vh-magenta-500)"
        : "var(--vh-text-3)";
  return (
    <article>
      <div
        className="vh-display"
        style={{
          fontSize: 22,
          color: c,
          letterSpacing: "0.02em",
          marginBottom: 8,
        }}
      >
        {index}.
      </div>
      <h3 className="vh-h3" style={{ marginBottom: 8 }}>
        {title}
      </h3>
      <p className="vh-body">{body}</p>
    </article>
  );
}
