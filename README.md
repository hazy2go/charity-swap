# Charity Swap

> **A cross-chain swap app where 100% of fees go to charity.**
> Built in public over two weeks on the [SODAX SDK V2](https://docs.sodax.com).
> Shaped by community polls. Mainnet from day one.

[![Built with SODAX](https://img.shields.io/badge/built%20with-SODAX%20SDK%20V2-7C3AED)](https://docs.sodax.com)
[![Scaffolded with the SODAX Builders MCP](https://img.shields.io/badge/scaffolded%20with-SODAX%20Builders%20MCP-3B82F6)](https://builders.sodax.com/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build in public](https://img.shields.io/badge/build-in%20public-orange)](BUILD-LOG.md)

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

1. **You connect a wallet** (EVM today; more chains landing as the SDK
   adapters get wired up).
2. **You execute a cross-chain swap** through the SODAX intent solver.
3. **A small partner fee** (default 0.3%, community-tunable) is deducted by
   the SDK and accrues to a **public multisig on Sonic** — the address is
   shared, the balance is verifiable on the Sonic explorer, the math
   reconciles in this repo.
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
| **3** | **Wed 2026-05-20** | **Build Log #1** | **Working EVM connect + real `useSwap`** ← *we are here* |
| 4   | Thu 2026-05-21 | Name vote closes · points-system poll opens | Points ledger schema (Prisma + Supabase) |
| 5   | Fri 2026-05-22 | Discord stage #1 | Points tracking live, leaderboard endpoint |
| 6   | Sat 2026-05-23 | Week 1 recap | Bug triage |
| 7   | Sun 2026-05-24 | — | Rest |
| 8   | Mon 2026-05-25 | Charity shortlist poll | Charity data model + seed |
| **9** | **Tue 2026-05-26** | **Build Log #2 — charity wallet goes LIVE** | **Multisig deployed on Sonic, partner fee enabled** |
| 10  | Wed 2026-05-27 | Three winning charities announced | Voting UI shell |
| 11  | Thu 2026-05-28 | Threshold + vote-duration polls | Voting backend (`votes`, `vote_ballots`) |
| 12  | Fri 2026-05-29 | Discord stage #2 — v1 demo | Everything live for mainnet demo |
| 13  | Sat 2026-05-30 | Two-week recap | README + docs pass |
| 14  | Sun 2026-05-31 | Internal review | — |

---

## What's live right now

**Day 3 — Build Log #1.** What works in this commit:

- ✅ EVM wallet connect via `@sodax/wallet-sdk-react` (Hana, MetaMask, Rabby, plus any EIP-6963 wallet)
- ✅ Three preset swap pairs (BSC ↔ Arbitrum ↔ Base USDT/USDC)
- ✅ Live quotes via `useQuote` (auto-refreshes every 3s)
- ✅ Allowance + approve flow via `useSwapAllowance` / `useSwapApprove`
- ✅ Real `useSwap` execution on mainnet
- ✅ 0.5% slippage tolerance (community-tunable later)

What's intentionally **not** live yet:

- ❌ **Partner fee** — lands Day 9, after the charity multisig is deployed and disclosed
- ❌ **Points ledger** — lands Day 4 once the schema is settled
- ❌ **Token picker** — Day 4-5 (presets carry us through the first stage)
- ❌ **Voting** — Day 10-11 once the community picks the rules
- ❌ **Non-EVM chains** — added as time and demand allow

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
charity-swap/
├── src/
│   ├── app/
│   │   ├── layout.tsx          Geist fonts + Providers
│   │   ├── providers.tsx       SodaxProvider > QueryClient > SodaxWalletProvider
│   │   └── page.tsx            Header + SwapCard + footer
│   ├── components/
│   │   ├── ConnectButton.tsx   EVM connect button
│   │   └── SwapCard.tsx        Preset pair + amount + quote + approve+swap
│   └── lib/
│       ├── sodax.ts            SodaxConfig (NO partner fee yet — Day 9)
│       ├── wallet-config.ts    EVM chains: Sonic, Eth, Arb, Base, BSC, Polygon
│       ├── swap-presets.ts     Hardcoded pairs (replaced by token picker D4-5)
│       └── stub-empty.ts       Placeholder for future per-chain stubs
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
| Project name | "Charity Swap" (placeholder) | Day 4 |
| Points-to-vote conversion | TBD | Day 4 |
| Charity shortlist | TBD | Day 8-10 |
| Payout threshold | TBD | Day 11 |
| Vote duration | TBD | Day 11 |
| Leaderboard public/private | TBD | Day 5 |

---

## Build log

Day-by-day write-ups live in [**BUILD-LOG.md**](BUILD-LOG.md).

- [Day 3 — Scaffold + first working swap](BUILD-LOG.md#day-3--wed-2026-05-20--scaffold--first-working-swap)

---

## License

[MIT](LICENSE). Use it, fork it, ship your own version, donate to your
favourite cause.

---

<sub>Built by [Hazy](https://sodaxpay.vercel.app) (SODAX community).
Scaffolded with [Claude Code](https://claude.com/claude-code) +
the [SODAX Builders MCP](https://builders.sodax.com/mcp).</sub>
