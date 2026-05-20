import { ChainKeys } from "@sodax/sdk";

// Tiny seed list of curated swap pairs so Day 3 has a working UI without
// a full token picker. Token picker lands D4–D5 once the points ledger
// is in. Addresses & decimals copied from the SODAX BUILDER MCP supported
// token list (https://builders.sodax.com/mcp · sodax_get_swap_tokens).
export type SwapPreset = {
  id: string;
  label: string;
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

export const SWAP_PRESETS: SwapPreset[] = [
  {
    id: "bsc-usdt-arb-usdc",
    label: "BSC USDT → Arbitrum USDC",
    src: {
      chain: ChainKeys.BSC_MAINNET,
      address: "0x55d398326f99059fF775485246999027B3197955",
      symbol: "USDT",
      decimals: 18,
    },
    dst: {
      chain: ChainKeys.ARBITRUM_MAINNET,
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      symbol: "USDC",
      decimals: 6,
    },
  },
  {
    id: "base-usdc-bsc-usdt",
    label: "Base USDC → BSC USDT",
    src: {
      chain: ChainKeys.BASE_MAINNET,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      symbol: "USDC",
      decimals: 6,
    },
    dst: {
      chain: ChainKeys.BSC_MAINNET,
      address: "0x55d398326f99059fF775485246999027B3197955",
      symbol: "USDT",
      decimals: 18,
    },
  },
  {
    id: "arb-usdc-base-usdc",
    label: "Arbitrum USDC → Base USDC",
    src: {
      chain: ChainKeys.ARBITRUM_MAINNET,
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      symbol: "USDC",
      decimals: 6,
    },
    dst: {
      chain: ChainKeys.BASE_MAINNET,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      symbol: "USDC",
      decimals: 6,
    },
  },
];
