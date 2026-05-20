import { ConnectButton } from "@/components/ConnectButton";
import { SwapCard } from "@/components/SwapCard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Taskbar — sticky top */}
      <header className="xp-taskbar">
        <ConnectButton />

        {/* Open "applications" */}
        <div className="xp-taskbar__task xp-taskbar__task--active" aria-current="true">
          <span aria-hidden>🪟</span>
          <span>Swap.exe</span>
        </div>
        <div className="xp-taskbar__task">
          <span aria-hidden>📝</span>
          <span>ReadMe.txt — Notepad</span>
        </div>

        {/* Tray */}
        <div className="xp-tray">
          <span className="xp-tray__icon" title="MCP">🔌</span>
          <a
            href="https://builders.sodax.com/mcp"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
            title="SODAX Builders MCP"
          >
            builders.sodax.com/mcp
          </a>
          <span className="opacity-70">|</span>
          <span title="Network">SODAX V2</span>
        </div>
      </header>

      {/* Desktop */}
      <main
        className="flex-1 p-8 relative"
        style={{
          backgroundImage:
            "radial-gradient(circle at 8% 12%, rgba(255,255,255,0.06) 0%, transparent 22%), radial-gradient(circle at 92% 88%, rgba(0,0,0,0.18) 0%, transparent 28%)",
        }}
      >
        {/* Desktop icons — left rail */}
        <div className="hidden md:flex flex-col gap-5 absolute left-6 top-6">
          <DesktopIcon glyph="💾" label="charity-swap" />
          <DesktopIcon glyph="🧾" label="BUILD-LOG.md" />
          <DesktopIcon glyph="🔗" label="Repo on&nbsp;GitHub" />
          <DesktopIcon glyph="🛠" label="SODAX MCP" />
          <DesktopIcon glyph="🗑" label="Recycle Bin" />
        </div>

        {/* Two-window composition */}
        <div className="flex flex-wrap gap-6 justify-center items-start pt-2 md:pl-28">
          <SwapCard />

          <NotepadWindow />
        </div>

        {/* Watermark — "Charity Swap Silver Edition" — bottom-right */}
        <div
          className="absolute bottom-12 right-8 text-right select-none"
          style={{
            color: "rgba(255,255,255,0.55)",
            textShadow: "1px 1px 1px rgba(0,0,0,0.6)",
          }}
        >
          <div className="text-[18px] font-bold leading-none">
            Charity Swap
          </div>
          <div className="text-[11px] tracking-wider uppercase opacity-80">
            Silver Edition · build 0.0.1 · Day 3
          </div>
          <div className="text-[10px] opacity-70 mt-1">
            For evaluation purposes only. Mainnet.
          </div>
        </div>
      </main>
    </div>
  );
}

function DesktopIcon({
  glyph,
  label,
}: {
  glyph: string;
  label: string;
}) {
  return (
    <div className="xp-desktop-icon">
      <div className="xp-desktop-icon__glyph">{glyph}</div>
      <div
        className="xp-desktop-icon__label"
        dangerouslySetInnerHTML={{ __html: label }}
      />
    </div>
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
        <pre className="xp-notepad">{`CHARITY SWAP — README.TXT
============================

Day 3 of a 2-week public build on the SODAX SDK V2.

WHAT THIS DOES
  Cross-chain swap. Fees route to a public charity
  wallet on Sonic. Community votes which charity gets
  the payout when the wallet hits a chosen threshold.

  100% of fees go to charity. No skim. No ops cut.

SCAFFOLDED WITH
  >> https://builders.sodax.com/mcp
  The SODAX Builders MCP gives Claude Code (or any
  MCP-aware agent) the SDK docs, live config, and
  partner-fee primitives. This whole app dropped into
  place in an afternoon. If you're evaluating SODAX
  as a build target — start there.

STATUS THIS COMMIT
  [x] EVM wallet connect (Hana / MetaMask / Rabby)
  [x] Live quotes via useQuote
  [x] Approve + Swap path via useSwap
  [x] 3 preset USDC/USDT pairs
  [ ] Partner fee  ............ Day 9
  [ ] Points ledger  .......... Day 4
  [ ] Charity vote  ........... Day 11

REPO   github.com/hazy2go/charity-swap     MIT
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
