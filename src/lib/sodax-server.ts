import { Sodax, SolverIntentStatusCode, type SodaxConfig } from "@sodax/sdk";
import { sodaxConfig } from "@/lib/sodax";

// One Sodax instance per server boot, shared by the API routes that need
// server-side reads (charity fee accrual, swap-status verification). Never
// import this from a client component — it pulls the full node SDK.
let _sodax: Sodax | null = null;
export function getServerSodax(): Sodax {
  if (!_sodax) _sodax = new Sodax(sodaxConfig as SodaxConfig);
  return _sodax;
}

export type SwapVerdict = "confirmed" | "failed" | "pending" | "unknown";

/**
 * Ask the solver whether an intent actually executed. The solver indexes by
 * the hub-chain (Sonic) tx hash where the intent was created; depending on
 * the source chain that value may surface as different fields on the swap
 * result, so we try every candidate hash and take the first definitive
 * answer. SOLVED → confirmed, FAILED → failed, in-flight → pending, and
 * nothing-recognised → unknown (caller leaves the row as-is and retries).
 *
 * Returns the hash that matched so the first real mainnet swap reveals which
 * field is canonical (logged by the caller).
 */
export async function verifySwapStatus(
  candidates: (string | null | undefined)[],
): Promise<{ verdict: SwapVerdict; matchedHash: string | null; fillTxHash?: string }> {
  const sodax = getServerSodax();
  const hashes = [...new Set(candidates.filter((h): h is string => !!h && /^0x[0-9a-fA-F]+$/.test(h)))];

  let sawPending = false;
  for (const h of hashes) {
    try {
      const res = await sodax.swaps.getStatus({ intent_tx_hash: h as `0x${string}` });
      if (!res.ok) continue;
      const code = res.value.status;
      if (code === SolverIntentStatusCode.SOLVED) {
        return { verdict: "confirmed", matchedHash: h, fillTxHash: res.value.fill_tx_hash };
      }
      if (code === SolverIntentStatusCode.FAILED) {
        return { verdict: "failed", matchedHash: h };
      }
      // NOT_STARTED_YET (1) / STARTED_NOT_FINISHED (2) → still in flight
      if (
        code === SolverIntentStatusCode.NOT_STARTED_YET ||
        code === SolverIntentStatusCode.STARTED_NOT_FINISHED
      ) {
        sawPending = true;
      }
      // NOT_FOUND (-1) → this hash isn't the one; try the next candidate
    } catch {
      // network/solver hiccup — try the next candidate
    }
  }
  return { verdict: sawPending ? "pending" : "unknown", matchedHash: null };
}
