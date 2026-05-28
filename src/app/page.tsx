import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { SwapCard } from "@/components/SwapCard";
import { WalletBalancePanel } from "@/components/WalletBalancePanel";
import { TopBar } from "@/components/TopBar";
import { RegMark, Slash, Arrow } from "@/components/hud";

const CHARITY_WALLET = "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="swap" />

      <main style={{ flex: 1 }}>
        {/* HERO + SWAP */}
        <section className="vh-section">
          <div className="vh-container">
            <div className="vh-hero-grid">
              <Hero />
              <div id="swap" className="vh-hero-grid__swap vh-rise-2" style={{ scrollMarginTop: 80 }}>
                <ConnectButton block />
                <SwapCard />
              </div>
            </div>
          </div>
        </section>

        {/* LIVE WALLET — full-width data moment */}
        <section className="vh-section--tight" style={{ paddingTop: 0 }}>
          <div className="vh-container">
            <WalletBalancePanel />
          </div>
        </section>

        {/* HOW IT WORKS — three pillars */}
        <section className="vh-section">
          <div className="vh-container">
            <div className="vh-eyebrow" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--vh-cyan-500)" }}><RegMark size={12} /></span>
              The system
            </div>
            <div style={{ display: "grid", gap: 28, gridTemplateColumns: "1fr" }} className="md:grid-cols-3">
              <Pillar
                index="01"
                title="You swap."
                body={
                  <>
                    Pick any two tokens across <strong style={{ color: "var(--vh-text)" }}>18 networks</strong>. The SODAX
                    solver routes the swap. A 0.1% partner fee is deducted in the input token and forwarded to a public
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
                    any time. When it crosses a community-set threshold, the next charity vote opens.
                  </>
                }
              />
              <Pillar
                index="03"
                title="Community votes."
                accent="magenta"
                body={
                  <>
                    A shortlist of <Link href="/charities">charities</Link> is curated and voted on. The winner of each
                    cycle receives the full balance.{" "}
                    <strong style={{ color: "var(--vh-text)" }}>100% to charity.</strong> No skim, no ops cut.
                  </>
                }
              />
            </div>
          </div>
        </section>

        {/* BUILD IN PUBLIC */}
        <section
          className="vh-section--tight"
          style={{
            borderTop: "1px solid var(--vh-line)",
            borderBottom: "1px solid var(--vh-line)",
            background: "var(--vh-s1)",
          }}
        >
          <div className="vh-container">
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
                  Two weeks. <Slash /> Mainnet from day one. Every milestone is a commit.
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
                  href="https://builders.sodax.com/mcp"
                  target="_blank"
                  rel="noreferrer"
                  className="vh-btn vh-btn--magenta vh-btn--sm"
                >
                  SODAX Builders MCP
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="vh-rise">
      <div
        className="vh-eyebrow"
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}
      >
        <span style={{ color: "var(--vh-cyan-500)" }}>
          <RegMark size={12} />
        </span>
        Day 11 <Slash color="yellow" /> Build in public <Slash color="yellow" /> Mainnet
      </div>

      <h1 className="vh-h1">
        Cross-chain swaps
        <br />
        <span style={{ color: "var(--vh-cyan-500)" }}>that fund</span>{" "}
        <span style={{ color: "var(--vh-magenta-500)" }}>charity.</span>
      </h1>

      <p className="vh-lede" style={{ marginTop: 18, maxWidth: 580 }}>
        A dapp on the SODAX SDK V2. Every fee — a single tenth of a percent —
        routes to a public charity wallet on Sonic.{" "}
        <strong style={{ color: "var(--vh-text)" }}>
          100% goes to the community-voted cause.
        </strong>{" "}
        No skim. No ops cut.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
        <a href="#swap" className="vh-btn vh-btn--primary">
          Open swap <Arrow size={12} />
        </a>
        <Link href="/charities" className="vh-btn vh-btn--ghost">
          See charity wallet
        </Link>
      </div>

      <div className="vh-data-band" style={{ marginTop: 28 }}>
        <DataCell label="Fee per swap" value="0.1%" />
        <DataCell label="Networks live" value="18" />
        <DataCell label="To charity" value="100%" accent />
      </div>
    </section>
  );
}

function DataCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="vh-data-band__cell">
      <div className="vh-data-band__label">{label}</div>
      <div
        className="vh-data-band__value"
        style={accent ? { color: "var(--vh-magenta-500)" } : undefined}
      >
        {value}
      </div>
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

function Footer() {
  return (
    <footer
      style={{
        padding: "28px 0 56px",
        borderTop: "1px solid var(--vh-line)",
      }}
    >
      <div className="vh-container">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "1fr",
            alignItems: "end",
          }}
          className="md:grid-cols-[1fr_auto]"
        >
          <div>
            <div
              className="vh-display"
              style={{ fontSize: 18, color: "var(--vh-text)", marginBottom: 4 }}
            >
              Swaps without Borders
            </div>
            <p
              className="vh-body"
              style={{ fontSize: 12, maxWidth: 480, color: "var(--vh-text-3)" }}
            >
              Built by{" "}
              <a href="https://sodaxpay.vercel.app" target="_blank" rel="noreferrer">
                Hazy
              </a>{" "}
              with the{" "}
              <a href="https://builders.sodax.com/mcp" target="_blank" rel="noreferrer">
                SODAX Builders MCP
              </a>
              . Open source · MIT.
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
    </footer>
  );
}
