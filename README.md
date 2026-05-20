# Charity Swap

A cross-chain swap app where **100% of fees go to charity**. The community
shapes the rules — name, points system, charity shortlist, payout threshold,
vote duration — through polls. The whole thing is being built in public over
two weeks on top of the [SODAX SDK V2](https://docs.sodax.com).

This is a working name. The repo will be renamed after the Day 4 community vote.

## What it does

1. You connect a wallet and execute a cross-chain swap through the SODAX intent solver.
2. A small partner fee (default 0.3%, community-tunable) is deducted by the
   SDK and accrues to a **public multisig on Sonic** — anyone can verify the balance.
3. You earn governance points proportional to your swap volume.
4. When the wallet hits a community-decided threshold, a points-weighted vote
   opens to pick which charity from a curated shortlist gets the payout.
5. The winning charity is paid out, the cycle restarts.

## Non-negotiables

- **Mainnet from day one.** No testnet. Test with small amounts.
- **100% of fees go to charity.** No protocol cut, no ops skim.
- **Open source, MIT.** What you see is what's running.
- **Charity wallet is publicly viewable.** Anyone can audit on Sonic explorer.
- **Build in public.** Repo state matches what the community has been told.

## Built with the SODAX Builders MCP

This entire app was scaffolded against the **[SODAX Builders MCP](https://builders.sodax.com/mcp)**
— SDK docs, live token/chain config, supported networks, partner-fee primitives,
all queryable directly. The MCP is what makes "ship a cross-chain swap dapp in
an afternoon" actually true. If you want to build on SODAX, start there.

## Stack

- Next.js 15 App Router · TypeScript strict · Tailwind v4
- `@sodax/sdk` 2.0.0-rc.1 (core SDK + partner-fee primitives)
- `@sodax/dapp-kit` 2.0.0-rc.1 (`useQuote` / `useSwap` / `useSwapAllowance` / `useSwapApprove`)
- `@sodax/wallet-sdk-react` 2.0.0-rc.1 (EVM wallet connectors, more chains landing later)
- React Query · pnpm · Vercel
- Postgres via Supabase + Prisma — for the points ledger and votes (lands Day 4+)

## Two-week plan

| Day | Date | What ships |
|-----|------|------------|
| 1   | Mon 2026-05-18 | Announcement |
| 2   | Tue 2026-05-19 | Name vote opens · skeleton swap working locally |
| **3** | **Wed 2026-05-20** | **Build Log #1 — this commit · working UI + EVM connect** |
| 4   | Thu 2026-05-21 | Name vote closes · points ledger schema |
| 5   | Fri 2026-05-22 | Discord stage #1 · points tracking live |
| 6   | Sat 2026-05-23 | Bug triage |
| 7   | Sun 2026-05-24 | Rest |
| 8   | Mon 2026-05-25 | Charity shortlist poll |
| **9** | **Tue 2026-05-26** | **Partner fee goes LIVE · charity multisig deployed on Sonic** |
| 10  | Wed 2026-05-27 | Charities locked · voting UI shell |
| 11  | Thu 2026-05-28 | Threshold + duration polls · voting backend |
| 12  | Fri 2026-05-29 | Discord stage #2 · v1 demo |
| 13  | Sat 2026-05-30 | Docs pass + bug triage |
| 14  | Sun 2026-05-31 | Internal review |

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Then visit http://localhost:3000.

This is **mainnet code**. The dev server hits real chains. Test with the
smallest amounts you can — you're spending real gas.

## Status

**Day 3 — Build Log #1.** Working EVM wallet connect, three preset swap
pairs, real quotes, real `useSwap` execution path. Partner fee is **not
enabled yet** — that's Day 9, after the charity multisig is deployed and
publicly disclosed.

## License

MIT
