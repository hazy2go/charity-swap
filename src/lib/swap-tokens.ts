import { ChainKeys } from "@sodax/sdk";

// The ChainKey literal union (e.g. "sonic" | "0xa4b1.arbitrum" | …) that the
// SDK hooks expect, derived straight from the ChainKeys map.
export type ChainKey = (typeof ChainKeys)[keyof typeof ChainKeys];

// ── SODAX swap registry ───────────────────────────────────────────────
// Full network + token list, sourced from the SODAX Builders MCP
// (https://builders.sodax.com/mcp · sodax_get_swap_tokens +
// sodax_get_supported_chains). All 18 networks, ~115 tokens.
//
// Every network is swappable: the 12 EVM chains and the 6 non-EVM
// ecosystems (Solana, Sui, Injective, ICON, Stellar, NEAR), whose wallet
// adapters all ship bundled in @sodax/wallet-sdk. A swap signs on the
// source chain and settles to the connected address on the destination
// chain, so a cross-ecosystem route needs a wallet connected on both.

export type ChainType =
  | "EVM" | "SOLANA" | "SUI" | "INJECTIVE" | "ICON" | "STELLAR" | "NEAR" | "BITCOIN";

export type ChainInfo = {
  key: ChainKey;
  label: string;
  type: ChainType;
  swappable: boolean; // EVM today
};

export type TokenInfo = {
  chain: ChainKey;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
};

const NATIVE = "0x0000000000000000000000000000000000000000";

// Order: Sonic (hub) first, then EVM chains by familiarity, then non-EVM.
export const CHAINS: ChainInfo[] = [
  { key: ChainKeys.SONIC_MAINNET,     label: "Sonic",      type: "EVM", swappable: true },
  { key: ChainKeys.ETHEREUM_MAINNET,  label: "Ethereum",   type: "EVM", swappable: true },
  { key: ChainKeys.ARBITRUM_MAINNET,  label: "Arbitrum",   type: "EVM", swappable: true },
  { key: ChainKeys.BASE_MAINNET,      label: "Base",       type: "EVM", swappable: true },
  { key: ChainKeys.OPTIMISM_MAINNET,  label: "Optimism",   type: "EVM", swappable: true },
  { key: ChainKeys.POLYGON_MAINNET,   label: "Polygon",    type: "EVM", swappable: true },
  { key: ChainKeys.BSC_MAINNET,       label: "BNB Chain",  type: "EVM", swappable: true },
  { key: ChainKeys.AVALANCHE_MAINNET, label: "Avalanche",  type: "EVM", swappable: true },
  { key: ChainKeys.HYPEREVM_MAINNET,  label: "HyperEVM",   type: "EVM", swappable: true },
  { key: ChainKeys.LIGHTLINK_MAINNET, label: "LightLink",  type: "EVM", swappable: true },
  { key: ChainKeys.REDBELLY_MAINNET,  label: "Redbelly",   type: "EVM", swappable: true },
  { key: ChainKeys.KAIA_MAINNET,      label: "Kaia",       type: "EVM", swappable: true },
  // Non-EVM ecosystems — each has its own wallet adapter (Phantom, Sui
  // Wallet, Keplr, Hana/ICONex, Freighter, NEAR wallets). Swappable once
  // the matching wallet is connected for both the source and destination.
  { key: ChainKeys.SOLANA_MAINNET,    label: "Solana",     type: "SOLANA",    swappable: true },
  { key: ChainKeys.SUI_MAINNET,       label: "Sui",        type: "SUI",       swappable: true },
  { key: ChainKeys.INJECTIVE_MAINNET, label: "Injective",  type: "INJECTIVE", swappable: true },
  { key: ChainKeys.ICON_MAINNET,      label: "ICON",       type: "ICON",      swappable: true },
  { key: ChainKeys.STELLAR_MAINNET,   label: "Stellar",    type: "STELLAR",   swappable: true },
  { key: ChainKeys.NEAR_MAINNET,      label: "NEAR",       type: "NEAR",      swappable: true },
  // Bitcoin via Radfi 2-of-2 multisig trading wallet.
  // Requires sign-in + trading-wallet funding before first swap; see
  // https://docs.sodax.com/developers/how-to/bitcoin-integration
  { key: ChainKeys.BITCOIN_MAINNET,   label: "Bitcoin",    type: "BITCOIN",   swappable: true },
];

// ChainType doubles as the SDK's xChainType identifier.
export function xChainTypeOf(chainKey: ChainKey): ChainType {
  return chainInfo(chainKey)?.type ?? "EVM";
}

// Tokens per chain. Addresses verbatim from sodax_get_swap_tokens.
// EVM chains first, then the non-EVM ecosystems further below.
export const TOKENS: TokenInfo[] = [
  // ── Sonic (hub) ──
  { chain: ChainKeys.SONIC_MAINNET, symbol: "SODA",  name: "SODAX",          address: "0x7c7d53EEcda37a87ce0D5bf8E0b24512A48dC963", decimals: 18 },
  { chain: ChainKeys.SONIC_MAINNET, symbol: "S",     name: "Sonic",          address: NATIVE, decimals: 18 },
  { chain: ChainKeys.SONIC_MAINNET, symbol: "wS",    name: "Wrapped Sonic",  address: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", decimals: 18 },
  { chain: ChainKeys.SONIC_MAINNET, symbol: "WETH",  name: "Wrapped Ether",  address: "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b", decimals: 18 },
  { chain: ChainKeys.SONIC_MAINNET, symbol: "USDC",  name: "USD Coin",       address: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", decimals: 6 },
  { chain: ChainKeys.SONIC_MAINNET, symbol: "USDT",  name: "Tether USD",     address: "0x6047828dc181963ba44974801FF68e538dA5eaF9", decimals: 6 },
  { chain: ChainKeys.SONIC_MAINNET, symbol: "bnUSD", name: "Balanced Dollar", address: "0xE801CA34E19aBCbFeA12025378D19c4FBE250131", decimals: 18 },

  // ── Ethereum ──
  { chain: ChainKeys.ETHEREUM_MAINNET, symbol: "ETH",   name: "Ethereum",   address: NATIVE, decimals: 18 },
  { chain: ChainKeys.ETHEREUM_MAINNET, symbol: "USDC",  name: "USD Coin",   address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
  { chain: ChainKeys.ETHEREUM_MAINNET, symbol: "USDT",  name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { chain: ChainKeys.ETHEREUM_MAINNET, symbol: "SODA",  name: "SODAX",      address: "0x4A1C82744cDDeE675A255fB289Cb0917A482e7C7", decimals: 18 },
  { chain: ChainKeys.ETHEREUM_MAINNET, symbol: "bnUSD", name: "bnUSD",      address: "0x1f22279C89B213944b7Ea41daCB0a868DdCDFd13", decimals: 18 },
  { chain: ChainKeys.ETHEREUM_MAINNET, symbol: "LL",    name: "LightLink",  address: "0x0921799CB1d702148131024d18fCdE022129Dc73", decimals: 18 },

  // ── Arbitrum ──
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "ETH",    name: "Ethereum",      address: NATIVE, decimals: 18 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "USDC",   name: "USD Coin",      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "USDT",   name: "Tether USD",    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "SODA",   name: "SODAX",         address: "0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F", decimals: 18 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "bnUSD",  name: "bnUSD",         address: "0xA256dd181C3f6E5eC68C6869f5D50a712d47212e", decimals: 18 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "WBTC",   name: "Wrapped BTC",   address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "weETH",  name: "Wrapped eETH",  address: "0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe", decimals: 18 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "wstETH", name: "Wrapped stETH", address: "0x5979D7b546E38E414F7E9822514be443A4800529", decimals: 18 },
  { chain: ChainKeys.ARBITRUM_MAINNET, symbol: "tBTC",   name: "tBTC v2",       address: "0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40", decimals: 18 },

  // ── Base ──
  { chain: ChainKeys.BASE_MAINNET, symbol: "ETH",    name: "Ethereum",          address: NATIVE, decimals: 18 },
  { chain: ChainKeys.BASE_MAINNET, symbol: "USDC",   name: "USD Coin",          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { chain: ChainKeys.BASE_MAINNET, symbol: "SODA",   name: "SODAX",             address: "0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3", decimals: 18 },
  { chain: ChainKeys.BASE_MAINNET, symbol: "bnUSD",  name: "bnUSD",             address: "0xAcfab3F31C0a18559D78556BBf297EC29c6cf8aa", decimals: 18 },
  { chain: ChainKeys.BASE_MAINNET, symbol: "weETH",  name: "Wrapped eETH",      address: "0x04c0599ae5a44757c0af6f9ec3b93da8976c150a", decimals: 18 },
  { chain: ChainKeys.BASE_MAINNET, symbol: "wstETH", name: "Wrapped stETH",     address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", decimals: 18 },
  { chain: ChainKeys.BASE_MAINNET, symbol: "cbBTC",  name: "Coinbase Wrapped BTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },

  // ── Optimism ──
  { chain: ChainKeys.OPTIMISM_MAINNET, symbol: "ETH",    name: "Ethereum",      address: NATIVE, decimals: 18 },
  { chain: ChainKeys.OPTIMISM_MAINNET, symbol: "USDC",   name: "USD Coin",      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
  { chain: ChainKeys.OPTIMISM_MAINNET, symbol: "USDT",   name: "Tether USD",    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6 },
  { chain: ChainKeys.OPTIMISM_MAINNET, symbol: "SODA",   name: "SODAX",         address: "0x1f22279C89B213944b7Ea41daCB0a868DdCDFd13", decimals: 18 },
  { chain: ChainKeys.OPTIMISM_MAINNET, symbol: "bnUSD",  name: "bnUSD",         address: "0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8", decimals: 18 },
  { chain: ChainKeys.OPTIMISM_MAINNET, symbol: "wstETH", name: "Wrapped stETH", address: "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb", decimals: 18 },

  // ── Polygon ──
  { chain: ChainKeys.POLYGON_MAINNET, symbol: "POL",   name: "Polygon",   address: NATIVE, decimals: 18 },
  { chain: ChainKeys.POLYGON_MAINNET, symbol: "USDC",  name: "USD Coin",  address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
  { chain: ChainKeys.POLYGON_MAINNET, symbol: "SODA",  name: "SODAX",     address: "0xDDF645F33eDAD18fC23E01416eD0267A1bF59D45", decimals: 18 },
  { chain: ChainKeys.POLYGON_MAINNET, symbol: "bnUSD", name: "bnUSD",     address: "0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4", decimals: 18 },

  // ── BNB Chain ──
  { chain: ChainKeys.BSC_MAINNET, symbol: "BNB",   name: "BNB",          address: NATIVE, decimals: 18 },
  { chain: ChainKeys.BSC_MAINNET, symbol: "USDT",  name: "Tether USD",   address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18 },
  { chain: ChainKeys.BSC_MAINNET, symbol: "USDC",  name: "USD Coin",     address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", decimals: 18 },
  { chain: ChainKeys.BSC_MAINNET, symbol: "SODA",  name: "SODAX",        address: "0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3", decimals: 18 },
  { chain: ChainKeys.BSC_MAINNET, symbol: "bnUSD", name: "bnUSD",        address: "0x8428FedC020737a5A2291F46cB1B80613eD71638", decimals: 18 },
  { chain: ChainKeys.BSC_MAINNET, symbol: "ETHB",  name: "Ethereum BSC", address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", decimals: 18 },
  { chain: ChainKeys.BSC_MAINNET, symbol: "BTCB",  name: "Bitcoin BSC",  address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18 },

  // ── Avalanche ──
  { chain: ChainKeys.AVALANCHE_MAINNET, symbol: "AVAX",  name: "Avalanche",  address: NATIVE, decimals: 18 },
  { chain: ChainKeys.AVALANCHE_MAINNET, symbol: "USDC",  name: "USD Coin",   address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
  { chain: ChainKeys.AVALANCHE_MAINNET, symbol: "USDT",  name: "Tether USD", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
  { chain: ChainKeys.AVALANCHE_MAINNET, symbol: "SODA",  name: "SODAX",      address: "0x390ceed555905ec225Da330A188EA04e85570f00", decimals: 18 },
  { chain: ChainKeys.AVALANCHE_MAINNET, symbol: "bnUSD", name: "bnUSD",      address: "0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F", decimals: 18 },

  // ── HyperEVM ──
  { chain: ChainKeys.HYPEREVM_MAINNET, symbol: "HYPE",  name: "HYPE",      address: NATIVE, decimals: 18 },
  { chain: ChainKeys.HYPEREVM_MAINNET, symbol: "USDC",  name: "USD Coin",  address: "0xb88339CB7199b77E23DB6E890353E22632Ba630f", decimals: 6 },
  { chain: ChainKeys.HYPEREVM_MAINNET, symbol: "SODA",  name: "SODAX",     address: "0xA28C70F92a1B2513edCdDD29c2E5195a4B785aB2", decimals: 18 },
  { chain: ChainKeys.HYPEREVM_MAINNET, symbol: "bnUSD", name: "bnUSD",     address: "0x506Ba7C8d91dAdf7a91eE677a205D9687b751579", decimals: 18 },

  // ── LightLink ──
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "ETH",     name: "ETH",                address: NATIVE, decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "USDC",    name: "USD Coin",           address: "0xbCF8C1B03bBDDA88D579330BDF236B58F8bb2cFd", decimals: 6 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "SODA",    name: "SODAX",              address: "0x6BC8C37cba91F76E68C9e6d689A9C21E4d32079B", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "bnUSD",   name: "bnUSD",              address: "0x36134A03dcD03Bbe858B8F7ED28a71AAC608F9E7", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "BTC.LL",  name: "Bitcoin LightLink",  address: "0x5E921D8B7709b409132628258A53449D1fD82341", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "AVAX.LL", name: "Avalanche LightLink", address: "0x373d9c5390535e9e30185E52826d45b76df09aBb", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "BNB.LL",  name: "BNB LightLink",      address: "0xe80c2B7674dCdF47b199697E2c61730231b8da89", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "SOL.LL",  name: "Solana LightLink",   address: "0xba9af7029Ae5c1054Fc367d5D6a47Dc3D5c0D6bA", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "S.LL",    name: "Sonic LightLink",    address: "0xb3A47798CB6585Ea0d31a7986f2a04b25C60247f", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "POL.LL",  name: "Polygon LightLink",  address: "0xE963bfb4757fC8Ae66BC68E11e636f8fbafAfCb4", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "HYPE.LL", name: "HyperEVM LightLink", address: "0x127b64fb645279F8aca786c507b94dde81F02d16", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "XLM.LL",  name: "Stellar LightLink",   address: "0x03beDD719b6d8de11f5B2671b2f30085a626F8Da", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "INJ.LL",  name: "Injective LightLink", address: "0x8a4C8B1A899Fa9D9246a112E8D43EC0C97b77B8C", decimals: 18 },
  { chain: ChainKeys.LIGHTLINK_MAINNET, symbol: "SUI.LL",  name: "Sui LightLink",       address: "0x59e68e2F5147F74F27FD173397a7419C1e5d9999", decimals: 18 },

  // ── Redbelly ──
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "RBNT",  name: "RBNT",                  address: NATIVE, decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "USDC",  name: "USD Coin",              address: "0x8201c02d4AB2214471E8C3AD6475C8b0CD9F2D06", decimals: 6 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "USDT",  name: "Tether USD",            address: "0x8C4aCd74Ff4385f3B7911432FA6787Aa14406f8B", decimals: 6 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "SODA",  name: "SODAX",                 address: "0x5034479da62Ec95360165BB45ead266A48519E85", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "bnUSD", name: "bnUSD",                 address: "0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rETH",  name: "RedBelly Ethereum",     address: "0xb5239140745067502ee35B4E2dC2869418Db8309", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rBTC",  name: "RedBelly Bitcoin",      address: "0x79F9B344bB64aF1E89B0C3d20ded4f299F4ff262", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rSOL",  name: "RedBelly SOL",          address: "0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rBNB",  name: "RedBelly BNB",          address: "0x674A76BE36eE36f201df3F918fe0d30AC969FFaB", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rHYPE", name: "RedBelly HYPE",         address: "0x30E603F6f4A0642579A9Eb87F39E97C3d63c5185", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rAVAX", name: "RedBelly AVAX",         address: "0xdEa692287E2cE8Cb08FA52917Be0F16b1DACDC87", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rXLM",  name: "RedBelly XLM",          address: "0xD6728c68158F8B1c2DD9C2c075b7Ec14Be82B056", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rSUI",  name: "RedBelly SUI",          address: "0x5a075872cb75F68668364Fa9295eCFcE9A1114e2", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rS",    name: "RedBelly S",            address: "0xd891190A2382c75e3091Bbff3a119e4C578E8ebb", decimals: 18 },
  { chain: ChainKeys.REDBELLY_MAINNET, symbol: "rPOL",  name: "RedBelly POL",          address: "0x390ceed555905ec225Da330A188EA04e85570f00", decimals: 18 },

  // ── Kaia ──
  { chain: ChainKeys.KAIA_MAINNET, symbol: "KAIA",  name: "Kaia",       address: NATIVE, decimals: 18 },
  { chain: ChainKeys.KAIA_MAINNET, symbol: "USDT",  name: "Tether USD", address: "0xd077a400968890eacc75cdc901f0356c943e4fdb", decimals: 6 },
  { chain: ChainKeys.KAIA_MAINNET, symbol: "SODA",  name: "SODAX",      address: "0x772ffe538e45b2cddfb5823041ec26c44815b9ab", decimals: 18 },
  { chain: ChainKeys.KAIA_MAINNET, symbol: "bnUSD", name: "bnUSD",      address: "0xF8D13cAcb8E2B6BA8396DbA35a7365EF6b603cd6", decimals: 18 },

  // ── Bitcoin (via Radfi — 2-of-2 multisig trading wallet) ──
  // Token address is the SDK's hub-side identifier for native BTC.
  // Source: docs.sodax.com bitcoin-integration guide.
  { chain: ChainKeys.BITCOIN_MAINNET, symbol: "BTC", name: "Bitcoin", address: "0xeB0393893b5bf98a50073d6740738B08e575058b", decimals: 8 },

  // ── Solana (non-EVM) ──
  { chain: ChainKeys.SOLANA_MAINNET, symbol: "SOL",   name: "Solana",   address: "11111111111111111111111111111111", decimals: 9 },
  { chain: ChainKeys.SOLANA_MAINNET, symbol: "USDC",  name: "USD Coin", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  { chain: ChainKeys.SOLANA_MAINNET, symbol: "SODA",  name: "SODAX",    address: "8Bj8gSbga8My8qRkT1RrvgxFBExiGFgdRNHFaR9o2T3Q", decimals: 9 },
  { chain: ChainKeys.SOLANA_MAINNET, symbol: "bnUSD", name: "bnUSD",    address: "3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5", decimals: 9 },

  // ── Sui (non-EVM) ──
  { chain: ChainKeys.SUI_MAINNET, symbol: "SUI",       name: "SUI",                 address: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "USDC",      name: "USD Coin",            address: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", decimals: 6 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "SODA",      name: "SODAX",               address: "0x0a0393721732617a2a771535e83c0a46f04aeef7d03239bbbb1249bc0981b952::soda::SODA", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "bnUSD",     name: "bnUSD",               address: "0xff4de2b2b57dd7611d2812d231a467d007b702a101fd5c7ad3b278257cddb507::bnusd::BNUSD", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "afSUI",     name: "Aftermath Staked Sui", address: "0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "mSUI",      name: "Mirai Staked SUI",    address: "0x922d15d7f55c13fd790f6e54397470ec592caa2b508df292a2e8553f3d3b274f::msui::MSUI", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "haSUI",     name: "haSUI",               address: "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "vSUI",      name: "Volo Staked SUI",     address: "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "yapSUI",    name: "Yap Staked SUI",      address: "0x83f1bb8c91ecd1fd313344058b0eed94d63c54e41d8d1ae5bff1353443517d65::yap_sui::YAP_SUI", decimals: 9 },
  { chain: ChainKeys.SUI_MAINNET, symbol: "trevinSUI", name: "Trevin Staked SUI",   address: "0x502867b177303bf1bf226245fcdd3403c177e78d175a55a56c0602c7ff51c7fa::trevin_sui::TREVIN_SUI", decimals: 9 },

  // ── Injective (non-EVM) ──
  { chain: ChainKeys.INJECTIVE_MAINNET, symbol: "SODA", name: "SODAX", address: "factory/inj1d036ftaatxpkqsu9hja8r24rv3v33chz3appxp/soda", decimals: 18 },

  // ── ICON (non-EVM) ──
  { chain: ChainKeys.ICON_MAINNET, symbol: "ICX",   name: "ICON",         address: "cx0000000000000000000000000000000000000000", decimals: 18 },
  { chain: ChainKeys.ICON_MAINNET, symbol: "wICX",  name: "Wrapped ICX",  address: "cx3975b43d260fb8ec802cef6e60c2f4d07486f11d", decimals: 18 },
  { chain: ChainKeys.ICON_MAINNET, symbol: "bnUSD", name: "bnUSD (legacy)", address: "cx88fd7df7ddff82f7cc735c871dc519838cb235bb", decimals: 18 },

  // ── Stellar (non-EVM) ──
  { chain: ChainKeys.STELLAR_MAINNET, symbol: "XLM",   name: "Stellar Lumens", address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", decimals: 7 },
  { chain: ChainKeys.STELLAR_MAINNET, symbol: "USDC",  name: "USD Coin",       address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", decimals: 7 },
  { chain: ChainKeys.STELLAR_MAINNET, symbol: "SODA",  name: "SODAX",          address: "CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM", decimals: 7 },
  { chain: ChainKeys.STELLAR_MAINNET, symbol: "bnUSD", name: "bnUSD",          address: "CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX", decimals: 7 },

  // ── NEAR (non-EVM) ──
  { chain: ChainKeys.NEAR_MAINNET, symbol: "NEAR",  name: "NEAR",       address: "NEAR", decimals: 24 },
  { chain: ChainKeys.NEAR_MAINNET, symbol: "USDC",  name: "USD Coin",   address: "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6 },
  { chain: ChainKeys.NEAR_MAINNET, symbol: "USDT",  name: "Tether USD", address: "usdt.tether-token.near", decimals: 6 },
  { chain: ChainKeys.NEAR_MAINNET, symbol: "SODA",  name: "SODAX",      address: "soda.sodax.near", decimals: 24 },
  { chain: ChainKeys.NEAR_MAINNET, symbol: "bnUSD", name: "bnUSD",      address: "bnusd.sodax.near", decimals: 24 },
];

export function chainInfo(key: ChainKey): ChainInfo | undefined {
  return CHAINS.find((c) => c.key === key);
}

export function tokensForChain(chainKey: ChainKey): TokenInfo[] {
  return TOKENS.filter((t) => t.chain === chainKey);
}

export function findToken(chainKey: ChainKey, address: string): TokenInfo | undefined {
  return TOKENS.find((t) => t.chain === chainKey && t.address === address);
}

export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === NATIVE;
}

// Default pair: Arbitrum USDC → Sonic SODA (the headline "buy SODA" route).
export const DEFAULT_SRC = { chain: ChainKeys.ARBITRUM_MAINNET, address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" };
export const DEFAULT_DST = { chain: ChainKeys.SONIC_MAINNET, address: "0x7c7d53EEcda37a87ce0D5bf8E0b24512A48dC963" };
