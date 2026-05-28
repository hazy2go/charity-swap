import { NextResponse } from "next/server";
import { createPublicClient, http, formatEther, type Address } from "viem";
import { priceOf } from "@/lib/pricing";

// Live read of the charity wallet's native S balance on Sonic mainnet,
// plus a CoinGecko USD conversion. Public, GET-only, 30s edge cache.

const CHARITY_WALLET =
  (process.env.NEXT_PUBLIC_CHARITY_FEE_ADDRESS ??
    "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD") as Address;

const SONIC_RPC = process.env.NEXT_PUBLIC_SONIC_RPC ?? "https://rpc.soniclabs.com";

// Sonic mainnet — chain id 146, native token symbol S
const sonicChain = {
  id: 146,
  name: "Sonic",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: { default: { http: [SONIC_RPC] } },
} as const;

const client = createPublicClient({
  chain: sonicChain,
  transport: http(SONIC_RPC, { timeout: 5_000 }),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [wei, sPrice] = await Promise.all([
      client.getBalance({ address: CHARITY_WALLET }),
      priceOf("S"),
    ]);

    const balanceS = Number(formatEther(wei));
    const usd =
      sPrice && Number.isFinite(balanceS)
        ? balanceS * sPrice.usdPerToken
        : null;

    return NextResponse.json(
      {
        wallet: CHARITY_WALLET,
        chain: "sonic",
        balance: {
          raw: wei.toString(),
          symbol: "S",
          formatted: balanceS,
        },
        usd: {
          value: usd,
          price: sPrice?.usdPerToken ?? null,
          source: sPrice?.source ?? null,
        },
        ts: Date.now(),
      },
      {
        status: 200,
        headers: { "cache-control": "public, max-age=30, s-maxage=30" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        wallet: CHARITY_WALLET,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200, headers: { "cache-control": "public, max-age=10" } },
    );
  }
}
