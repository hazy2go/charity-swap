# Build Log — Swaps without Borders

> Previously known as *Charity Swap* (working title, Days 1-3). The
> community named it on **Day 4 (Thu 2026-05-21)**: **Swaps without Borders**.

A day-by-day public log of building Swaps without Borders on the
[SODAX SDK V2](https://docs.sodax.com), scaffolded against the
[SODAX Builders MCP](https://builders.sodax.com/mcp).

---

## Day 11 — Thu 2026-05-28 — Vectorheart: the look gets its identity

Day 10 was a break. Day 11 picks up with the UI vote outcome.

When the community was asked what the dapp should *look* like, the winning
answer was **Vectorheart** — the late-90s WipEout / The Designers Republic
aesthetic. Sharp vector shapes. 45° and 60° diagonals. Flat, high-contrast
color. Futuristic mono+display typography. The kind of interface that looks
like a real product with attitude, not another wallet dashboard.

The Windows XP Luna Silver build was a fun temporary skin — kitschy, dense,
loved by the people who got the joke. But it didn't scale to the project's
ambition. Vectorheart does.

### The system

A small, hand-rolled design system replaces the XP CSS:

- **Palette** — ink `#08090B` ground, paper `#EFEAE0` blocks, three hi-vis
  accents (cyan `#00E5FF`, magenta `#FF2E88`, yellow `#FFE600`) plus green
  for live/OK states. No purple gradients. Nothing safe.
- **Type** — Orbitron for display caps (the SWAPS // WITHOUT . BORDERS hero
  is built to be felt across the room), JetBrains Mono for every number and
  technical readout, Barlow Condensed for body. All via `next/font/google`.
- **Motifs** — type plates (`TYPE-WB.01 // SODAX V2`), slash dividers,
  bracket call-outs (`[FROM]`, `[TO]`), corner notches via `clip-path`,
  a halftone dot grid behind everything, a hazard-tape marquee at the bottom
  of the page.

### What changed

Every visible surface. The home page lost the Notepad ReadMe window — it
was charming but it diluted the hero. In its place: a massive headline, a
4-stat block grid (live charity wallet, fee, network count, schedule), a
sys-log panel for the explainer copy, and a marquee ticker.

The swap card kept every line of swap logic but lost every line of XP
chrome. `useQuote`, `useSwapAllowance`, `useSwapApprove`, `useSwap` — all
byte-identical. The visual treatment is new: bracketed FROM/TO labels,
a big cyan input that doubles as the amount field, the magenta TO readout,
and a primary EXECUTE button that's a single sharp cyan slab.

Connect Wallet became a clean dropdown with numbered ecosystem groups
(`[01] EVM`, `[02] Solana`, …). Leaderboard got a typographic title and a
rank-coloured table — gold/cyan/magenta medals replaced the emoji. Charities
got candidate cards numbered `CANDIDATE / 01..05`.

### What stayed the same

This is the important part. The revamp is **paint only**:

- Routes: all 18 SODAX networks still wired exactly as Day 9.
- Fee: `0.1% → 0x95A8…721AD` untouched.
- Data: Prisma schema, leaderboard query, charity seed all untouched.
- API: `/api/swap-events`, `/api/leaderboard` untouched.

A swap submitted under Luna Silver and a swap submitted under Vectorheart
hit the same SDK calls in the same order with the same parameters. The
audit surface didn't move.

### Honest notes

- Lint is back to the pre-existing baseline (2 SDK warnings + 2 pre-existing
  errors in `providers.tsx` and `stub-empty.ts` that were there on Day 9).
  No new lint debt from the revamp.
- Mainnet swap test still pending — the smoke pass was render-only.
- Voting UI/backend bumped to Day 12 (the vote runs in Discord and isn't
  threshold-triggered yet, so there's no urgency).

---

## Day 9 — Tue 2026-05-26 — Build Log #2: the fee is live

This is the day the project stops being a demo. Until now, every swap was
real but free — zero fee, nothing routed anywhere. Today the fee turned on,
and a cross-chain swap through this app moves real money toward charity for
the first time.

### What turned on

One file changed: `src/lib/sodax.ts`. A `PartnerFee` of **0.1%** now sits on
every feature the dapp exposes — swaps, bridge, money market. The SDK deducts
it from the input amount before building the intent and routes it to a wallet
on Sonic. **100% of that fee is charity-bound. No skim, no ops cut** — the
only number between the swapper and the charity is the 0.1% itself.

### The address, and the honesty about it

    0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD

That's the charity wallet, on Sonic. Watch it on sonicscan and you'll see
exactly one kind of inflow (fees) and, eventually, one kind of outflow
(payouts). Nothing else touches it.

It is **not a multisig** — not yet. It's a single dedicated wallet, and we're
saying so out loud rather than implying more decentralization than exists. The
multisig was the original Day 9 plan; deploying a Safe with real signers is its
own ceremony, and we'd rather ship the fee live today behind an honest interim
wallet than stall the whole thing. Migrating is a one-line change to the
recipient address plus a public re-announce. That's the whole cost of the
upgrade, and it's logged here so nobody can claim it was hidden.

### The bug that didn't happen

The SODAX docs contradict themselves on how the fee percentage is encoded — most
pages say basis points (`100 = 1%`), one says `0.1` means 10%. On a money
config, a 100× misread is the difference between a 0.1% fee and a 10% fee. So
instead of trusting the docs, I read the installed SDK source:

    calculatePercentageFeeAmount(amount, percentage) =
        amount * BigInt(percentage) / 10_000n   // FEE_PERCENTAGE_SCALE

Basis points, unambiguously. `0.1%` is `percentage: 10`. (And `percentage: 0.1`
would have thrown outright — `BigInt(0.1)` is a runtime error — which is its own
small mercy.) There's now a runtime guard too: a malformed or zero recipient
address throws at load instead of silently burning every fee.

### How it shipped

Diff reviewed before commit, per the rule we've held since Day 1: anything that
moves money is a gate. Hazy provided the address, the rate, and the go. The fee
is live on mainnet from this commit forward.

### Next

The wallet starts filling now, one swap at a time. The community sets the payout
threshold and vote duration on Day 11; when the balance crosses that threshold,
the first charity payout vote opens — in Discord, where the community already
is.

---

## Day 8 — Mon 2026-05-25 — the charity shortlist goes live

Week 2 opens with the part that gives this whole thing its name: the charities.

The `Charity` table and the `/charities` page have been sitting there since
Day 6, empty, waiting on this. Today they got filled. Five candidates, chosen
to be globally recognizable, to already accept crypto, and to fit the *without
borders* theme — so the spread covers poverty, water, digital rights, health,
and education rather than five flavors of the same cause:

- **GiveDirectly** — unconditional cash transfers to people in extreme poverty
- **charity: water** — clean and safe drinking water projects
- **Electronic Frontier Foundation** — digital civil liberties and privacy
- **Doctors Without Borders** — emergency medical care, across borders
- **Khan Academy** — free education for anyone, anywhere

`pnpm db:seed` pushed them into Supabase; the seed is idempotent (it upserts by
name), so the list stays editable as the community thread runs. Refresh
`/charities` and all five are there now.

### The one line that matters for safety

These are *ballot candidates*, not payout destinations — not yet. Every
`payoutTarget` is a placeholder slug (`givedirectly-offramp-tbd`, etc.), kind
`offramp`, deliberately **not** a real wallet address. Nothing on this page can
route a cent. The real on-chain addresses get locked in only after the
community picks winners, and that lands as one reviewed diff — same discipline
as the fee switch.

That's the rule for the whole second week: anything that can move money is a
gate, shown as a diff, confirmed before it ships. Seeding a ballot isn't that.
Wiring a real address is.

### A detour, for the record

Mid-day I built a `/vote` page — a points-weighted charity-voting UI shell,
XP-styled, with a demo points budget and per-charity allocation bars — pulling
Day 10's work forward. Then it got pulled: the vote runs in Discord, not in the
dapp. The dapp's job is the swap and the transparent leaderboard; the vote is a
community ritual that lives where the community already is. Net-zero code, but
the commits stay in history — that's what building in public means.

### And then we opened the doors: every network, every token

The fee going live was the headline, but the same day the swap itself grew up.
Until now it shipped with eight hand-picked preset pairs — enough to demo, not
enough to use. That's gone. Swap.exe now has a proper **chain → token** picker
on both sides, with a flip button between them.

Every network SODAX supports is now in the dropdown — all eighteen, and all of
them swappable. The twelve EVM chains (Sonic, Ethereum, Arbitrum, Base,
Optimism, Polygon, BNB Chain, Avalanche, HyperEVM, LightLink, Redbelly, Kaia)
and the six non-EVM ones (Solana, Sui, Injective, ICON, Stellar, NEAR).

I'll be honest about how this landed, because building in public means showing
the turns: I first shipped it EVM-only and greyed out the non-EVM chains,
figuring the other ecosystems were a big lift. Then I actually looked — and
every adapter (Solana's wallet-adapter, Mysten's dapp-kit for Sui, the Injective
stack, Stellar, NEAR, ICON) already ships *bundled* inside the SODAX wallet SDK.
Nothing to install. So the same day, I lit them all up.

What that took: mounting every ecosystem's provider in the wallet config (the
scary part — six more wallet stacks mounting alongside EVM, on an app that's
already had one SSR crash; it booted clean), rebuilding the connect menu to
connect **one wallet per ecosystem**, and teaching the swap to resolve the
source and destination accounts by *their own* ecosystem. A Solana→Sonic swap
now signs with Phantom on the source and settles to your EVM address on the
destination — both wallets connected, the SDK handles the bridge between them.

The token registry — about 115 tokens across all 18 chains — comes straight from
the SODAX Builders MCP (`sodax_get_swap_tokens`); per-chain RPC defaults were
lifted from the SDK's own source rather than guessed. The points API even
learned to stop lowercasing non-EVM addresses, because base58 and Sui type tags
are case-sensitive and folding them corrupts the address.

This is the difference between a demo and something you'd actually route money
through — every chain SODAX reaches, every route paying the charity fee.

**One honest caveat:** the EVM paths I can stand behind; the non-EVM swap flows
are wired to the SDK but I can't connect a Phantom or Sui wallet in this build
environment to test them end-to-end. They build, they render, the addresses
validate — but the first real Solana or Sui swap is the true test.

### Next

The wallet fills from here. Day 11 the community sets the payout threshold and
vote duration; when the balance crosses it, the first charity payout vote opens
in Discord. The multisig migration (off the interim single-key wallet) is still
on the board — a one-line change when the signers are ready.

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

## Day 6 — Sat 2026-05-23 — Charity page + seed scaffold + Week 1 recap + audit

**Status:** lightweight Saturday by design. No bugs reported from stage #1 — straight to Week 2 prep, plus a full functionality + bug-fix audit so we go into Tuesday's money-flip with a clean baseline.

### What shipped

- **`/charities` page** — server component reading from the `Charity` table. XP window styling. Empty state pointing at Monday's poll. Wired into desktop icons + taskbar task + mobile chip nav.
- **`prisma/seed.ts`** — idempotent seed script (`findFirst` → `update` or `create`) reading from a `CHARITIES` const at the top. Empty until Monday's community thread closes; then drop in 5 entries, run `pnpm db:seed`, page populates.
- **`pnpm db:seed`** + Prisma `seed` config + `tsx` runner installed
- **Week 1 recap** (above) — long-form public-facing narrative for Discord/X
- **Functionality + bug audit** — see below

### Audit pass

Smoke-tested every route, every API endpoint, every error path. Five bugs found and fixed in the same commit.

#### Routes

| Route | Method | Result |
|---|---|---|
| `/` | GET | 200 ✅ |
| `/leaderboard` | GET | 200 ✅ |
| `/charities` | GET | 200 ✅ |
| `/api/leaderboard` | GET | 200 ✅ |
| `/api/swap-events` | GET | 405 (POST-only) ✅ |
| `/nonexistent` | GET | 404 ✅ |

#### API validation paths

| Case | Expected | Got |
|---|---|---|
| `POST` with missing wallet | 400 `wallet must be a 0x address` | ✅ |
| `POST` with wallet `"nope"` | 400 same | ✅ |
| `POST` with `srcAmountRaw: "1.5"` (non-integer) | 400 `srcAmountRaw must be a decimal string` | ✅ |
| `POST` with empty body | 400 `invalid json` | ✅ |
| `POST` happy path (1 USDC) | 200 + row created | ✅ |
| `POST` same `txHash` again | 200 `{idempotent:true}` | ✅ |
| `POST` unknown token symbol | 200, `usdValue:null`, `pointsAwarded:0` | ✅ |

#### Bugs found & fixed

| # | Bug | Severity | Fix |
|---|---|---|---|
| 1 | `Math.floor(0.99 × 1) = 0` — anyone swapping under $1 earned 0 points but still appeared on the leaderboard | High (silent UX failure) | `Math.floor` → `Math.round` in both `src/lib/points.ts` (preview) and `src/app/api/swap-events/route.ts` (server) so the preview matches what's logged |
| 2 | `GET /api/leaderboard?limit=abc` returned 500 — `Number("abc") = NaN` propagated to Prisma | Medium (exposed 500) | Coerce safely: `Number.isFinite(n) && n > 0 ? n : 50` |
| 3 | Page watermark stale at "build 0.0.3 · Day 5" | Cosmetic | Bumped to "build 0.0.4 · Day 6" |
| 4 | Notepad ReadMe content stale at Day 5 status | Cosmetic | Day 6 headline + updated checklist (Week 1 done, audit done, charities scaffold listed) |
| 5 | Three audit rows from earlier testing visible on the public leaderboard (`0xDEAD` wallet, 3 swaps, $100, 99 pts) | High (public data integrity) | Deleted via one-off Prisma script; leaderboard back to empty |

#### Known incomplete (deferred, not bugs)

- `SwapEvent.status` is always written as `submitted`; we never transition to `confirmed` because the `useSwap` resolution fires on solver acceptance, not final settlement. Wiring `useStatus` polling to flip the row is a Day 12 polish.
- `/leaderboard` currently shows all swaps, not just `confirmed` ones. Same root cause.
- CoinGecko free tier has a soft rate limit (~30 req/min). Our 60s cache means one fetch per token per minute, which is well under the limit, but a viral spike could 429. Acceptable for current scale.

### Security audit

Followed the functionality audit with a deep security pass. The shipping concern is twofold: people execute real on-chain swaps through this UI, and we have a public write endpoint feeding a public leaderboard. Two attack surfaces, audited separately.

#### Surface 1 — wallet drain

The thing we care about most. Can anyone craft a link, a referrer, or a UI state that tricks a user into approving the wrong contract, sending tokens to the wrong address, or signing the wrong intent?

**Findings: no holes in our code.**

- `intentParams.srcAddress` and `intentParams.dstAddress` are always `account.address` (the connected wallet). Never URL-controlled, never query-parametrized, never user-typed.
- `intentParams.solver` is always `address(0)` ("any solver"). No malicious solver targeting.
- `inputToken` / `outputToken` come from `SWAP_PRESETS` — hardcoded in `src/lib/swap-presets.ts`, sourced from the SODAX SDK's bundled token registry. No URL override path.
- `partnerFee` is **not configured**. Nothing routes to anywhere.
- `useSwapApprove` calls into the SDK's own approval function — the spender is SODAX's swap router address, set by the SDK, not by us.
- `pnpm-lock.yaml` is committed. `@sodax/*` packages pinned to exact `2.0.0-rc.1` (no caret). Supply-chain ✅.

**Trust boundary:** we trust `@sodax/sdk` and `@sodax/dapp-kit` to direct approvals + intents to the right contracts. That's the right trust boundary — it's the SDK's job, and they own the addresses. Day 9 partner-fee config will introduce one new piece of trusted state (`PartnerFee.address`); when that lands, the charity multisig address goes into a single line of code that's reviewed in chat before commit, per the money-gates rule.

**Deferred verification:** the exact approval scope (`MaxUint256` vs exact amount) lives inside `sodax.swaps.approve()`. If it's `MaxUint256`, anyone using the dapp grants the SODAX router unbounded allowance on the input token. That's standard DEX behavior but worth confirming with the SODAX team for the Day 9 announcement. Not a vuln in our code either way.

#### Surface 2 — public write API (`POST /api/swap-events`)

The endpoint is unauthenticated by design (you don't need an account to log a swap; the wallet is the identity). So everything goes through validation + caps instead.

| Hardening | Before | After |
|---|---|---|
| Wallet format | basic `^0x{40}` regex | same |
| Token addresses | accepted any string | strict `^0x[a-fA-F0-9]{40}$` |
| Chain keys | accepted any non-empty string | `^[a-zA-Z0-9._:-]{1,64}$` |
| Symbols | accepted any non-empty string | `^[A-Za-z0-9._-]{1,32}$` |
| Preset id | accepted any non-empty string | `^[A-Za-z0-9._-]{1,64}$` (so `<script>` 400s) |
| Amount strings | `\d+` no length cap | `^\d{1,80}$` |
| Decimals | `typeof === 'number'` | integer in `[0, 36]` |
| txHash | accepted any non-empty string | `^0x[a-fA-F0-9]{64}$` |
| Body size | unbounded | `content-length > 4096 → 413` |
| Rate limit | none | 30 POSTs / 60s per IP, 429 with `retry-after` |
| USD cap | none | $10M per swap (defends against pricing-oracle poisoning) |
| Points cap | none | 10,000,000 per swap |
| 500 detail | full error message echoed | logged server-side, generic `{error:"write failed"}` returned |

Same treatment on `GET /api/leaderboard`: 120 reads/min per IP, generic error responses, `?limit` already coerced safely from the functionality pass.

#### Other vectors

- **XSS:** every user-derived field rendered to the leaderboard goes through React's default escaping (text children, no `dangerouslySetInnerHTML` on DB fields). Wallets are lowercased + format-validated before insert. No XSS surface.
- **SQL injection:** Prisma queries are parameterized end-to-end. No raw SQL anywhere in the codebase.
- **CSRF:** the POST is intentionally unauthenticated, so CSRF is moot — there's no user session to ride on.
- **Secrets in git:** verified — only `.env.example` is tracked. `.env` and `.env.local` are ignored. `grep` across tracked files: zero password leaks.
- **Client bundle:** only `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is exposed, which is expected (it's a public client identifier, not a credential).
- **Security headers:** added via `next.config.ts` → `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic/geo/cohorts, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **CSP:** intentionally deferred. Wallet SDKs fetch from many RPC origins and contain bundled `eval`-style code; a wrong CSP silently breaks connect/sign. Adding a permissive but real CSP is on the Day 13 docs-pass list.

#### Known limitations (deferred, not exploits)

- Rate limit is in-memory per-instance — survives within one Vercel function instance, doesn't survive cold starts or share state across instances. Good for spam, not a serious DDoS defense. Upstash Redis swap-in is one file (`src/lib/rate-limit.ts`).
- `SwapEvent.status` always written as `submitted` — we never poll back to `confirmed`. A failed-to-settle swap counts toward the leaderboard. Fix is `useStatus` polling, Day 12 polish.
- Database password was shared in chat during Day 5 wiring. Rotation reminder is in `project_status.md` memory.

#### Cleanup

All 25 audit rows generated during this pass have been deleted from Supabase. Public leaderboard is back to empty totals.

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
