# Build Log — Charity Swap

A day-by-day public log of building Charity Swap on the
[SODAX SDK V2](https://docs.sodax.com), scaffolded against the
[SODAX Builders MCP](https://builders.sodax.com/mcp).

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

- 🌐 **Live:** *(deploy URL goes here once Vercel is provisioned)*
- 💻 **Repo:** https://github.com/hazy2go/charity-swap
- 🛠️ **MCP we built against:** https://builders.sodax.com/mcp

---

<sub>Build Log #2 lands Day 9 — the day the charity multisig goes live on Sonic.</sub>
