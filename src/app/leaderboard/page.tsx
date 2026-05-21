import Link from "next/link";

// Leaderboard reads SwapEvent rows once Day 5 wires Supabase. For now the
// route is live with an XP-styled empty state so the navigation works and
// future-screenshots have a real URL to link to.
export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="xp-taskbar">
        <Link href="/" className="xp-start h-full" aria-label="Back to desktop">
          <span className="xp-start__flag">⟁</span>
          <span>Back</span>
        </Link>
        <span className="xp-taskbar__task xp-taskbar__task--active">
          <span aria-hidden>🏆</span>
          <span>Leaderboard.exe</span>
        </span>
        <div className="xp-tray text-[10px] sm:text-[11px]">
          <a
            href="https://builders.sodax.com/mcp"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            <span className="xp-tray__icon" aria-hidden>🔌</span>
            <span className="hidden sm:inline">builders.sodax.com/mcp</span>
            <span className="sm:hidden">MCP</span>
          </a>
        </div>
      </header>

      <main
        className="flex-1 p-3 sm:p-6 md:p-8 grid place-items-center"
        style={{
          backgroundImage:
            "radial-gradient(circle at 8% 12%, rgba(255,255,255,0.06) 0%, transparent 22%), radial-gradient(circle at 92% 88%, rgba(0,0,0,0.18) 0%, transparent 28%)",
        }}
      >
        <div className="xp-window w-[520px] max-w-[95vw]">
          <div className="xp-titlebar">
            <span className="xp-titlebar__icon" aria-hidden>🏆</span>
            <span className="xp-titlebar__title">
              Leaderboard.exe — Swaps without Borders
            </span>
            <div className="xp-titlebar__controls">
              <Link
                href="/"
                className="xp-ctrl xp-ctrl--close"
                aria-label="Close"
                tabIndex={-1}
              >
                <span style={{ fontWeight: "bold", lineHeight: 1 }}>×</span>
              </Link>
            </div>
          </div>

          <div className="xp-menubar">
            <span className="xp-menubar__item"><u>F</u>ile</span>
            <span className="xp-menubar__item"><u>V</u>iew</span>
            <span className="xp-menubar__item"><u>S</u>ort</span>
            <span className="xp-menubar__item"><u>H</u>elp</span>
          </div>

          <div className="bg-[var(--xp-face)] px-4 py-4">
            <table className="w-full text-[11px] mb-3">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[#666] border-b border-[#aaa]">
                  <th className="py-1 pr-2">#</th>
                  <th className="py-1 pr-2">Wallet</th>
                  <th className="py-1 pr-2 text-right">Swapped (USD)</th>
                  <th className="py-1 pr-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#666]">
                    <div className="text-[24px] mb-2" aria-hidden>📋</div>
                    <div className="font-bold text-[13px] text-[#111]">
                      No swaps logged yet
                    </div>
                    <div className="mt-1 text-[11px]">
                      The leaderboard activates <strong>Day 5 (Fri 2026-05-22)</strong>{" "}
                      once the Supabase connection lands.
                      <br />
                      Schema is already committed in{" "}
                      <code className="font-mono">prisma/schema.prisma</code>.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="xp-readout !block !text-[11px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[#666]">Points formula (preview)</span>
                <span className="font-mono">1 pt = $1 swapped</span>
              </div>
              <div className="mt-1 text-[10px] text-[#666]">
                Final ratio decided by the Day 11 community vote. Whatever
                the community picks lands as a single config flip — no
                silent weighting, no rounding.
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Link href="/" className="xp-button">
                Back to Swap.exe
              </Link>
              <a
                href="https://github.com/hazy2go/swaps-without-borders/blob/main/prisma/schema.prisma"
                target="_blank"
                rel="noreferrer"
                className="xp-button"
              >
                View schema.prisma
              </a>
            </div>
          </div>

          <div className="xp-statusbar">
            <span className="xp-statusbar__cell">0 swap(s) · 0 wallet(s)</span>
            <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
              Day 4 · pre-launch
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
