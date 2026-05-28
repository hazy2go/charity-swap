# Changelog — Swaps without Borders

Punchy day-by-day patch notes. For the narrative version with rationale,
see [BUILD-LOG.md](BUILD-LOG.md).

---

## Day 11 — Thu 2026-05-28 — VECTORHEART // full UI revamp

### Community vote — UI direction
- Day 10 community poll picked **Vectorheart** — late-90s WipEout / The Designers Republic aesthetic
- Sharp vector shapes, 45/60° diagonals, flat high-contrast color, futuristic mono+display type
- Old Windows XP Luna Silver chrome retired in full

### Design system
- New palette: ink `#08090B`, paper `#EFEAE0`, cyan `#00E5FF`, magenta `#FF2E88`, yellow `#FFE600`, green `#7BE564`
- Typefaces: **Orbitron** (display caps) · **JetBrains Mono** (data/code) · **Barlow Condensed** (body), loaded via `next/font/google`
- Motifs: type plates (`TYPE-WB.01 // SODAX V2`), slash dividers `//`, bracket call-outs `[FROM]`, halftone dot grid background, hazard-tape ticker, diagonal corner cuts via `clip-path`

### Pages revamped
- **`src/app/globals.css`** — full rewrite with `vc-*` primitives (panels, buttons, inputs, chips, plates, tables, animations)
- **`src/app/page.tsx`** — killed the Notepad ReadMe window for a cleaner hero. Massive `SWAPS // WITHOUT . BORDERS` headline, stat-block grid (charity wallet · fee · networks · schedule), README sys-log panel, hazard-tape ticker
- **`src/components/SwapCard.tsx`** — restyled (all swap logic untouched): bracketed FROM/TO labels, monospace quote readout, charity-rewards subpanel, primary cyan EXECUTE button
- **`src/components/ConnectButton.tsx`** — Vectorheart dropdown with numbered `[01] EVM` / `[02] Solana` / … ecosystem groups
- **`src/app/leaderboard/page.tsx`** — typographic LEADER.BOARD title, cyan stat tiles, rank-coloured ledger table
- **`src/app/charities/page.tsx`** — CHARI.TIES title, candidate cards numbered `CANDIDATE / 01..05`

### Cleanup
- **Deleted** `src/components/DesktopIcons.tsx`
- Removed all `xp-*` classes and Luna Silver tokens (clean cut, no aliases)
- Boot skeleton in `src/app/providers.tsx` rebuilt in Vectorheart
- Watermark/copy: build bumped to **0.0.7 · Day 11**

### Not changed (intentionally)
- Swap logic — `useQuote`/`useSwapAllowance`/`useSwapApprove`/`useSwap` flow byte-identical
- Routes — all 18 SODAX networks still wired exactly as Day 9
- Fee config — `0.1% → 0x95A8…721AD` untouched
- Data layer — Prisma, leaderboard query, charity seed all untouched

---

## Day 9 — Tue 2026-05-26 — 🚨 the fee is LIVE (Build Log #2)

### 💸 Partner fee turned on
- `src/lib/sodax.ts` now configures a `PartnerFee` across **all features** — `swaps`, `bridge`, `moneyMarket`
- **0.1%** per swap (`percentage: 10` — basis points; SDK `FEE_PERCENTAGE_SCALE = 10_000`)
- Deducted from the input amount before the intent is created, routed to the charity wallet on Sonic
- **100% of the fee → charity. No skim, no ops cut.**

### 🏦 Charity wallet live (interim)
- Recipient: **`0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD`** on Sonic (chain 146)
- Dedicated wallet — only fees in, only payouts out, so the audit trail is clean: [sonicscan.org](https://sonicscan.org/address/0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD)
- **Disclosed honestly as an interim single-key EOA, not yet a multisig.** Multisig migration = a one-line address change + re-announce. Overridable via `NEXT_PUBLIC_CHARITY_FEE_ADDRESS`.

### 🛡️ Safety rails on the money config
- `percentage` encoding verified against the **installed `@sodax/sdk` source** (not the docs, which contradict themselves) — `calculatePercentageFeeAmount = amount * percentage / 10_000n`
- Runtime guard: a malformed/zero address **throws at load** rather than silently burning fees
- Money-gate discipline held — diff reviewed before commit

### 🪟 Public copy
- ReadMe.txt: "THE FEE IS LIVE", 0.1% explained, charity wallet address shown for self-audit
- Status block: `Partner fee → 0.1% LIVE`, `Charity wallet → interim EOA`
- Watermark `build 0.0.5 · Day 8` → `build 0.0.6 · Day 9`

### 🌐 Every network, every token — full multi-VM swap
- Swap.exe rebuilt: the 8 hardcoded presets are gone, replaced by a **chain → token** picker on both From and To sides, plus a ⇅ flip button
- **All 18 SODAX networks are swappable** — not just EVM. The 12 EVM chains (Sonic, Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain, Avalanche, HyperEVM, LightLink, Redbelly, Kaia) **and** the 6 non-EVM ecosystems (Solana, Sui, Injective, ICON, Stellar, NEAR)
- *(Shipped EVM-only first, then expanded to all VMs the same day once the bundled adapters were confirmed — both commits in history.)*
- **Multi-VM wallet layer:** `wallet-config.ts` now mounts every ecosystem slot (Solana, Sui, Injective, ICON, Stellar, NEAR — all adapter libs ship bundled in the SODAX wallet SDK). ConnectButton rebuilt to connect **one wallet per ecosystem**; a cross-VM swap needs both sides connected
- **Per-side account resolution:** SwapCard resolves the source/destination account by each chain's ecosystem (`useXAccount({ xChainType })`), so e.g. Solana→Sonic signs with Phantom and settles to your EVM address
- New `src/lib/swap-tokens.ts` registry (from MCP `sodax_get_swap_tokens`): ~115 tokens across all 18 chains — native gas tokens, USDC/USDT/bnUSD, SODA everywhere, BTC variants, LSTs, Sui staked-SUI family
- Wallet + SDK config expanded 6 → all 12 EVM chains (RPC defaults from `@sodax/sdk` source, env-overridable)
- `/api/swap-events` validation widened to accept non-EVM address formats (base58, Sui `::` type tags, NEAR names, ICON `cx…`) on a safe allowlist; **stops lowercasing** non-EVM addresses (case-sensitive) while still rejecting injection
- Native tokens (`address(0)`) skip the ERC-20 approval step; same-token guard disables nonsense pairs
- Pricing map extended (BNB, AVAX, POL, HYPE, KAIA, WBTC, weETH, wstETH, tBTC, cbBTC, bnUSD…)
- Fee notice corrected: `0% (until Day 9)` / `0.3%` → **`LIVE: 0.1% → charity`**

---

## Day 8 — Mon 2026-05-25 — Charity shortlist poll goes live

### 🎗 5-candidate shortlist seeded
- `prisma/seed.ts` `CHARITIES` array filled with five globally-recognized orgs that already accept crypto, spanning poverty / water / digital rights / health / education:
  - **GiveDirectly** — unconditional cash transfers to people in extreme poverty
  - **charity: water** — clean and safe drinking water projects
  - **Electronic Frontier Foundation** — digital civil liberties & privacy
  - **Doctors Without Borders** — emergency medical care across borders
  - **Khan Academy** — free education for anyone, anywhere
- `pnpm db:seed` run against Supabase — `/charities` now renders all five live
- Idempotent re-run confirmed (upsert by name); the list stays editable as the community thread evolves

### 🔒 Money-gate respected
- Every `payoutTarget` is an **`offramp` placeholder slug** (`*-offramp-tbd`), **not** a real wallet address
- No funds are routable from the shortlist — real on-chain payout addresses get locked in only after winners are chosen, as a single reviewed change

### 🧹 Copy / version sync
- `/charities`: intro copy now reads "poll opened" (live, not upcoming); status bar `Day 6 · pre-seed` → `Day 8 · shortlist live`
- Homepage watermark `build 0.0.4 · Day 6` → `build 0.0.5 · Day 8`
- ReadMe.txt Notepad: status block bumped to Day 8, shortlist checkbox flipped ✅
- Leaderboard status bar `Day 5 · live` → `Day 8 · live`
- Swap.exe points footnote fixed — it still said "persistence + leaderboard activate Day 5" (live since Day 5); now describes the real logging behavior

### 🗳 Vote UI: explored, then pulled
- Built and shipped a `/vote` points-weighted charity-voting UI shell, then **reverted it same-day** — voting happens in Discord, not in the dapp. Net-zero code; commits left in history (build-in-public).

---

## Day 6 — Sat 2026-05-23 — Charities + seed + audits + security hardening

### 🎗 `/charities` page (Day 8 prep)
- Server component reading from `Charity` table via Prisma
- XP window styling, "X candidate(s)" pill, empty state pointing at Monday's poll
- Per-charity card: name, blurb, payout kind, short payout target, optional website
- Wired into desktop icons, taskbar tab (md+), mobile chip nav, leaderboard footer

### 🌱 `prisma/seed.ts`
- Idempotent (`findFirst` → `update` or `create`, no schema migration required)
- `CHARITIES` const at top — Hazy fills 5 entries Monday after community input
- `pnpm db:seed` + Prisma `seed` config + `tsx` runner installed
- Smoke-tested empty: prints "nothing to seed" and exits 0

### 🧪 Functionality audit (5 bugs found + fixed)
1. **Points bug** — `Math.floor(0.99 × 1) = 0` meant sub-dollar swaps earned 0 points but still polluted the leaderboard. Fixed: `Math.floor` → `Math.round` in both server and preview helper.
2. **Leaderboard 500** — `?limit=abc` → `NaN` → Prisma error. Fixed: safe coercion with default 50.
3. **Stale watermark** — page said "Day 5"; bumped to "build 0.0.4 · Day 6".
4. **Stale Notepad ReadMe** — Day 5 checklist; updated to Day 6 state.
5. **Audit data in prod DB** — 3 test rows from earlier curl tests were visible on the public leaderboard. Deleted via one-off Prisma script.

### 🔐 Security audit (deep pass — no wallet-drain vectors)

**Wallet drain surface — clean.** No URL-controlled addresses. `srcAddress`/`dstAddress` always = connected wallet. Solver always `address(0)`. Token addresses hardcoded in `swap-presets.ts`. `partnerFee` not configured (Day 9). pnpm-lock committed, SODAX pkgs pinned exact `2.0.0-rc.1`.

**API hardening — applied:**
- Strict regex on every string field: `srcToken` / `dstToken` must be `0x` + 40 hex; `txHash` must be `0x` + 64 hex; symbols `[A-Za-z0-9._-]{1,32}`; preset id `[A-Za-z0-9._-]{1,64}` (so `<script>` 400s); chain keys `[a-zA-Z0-9._:-]{1,64}`
- `srcAmountRaw` capped at 80 digits
- `srcDecimals` / `dstDecimals` integer in `[0, 36]`
- `content-length > 4096 → 413`
- **Rate limit** on both endpoints (`src/lib/rate-limit.ts`): 30 POSTs/min on `/api/swap-events`, 120 GETs/min on `/api/leaderboard`, per IP, returns 429 with `retry-after`
- **USD value capped at $10M** per swap, **points capped at 10M** per swap — defends against CoinGecko returning nonsense or MITM injection
- Internal error messages no longer echoed; logged server-side, generic response

**Headers:** added via `next.config.ts` → `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (no camera/mic/geo/cohorts), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

**Verified:** no secrets in git (only `.env.example` tracked), no XSS surface (React default escaping + format validation pre-DB), no SQL injection surface (Prisma parameterized), client bundle exposes only `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (intended).

**Deferred (not exploits, just to-do):**
- CSP — wallet SDKs need careful allowlist; tackled Day 13 docs pass
- Rate limiter is in-memory per-instance; swap in Upstash for production-grade
- `SwapEvent.status` never transitions to `confirmed` (would need `useStatus` polling)

### 🔒 Money state — unchanged
- No `partnerFee` · no charity wallet · Day 9 gate sealed

### 📦 Files
- **+5 new** — `src/app/charities/page.tsx`, `prisma/seed.ts`, `src/lib/rate-limit.ts`, plus modifications to two API routes
- **8 modified** — `next.config.ts` (headers), `src/lib/points.ts`, `src/app/api/swap-events/route.ts`, `src/app/api/leaderboard/route.ts`, `src/components/DesktopIcons.tsx`, `src/app/page.tsx`, `src/app/leaderboard/page.tsx`, `package.json`

---


## Day 5 — Fri 2026-05-22 — Live points + leaderboard

### 🗄 Supabase wired in
- Project `swaps-without-borders` provisioned in **Tokyo (`ap-northeast-1`)**
- `DATABASE_URL` (pooled, port 6543) + `DIRECT_URL` (direct, port 5432) set in `.env.local` + Vercel production env
- `pnpm db:push` executed against the live DB → all four tables materialized (`swap_events`, `payout_votes`, `ballots`, `charities` + the two enums)

### 💱 Real USD pricing
- `src/lib/pricing.ts` — CoinGecko `/simple/price` snapshot at swap-submit time
- 60-second in-memory cache; falls back to last cached value on transient errors; final fallback pins stables to $1
- 4-second timeout so a slow CoinGecko never hangs the log

### 🔌 API routes
- **`POST /api/swap-events`** — accepts the swap payload, prices via CoinGecko, awards `floor(usd) × 1` points (community-tunable Day 11), persists as `SwapEvent` (status=`submitted`). Idempotent on duplicate `txHash`. Validates wallet, decimals, raw amount string.
- **`GET /api/leaderboard?limit=N`** — Prisma `groupBy` over `swap_events` summing points + USD + count per wallet. Returns rows + totals. Limit 1–250.

### 🏆 Live leaderboard
- `/leaderboard` page now reads directly from Prisma (server component, force-dynamic)
- Totals strip (wallets · swaps · volume)
- Top-3 gets 🥇🥈🥉 medals
- Hover row highlight (XP-blue)
- "LIVE · reads from Supabase" pill in the menu bar
- Graceful error + empty states stay XP-styled

### 🪝 SwapCard hook
- After `useSwap` confirms, POSTs the swap to `/api/swap-events` fire-and-forget
- Status line on success now shows **"Swap submitted · +N pts logged to leaderboard"** when the log succeeded
- Logging failure never breaks the swap report

### ✅ Smoke-tested
- `pnpm build` clean: 5 routes (`/`, `/_not-found`, `/api/leaderboard`, `/api/swap-events`, `/leaderboard`)
- `curl localhost:3457/api/leaderboard` against the live Supabase returns `{"rows":[],"totals":{...}}` ⇒ connection healthy

### 🔒 Money state — unchanged
- Still no `partnerFee` in `src/lib/sodax.ts`
- Still no charity wallet
- **Day 9 gate sealed**

### 📦 Files
- **+3 new** — `src/lib/pricing.ts`, `src/app/api/swap-events/route.ts`, `src/app/api/leaderboard/route.ts`
- **2 modified** — `src/components/SwapCard.tsx` (onSuccess hook), `src/app/leaderboard/page.tsx` (real data)

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
