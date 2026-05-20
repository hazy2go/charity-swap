import { ChainKeys } from "@sodax/types";
import type { SodaxWalletConfig } from "@sodax/wallet-sdk-react";

export const walletConfig: SodaxWalletConfig = {
  EVM: {
    ssr: true,
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
  },
};
