import { ChainKeys, type DeepPartial, type PartnerFee, type SodaxConfig } from "@sodax/sdk";

// ── Charity fee (Day 9 go-live) ───────────────────────────────────────
// 100% of this fee is destined for the community-voted charity. No skim,
// no ops cut. The recipient is a dedicated Sonic (chain 146) wallet used
// ONLY for charity fees, so every inflow is a fee and every outflow is a
// payout — fully auditable on the Sonic explorer.
//
// INTERIM: this is a single externally-owned wallet, not yet a multisig.
// Disclosed as such publicly; multisig migration is a one-line address
// change here + a re-announce.
const RAW_CHARITY_FEE_ADDRESS =
  process.env.NEXT_PUBLIC_CHARITY_FEE_ADDRESS ??
  "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";

// Fail loud rather than silently route fees to a malformed/zero address.
if (!/^0x[0-9a-fA-F]{40}$/.test(RAW_CHARITY_FEE_ADDRESS)) {
  throw new Error(`Invalid CHARITY_FEE_ADDRESS: ${RAW_CHARITY_FEE_ADDRESS}`);
}
const CHARITY_FEE_ADDRESS = RAW_CHARITY_FEE_ADDRESS as `0x${string}`;

// `percentage` is BASIS POINTS (SDK FEE_PERCENTAGE_SCALE = 10_000):
// 10 = 0.1%, 100 = 1%, 10_000 = 100%. Verified against @sodax/sdk source
// (calculatePercentageFeeAmount: amount * percentage / 10_000n).
const charityPartnerFee: PartnerFee = {
  address: CHARITY_FEE_ADDRESS,
  percentage: 10, // 0.1%
};

export const sodaxConfig: DeepPartial<SodaxConfig> = {
  // Fee applied across all features the dapp exposes.
  swaps: { partnerFee: charityPartnerFee },
  bridge: { partnerFee: charityPartnerFee },
  moneyMarket: { partnerFee: charityPartnerFee },
  chains: {
    [ChainKeys.SONIC_MAINNET]: {
      rpcUrl: process.env.NEXT_PUBLIC_SONIC_RPC_URL ?? "https://rpc.soniclabs.com",
    },
    [ChainKeys.ETHEREUM_MAINNET]: {
      rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ?? "https://ethereum-rpc.publicnode.com",
    },
    [ChainKeys.ARBITRUM_MAINNET]: {
      rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc",
    },
    [ChainKeys.BASE_MAINNET]: {
      rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "https://mainnet.base.org",
    },
    [ChainKeys.BSC_MAINNET]: {
      rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org",
    },
    [ChainKeys.POLYGON_MAINNET]: {
      rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? "https://polygon-rpc.com",
    },
  },
};
