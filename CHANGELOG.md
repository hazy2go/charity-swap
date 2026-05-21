# Changelog — Swaps without Borders

Punchy day-by-day patch notes. For the narrative version with rationale,
see [BUILD-LOG.md](BUILD-LOG.md).

---

## Day 4 — Thu 2026-05-21 — `4ae547f`

### 🏷 Naming
- Community vote closed → **Swaps without Borders**
- GitHub repo renamed: `hazy2go/charity-swap` → **`hazy2go/swaps-without-borders`** (GitHub auto-redirects the old URL)
- Renamed everywhere: `package.json`, window titles, watermark, README, BUILD-LOG, the in-app Notepad ReadMe, desktop-icon label, footer

### 🗄 Database (Day 4 milestone)
- **Prisma + Supabase scaffolded** (`prisma/schema.prisma`):
  - `SwapEvent` — one row per swap (wallet, route, amounts, USD value, points, tx hash, status)
  - `PayoutVote` — open/closed vote with threshold + duration + winning charity
  - `Ballot` — wallet's points spent on a candidate inside a vote (unique per `(vote, wallet, charity)`)
  - `Charity` — curated shortlist entries with `wallet` or `offramp` payout
  - Bigints stored as decimal strings (no JS number loss), indexes on wallet/createdAt
- Prisma client singleton at `src/lib/db.ts`
- `pnpm db:generate / db:push / db:studio / db:migrate` scripts
- `.env.example` documents Supabase pooled (`DATABASE_URL`) + direct (`DIRECT_URL`) URLs
- _Pinned Prisma 6 — v7 moved URL config out of the schema, not worth migrating mid-sprint._

### 💎 Points preview in SwapCard
- New **"Charity rewards"** GroupBox under Amount
- Live `+X pts` next to every quote (font scales up, monospace)
- USD estimate + formula footer ("1 pt / $1 — Day 11 vote")
- Helper at `src/lib/points.ts` (`previewPoints`, `DEFAULT_POINTS_PER_USD`)
- Explicit "preview only — persistence activates Day 5" footer

### 🏆 `/leaderboard` route
- Real Next.js route under `app/leaderboard/page.tsx`
- XP-styled window with title bar, menu bar, sortable-looking table header
- Big "no swaps logged yet" empty state with "activates Day 5" copy
- Back-to-Swap + View-schema.prisma buttons
- Wired into: desktop icons (🏆 Leaderboard), taskbar task tab, mobile chip nav

### 🪟 UI / UX
- Fee timing pill on SwapCard: **"Today: 0% — From Day 9 (Tue 2026-05-26) 0.3%"**
- Notepad ReadMe rewritten with the Day 4 checklist
- Watermark updated to "build 0.0.2 · Day 4"
- README "What's live right now" + two-week table reflect Day 4 ✅

### 🔒 Money state — unchanged
- No `partnerFee` in `src/lib/sodax.ts`
- No charity wallet address anywhere
- Zero `SwapEvent` rows written (Supabase isn't connected yet)
- **Day 9 gate is sealed**

### 📦 Files
- **+5 new** — `prisma/schema.prisma`, `src/lib/db.ts`, `src/lib/points.ts`, `src/app/leaderboard/page.tsx`, BUILD-LOG Day 4 section
- **9 modified** — SwapCard, DesktopIcons, page, layout, providers, globals.css, `.env.example`, `package.json`, README

---

## Day 3 — Wed 2026-05-20 — `0638cb4` + `38f1f91` + `b9ea0e3` + `29ee82b`

### 🏗 Scaffold
- Next.js 15 App Router + TS strict + Tailwind v4 + ESLint
- `@sodax/sdk` / `@sodax/dapp-kit` / `@sodax/wallet-sdk-react` 2.0.0-rc.1
- React Query (`createSodaxQueryClient`), viem, pnpm
- Webpack pinned (`--webpack` flag); `IgnorePlugin` shim for `@injectivelabs/wallet-ledger` UMD crypto-js
- `force-dynamic` root layout + client-mount-gated providers to dodge `hasHydrated` SSR crash

### 🔗 Wallet
- EVM connect via `@sodax/wallet-sdk-react` — Hana / MetaMask / Rabby / any EIP-6963
- WalletConnect connector enabled when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set (silently skipped otherwise)
- ConnectButton = Start-button + Start-menu picker when disconnected, system-tray pill + clock when connected
- Wallet config: Sonic, Ethereum, Arbitrum, Base, BSC, Polygon

### 🔁 Swap
- Full path: `useQuote` → `useSwapAllowance` → `useSwapApprove` → `useSwap`
- 8 preset pairs, default **★ Arbitrum USDC → Sonic SODA**
  - 3 SODA buys (Arb / Base / BSC → Sonic SODA)
  - 1 SODA sell (Sonic → Arb)
  - 1 SODA bridge (Arb → Base)
  - 3 stablecoin pairs
- 0.5% hardcoded slippage (community-tunable Day 11)

### 🪟 Windows XP Luna Silver UI
- Hand-rolled in `globals.css` — no `98.css` / `xp.css` deps
- Bevel atoms (`xp-bevel-out`, `xp-bevel-in`, `xp-panel`)
- Window chrome with silver-gradient title bars + [—][□][×] controls
- Taskbar with Start button, task tabs, system tray + clock
- Two-window composition (Swap.exe + ReadMe.txt Notepad) on a teal-grey desktop
- Functional desktop icons: click-to-select / dbl-click-to-open / Enter / Esc, with a faux Recycle Bin dialog
- Inset form fields, dialog buttons, status bars, scanline scrollbars

### 📱 Mobile
- Taskbar task tabs hide < sm/md
- Tray collapses to "MCP" pill
- Watermark hidden < md
- Mobile chip nav (GitHub / Build Log / SODAX MCP) under windows
- Big input bumped to 16px on mobile to stop iOS auto-zoom
- `html { scroll-behavior: smooth }`

### 🔧 Build / deploy
- Public GitHub repo (MIT, topics, issues + discussions enabled)
- Vercel project linked + auto-deploy on push to `main`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` set in prod env

### 🐛 Fixes during the day
- `da5f193` — `force-dynamic` to skip SSG crash
- `e28c792` — gate provider tree on client mount, SSR boot skeleton
- `2166c48` — Start menu no longer auto-closes on the opening click
- `29ee82b` — drop `overflow:hidden` from taskbar (was clipping Start menu)

---

## Day 2 — Tue 2026-05-19

- Name poll opened (community-facing, no code change)

## Day 1 — Mon 2026-05-18

- Announcement (community-facing, no code change)
