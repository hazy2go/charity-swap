# Build Log — Swaps without Borders

> Previously known as *Charity Swap* (working title, Days 1-3). The
> community named it on **Day 4 (Thu 2026-05-21)**: **Swaps without Borders**.

A day-by-day public log of building Swaps without Borders on the
[SODAX SDK V2](https://docs.sodax.com), scaffolded against the
[SODAX Builders MCP](https://builders.sodax.com/mcp).

---

## Week 1 recap — Sat 2026-05-23 — five days in

Halfway through the build. The first week is done. Here's where we landed.

### What we set out to do

A cross-chain swap app where **100% of the fees go to charity** — picked by
the community, voted on, paid out from a wallet anyone can audit. Two
weeks. One person. Built in public on the **SODAX SDK V2**, scaffolded
against the **[SODAX Builders MCP](https://builders.sodax.com/mcp)**.

### What's actually live, five days in

- 🌐 **Public dapp:** https://charity-swap-hasantoprak28-4555s-projects.vercel.app
- 🏆 **Live leaderboard** reading from Supabase — `/leaderboard`
- 🎗 **Charities shortlist page** (empty until Monday's poll closes) — `/charities`
- 💱 **8 swap presets**, default ★ Arbitrum USDC → Sonic SODA
- 💎 **Points awarded** on every confirmed swap, USD value snapshotted via CoinGecko at submit time
- 🪟 The whole thing in **Windows XP Luna Silver chrome** because why not

### What we promised but haven't done yet

We're holding the line on these — they're the Week 2 milestones, not late deliverables:

- ❌ **Partner fee** — still 0%. Turns on **Tuesday (Day 9)**.
- ❌ **Charity multisig** — not deployed. Public address comes Tuesday with the fee.
- ❌ **Charity shortlist** — Monday's community thread → 5 candidates seeded → page populates
- ❌ **Payout vote** — schema's ready (`PayoutVote`, `Ballot` tables exist), UI lands Day 10, backend Day 11

### What we built, day by day

| Day | Public | Code |
|---|---|---|
| 1 (Mon) | Announcement | — |
| 2 (Tue) | Name vote opens | Skeleton swap working locally |
| 3 (Wed) | **Build Log #1** | Working EVM connect + real `useSwap` + XP UI |
| 4 (Thu) | Name vote closes → **Swaps without Borders** | Prisma + Supabase schema, points preview, `/leaderboard` route |
| 5 (Fri) | **Discord stage #1** | Supabase live, CoinGecko pricing, `POST /api/swap-events`, `GET /api/leaderboard`, useSwap hook |

### The line we keep saying out loud

> "If you're evaluating SODAX as a build target — install the Builders MCP. Point your AI agent at it. Be writing cross-chain code in ten minutes."

This whole project is the receipt. Five afternoons. One person. The MCP gave my agent live SDK docs + live chain config + the partner-fee primitives. I never tabbed-hopped to a docs site. **That is the actual unlock.**

### Numbers

- **Routes:** 5 (`/`, `/leaderboard`, `/charities`, `/api/swap-events`, `/api/leaderboard`)
- **Lines of code (`src/` + `prisma/`):** ~700 (up from ~330 on Day 3)
- **Commits this week:** ~15
- **External deps added:** `@sodax/sdk`, `@sodax/dapp-kit`, `@sodax/wallet-sdk-react`, `@tanstack/react-query`, `viem`, `prisma`, `@prisma/client`, `tsx`
- **`partnerFee` config touched:** 0 ← important
- **Charity wallet addresses written anywhere:** 0 ← important
- **Real money routed to charity:** 0 ← honest

### Week 2 calendar

| Day | Date | What lands |
|---|---|---|
| 7 (Sun) | 2026-05-24 | Rest |
| 8 (Mon) | 2026-05-25 | Charity shortlist poll → 5 candidates seeded |
| **9 (Tue)** | **2026-05-26** | **🚨 Partner fee turns ON · charity multisig deployed on Sonic · public address announced** |
| 10 (Wed) | 2026-05-27 | 3 winning charities locked, voting UI shell |
| 11 (Thu) | 2026-05-28 | Threshold + duration polls, voting backend |
| 12 (Fri) | 2026-05-29 | **Discord stage #2** — v1 demo with real fees flowing |
| 13 (Sat) | 2026-05-30 | Docs + bug triage |
| 14 (Sun) | 2026-05-31 | Internal review |

### Want to help?

- ⭐ **Star the repo** — [github.com/hazy2go/swaps-without-borders](https://github.com/hazy2go/swaps-without-borders)
- 🗳 **Suggest a charity** in the Discord thread (opens Monday)
- 💱 **Try a swap** — even $1. Your wallet shows up on the leaderboard.
- 🛠 **Build your own SODAX project** — use the [Builders MCP](https://builders.sodax.com/mcp)

### And the same disclaimer as every day

The fee is currently **zero**. Nothing routes to charity yet. Tuesday flips it. Until Tuesday, everything in this app is plumbing.

---

## Day 6 — Sat 2026-05-23 — Charity page + seed scaffold + Week 1 recap

**Status:** lightweight Saturday by design. No bugs reported from stage #1 — straight to Week 2 prep.

### What shipped

- **`/charities` page** — server component reading from the `Charity` table. XP window styling. Empty state pointing at Monday's poll. Wired into desktop icons + taskbar task + mobile chip nav.
- **`prisma/seed.ts`** — idempotent seed script (`findFirst` → `update` or `create`) reading from a `CHARITIES` const at the top. Empty until Monday's community thread closes; then drop in 5 entries, run `pnpm db:seed`, page populates.
- **`pnpm db:seed`** + Prisma `seed` config + `tsx` runner installed
- **Week 1 recap** (above) — long-form public-facing narrative for Discord/X

### Money state — unchanged

- Still no `partnerFee` in `src/lib/sodax.ts`
- Still no charity wallet
- Day 9 gate sealed

---

## Day 4 — Thu 2026-05-21 — Name decided · points ledger · leaderboard route

**Status:** the name vote closed. The community picked **Swaps without Borders.**
Today landed two of the four Day 4 milestones from the roadmap plus two
stretch items that set up Day 5 in advance. No money-state changed — the
partner fee is still 0% and there is still no charity wallet (Day 9 stays sealed).

### What shipped

| Area | What landed today |
|---|---|
| **Name** | **Swaps without Borders.** Repo renamed (`hazy2go/charity-swap` → `hazy2go/swaps-without-borders`, GitHub auto-301s the old URL), `package.json` slug, window titles, README, BUILD-LOG, watermark, all internal copy |
| **Points-ledger schema (Day 4 milestone)** | `prisma/schema.prisma` with `SwapEvent`, `PayoutVote`, `Ballot`, `Charity` models plus enums. Bigints stored as decimal strings (no JS number loss). USD value stored alongside the row (audit trail). Indexes on `wallet`, `createdAt`, `(status, createdAt)`. Prisma 6 to avoid v7's new config layout. Postgres + Supabase pooled connection (`DATABASE_URL`) + direct connection for migrations (`DIRECT_URL`) |
| **Prisma client singleton** | `src/lib/db.ts` — globalThis-cached client to survive hot-reload and avoid pooler exhaustion in prod |
| **Points preview in SwapCard** | New "Charity rewards" GroupBox. Live `+X pts` display as the amount changes. USD estimate, formula explainer ("1 pt / $1 — Day 11 vote"), explicit "preview only" footer pointing at the committed schema |
| **`/leaderboard` route** | Real route with an XP-styled empty state. Sortable-looking table header, big empty placeholder, "activates Day 5" copy, two action buttons (Back / View schema). Wired into desktop icons + taskbar task + mobile chip nav |
| **Fee-timing notice** | Inline pill on the SwapCard: "Today: 0% fee — From Day 9 (Tue 2026-05-26) a 0.3% charity fee accrues to a public multisig on Sonic." Pure copy. The actual fee config doesn't flip until Day 9 |

### Roadmap discipline

The handover document said Day 4 = "Name vote closes · points-system poll opens · code: design points ledger schema". I shipped the schema (the code milestone) and the rename (the public milestone). Everything else today is **ahead-of-schedule prep**, not borrowed-from-later:

- ✅ Points preview UI is Day 5 polish, brought forward as a no-cost UI hook.
- ✅ `/leaderboard` route as empty-state shell is the same — Day 5 lights it up.
- ❌ Did **not** touch the partner fee. (Day 9 gate.)
- ❌ Did **not** deploy or write any charity-related state on-chain. (Day 9 gate.)
- ❌ Did **not** seed any charity rows yet. (Day 8 milestone.)

### Numbers

- **Files added:** 5 (`prisma/schema.prisma`, `src/lib/db.ts`, `src/lib/points.ts`, `src/app/leaderboard/page.tsx`, this build log update)
- **Files modified:** 9 (rename pass + SwapCard + DesktopIcons + page + .env.example + package.json + README)
- **New routes:** 1 (`/leaderboard`)
- **Lines of code (src/ + prisma/):** ~480 (up from ~330 on Day 3)
- **Money-touching changes:** 0
- **Database queries executed against production:** 0 (Supabase not provisioned yet — Hazy adds the URL when ready, schema is staged)

### Try it

- 🌐 **Live:** https://charity-swap-hasantoprak28-4555s-projects.vercel.app
- 🏆 **Leaderboard:** https://charity-swap-hasantoprak28-4555s-projects.vercel.app/leaderboard
- 💻 **Repo:** https://github.com/hazy2go/swaps-without-borders
- 🛠️ **Schema:** [`prisma/schema.prisma`](https://github.com/hazy2go/swaps-without-borders/blob/main/prisma/schema.prisma)
- 🛠️ **MCP we built against:** https://builders.sodax.com/mcp

### What's next (Day 5)

- Provision Supabase project, drop `DATABASE_URL` + `DIRECT_URL` into Vercel env
- `prisma db push` to materialize the schema
- `POST /api/swap-events` endpoint — wired to the `useSwap` `onSuccess` hook
- `GET /api/leaderboard?limit=N` reading from `SwapEvent`
- Replace the empty state on `/leaderboard` with the real data
- Discord stage #1 — live swap with points incrementing on the leaderboard in real time

---

## Day 3 — Wed 2026-05-20 — Scaffold + first working swap

**Status:** scaffold landed, EVM connect working, real `useSwap` path
executing on mainnet. Partner fee intentionally not yet enabled (lands Day 9).

### What shipped

| Area | What works | What's stubbed |
|---|---|---|
| **Wallet** | EVM connect (Hana, MetaMask, Rabby, any EIP-6963 wallet) via `@sodax/wallet-sdk-react` | WalletConnect needs a project ID; non-EVM chains land later |
| **Swap** | Live quotes (`useQuote`), allowance + approve (`useSwapAllowance` / `useSwapApprove`), real execution (`useSwap`) | Slippage hardcoded to 0.5%; community-tunable Day 11 |
| **Pairs** | 3 curated USDC/USDT pairs across BSC ↔ Arbitrum ↔ Base | Token picker lands Day 4-5 |
| **Fees** | **Off.** Partner fee is intentionally not wired into the `Sodax` config | Enabled Day 9 with the multisig deploy |
| **Build** | Production build green (webpack-pinned) | Turbopack incompatibility documented |

### The "scaffolded in an afternoon" claim

I used **[https://builders.sodax.com/mcp](https://builders.sodax.com/mcp)**
end-to-end. The MCP exposed:

- The exact `SodaxProvider` + `SodaxWalletProvider` + `QueryClientProvider`
  nesting and why (config is frozen on first mount — must be one stable
  reference)
- `useQuote` / `useSwap` / `useSwapAllowance` / `useSwapApprove` shapes,
  including the *nested* `params.payload` pattern that's easy to get wrong
- `CreateIntentParams` field-by-field — including the `srcChainKey` vs
  `srcChain` distinction (request-side vs read-side)
- Token addresses + decimals for the three preset pairs
- `ChainKeys` constants for every supported network
- The `getPartnerFee()` preview API (which I'll wire on Day 9)

No tab-hopping to docs. No "let me check the SDK source." One MCP. One
afternoon. **This is the actual pitch to anyone evaluating SODAX as a
build target — start with the MCP.**

### Decisions on the way

| Choice | What I picked | Why |
|---|---|---|
| Bundler | **webpack** over Turbopack | `@injectivelabs/wallet-ledger` ships an inline UMD crypto-js whose AMD branch contains `require('./sha256')` — Turbopack fails to statically resolve, webpack accepts an `IgnorePlugin` shim. Documented in `next.config.ts`. |
| DB | **Prisma + Supabase** | Picked Prisma's batteries-included DX over Drizzle for a 2-week sprint. Lands Day 4 with the points ledger. |
| Wallet scope | **EVM-only at launch** | Six EVM chains cover Sonic + the major hubs. Adding chains is one config block per chain — lands later if the community asks. |
| Swap UX | **3 preset pairs**, not a token picker | Build Log #1 needs a working screenshot today, not a half-done token list. Token picker is Day 4-5 work. |
| Slippage | **Hardcoded 0.5%** | Same reason. Community-tunable as part of the Day 11 voting parameter pass. |
| Naming | **"Charity Swap"** placeholder | Real name decided by the community vote that closes Day 4. Repo will rename then. |

### Money-touching state

This is the part the community is asked to trust, so I'm explicit:

- ✅ The `Sodax` instance in `src/lib/sodax.ts` **has no `partnerFee`
  configured.** Every swap executed today is a normal SODAX intent swap
  with zero charity routing.
- ✅ There is **no charity wallet address** anywhere in the code or env
  yet. The Day 9 multisig deploy is its own commit, its own announcement,
  its own audit trail.
- ✅ When the partner fee turns on, it will be in a single, reviewable
  diff. Everyone will know exactly when zero became 0.3%.

### Numbers

- **Lines of code (src/):** ~330
- **Files (src/):** 9
- **Commits today:** 2 (scaffold + build-log)
- **Time from `pnpm create next-app` to working swap:** one afternoon
- **SDK docs read manually outside the MCP:** zero

### What's next (Day 4)

- Points-ledger schema (Prisma + Supabase): one row per swap event,
  user address, src/dst chain, USD-equivalent volume, points awarded,
  timestamp
- USD-equivalent pricing helper (CoinGecko at swap-submit time, rate
  stored alongside the swap)
- Wire `getPartnerFee()` preview into the UI as a "0% today, 0.3% from Day 9"
  affordance, so the community can see exactly what's coming

### Try it

- 🌐 **Live:** https://charity-swap-hasantoprak28-4555s-projects.vercel.app
- 💻 **Repo:** https://github.com/hazy2go/swaps-without-borders
- 🛠️ **MCP we built against:** https://builders.sodax.com/mcp

---

<sub>Build Log #2 lands Day 9 — the day the charity multisig goes live on Sonic.</sub>
