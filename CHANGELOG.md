# Changelog — Swaps without Borders

Punchy day-by-day patch notes. For the narrative version with rationale,
see [BUILD-LOG.md](BUILD-LOG.md).

---

## Day 12 — Fri 2026-05-29 — Full audit pass + points integrity

Full audit of the whole app (functionality, dead code, placeholders, SDK
correctness). All SDK usage verified against rc.8 and exercised live: every
quote route resolves on the real solver — incl. both Bitcoin directions and
cross-VM — and the partner fee-accrual read works. No money-routing bugs.

### Audit fixes
- **Points were credited before on-chain success** — see "Points integrity" below.
- `SwapCard.tsx` — slippage restore moved out of `useMemo` (a render-time side
  effect that broke SSR) into a proper mount effect.
- Network count corrected **18 → 19** everywhere (Bitcoin was uncounted):
  home stat, About copy, `swap-tokens.ts`.
- Stale "Day 11" hero eyebrow → evergreen "Live".
- "confirmed swap" copy fixed where it actually meant "submitted".
- Dead code removed: `src/lib/stub-empty.ts` (referenced nowhere) and the
  superseded `PayoutVote` / `Ballot` Prisma models.
- Cleared all unused-var lint warnings + two pre-existing lint errors.

### Points integrity (new)
- **Points now count only for solver-confirmed swaps.** Leaderboard (page +
  API) and vote-weight all filter on `status = "confirmed"`; submitted-but-
  unconfirmed and failed intents earn nothing.
- **`POST /api/swap-events/confirm`** — server-side reconciliation. The server
  independently asks the solver (`sodax.swaps.getStatus`) whether the intent
  executed (`SOLVED`→confirmed, `FAILED`→failed). The client cannot self-confirm
  — this is the anti-farm trust boundary.
- `SwapCard.tsx` logs all candidate hashes (`dstTxHash` / `txHash` /
  `intentHash`) and polls confirm in the background; status card shows
  "pending confirmation…" → "+N pts credited" / "failed on-chain".
- New `sodax-server.ts` — shared server Sodax singleton + `verifySwapStatus`
  (tries every candidate hash, since the solver keys off the hub tx; for
  Sonic-destination swaps that's `dstTxHash`).
- `swap_events` schema: added `dstTxHash` + `intentHash` (both `@unique`,
  blocking hash replay).

### Admin nonce replay guard (new)
- New `UsedNonce` table. `/api/rounds` (open) and `/api/rounds/close` now burn
  the signed nonce on use — a captured admin signature can't be replayed
  (`409 nonce already used`).

### DB
- `pnpm db:push` applied: adds `dstTxHash`/`intentHash`/`used_nonces`, drops the
  dead `payout_votes`/`ballots` tables (were empty).

### Swap UX — wallet balance + Max
- The From section now shows the **connected wallet's balance** of the selected
  source token (e.g. Polygon USDC) via `useXBalances` + `useXService`, with a
  **Max** button that fills the amount with the full balance.
- Skipped for Bitcoin (its Radfi trading wallet has a separate balance flow).
- Live-refetches on the SDK's interval; reads keyed by token address.
- **Max on a native token leaves a small gas reserve** (0.003 ETH on Ethereum,
  0.001 elsewhere) so the swap tx can still pay gas; ERC-20 reserves nothing.

### Fee claim (admin page)
- New `FeeClaimCard` on `/vote/admin` — the partner fee-claim flow, wired to the
  rc.8 `sodax.partners.feeClaim` lifecycle.
- **Gated to the charity wallet**, not the admin wallet: fees are owned by the
  charity EOA on the Sonic hub, so only it can sign the claim. The card refuses
  to act for any other connected wallet.
- Flow: read accrued basket (`useFetchAssetsBalances`) → one-time
  `useSetSwapPreference` (output = **USDC on Sonic**, back to the charity wallet)
  → per token `isTokenApproved`/`useApproveToken` then `useFeeClaimSwap`. A
  "Claim all → USDC" button loops the basket with a live progress log.
- Read path verified against the live hub (balances / preferences / approval
  state all resolve); signing requires the charity key, untested headlessly.

### RPC fix
- Swept all 12 default EVM RPCs — **Polygon's `polygon-rpc.com` now 401s**
  (gated behind a key), which would break Polygon balances + swaps. Swapped the
  default to `polygon-bor-rpc.publicnode.com` (open, verified) in both
  `sodax.ts` and `wallet-config.ts`. Still overridable via
  `NEXT_PUBLIC_POLYGON_RPC_URL`. The other 11 RPCs are healthy.

### Mobile nav fix
- Top bar was cramming the full 5-item inline nav next to the brand + Connect
  button on phones, so the links collided/scrolled into each other.
- `TopBar` is now a client component: **inline nav is desktop-only (≥768px)**;
  on mobile it collapses to an animated hamburger that opens a Vectorheart drop-
  sheet (stacked links, numbered, cyan active rail, magenta arrows, staggered
  reveal, scrim + Escape + scroll-lock to dismiss).

### Known follow-up
- A sophisticated attacker reusing a *stranger's* real `SOLVED` hash with a
  forged amount is still possible; fully closing it needs amount-binding via
  `getIntent`. Unique hash constraints reduce but don't eliminate it.

---

## Day 11 — Thu 2026-05-28 (BTC) — SDK rc.8 + Bitcoin via Radfi

Boss feedback: bump to latest SDK (rc.8) and wire native BTC via the
Radfi 2-of-2 multisig trading wallet integration. Done.

### SDK
- All 4 @sodax packages bumped: `2.0.0-rc.1` → **`2.0.0-rc.8`**
- Type-clean against the new minor (no API breakages in our usage)

### Bitcoin (via Radfi)
- `wallet-config.ts` — added `BITCOIN: {}` slot (production defaults baked in; no API key needed)
- `swap-tokens.ts` — added Bitcoin chain + native BTC token (`0xeB0393…58b`, 8 decimals)
- `swap-tokens.ts` — `ChainType` union extended with `"BITCOIN"`
- `ConnectButton.tsx` — Bitcoin added to ECOSYSTEMS (Unisat/Xverse/OKX connectors auto-mount)
- **`SwapCard.tsx`** — full Radfi readiness gate:
  - `useRadfiSession(btcWalletProvider)` for sign-in + trading-wallet provisioning
  - `useTradingWalletBalance` + `useExpiredUtxos` for source-side readiness checks
  - `useFundTradingWallet` for the one-time on-chain BTC top-up
  - **Bitcoin-aware intent params** per the docs:
    - `dstAddress` swapped to the Radfi trading address when destination is BTC
    - `minOutputAmount` clamped to ≥ 546 sats (dust limit) when destination is BTC
    - `srcAddress` stays as the personal wallet (SDK derives trading internally)
  - **No approve step** when source is BTC (UTXO model — `useSwapAllowance` + `needsApprove` short-circuit)
  - **Action button dispatch** — if BTC involved, button progresses through: Sign in → Fund trading wallet → Engage swap. Each state has its own label + readiness banner.
- `pricing.ts` — native `BTC` symbol mapped to CoinGecko `bitcoin` (was previously only the wrapped variants)

### ⚠️ Hazy must do before Bitcoin works in production
- The Radfi API only accepts requests from **whitelisted origins**:
  - **Local dev:** run `pnpm dev --port 1993` (Radfi only accepts `http://localhost:1993`)
  - **Production:** submit your Vercel domain (`charity-swap-hasantoprak28-4555s-projects.vercel.app` or any custom domain) to the SODAX team for whitelisting. Until whitelisted, BTC features will show Radfi errors.

---

## Day 11 — Thu 2026-05-28 (final) — full SDK catalog parity · every token earns points

End-of-day SDK audit caught 13 missing tokens we hadn't added since Day 9,
plus a stale price map that wasn't keeping up with the wrapped/synthetic
families. Fixed both — now the dapp has parity with the SODAX MCP catalog
and every supported swap earns the correct USD-snapshotted points.

### Tokens added (was 103 → now 116)
- **LightLink wrappers (3 new):** XLM.LL, INJ.LL, SUI.LL — fills out the 10-token L1-bridged set on LightLink
- **Redbelly synthetics (10 new):** rETH, rBTC, rSOL, rBNB, rHYPE, rAVAX, rXLM, rSUI, rS, rPOL — the full Redbelly r* family

No new chains — all 18 SODAX-supported networks were already wired. **Note:** SODAX has no native Bitcoin spoke chain; BTC is represented via six wrapped/synthetic variants we now fully cover (WBTC, BTCB, cbBTC, tBTC, BTC.LL, rBTC).

### Prices wired for every token
`src/lib/pricing.ts` `COIN_ID_BY_SYMBOL` was only mapping ~22 majors; everything else was silently logging $0/0 points to the leaderboard. Extended to cover the full 116-token catalog:
- All 10 **LightLink wrappers** price as the underlying (BTC.LL → bitcoin, AVAX.LL → avalanche-2, etc.)
- All 10 **Redbelly synthetics** price as the underlying (rBTC → bitcoin, rETH → ethereum, etc.)
- All 6 **Sui liquid-staked variants** (afSUI/mSUI/haSUI/vSUI/yapSUI/trevinSUI) price as SUI — 1:1 approximation, peg drift acceptable for the points formula
- Bare natives that were missing: SUI, XLM, INJ (`injective-protocol`), NEAR, ICX/wICX (→ `icon`), LL (→ `lightlink`)
- Only **RBNT** intentionally omitted — no reliable CoinGecko id; logs 0 points (rare swap)

### Other
- `/api/price` symbol regex widened from `[A-Za-z0-9]{1,12}` to `[A-Za-z0-9.]{1,16}` so dotted symbols (BTC.LL etc.) aren't rejected
- Verified live: `BTC.LL` → $73,234, `rBTC` → $73,234, `INJ` → $5.45 — all from CoinGecko

---

## Day 11 — Thu 2026-05-28 (close) — voting on-site · /about extracted · slim shell

The end-of-Day-11 cleanup that turns the dapp into something demo-ready.

### Voting moved on-site (was: "happens in Discord")
- Spec corrected: payout vote runs on the website, not Discord. Threshold-based (event-driven, not calendar). 1 vote per wallet per round. Vote weight = your points balance at cast-time.
- New Prisma models (Day 4 `PayoutVote`/`Ballot` left intact for legacy):
  - `VoteRound { id, thresholdUsd, candidateIds[3], status, openedBy/At, closedBy/At, winnerId }`
  - `VoteBallot { id, roundId, wallet, candidateId, pointsSnapshot, castAt }` with `@@unique([roundId, wallet])`
- Pushed to Supabase live
- API:
  - `GET  /api/rounds/current` — public, returns open round + resolved 3 candidates + live tallies
  - `POST /api/rounds` — admin opens round (signed `OPEN_ROUND::{nonce}::{ids}::{threshold}`)
  - `POST /api/rounds/close` — admin declares winner (signed `CLOSE_ROUND::{nonce}::{roundId}::{winnerId}`)
  - `POST /api/ballots` — wallet casts vote; server snapshots their points from the leaderboard; unique constraint blocks double-voting
  - `GET  /api/charities` — list active candidates (used by admin UI)
- Admin auth: `src/lib/admin.ts` uses viem `recoverMessageAddress`; admin wallet hardcoded `0x9aA8…839B` (Hazy), env-overridable via `NEXT_PUBLIC_ADMIN_WALLET`
- UI:
  - `/vote` — public, polls every 12s. 3 candidate cards with live magenta→cyan tally bars, per-candidate vote button. Empty state when no round.
  - `/vote/admin` — gated by `connected wallet === ADMIN_WALLET`. Pick 3 charities + threshold + sign with wallet + open. Per-candidate "Declare winner & close" controls with confirm.
- Topbar gains `Vote` nav item
- Vercel `NEXT_PUBLIC_ADMIN_WALLET` env var also set (redundant — hardcoded default works, env is rotation-friendly)

### Narrative moved to /about
- New `/about` page absorbs the 3-pillar "system" explanation + the build-in-public band + colophon (source / build log / changelog links / type system credits)
- Home page is now: hero + swap card + live wallet panel. Period.
- New `SiteFooter` (privacy-link style strip) on every page — only SODAX V2 + SODAX Builders MCP + About links

### Shell tightened
- `ConnectButton` moved into the topbar (replaces the Mainnet pill). Compact ghost state when connected, primary cyan when not.
- `ConnectButton` removed from the swap section (it was duplicated)
- SwapCard compacted to fit mobile viewport without scrolling:
  - amount input 64→52 px (font 28→22 mobile)
  - inputs/pickers 48→42
  - readout min-height 56→48
  - section gaps 16→10
  - charity rewards collapsed to one horizontal strip
  - card head padding tightened

### Docs
- README "What's live" synced — voting routes added, balance panel mentioned, Vectorheart v3 description updated, stale "Voting runs in Discord" removed
- Memory: new `project_admin_wallet.md` saved (hardcoded `0x9aA8…839B`, distinguished from the fee wallet `0x95A8…721AD`); `project_status.md` corrected on the vote-flow (was wrong about Discord)

---

## Day 11 — Thu 2026-05-28 (cont. ×4) — VECTORHEART v.3 — done with intent

Open Ledger retired. The community voted **Vectorheart** and Vectorheart they
get, just done with proper craft this time. Anchored on **WipEout 3 (1999)**
specifically (per Hazy) and **moderate HUD density** (swap card + wallet
panel use racing-HUD vocabulary; hero + content pages stay editorial).

### Why this iteration is different
- Anchored to a specific TDR/WipEout era (3, 1999) instead of "diagonals + cyan"
- Custom inline SVG HUD primitives (registration marks, target reticles, brand mark wedge, arc gauge) — not just CSS clip-path tricks
- Selective HUD: where the data is technical (the swap, the live balance), HUD vocabulary; where the narrative is human (hero, charities), editorial Vectorheart
- Hard mobile breakpoints replace unreliable clamp() guessing

### Type system (every pick justified)
- Display: **Audiowide** — single-weight tech caps, characterful, broadly TDR-evoking (community-picked)
- Body/UI: **DM Sans** — modern grotesque, NOT Inter
- Data/numbers: **JetBrains Mono** — best slashed zero, tight tnum

### Palette (cool ink, R<B, WCAG AA verified)
- Surfaces: cool-ink ramp `#06080F` → `#222838`
- Text: cream `#E8F1F7` (~16:1), `#A6B4C8` (~7:1), `#7886A0` (~4.6:1)
- **Cyan `#21D4E5`** — primary signal (live, action, focus)
- **Magenta `#FF4FB8`** — charity signal (fee, vote, hot CTA)
- **Yellow `#F5D300`** — hazard / numplate
- **Acid `#BFF252`** — sage / online
- Real glow tokens (`*-glow`) and soft tints (`*-soft`) for halos + backgrounds

### Rebuilt (vh- prefix)
- **`globals.css`** — full design system, mobile-first hard breakpoints
- **`hud.tsx`** (new) — `<RegMark>`, `<Reticle>`, `<Chevron>`, `<Arrow>`, `<BrandMark>` (vector logo, not text), `<GaugeArc>` (240° SVG gauge with progress fill + tick marks), `<Bracketed>`, `<Slash>`
- **`TopBar.tsx`** — vector brand mark + minimal nav + Mainnet pill + bottom hazard-tape strip
- **`Picker.tsx`** — desktop dropdown / mobile portal-bottom-sheet (HUD-styled)
- **`ConnectButton.tsx`** — Engage / connected states, dropdown ↔ sheet
- **`SwapCard.tsx`** — bracketed FROM/TO, segmented LED-style amount input (cyan glow text-shadow), bottom-sheet pickers, magenta charity-rewards subpanel, cyan ENGAGE button
- **`WalletBalancePanel.tsx`** — Audiowide live counter + **240° SVG arc gauge** for progress (magenta→cyan→acid gradient stroke with cyan glow), telemetry footer
- **`page.tsx`** — editorial hero (reg-mark eyebrow, two-color headline split, dual CTAs, data band) + swap + live wallet + 3-pillar system + build-in-public band + footer
- **`leaderboard/page.tsx`** — same editorial header, telemetry table (cards on mobile)
- **`charities/page.tsx`** — wallet panel front-and-center, reticle-marked candidate cards
- **`opengraph-image.tsx`** — cool-ink ground, two-color headline, telemetry stat row
- **`layout.tsx`** — Audiowide + DM Sans + JetBrains via next/font, viewport meta

### Tech kept (didn't reinvent the wheel)
- viewport meta wiring
- Picker portal/sheet pattern
- `useCountUp` rAF tween on balance
- `/api/wallet-balance` + `/api/price` endpoints
- All useQuote/useSwap/useSwapAllowance/useSwapApprove flows byte-identical
- All 18 SODAX networks still wired
- Fee config 0.1% → 0x95A8…721AD untouched
- Prisma + leaderboard + charity seed untouched

---

## Day 11 — Thu 2026-05-28 (cont. ×3) — OPEN LEDGER · full ground-up redesign

Vectorheart retired. The neon WipEout aesthetic was tonally wrong for a
charity-funding product — felt cold and edgelord. Replaced with **Open Ledger**:
editorial dark, warm, philanthropic, considered.

### Why this aesthetic fits the topic
- Charity-funding requires gravitas + warmth, not cyberpunk neon
- Real-time on-chain data still needs mono precision + big legible numbers
- Build in public wants editorial calm, like an annual report

### Type system (every pick justified)
- Display: **Fraunces** (Google) — characterful contemporary serif, opsz axis
- UI/body: **Mona Sans** (GitHub) — characterful grotesque, deliberately NOT Inter/Geist
- Data/mono: **JetBrains Mono** — best slashed zero, tight tnum

### Palette (WCAG AA verified)
- Surfaces: warm-ink ramp `#15110D` → `#36302A` (R>G>B undertone, feels paper-at-night)
- Cream text on dark `#F4ECDD` = **15:1 contrast**; secondary `#C2B59C` = 7.2:1; muted `#8A7E68` = 4.5:1
- **Persimmon `#E8643C`** — charity / CTA (warm, generous, signals giving)
- **Jade `#5BA89A`** — trust / data / links
- Honey + Sage — warning + success only
- No dark text on dark anywhere

### Components rebuilt from scratch
- **`src/app/globals.css`** — full design system: spacing scale, type, buttons (`ol-btn` + variants), card (`ol-card` + header/body/footer), inputs, picker, table, progress, pill, eyebrow, data-band, animations
- **`src/components/TopBar.tsx`** — moved out of page.tsx (Next 16 disallows named exports from pages), shared by all 3 routes
- **`src/components/Picker.tsx`** — desktop dropdown / **mobile bottom sheet** via portal. Keyboard nav, searchable, click-outside, body-scroll-lock on mobile
- **`src/components/ConnectButton.tsx`** — same dropdown↔sheet pattern, numbered ecosystem groups
- **`src/components/SwapCard.tsx`** — clean editorial form, jade primary "Swap" button, persimmon charity rewards subpanel, mobile-tightened
- **`src/components/WalletBalancePanel.tsx`** — Fraunces big-number live counter (rAF count-up), persimmon→honey gradient progress to threshold, sonicscan link
- **`src/app/page.tsx`** — editorial hero (eyebrow + serif headline + lede + dual CTAs + data band), then swap section, then live wallet, then 3-pillar "how it works", then build-in-public band, then footer
- **`src/app/leaderboard/page.tsx`** — editorial table, mobile card list, rank colors
- **`src/app/charities/page.tsx`** — wallet panel front-and-center, candidate cards with serif names + body
- **`src/app/opengraph-image.tsx`** — warm dark OG card with persimmon italic accent (no more clip-path)
- **`src/app/layout.tsx`** — Fraunces (variable, opsz/SOFT/WONK axes) + Mona Sans + JetBrains Mono via next/font, viewport meta wired (`width=device-width, initial-scale=1`)
- **`src/app/providers.tsx`** — boot skeleton in Open Ledger system

### Honest open issues
- **Mobile (375px) verification via headless Chrome was unreliable** — some chip + headline overflow at 375 in screenshots, may be a Chrome rendering artifact rather than a real bug. Needs a real iOS Safari check.
- Vectorheart `vc-*` classes removed entirely from CSS but a few stale references may still exist in copy/docs.

---

## Day 11 — Thu 2026-05-28 (cont. ×2) — VECTORHEART v.0.8 // design-department pass

### Color science upgrade
- Palette rewritten in **OKLCH** (perceptually uniform). Each accent now has a full tonal ramp (100 / 200 / 400 / 500 / 600 / 800) plus `*-soft` (tinted fill) and `*-glow` (shadow/halo) tokens
- Three-tier ink elevation: `--vc-ink-0/1/2/3` actually mean depth now (each step lifts ~3 OKLCH luminance points + a hair warmer hue). Inset wells go *darker* than panels
- Panels gain a subtle linear gradient + top-edge highlight (`::before`) implying overhead lighting, plus inset top-shadow and mid-tier elevation shadow
- Glow tokens: `--vc-glow-cyan/magenta/green` for focus rings, hover halos, live pulses
- Background: triple-layer atmosphere (slow magenta wash + cyan wash + halftone dots) that drifts 22px/60s. `prefers-reduced-motion` opts out

### Forms — kill the native &lt;select&gt;
- New **`<Picker>`** component (`src/components/Picker.tsx`) — searchable, keyboard-nav, grouped, portal-style popup. Custom-themed (cyan focus glow, magenta selected), `↑↓ ↵ esc` work, auto-search if &gt;8 items
- SwapCard's two chain selects + two token selects now use `<Picker>`. Chain picker shows the chain type as a right-aligned badge (`EVM`, `SOLANA`, `SUI`, …). Token picker shows the symbol in magenta display type
- New `vc-picker-*` primitives in globals.css: animated pop-in, sticky search input, hover/selected states

### Live charity-wallet balance — **the demo magic**
- New **`/api/wallet-balance`** route (Edge-cached 30s) — viem public client against Sonic mainnet RPC reads native S balance of `0x95A8…721AD`, multiplies by live CoinGecko S price
- New **`<WalletBalancePanel>`** component renders on `/charities` with:
  - **Animated count-up** to USD value (`requestAnimationFrame` ease-out-cubic tween)
  - Native S balance secondary number
  - **Progress bar** toward provisional $1,000 threshold (magenta → cyan gradient fill)
  - Live "syncing/online" chip, sonicscan link, S price + source readout
- Added `S` + `WS` to `src/lib/pricing.ts` CoinGecko id map (sonic-3)

### OG / Twitter card
- `src/app/opengraph-image.tsx` — 1200×630 Vectorheart card rendered via `next/og` (edge runtime). Brand mark, TYPE plate, massive SWAPS // WITHOUT . BORDERS headline, yellow `0.1% → CHARITY` chip with magenta drop-shadow, halftone dot grid, magenta+cyan diagonal stripes
- `src/app/twitter-image.tsx` — re-exports the OG generator for `summary_large_image`
- Metadata in `layout.tsx` wired with `openGraph` + `twitter` blocks and `metadataBase`

### Mobile pass
- Mobile-friendly `<select>` replacement (Picker is responsive, fits in 100% width)
- SwapCard goes full-width on phones (was max-w-460 always)
- Hero headline minimum bumped down to 40px (was 48px) so it doesn't overflow at 320px
- Leaderboard table → **card list** under `sm` breakpoint; each card shows rank + address + swap count + USD volume + points
- Topbar nav horizontal-scrolls cleanly on phones (no scrollbar shown), nav-item padding tightened on mobile

### Animations
- `vc-rise` family now has 4 stagger steps (80ms / 160ms / 240ms / 320ms) + a subtle blur(2px) → 0 reveal
- `vc-scan` sweep on key panels (swap card, wallet balance) for a cyan beam every 7s
- Buttons: top-edge inner-highlight, hover translate-Y, primary buttons get a cyan halo glow on hover
- `.vc-chip__dot` has a real `box-shadow` glow so live indicators actually look hot

### Tooling
- Wired **`@21st-dev/magic` MCP** at user scope for design inspiration / component generation
- Saved memory `feedback-always-push` — commit+push are one step on this repo
- Saved memory `project-vectorheart-ui` updated with v0.8 deltas

---

## Day 11 — Thu 2026-05-28 (cont.) — ship-prep: live preview price + mobile nav

- **`/api/price?symbol=…`** (new) — public, GET-only, returns the same CoinGecko price the server uses for the points ledger. 30s public cache.
- **SwapCard preview now matches the leaderboard** — `PointsPreview` calls `/api/price` via React Query. SODA no longer pinned to $1; the "≈ $X swapped" line and the "+N pts" estimate use the real live price.
- **Deleted dead preview stub** — `src/lib/points.ts` no longer exports `previewUsdValue` / `previewPoints` / `PREVIEW_PRICE_USD` (everything routed through the new endpoint).
- **Mobile nav regression fixed** — `/`, `/leaderboard`, `/charities` topbar nav is now visible on all viewports (was `hidden md:flex`, dropped to mobile-blank by the revamp). Labels collapse to `[01] [02] [03]` < md, full text ≥ md. Topbar padding tightened on mobile.

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
