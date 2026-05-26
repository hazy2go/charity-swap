# Swaps without Borders

> **A cross-chain swap app where 100% of fees go to charity.**
> Built in public over two weeks on the [SODAX SDK V2](https://docs.sodax.com).
> Shaped by community polls. Mainnet from day one.
>
> Name picked by the community on **Day 4 (Thu 2026-05-21)**.

[![Built with SODAX](https://img.shields.io/badge/built%20with-SODAX%20SDK%20V2-7C3AED)](https://docs.sodax.com)
[![Scaffolded with the SODAX Builders MCP](https://img.shields.io/badge/scaffolded%20with-SODAX%20Builders%20MCP-3B82F6)](https://builders.sodax.com/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build in public](https://img.shields.io/badge/build-in%20public-orange)](BUILD-LOG.md)
[![Changelog](https://img.shields.io/badge/changelog-day%204-blueviolet)](CHANGELOG.md)

---

## Table of contents

- [How it works](#how-it-works)
- [Why this exists](#why-this-exists)
- [The non-negotiables](#the-non-negotiables)
- [Built with the SODAX Builders MCP](#built-with-the-sodax-builders-mcp)
- [Tech stack](#tech-stack)
- [The two-week plan](#the-two-week-plan)
- [What's live right now](#whats-live-right-now)
- [Run it locally](#run-it-locally)
- [Project layout](#project-layout)
- [Decisions the community will make](#decisions-the-community-will-make)
- [Build log](#build-log)
- [License](#license)

---

## How it works

1. **You connect a wallet** — EVM, Solana, Sui, Injective, ICON, Stellar, or NEAR.
2. **You execute a cross-chain swap** through the SODAX intent solver.
3. **A 0.1% partner fee** (community-tunable) is deducted by the SDK and
   accrues to a **public wallet on Sonic** (`0x95A8…721AD`) — the address is
   shared, the balance is verifiable on the Sonic explorer, the math
   reconciles in this repo. Interim single-key wallet today; multisig to follow.
4. **You earn governance points** proportional to your swap volume.
5. **When the wallet hits a community-decided threshold**, a points-weighted
   vote opens to pick which charity from a curated shortlist receives the
   payout.
6. **The winning charity is paid out**, the cycle restarts.

---

## Why this exists

Two reasons:

1. **Prove SODAX is fast to build on.** The [SODAX Builders MCP](https://builders.sodax.com/mcp)
   means an AI agent (or a human with one open) can ship a real cross-chain
   dapp in an afternoon. This repo is the receipt.
2. **Send real money to charity, transparently.** Every swap on this app
   contributes. No skim. No "ops fee." The whole thing is open source,
   the wallet is public, the vote is on-the-record.

It's a two-week build in public. The community votes on the name, the
points system, the charity shortlist, the payout threshold, and the vote
duration. The code follows the community, not the other way round.

---

## The non-negotiables

| | |
|---|---|
| **Mainnet from day one** | No testnet diversion. Real wallets, real swaps, real fees. Test with the smallest amounts you can. |
| **100% of fees go to charity** | No protocol cut, no ops skim. If covering gas for fee claims is ever necessary, it goes to a public vote first. |
| **Open source, MIT** | What you see in this repo is what's running in production. |
| **Charity wallet publicly viewable** | Multisig on Sonic. Address disclosed in the UI. Balance verifiable in one click. |
| **Built in public** | Repo state matches what the community has been told. Every public milestone has a commit. |
| **No dark patterns in voting** | Whatever points-to-vote system the community picks gets implemented exactly. No silent "weighting" or "rounding." |

---

## Built with the SODAX Builders MCP

This whole repo was scaffolded against the
**[SODAX Builders MCP](https://builders.sodax.com/mcp)** — a Model Context
Protocol server that exposes:

- SDK documentation (searchable, fetchable page by page)
- Live config (supported chains, swap tokens, money market reserves)
- Partner-fee primitives
- Network and partner registries

I pointed Claude Code at it, asked for "a cross-chain swap component with
partner fees," and the entire wiring — provider tree, `useQuote`/`useSwap`
flow, allowance handling, the EVM connect button — fell out in an afternoon.

**If you're a builder considering SODAX, start here:**
👉 **https://builders.sodax.com/mcp**

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript, strict mode |
| Styling | Tailwind v4 |
| SDK | [`@sodax/sdk`](https://www.npmjs.com/package/@sodax/sdk) `2.0.0-rc.1` |
| React hooks | [`@sodax/dapp-kit`](https://www.npmjs.com/package/@sodax/dapp-kit) `2.0.0-rc.1` |
| Wallet | [`@sodax/wallet-sdk-react`](https://www.npmjs.com/package/@sodax/wallet-sdk-react) `2.0.0-rc.1` (EVM via wagmi) |
| State | React Query (required by dapp-kit) |
| Database (Day 4+) | Postgres via Supabase + Prisma |
| Build | webpack (pinned — see `next.config.ts` for the `@injectivelabs/wallet-ledger` UMD shim) |
| Hosting | Vercel |

---

## The two-week plan

| Day | Date | Public milestone | Code milestone |
|----:|------|------------------|----------------|
| 1   | Mon 2026-05-18 | Announcement | — |
| 2   | Tue 2026-05-19 | Name vote opens | Skeleton swap working locally |
| 3   | Wed 2026-05-20 | Build Log #1 | Working EVM connect + real `useSwap` ✅ |
| 4   | Thu 2026-05-21 | Name vote closes ✅ · points-system poll opens | Points ledger schema (Prisma + Supabase) ✅ |
| 5   | Fri 2026-05-22 | Discord stage #1 | Points tracking live, leaderboard endpoint ✅ |
| 6   | Sat 2026-05-23 | Week 1 recap | Audits + security hardening ✅ |
| 7   | Sun 2026-05-24 | — | Rest |
| 8   | Mon 2026-05-25 | Charity shortlist poll | Charity shortlist seeded ✅ |
| **9** | **Tue 2026-05-26** | **Build Log #2 — charity wallet goes LIVE** | **0.1% fee enabled · all 18 networks swappable ✅** ← *we are here* |
| 10  | Wed 2026-05-27 | Three winning charities announced | Voting UI shell |
| 11  | Thu 2026-05-28 | Threshold + vote-duration polls | Voting backend (`votes`, `vote_ballots`) |
| 12  | Fri 2026-05-29 | Discord stage #2 — v1 demo | Everything live for mainnet demo |
| 13  | Sat 2026-05-30 | Two-week recap | README + docs pass |
| 14  | Sun 2026-05-31 | Internal review | — |

---

## What's live right now

**Day 9.** What works in this commit:

- ✅ Name: **Swaps without Borders** (community vote, Day 4)
- ✅ Multi-VM wallet connect via `@sodax/wallet-sdk-react` — EVM (Hana, MetaMask, Rabby, any EIP-6963) **plus** Solana, Sui, Injective, ICON, Stellar, NEAR
- ✅ **All 18 SODAX networks swappable** via a chain → token picker (~115 tokens); default ★ **Arbitrum USDC → Sonic SODA**
- ✅ Live quotes via `useQuote`; cross-ecosystem routing handled by the solver
- ✅ Allowance + approve flow via `useSwapAllowance` / `useSwapApprove` (native tokens skip approval)
- ✅ Real `useSwap` execution on mainnet
- ✅ **0.1% charity fee LIVE** → public Sonic wallet `0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD` (interim EOA; 100% to charity)
- ✅ **Points ledger live** (Prisma + Supabase) — CoinGecko-priced, logged on every confirmed swap
- ✅ **`/leaderboard`** reading from Supabase · **`/charities`** 5-candidate shortlist
- ✅ Windows XP Luna Silver UI (taskbar, windows, functional desktop icons, mobile-aware)

What's intentionally **not** live yet:

- ❌ **Charity multisig** — interim single-key wallet today; migration is a one-line address change
- ❌ **Voting** — Day 10-11 once the community picks the rules (runs in Discord)
- ⚠️ **Non-EVM swap signing** — wired per the SDK and routes verified live, but not yet exercised with a real Solana/Sui/etc. wallet

---

## Run it locally

```bash
pnpm install
cp .env.example .env.local
# (optional) add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for WalletConnect
pnpm dev
```

Open http://localhost:3000.

> ⚠️ **This is mainnet code.** The dev server hits real chains. Test with
> the smallest amounts you can — you're spending real gas.

---

## Project layout

```
swaps-without-borders/
├── src/
│   ├── app/
│   │   ├── layout.tsx          Geist fonts + Providers
│   │   ├── providers.tsx       SodaxProvider > QueryClient > SodaxWalletProvider
│   │   └── page.tsx            Header + SwapCard + footer
│   ├── components/
│   │   ├── ConnectButton.tsx   Per-ecosystem wallet connect (EVM + 6 non-EVM)
│   │   └── SwapCard.tsx        Chain→token picker + amount + quote + approve+swap
│   └── lib/
│       ├── sodax.ts            SodaxConfig + 0.1% charity partnerFee (LIVE, Day 9)
│       ├── wallet-config.ts    All 12 EVM chains + 6 non-EVM ecosystem slots
│       ├── swap-tokens.ts      Full registry: 18 networks, ~115 tokens (from MCP)
│       ├── pricing.ts          CoinGecko USD pricing for the points ledger
│       └── points.ts           Points formula + preview
├── next.config.ts              webpack IgnorePlugin for injective ledger UMD
├── .env.example                All env vars annotated with the day they're needed
└── BUILD-LOG.md                Day-by-day public build log
```

---

## Decisions the community will make

These are kept as **env vars or DB rows** so they can flip without a code
change once the community votes:

| Decision | Default | Decided on |
|---|---|---|
| Project name | **Swaps without Borders** (decided Day 4 ✅) | Day 4 |
| Points-to-vote conversion | TBD | Day 4 |
| Charity shortlist | TBD | Day 8-10 |
| Payout threshold | TBD | Day 11 |
| Vote duration | TBD | Day 11 |
| Leaderboard public/private | TBD | Day 5 |

---

## Build log

- 📔 **[BUILD-LOG.md](BUILD-LOG.md)** — narrative day-by-day write-up with rationale
- 📋 **[CHANGELOG.md](CHANGELOG.md)** — punchy patch notes per commit cluster

- [Day 3 — Scaffold + first working swap](BUILD-LOG.md#day-3--wed-2026-05-20--scaffold--first-working-swap)
- [Day 4 — Name decided · points ledger · leaderboard route](BUILD-LOG.md#day-4--thu-2026-05-21--name-decided--points-ledger--leaderboard-route)

---

## License

[MIT](LICENSE). Use it, fork it, ship your own version, donate to your
favourite cause.

---

<sub>Built by [Hazy](https://sodaxpay.vercel.app) (SODAX community).
Scaffolded with [Claude Code](https://claude.com/claude-code) +
the [SODAX Builders MCP](https://builders.sodax.com/mcp).</sub>
