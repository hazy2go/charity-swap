import { recoverMessageAddress, isAddress, getAddress } from "viem";

/**
 * Admin wallet — Hazy's wallet, hardcoded.
 * Used for: opening new vote rounds, closing rounds, declaring winners.
 *
 * Override via NEXT_PUBLIC_ADMIN_WALLET env var if rotating.
 */
const RAW_ADMIN =
  process.env.NEXT_PUBLIC_ADMIN_WALLET ??
  "0x9aA8f40bFf01E953fE278179C3888AE8195b839B";

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
