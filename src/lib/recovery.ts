// ─────────────────────────────────────────────────────────────────────────
// Stuck-funds recovery
//
// When a cross-chain action's spoke deposit succeeds but the hub-side hook
// reverts (e.g. the native-gas-token swap bug — see CHANGELOG v1.0.1), the
// bridged asset is minted into the user's hub wallet on Sonic but never
// forwarded. It's safe, just parked. This module finds those parked balances
// and builds the withdrawal that releases them back to the user's spoke chain.
//
// Why not the SDK's `sodax.recovery.withdrawHubAsset` directly? It derives the
// hub wallet AND looks up the hub asset from a SINGLE `srcChainKey`. The native
// bug strands funds in a wallet derived from one chain (e.g. Base, relay id 30)
// while the asset belongs to another (e.g. Optimism). We split those two: derive
// the wallet from the chain it was actually created under, and look up the asset
// from its real home chain. Mechanism verified on-chain against the real
// incident (Optimism→Sonic, tx 0xe026b4c9…): payload decodes to
// AssetManager.transfer(hubAsset, user, amount) and the hub execution simulates
// clean.
// ─────────────────────────────────────────────────────────────────────────
import {
  ChainKeys,
  EvmAssetManagerService,
  encodeAddress,
  erc20Abi,
  assetManagerAbi,
  type Sodax,
} from "@sodax/sdk";
import { CHAINS, type ChainKey } from "@/lib/swap-tokens";

const EVM_CHAIN_KEYS = CHAINS.filter((c) => c.type === "EVM").map((c) => c.key);

export type HubAssetRef = {
  hubAsset: `0x${string}`;
  homeChainKey: ChainKey; // chain the asset belongs to (withdrawal destination)
  spokeToken: string; // the asset's token address on its home chain
  symbol: string;
  decimals: number;
};

export type StrandedAsset = HubAssetRef & {
  derivationChainKey: ChainKey; // chain whose hub-wallet derivation holds the balance
  walletAddress: `0x${string}`; // the hub wallet on Sonic holding it
  balance: bigint;
};

// Every unique hub asset known to the config, with its home chain + spoke token.
export function enumerateHubAssets(sodax: Sodax): HubAssetRef[] {
  const seen = new Map<string, HubAssetRef>();
  for (const chain of EVM_CHAIN_KEYS) {
    const cfg = sodax.config.spokeChainConfig[chain as never] as
      | { supportedTokens?: Record<string, { address: string; hubAsset?: string; symbol: string; decimals: number }> }
      | undefined;
    if (!cfg?.supportedTokens) continue;
    for (const t of Object.values(cfg.supportedTokens)) {
      const hub = t.hubAsset?.toLowerCase();
      if (!hub || !/^0x[0-9a-f]{40}$/.test(hub)) continue;
      if (seen.has(hub)) continue; // first home chain wins; build step re-confirms on-chain
      seen.set(hub, {
        hubAsset: hub as `0x${string}`,
        homeChainKey: chain,
        spokeToken: t.address,
        symbol: t.symbol,
        decimals: t.decimals,
      });
    }
  }
  return [...seen.values()];
}

// Scan every EVM hub-wallet derivation for the user and report any non-zero hub
// asset balances. Catches both same-chain strandings and the cross-chain
// (wrong-derivation) bug, since it checks every asset at every derived wallet.
export async function scanStranded(sodax: Sodax, evmAddress: string): Promise<StrandedAsset[]> {
  const assets = enumerateHubAssets(sodax);
  if (assets.length === 0) return [];
  const client = sodax.hubProvider.publicClient;

  const found: StrandedAsset[] = [];
  for (const chain of EVM_CHAIN_KEYS) {
    let wallet: `0x${string}`;
    try {
      wallet = (await sodax.hubProvider.getUserHubWalletAddress(evmAddress, chain as never)) as `0x${string}`;
    } catch {
      continue;
    }
    const results = await client.multicall({
      allowFailure: true,
      contracts: assets.map((a) => ({
        address: a.hubAsset,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: [wallet],
      })),
    });
    results.forEach((r, i) => {
      if (r.status !== "success") return;
      const bal = r.result as bigint;
      if (bal <= 0n) return;
      found.push({ ...assets[i], derivationChainKey: chain, walletAddress: wallet, balance: bal });
    });
  }
  return found;
}

// Resolve the asset's authoritative home chain + spoke token from on-chain
// assetInfo (don't trust the config's first-home guess for unified assets).
async function resolveHome(
  sodax: Sodax,
  hubAsset: `0x${string}`,
): Promise<{ homeChainKey: ChainKey; spokeToken: `0x${string}` }> {
  const assetMgr = (sodax.hubProvider.chainConfig as { addresses: { assetManager: `0x${string}` } }).addresses.assetManager;
  const [chainId, spokeAddrBytes] = (await sodax.hubProvider.publicClient.readContract({
    address: assetMgr,
    abi: assetManagerAbi,
    functionName: "assetInfo",
    args: [hubAsset],
  })) as [bigint, `0x${string}`];
  const homeChainKey = sodax.config.getSpokeChainKeyFromIntentRelayChainId(chainId as never) as ChainKey;
  // EVM spoke address is the last 20 bytes of the encoded bytes.
  const spokeToken = ("0x" + spokeAddrBytes.slice(-40)) as `0x${string}`;
  return { homeChainKey, spokeToken };
}

// Build the (unsigned-capable) spoke message that releases a stranded asset.
// The user signs this on `derivationChainKey`; funds return to them on the
// asset's home chain.
export async function buildRecovery(
  sodax: Sodax,
  item: Pick<StrandedAsset, "derivationChainKey" | "hubAsset" | "balance">,
  user: `0x${string}`,
) {
  const hub = sodax.hubProvider;
  const hubWallet = (await hub.getUserHubWalletAddress(user, item.derivationChainKey as never)) as `0x${string}`;
  const { homeChainKey, spokeToken } = await resolveHome(sodax, item.hubAsset);

  const payload = EvmAssetManagerService.withdrawAssetData(
    { token: spokeToken, to: encodeAddress(homeChainKey as never, user), amount: item.balance },
    hub,
    homeChainKey as never,
  );

  const coreParams = {
    srcChainKey: item.derivationChainKey,
    srcAddress: user,
    dstChainKey: hub.chainConfig.chain.key,
    dstAddress: hubWallet,
    payload,
  };
  return { hubWallet, homeChainKey, spokeToken, payload, coreParams };
}

// Dry-run the hub-side withdrawal (eth_call as the hub wallet). Returns true if
// it would NOT revert. This is the hard safety gate before signing anything.
export async function simulateRecovery(
  sodax: Sodax,
  item: Pick<StrandedAsset, "derivationChainKey" | "hubAsset" | "balance">,
  user: `0x${string}`,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { hubWallet, coreParams } = await buildRecovery(sodax, item, user);
    // The payload is an array of (address,uint256,bytes) calls; decode the first
    // (the AssetManager.transfer) and eth_call it from the hub wallet.
    const { decodeAbiParameters, parseAbiParameters } = await import("viem");
    const calls = decodeAbiParameters(parseAbiParameters("(address,uint256,bytes)[]"), coreParams.payload)[0] as readonly [
      `0x${string}`,
      bigint,
      `0x${string}`,
    ][];
    const [to, value, data] = calls[0];
    await sodax.hubProvider.publicClient.call({ account: hubWallet, to, data, value });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message.split("\n")[0] : "simulation failed" };
  }
}

// Sign + relay the recovery on the derivation chain. Simulates first and aborts
// if the dry-run reverts — never broadcasts a money-moving tx on a guess.
export async function executeRecovery(
  sodax: Sodax,
  item: Pick<StrandedAsset, "derivationChainKey" | "hubAsset" | "balance">,
  user: `0x${string}`,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletProvider: any,
): Promise<{ ok: true; txHash: unknown } | { ok: false; error: string }> {
  const sim = await simulateRecovery(sodax, item, user);
  if (!sim.ok) return { ok: false, error: `Pre-flight simulation failed: ${sim.reason ?? "unknown"}` };

  const { coreParams } = await buildRecovery(sodax, item, user);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (sodax.spoke as any).sendMessage({ ...coreParams, raw: false, walletProvider });
  if (res && typeof res === "object" && "ok" in res) {
    return res.ok ? { ok: true, txHash: res.value } : { ok: false, error: String(res.error?.message ?? "send failed") };
  }
  return { ok: true, txHash: res };
}

export const HUB_CHAIN_KEY = ChainKeys.SONIC_MAINNET;
