// Points formula constants + formatter.
//
// USD value is sourced from the live CoinGecko snapshot in src/lib/pricing.ts
// (server-side at swap-submit time; client-side via /api/price for the
// preview). DEFAULT_POINTS_PER_USD is the points-to-USD ratio — the
// community vote outcome lands here as a single config flip.

export const DEFAULT_POINTS_PER_USD = 1;

export function formatPoints(n: number): string {
  return n.toLocaleString("en-US");
}
