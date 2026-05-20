"use client";

import { useMemo, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import {
  useQuote,
  useSwap,
  useSwapAllowance,
  useSwapApprove,
} from "@sodax/dapp-kit";
import { useWalletProvider, useXAccount } from "@sodax/wallet-sdk-react";
import type { CreateIntentParams } from "@sodax/sdk";
import { SWAP_PRESETS } from "@/lib/swap-presets";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as const;

export function SwapCard() {
  const [presetId, setPresetId] = useState(SWAP_PRESETS[0].id);
  const [amount, setAmount] = useState("");

  const preset = useMemo(
    () => SWAP_PRESETS.find((p) => p.id === presetId) ?? SWAP_PRESETS[0],
    [presetId],
  );

  const account = useXAccount({ xChainType: "EVM" });
  const walletProvider = useWalletProvider({ xChainId: preset.src.chain });

  const parsedAmount = useMemo(() => {
    if (!amount) return 0n;
    try {
      return parseUnits(amount, preset.src.decimals);
    } catch {
      return 0n;
    }
  }, [amount, preset.src.decimals]);

  const { data: quoteResult, isFetching: isQuoting } = useQuote({
    params: {
      payload:
        parsedAmount > 0n
          ? {
              token_src: preset.src.address,
              token_dst: preset.dst.address,
              token_src_blockchain_id: preset.src.chain,
              token_dst_blockchain_id: preset.dst.chain,
              amount: parsedAmount,
              quote_type: "exact_input",
            }
          : undefined,
    },
  });

  const quotedOut = quoteResult?.ok ? BigInt(quoteResult.value.quoted_amount) : 0n;

  const intentParams: CreateIntentParams | undefined =
    account.address && quotedOut > 0n
      ? {
          inputToken: preset.src.address,
          outputToken: preset.dst.address,
          inputAmount: parsedAmount,
          // 0.5% slippage tolerance for now (community-configurable later)
          minOutputAmount: (quotedOut * 995n) / 1000n,
          deadline: 0n,
          allowPartialFill: false,
          srcChainKey: preset.src.chain,
          dstChainKey: preset.dst.chain,
          srcAddress: account.address,
          dstAddress: account.address,
          solver: ADDRESS_ZERO,
          data: "0x",
        }
      : undefined;

  const { data: isApproved } = useSwapAllowance({
    params: intentParams
      ? { payload: intentParams, srcChainKey: preset.src.chain, walletProvider }
      : undefined,
  });

  const { mutateAsync: approve, isPending: isApproving } = useSwapApprove();
  const { mutateAsync: swap, isPending: isSwapping } = useSwap();

  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  const handleSwap = async () => {
    if (!intentParams || !walletProvider) return;
    setStatus({ kind: "idle" });
    try {
      if (!isApproved) {
        await approve({ params: intentParams, walletProvider });
      }
      const { solverExecutionResponse } = await swap({
        params: intentParams,
        walletProvider,
      });
      setStatus({
        kind: "ok",
        message: `Swap submitted. Solver: ${JSON.stringify(solverExecutionResponse).slice(0, 80)}…`,
      });
    } catch (e) {
      setStatus({
        kind: "err",
        message: e instanceof Error ? e.message : "Swap failed",
      });
    }
  };

  const canSwap =
    !!intentParams && !!walletProvider && !isSwapping && !isApproving;

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Swap</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          Mainnet · 0% fee (yet)
        </span>
      </div>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
        Pair
      </label>
      <select
        value={presetId}
        onChange={(e) => setPresetId(e.target.value)}
        className="mb-4 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      >
        {SWAP_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
        Amount ({preset.src.symbol})
      </label>
      <input
        inputMode="decimal"
        placeholder="0.0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-4 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-lg font-mono dark:border-neutral-700 dark:bg-neutral-950"
      />

      <div className="mb-4 rounded-md bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800/50">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">You receive</span>
          <span className="font-mono">
            {isQuoting && parsedAmount > 0n ? (
              <span className="text-neutral-400">fetching…</span>
            ) : quotedOut > 0n ? (
              `${formatUnits(quotedOut, preset.dst.decimals)} ${preset.dst.symbol}`
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </span>
        </div>
      </div>

      <button
        onClick={handleSwap}
        disabled={!canSwap}
        className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {!account.address
          ? "Connect wallet to swap"
          : isApproving
            ? "Approving…"
            : isSwapping
              ? "Swapping…"
              : isApproved === false
                ? `Approve ${preset.src.symbol} & swap`
                : "Swap"}
      </button>

      {status.kind === "ok" && (
        <p className="mt-3 break-words text-xs text-green-600 dark:text-green-400">
          {status.message}
        </p>
      )}
      {status.kind === "err" && (
        <p className="mt-3 break-words text-xs text-red-600 dark:text-red-400">
          {status.message}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        Partner fee is <strong>not yet enabled</strong>. From Day 9 a 0.3%
        fee (community-tunable) accrues to a public multisig on Sonic. 100%
        of fees go to charity.
      </p>
    </div>
  );
}
