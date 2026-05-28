import { recoverMessageAddress, isAddress, getAddress } from "viem";

/**
 * Admin wallet — Hazy's wallet, hardcoded via env var.
 * Used for: opening new vote rounds, closing rounds, declaring winners.
 *
 * Set NEXT_PUBLIC_ADMIN_WALLET in Vercel + .env.local.
 * Falls back to a placeholder during dev so the type system is happy.
 */
const RAW_ADMIN =
  process.env.NEXT_PUBLIC_ADMIN_WALLET ??
  "0x0000000000000000000000000000000000000000";

if (!isAddress(RAW_ADMIN)) {
  throw new Error(`Invalid NEXT_PUBLIC_ADMIN_WALLET: ${RAW_ADMIN}`);
}

export const ADMIN_WALLET = getAddress(RAW_ADMIN);

/**
 * Verify a signed admin action. Server recovers the signing address from
 * the message + signature and checks it matches ADMIN_WALLET.
 *
 * Convention: admin signs `OPEN_ROUND::{nonce}::{candidateIdsJoined}::{threshold}`
 * or `CLOSE_ROUND::{nonce}::{roundId}::{winnerId}` on the client.
 */
export async function verifyAdmin({
  message,
  signature,
}: {
  message: string;
  signature: `0x${string}`;
}): Promise<{ ok: boolean; recovered: string | null }> {
  try {
    const recovered = await recoverMessageAddress({
      message,
      signature,
    });
    return {
      ok: getAddress(recovered) === ADMIN_WALLET,
      recovered,
    };
  } catch (err) {
    return { ok: false, recovered: null };
  }
}
