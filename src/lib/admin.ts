import { recoverMessageAddress, getAddress } from "viem";

/**
 * Admin wallet — Hazy's wallet, hardcoded.
 * Used for: opening new vote rounds, closing rounds, declaring winners.
 *
 * Override via NEXT_PUBLIC_ADMIN_WALLET env var if rotating.
 *
 * Note: we use getAddress() to both validate AND normalize to the
 * correct EIP-55 checksum, so any reasonable casing (lower, upper, or
 * mixed) is accepted. The strict isAddress() check would reject input
 * unless it's pre-checksummed, which is a footgun for hand-entered values.
 */
const RAW_ADMIN =
  process.env.NEXT_PUBLIC_ADMIN_WALLET ??
  "0x9aa8f40bff01e953fe278179c3888ae8195b839b";

let _admin: `0x${string}`;
try {
  _admin = getAddress(RAW_ADMIN);
} catch {
  throw new Error(`Invalid NEXT_PUBLIC_ADMIN_WALLET: ${RAW_ADMIN}`);
}

export const ADMIN_WALLET = _admin;

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
