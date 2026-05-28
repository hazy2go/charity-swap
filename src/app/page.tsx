import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { SwapCard } from "@/components/SwapCard";
import { WalletBalancePanel } from "@/components/WalletBalancePanel";
import { TopBar } from "@/components/TopBar";

const CHARITY_WALLET = "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="swap" />

      <main style={{ flex: 1 }}>
        {/* HERO + SWAP — single column < lg, side-by-side ≥ lg */}
        <section className="ol-section">
          <div className="ol-container">
            <div className="ol-hero-grid">
              <Hero />

              <div
                id="swap"
                className="ol-rise-2 ol-hero-grid__swap scroll-mt-24"
              >
                <ConnectButton block />
                <SwapCard />
              </div>
            </div>
          </div>
        </section>

        {/* DATA BAND — the live "see fees move" moment */}
        <section className="ol-section--tight" style={{ paddingTop: 0 }}>
          <div className="ol-container">
            <WalletBalancePanel />
          </div>
        </section>

        {/* HOW IT WORKS — three editorial paragraphs */}
        <section className="ol-section">
          <div className="ol-container">
            <div className="grid gap-12 lg:grid-cols-3">
              <Pillar
                eyebrow="01 · how it works"
                title="You swap. The dapp keeps 0.1%."
              >
                Pick any two tokens across <strong>18 networks</strong>. The
                SODAX solver routes the swap. A 0.1% partner fee is deducted
                in the input token and forwarded to a public wallet on Sonic.
              </Pillar>
              <Pillar
                eyebrow="02 · transparency"
                title="The wallet is public. The balance is verifiable."
              >
                It&apos;s the address above. Watch fees stack in real time on{" "}
                <a
                  href={`https://sonicscan.org/address/${CHARITY_WALLET}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  sonicscan
                </a>
                . When it crosses a community-set threshold, the next charity
                vote opens.
              </Pillar>
              <Pillar
                eyebrow="03 · community vote"
                title="The community picks where it goes."
              >
                A shortlist of charities is{" "}
                <Link href="/charities">curated and voted on</Link>. The
                winner of each cycle receives the full balance.{" "}
                <strong>100% to charity.</strong> No skim, no ops cut.
              </Pillar>
            </div>
          </div>
        </section>

        {/* BUILD IN PUBLIC */}
        <section
          className="ol-section--tight"
          style={{
            borderTop: "1px solid var(--ol-line)",
            borderBottom: "1px solid var(--ol-line)",
            background: "var(--ol-s1)",
          }}
        >
          <div className="ol-container">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] items-center">
              <div>
                <div className="ol-eyebrow" style={{ marginBottom: 6 }}>
                  Built in public on the SODAX SDK V2
                </div>
                <p
                  className="ol-serif"
                  style={{
                    fontSize: "clamp(20px, 2.4vw, 26px)",
                    color: "var(--ol-text)",
                    lineHeight: 1.25,
                    margin: 0,
                  }}
                >
                  Two weeks. Mainnet from day one. Every milestone is a commit.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://github.com/hazy2go/swaps-without-borders"
                  target="_blank"
                  rel="noreferrer"
                  className="ol-btn ol-btn--ghost"
                >
                  Source on GitHub
                </a>
                <a
                  href="https://github.com/hazy2go/swaps-without-borders/blob/main/BUILD-LOG.md"
                  target="_blank"
                  rel="noreferrer"
                  className="ol-btn ol-btn--ghost"
                >
                  Build log
                </a>
                <a
                  href="https://builders.sodax.com/mcp"
                  target="_blank"
                  rel="noreferrer"
                  className="ol-btn ol-btn--jade"
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
    <section className="ol-rise">
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
        Day 11 · build in public · mainnet
      </p>
      <h1 className="ol-h1">
        Swaps that{" "}
        <span
          className="ol-serif-it"
          style={{ color: "var(--ol-persimmon)" }}
        >
          quietly
        </span>{" "}
        fund charity.
      </h1>
      <p className="ol-lede" style={{ marginTop: 20, maxWidth: 560 }}>
        A cross-chain swap dapp on the SODAX SDK V2. Every fee — a single
        tenth of a percent — routes to a public charity wallet on Sonic.
        <strong style={{ color: "var(--ol-text)" }}>
          {" "}100% goes to the community-voted cause.
        </strong>{" "}
        No skim. No ops cut.
      </p>
      <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
        <a href="#swap" className="ol-btn ol-btn--primary">
          Open swap
        </a>
        <Link href="/charities" className="ol-btn ol-btn--ghost">
          See charity wallet
        </Link>
      </div>

      <div
        className="ol-data-band"
        style={{ marginTop: 36, maxWidth: 560 }}
      >
        <DataCell label="Fee per swap" value="0.1%" />
        <DataCell label="Networks live" value="18" />
        <DataCell label="To charity" value="100%" highlight />
      </div>
    </section>
  );
}

function DataCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
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

function Pillar({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <div className="ol-eyebrow" style={{ marginBottom: 12 }}>
        {eyebrow}
      </div>
      <h3
        className="ol-serif"
        style={{
          fontSize: "clamp(20px, 2.4vw, 26px)",
          color: "var(--ol-text)",
          lineHeight: 1.2,
          letterSpacing: "-0.012em",
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      <p
        className="ol-body"
        style={{ color: "var(--ol-text-2)", fontSize: 15 }}
      >
        {children}
      </p>
    </article>
  );
}

function Footer() {
  return (
    <footer
      style={{
        padding: "32px 0 56px",
        borderTop: "1px solid var(--ol-line)",
      }}
    >
      <div className="ol-container">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-end">
          <div>
            <div
              className="ol-serif"
              style={{
                fontSize: 18,
                color: "var(--ol-text)",
                marginBottom: 4,
              }}
            >
              Swaps without Borders
            </div>
            <p className="ol-body" style={{ fontSize: 13, maxWidth: 480 }}>
              Built by{" "}
              <a
                href="https://sodaxpay.vercel.app"
                target="_blank"
                rel="noreferrer"
              >
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
              . Open source · MIT · audited and verified on Sonicscan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://github.com/hazy2go/swaps-without-borders"
              target="_blank"
              rel="noreferrer"
              className="ol-btn ol-btn--ghost ol-btn--sm"
            >
              Source
            </a>
            <a
              href="https://github.com/hazy2go/swaps-without-borders/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noreferrer"
              className="ol-btn ol-btn--ghost ol-btn--sm"
            >
              Changelog
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
