import { ChainKeys } from "@sodax/types";
import type { SodaxWalletConfig } from "@sodax/wallet-sdk-react";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const walletConfig: SodaxWalletConfig = {
  EVM: {
    ssr: true,
    // When the project id is missing the connector is silently skipped
    // (EIP-6963 wallets keep working) — local dev without the env stays sane.
    ...(wcProjectId ? { walletConnect: { projectId: wcProjectId } } : {}),
    // All 12 EVM spoke chains SODAX supports. RPC defaults taken from the
    // @sodax/sdk source; each overridable via env.
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
      [ChainKeys.OPTIMISM_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL ?? "https://mainnet.optimism.io",
      },
      [ChainKeys.POLYGON_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? "https://polygon-rpc.com",
      },
      [ChainKeys.BSC_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org",
      },
      [ChainKeys.AVALANCHE_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_AVAX_RPC_URL ?? "https://api.avax.network/ext/bc/C/rpc",
      },
      [ChainKeys.HYPEREVM_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_HYPEREVM_RPC_URL ?? "https://rpc.hyperliquid.xyz/evm",
      },
      [ChainKeys.LIGHTLINK_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_LIGHTLINK_RPC_URL ?? "https://replicator.phoenix.lightlink.io/rpc/v1",
      },
      [ChainKeys.REDBELLY_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_REDBELLY_RPC_URL ?? "https://governors.mainnet.redbelly.network",
      },
      [ChainKeys.KAIA_MAINNET]: {
        rpcUrl: process.env.NEXT_PUBLIC_KAIA_RPC_URL ?? "https://public-en.node.kaia.io",
      },
    },
  },
  // Non-EVM ecosystems. All adapter libs ship bundled in the wallet SDK;
  // each slot mounts that ecosystem's provider with registry defaults.
  SOLANA: {},
  SUI: {},
  INJECTIVE: {},
  ICON: {},
  STELLAR: {},
  NEAR: {},
  // Bitcoin via Radfi (2-of-2 multisig trading wallet).
  // Production defaults are baked in — no API key, no per-dApp registration.
  // See https://docs.sodax.com/developers/how-to/bitcoin-integration
  //
  // ⚠️ The Radfi API only accepts requests from whitelisted origins:
  //   - Local dev: http://localhost:1993 (run `pnpm dev --port 1993`)
  //   - Production: the deployed domain must be whitelisted by the SODAX team
  // Non-whitelisted origins are rejected and BTC features will appear broken.
  BITCOIN: {},
};
