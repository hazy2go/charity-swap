import { ConnectButton } from "@/components/ConnectButton";
import { SwapCard } from "@/components/SwapCard";

const CHARITY_WALLET = "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";

const TICKER = [
  "0.1% PARTNER FEE",
  "100% TO CHARITY",
  "18 NETWORKS LIVE",
  "MAINNET SINCE DAY 3",
  "OPEN SOURCE — MIT",
  "BUILT WITH SODAX BUILDERS MCP",
  "COMMUNITY-VOTED PAYOUTS",
  "SDK V2 // SOLVER ROUTED",
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <main className="flex-1 relative">
        <DiagonalDecor />

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 pt-10 sm:pt-14 md:pt-20 pb-16 grid lg:grid-cols-[1.05fr_minmax(440px,1fr)] gap-10 lg:gap-16 items-start">
          <Hero />

          <div id="swap" className="scroll-mt-12 flex justify-center lg:justify-end vc-rise-2">
            <div className="w-full max-w-[460px] flex flex-col items-center lg:items-end gap-4">
              <ConnectButton />
              <SwapCard />
            </div>
          </div>
        </div>

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 pb-16">
          <HeroDetails />
        </div>

        <Ticker />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="vc-topbar">
      <div className="vc-topbar__brand">
        <span className="vc-topbar__brand-mark">◢</span>
        <span className="vc-topbar__title hidden sm:inline">
          Swaps <span style={{ color: "var(--vc-yellow)" }}>{"//"}</span> Without Borders
        </span>
        <span className="vc-topbar__title sm:hidden">
          <span style={{ color: "var(--vc-yellow)" }}>{"//"}</span> SWB
        </span>
      </div>
      <nav className="vc-topbar__nav flex">
        <a href="#swap" className="is-active">
          <span className="md:hidden">[01]</span>
          <span className="hidden md:inline">[01] Swap</span>
        </a>
        <a href="/leaderboard">
          <span className="md:hidden">[02]</span>
          <span className="hidden md:inline">[02] Leaderboard</span>
        </a>
        <a href="/charities">
          <span className="md:hidden">[03]</span>
          <span className="hidden md:inline">[03] Charities</span>
        </a>
      </nav>
      <div className="vc-topbar__tail">
        <span className="vc-chip vc-chip--live">
          <span className="vc-chip__dot vc-blink" />
          MAINNET
        </span>
        <a
          href="https://builders.sodax.com/mcp"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline vc-mono"
          style={{ color: "var(--vc-text-mute)" }}
          title="SODAX Builders MCP"
        >
          builders.sodax.com/mcp ↗
        </a>
      </div>
    </header>
  );
}

function DiagonalDecor() {
  return (
    <>
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[320px] h-[320px] pointer-events-none opacity-90 hidden md:block"
        style={{
          background:
            "linear-gradient(135deg, transparent 0%, transparent 56%, var(--vc-magenta) 56%, var(--vc-magenta) 58%, transparent 58%, transparent 66%, var(--vc-cyan) 66%, var(--vc-cyan) 67%, transparent 67%)",
        }}
      />
      <div
        aria-hidden
        className="absolute top-[420px] left-0 w-[180px] h-[180px] pointer-events-none opacity-80 hidden md:block"
        style={{
          background:
            "linear-gradient(315deg, transparent 0%, transparent 70%, var(--vc-yellow) 70%, var(--vc-yellow) 72%, transparent 72%)",
        }}
      />
    </>
  );
}

function Hero() {
  return (
    <section className="vc-rise">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="vc-numplate">TYPE-WB.01 // SODAX V2</span>
        <span className="vc-chip vc-chip--cyan">DAY 11 // BUILD 0.0.7</span>
      </div>

      <h1
        className="vc-display"
        style={{
          fontWeight: 800,
          fontSize: "clamp(48px, 9vw, 112px)",
          lineHeight: 0.9,
          letterSpacing: "-0.025em",
          color: "var(--vc-text)",
        }}
      >
        SWAPS<span style={{ color: "var(--vc-magenta)" }}>{"//"}</span>
        <br />
        WITHOUT<span style={{ color: "var(--vc-cyan)" }}>.</span>
        <br />
        <span style={{ color: "var(--vc-paper)" }}>BORDERS</span>
      </h1>

      <p
        className="mt-6 sm:mt-8 max-w-[520px]"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(16px, 1.45vw, 20px)",
          lineHeight: 1.45,
          color: "var(--vc-text-mute)",
          letterSpacing: "0.01em",
        }}
      >
        Cross-chain swaps where every fee routes to charity.
        <span style={{ color: "var(--vc-text)" }}>
          {" "}0.1% per swap. 100% to the community-voted cause.
        </span>{" "}
        Two weeks. Built in public. Mainnet from day one.
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        <a
          href="https://github.com/hazy2go/swaps-without-borders"
          target="_blank"
          rel="noreferrer"
          className="vc-btn vc-btn--ghost"
        >
          ◇ Source
        </a>
        <a
          href="https://github.com/hazy2go/swaps-without-borders/blob/main/BUILD-LOG.md"
          target="_blank"
          rel="noreferrer"
          className="vc-btn vc-btn--ghost"
        >
          ◐ Build Log
        </a>
        <a
          href="https://builders.sodax.com/mcp"
          target="_blank"
          rel="noreferrer"
          className="vc-btn vc-btn--magenta"
        >
          ⌬ SODAX Builders MCP
        </a>
      </div>
    </section>
  );
}

function HeroDetails() {
  return (
    <section className="vc-rise-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="[ CHARITY WALLET ]"
          big="0x95A8…721AD"
          sub="SONIC // INTERIM EOA — multisig to follow"
          tone="cyan"
          href={`https://sonicscan.org/address/${CHARITY_WALLET}`}
        />
        <StatBlock
          label="[ FEE // FLOWS TO ]"
          big="0.1% → CHARITY"
          sub="100% — no skim, no ops cut"
          tone="magenta"
        />
        <StatBlock
          label="[ NETWORKS // LIVE ]"
          big="18 CHAINS"
          sub="12 EVM + Solana, Sui, Injective, ICON, Stellar, NEAR"
          tone="ink"
        />
        <StatBlock
          label="[ SCHEDULE ]"
          big="DAY 11 / 14"
          sub="Mainnet · open-source · MIT"
          tone="ink"
        />
      </div>

      <div className="mt-8 vc-panel">
        <div className="vc-panel__strip">
          <span className="vc-mono vc-caps" style={{ fontSize: 11, color: "var(--vc-cyan)" }}>
            README // SYS-LOG
          </span>
          <span className="ml-auto vc-chip vc-chip--mag">⊕ ÆSTHETIC: VECTORHEART</span>
        </div>
        <div
          className="px-5 py-5 text-[15px] leading-[1.55]"
          style={{ color: "var(--vc-text-mute)" }}
        >
          <p>
            <span className="vc-slash" />
            Connect a wallet on either side. Pick chain, pick token, quote,
            approve, swap. The solver routes cross-chain. The fee settles to a
            public Sonic wallet — audit it any time.
          </p>
          <p className="mt-3">
            <span className="vc-slash" style={{ color: "var(--vc-yellow)" }} />
            The community picks the charity. The repo picks nothing for them.
            Votes run in Discord when the wallet crosses threshold.
          </p>
        </div>
      </div>
    </section>
  );
}

function StatBlock({
  label,
  big,
  sub,
  tone,
  href,
}: {
  label: string;
  big: string;
  sub: string;
  tone: "cyan" | "magenta" | "ink";
  href?: string;
}) {
  const accent =
    tone === "cyan"
      ? "var(--vc-cyan)"
      : tone === "magenta"
        ? "var(--vc-magenta)"
        : "var(--vc-text)";
  const Wrap: React.ElementType = href ? "a" : "div";
  return (
    <Wrap
      {...(href ? { href, target: "_blank", rel: "noreferrer" } : {})}
      className="vc-panel vc-panel--cut block"
      style={{ textDecoration: "none" }}
    >
      <div className="vc-panel__strip">
        <span
          className="vc-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--vc-text-mute)",
          }}
        >
          {label}
        </span>
      </div>
      <div className="px-4 py-4">
        <div
          className="vc-display"
          style={{
            fontSize: 22,
            letterSpacing: "0.02em",
            fontWeight: 700,
            color: accent,
            wordBreak: "break-word",
          }}
        >
          {big}
        </div>
        <div
          className="mt-1 vc-mono"
          style={{ fontSize: 11, color: "var(--vc-text-mute)" }}
        >
          {sub}
        </div>
      </div>
    </Wrap>
  );
}

function Ticker() {
  return (
    <div
      aria-hidden
      className="border-y overflow-hidden vc-hazard"
      style={{ borderColor: "var(--vc-ink)" }}
    >
      <div className="vc-marquee-track py-2">
        {Array.from({ length: 2 }).map((_, dup) => (
          <span key={dup} className="flex">
            {TICKER.map((t, i) => (
              <span
                key={`${dup}-${i}`}
                className="vc-display vc-caps-tight px-6"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--vc-ink)",
                  letterSpacing: "0.16em",
                }}
              >
                ⊕ {t}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
