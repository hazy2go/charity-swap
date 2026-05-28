import Link from "next/link";
import { SwapCard } from "@/components/SwapCard";
import { WalletBalancePanel } from "@/components/WalletBalancePanel";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { RegMark, Slash, Arrow } from "@/components/hud";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="swap" />

      <main style={{ flex: 1 }}>
        <section className="vh-section">
          <div className="vh-container">
            <div className="vh-hero-grid">
              <Hero />
              <div
                id="swap"
                className="vh-hero-grid__swap vh-rise-2"
                style={{ scrollMarginTop: 80 }}
              >
                <SwapCard />
              </div>
            </div>
          </div>
        </section>

        <section className="vh-section--tight" style={{ paddingTop: 0 }}>
          <div className="vh-container">
            <WalletBalancePanel />
          </div>
        </section>
      </main>

      <SiteFooter />
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
