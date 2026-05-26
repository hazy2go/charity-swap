import { ConnectButton } from "@/components/ConnectButton";
import { SwapCard } from "@/components/SwapCard";
import { DesktopIcons } from "@/components/DesktopIcons";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Taskbar — sticky top */}
      <header className="xp-taskbar">
        <ConnectButton />

        {/* Open "applications" — hidden on mobile to save space */}
        <a
          href="#swap-window"
          className="xp-taskbar__task xp-taskbar__task--active hidden sm:flex"
          aria-current="true"
        >
          <span aria-hidden>🪟</span>
          <span>Swap.exe</span>
        </a>
        <a
          href="/leaderboard"
          className="xp-taskbar__task hidden sm:flex"
        >
          <span aria-hidden>🏆</span>
          <span>Leaderboard</span>
        </a>
        <a
          href="/charities"
          className="xp-taskbar__task hidden md:flex"
        >
          <span aria-hidden>🎗</span>
          <span>Charities</span>
        </a>
        <a
          href="#notepad-window"
          className="xp-taskbar__task hidden md:flex"
        >
          <span aria-hidden>📝</span>
          <span>ReadMe.txt — Notepad</span>
        </a>

        {/* Tray — collapses on small screens */}
        <div className="xp-tray text-[10px] sm:text-[11px]">
          <a
            href="https://builders.sodax.com/mcp"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1"
            title="SODAX Builders MCP"
          >
            <span className="xp-tray__icon" aria-hidden>🔌</span>
            <span className="hidden sm:inline">builders.sodax.com/mcp</span>
            <span className="sm:hidden">MCP</span>
          </a>
          <span className="opacity-70 hidden sm:inline">|</span>
          <span className="hidden sm:inline" title="Network">SODAX V2</span>
        </div>
      </header>

      {/* Desktop */}
      <main
        className="flex-1 p-3 sm:p-6 md:p-8 relative overflow-x-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 8% 12%, rgba(255,255,255,0.06) 0%, transparent 22%), radial-gradient(circle at 92% 88%, rgba(0,0,0,0.18) 0%, transparent 28%)",
        }}
      >
        {/* Functional desktop icons (md+) */}
        <DesktopIcons />

        {/* Two-window composition */}
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-start pt-1 sm:pt-2 md:pl-28">
          <section id="swap-window" className="scroll-mt-12">
            <SwapCard />
          </section>

          <section id="notepad-window" className="scroll-mt-12">
            <NotepadWindow />
          </section>
        </div>

        {/* Mobile: tiny chip with quick links since desktop icons are hidden */}
        <nav className="md:hidden mt-4 flex flex-wrap justify-center gap-2 text-[10px]">
          <MobileChip href="/leaderboard" label="Leaderboard" glyph="🏆" />
          <MobileChip href="/charities" label="Charities" glyph="🎗" />
          <MobileChip
            href="https://github.com/hazy2go/swaps-without-borders"
            label="GitHub"
            glyph="🔗"
          />
          <MobileChip
            href="https://github.com/hazy2go/swaps-without-borders/blob/main/BUILD-LOG.md"
            label="Build Log"
            glyph="🧾"
          />
          <MobileChip
            href="https://builders.sodax.com/mcp"
            label="SODAX MCP"
            glyph="🛠"
          />
        </nav>

        {/* Watermark — hidden on small screens, visible from md+ */}
        <div
          className="hidden md:block absolute bottom-12 right-8 text-right select-none"
          style={{
            color: "rgba(255,255,255,0.55)",
            textShadow: "1px 1px 1px rgba(0,0,0,0.6)",
          }}
        >
          <div className="text-[18px] font-bold leading-none">
            Swaps without Borders
          </div>
          <div className="text-[11px] tracking-wider uppercase opacity-80">
            Silver Edition · build 0.0.6 · Day 9
          </div>
          <div className="text-[10px] opacity-70 mt-1">
            For evaluation purposes only. Mainnet.
          </div>
        </div>
      </main>
    </div>
  );
}

function MobileChip({
  href,
  label,
  glyph,
}: {
  href: string;
  label: string;
  glyph: string;
}) {
  const isInternal = href.startsWith("/");
  return (
    <a
      href={href}
      {...(isInternal ? {} : { target: "_blank", rel: "noreferrer" })}
      className="xp-button !min-w-0 !h-auto inline-flex items-center gap-1 !px-2 !py-1"
    >
      <span aria-hidden>{glyph}</span>
      <span>{label}</span>
    </a>
  );
}

function NotepadWindow() {
  return (
    <div className="xp-window w-[420px] max-w-[95vw]">
      <div className="xp-titlebar xp-titlebar--inactive">
        <span className="xp-titlebar__icon" aria-hidden>📝</span>
        <span className="xp-titlebar__title">ReadMe.txt — Notepad</span>
        <div className="xp-titlebar__controls">
          <button className="xp-ctrl" aria-label="Minimize" tabIndex={-1}>
            <span style={{display:"inline-block",width:8,height:2,background:"#000",marginTop:8}} />
          </button>
          <button className="xp-ctrl" aria-label="Maximize" tabIndex={-1}>
            <span style={{display:"inline-block",width:10,height:9,border:"1px solid #000",borderTopWidth:2}} />
          </button>
          <button className="xp-ctrl xp-ctrl--close" aria-label="Close" tabIndex={-1}>
            <span style={{fontWeight:"bold",lineHeight:1}}>×</span>
          </button>
        </div>
      </div>

      <div className="xp-menubar">
        <span className="xp-menubar__item"><u>F</u>ile</span>
        <span className="xp-menubar__item"><u>E</u>dit</span>
        <span className="xp-menubar__item"><u>S</u>earch</span>
        <span className="xp-menubar__item"><u>H</u>elp</span>
      </div>

      <div className="px-3 pb-3 pt-2 bg-[var(--xp-face)]">
        <pre className="xp-notepad text-[11px] sm:text-[12px] overflow-x-auto">{`SWAPS WITHOUT BORDERS — README.TXT
====================================

Day 9 of a 2-week public build on the SODAX SDK V2.
THE FEE IS LIVE. Every swap now routes a 0.1% fee to
the public charity wallet on Sonic. 100% of it goes to
the community-voted charity — no skim, no ops cut.

WHAT THIS DOES
  Cross-chain swap. A 0.1% fee on every swap routes to
  a public charity wallet on Sonic. Community votes
  which charity gets the payout when the wallet hits a
  chosen threshold.

  100% of fees go to charity. No skim. No ops cut.

CHARITY WALLET (audit it yourself)
  0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD
  sonicscan.org → that address. Interim single-key
  wallet; multisig migration to follow.

SCAFFOLDED WITH
  >> https://builders.sodax.com/mcp
  The SODAX Builders MCP gives Claude Code (or any
  MCP-aware agent) the SDK docs, live config, and
  partner-fee primitives. This whole app dropped into
  place in an afternoon. If you're evaluating SODAX
  as a build target — start there.

STATUS THIS COMMIT (Day 9)
  [x] EVM wallet connect (Hana / MetaMask / Rabby)
  [x] Live quotes via useQuote
  [x] Approve + Swap path via useSwap
  [x] All 18 SODAX networks · chain→token picker
  [x] Name: Swaps without Borders (community vote)
  [x] Points ledger schema (Prisma + Supabase)
  [x] Points preview in SwapCard
  [x] Supabase live · CoinGecko USD pricing
  [x] /api/swap-events + /api/leaderboard
  [x] /leaderboard reads from DB · medals + totals
  [x] Functionality audit + bug-fix pass
  [x] /charities — 5-candidate shortlist seeded
  [x] Partner fee  ... 0.1% LIVE → charity wallet
  [~] Charity wallet . interim EOA (multisig TBD)
  [ ] Charity vote  ........... Day 11

REPO   github.com/hazy2go/swaps-without-borders   MIT
BUILT  by Hazy (SODAX community) · Kobe JST

Press Alt+F4 to close.`}</pre>
      </div>

      <div className="xp-statusbar">
        <span className="xp-statusbar__cell">Ln 1, Col 1</span>
        <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
          UTF-8
        </span>
        <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
          Windows (CRLF)
        </span>
      </div>
    </div>
  );
}
