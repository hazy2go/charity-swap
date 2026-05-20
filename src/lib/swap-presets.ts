import { ChainKeys } from "@sodax/sdk";

// Curated swap presets so Day 3 has a working UI without a full token
// picker. Token picker lands D4–D5 with the points ledger. Addresses
// pulled from @sodax/sdk's bundled token registry, sourced upstream from
// the SODAX Builders MCP (https://builders.sodax.com/mcp · sodax_get_swap_tokens).
export type SwapPreset = {
  id: string;
  label: string;
  highlight?: boolean; // SODA pairs get a "★ SODA" badge in the UI
  src: {
    chain: typeof ChainKeys[keyof typeof ChainKeys];
    address: string;
    symbol: string;
    decimals: number;
  };
  dst: {
    chain: typeof ChainKeys[keyof typeof ChainKeys];
    address: string;
    symbol: string;
    decimals: number;
  };
};

// SODA token addresses (the SODAX governance token), per chain.
const SODA_SONIC = "0x7c7d53EEcda37a87ce0D5bf8E0b24512A48dC963";
const SODA_ARB   = "0x5bda87f18109CA85fa7ADDf1D48B97734e9dc6F5";
const SODA_BASE  = "0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3";
const SODA_BSC   = "0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3";

// Native stables
const USDC_ARB   = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const USDC_BASE  = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDT_BSC   = "0x55d398326f99059fF775485246999027B3197955";

export const SWAP_PRESETS: SwapPreset[] = [
  // ── SODA pairs (default + the headline use case) ────────────────
  {
    id: "arb-usdc-sonic-soda",
    label: "★ Buy SODA — Arbitrum USDC → Sonic SODA",
    highlight: true,
    src: { chain: ChainKeys.ARBITRUM_MAINNET, address: USDC_ARB, symbol: "USDC", decimals: 6 },
    dst: { chain: ChainKeys.SONIC_MAINNET,    address: SODA_SONIC, symbol: "SODA", decimals: 18 },
  },
  {
    id: "base-usdc-sonic-soda",
    label: "★ Buy SODA — Base USDC → Sonic SODA",
    highlight: true,
    src: { chain: ChainKeys.BASE_MAINNET, address: USDC_BASE, symbol: "USDC", decimals: 6 },
    dst: { chain: ChainKeys.SONIC_MAINNET, address: SODA_SONIC, symbol: "SODA", decimals: 18 },
  },
  {
    id: "bsc-usdt-sonic-soda",
    label: "★ Buy SODA — BSC USDT → Sonic SODA",
    highlight: true,
    src: { chain: ChainKeys.BSC_MAINNET, address: USDT_BSC, symbol: "USDT", decimals: 18 },
    dst: { chain: ChainKeys.SONIC_MAINNET, address: SODA_SONIC, symbol: "SODA", decimals: 18 },
  },
  {
    id: "sonic-soda-arb-usdc",
    label: "Sell SODA — Sonic SODA → Arbitrum USDC",
    src: { chain: ChainKeys.SONIC_MAINNET, address: SODA_SONIC, symbol: "SODA", decimals: 18 },
    dst: { chain: ChainKeys.ARBITRUM_MAINNET, address: USDC_ARB, symbol: "USDC", decimals: 6 },
  },
  {
    id: "arb-soda-base-soda",
    label: "Bridge SODA — Arbitrum → Base",
    src: { chain: ChainKeys.ARBITRUM_MAINNET, address: SODA_ARB, symbol: "SODA", decimals: 18 },
    dst: { chain: ChainKeys.BASE_MAINNET, address: SODA_BASE, symbol: "SODA", decimals: 18 },
  },

  // ── Stablecoin pairs ────────────────────────────────────────────
  {
    id: "bsc-usdt-arb-usdc",
    label: "BSC USDT → Arbitrum USDC",
    src: { chain: ChainKeys.BSC_MAINNET, address: USDT_BSC, symbol: "USDT", decimals: 18 },
    dst: { chain: ChainKeys.ARBITRUM_MAINNET, address: USDC_ARB, symbol: "USDC", decimals: 6 },
  },
  {
    id: "base-usdc-bsc-usdt",
    label: "Base USDC → BSC USDT",
    src: { chain: ChainKeys.BASE_MAINNET, address: USDC_BASE, symbol: "USDC", decimals: 6 },
    dst: { chain: ChainKeys.BSC_MAINNET, address: USDT_BSC, symbol: "USDT", decimals: 18 },
  },
  {
    id: "arb-usdc-base-usdc",
    label: "Arbitrum USDC → Base USDC",
    src: { chain: ChainKeys.ARBITRUM_MAINNET, address: USDC_ARB, symbol: "USDC", decimals: 6 },
    dst: { chain: ChainKeys.BASE_MAINNET, address: USDC_BASE, symbol: "USDC", decimals: 6 },
  },
];

