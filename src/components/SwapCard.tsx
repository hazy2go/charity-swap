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
import { previewPoints, formatPoints, DEFAULT_POINTS_PER_USD } from "@/lib/points";

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
      const { solverExecutionResponse, intent } = await swap({
        params: intentParams,
        walletProvider,
      });

      // Fire-and-forget log to /api/swap-events. Don't block UX on it —
      // a points-ledger write failure should never break the swap report.
      const txHash =
        (intent && typeof intent === "object" && "txHash" in intent
          ? (intent as { txHash?: string }).txHash
          : undefined) ?? undefined;

      let pointsAwarded: number | null = null;
      try {
        const res = await fetch("/api/swap-events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            wallet: intentParams.srcAddress,
            presetId: preset.id,
            srcChain: preset.src.chain,
            dstChain: preset.dst.chain,
            srcToken: preset.src.address,
            dstToken: preset.dst.address,
            srcSymbol: preset.src.symbol,
            dstSymbol: preset.dst.symbol,
            srcAmountRaw: parsedAmount.toString(),
            srcDecimals: preset.src.decimals,
            dstQuotedRaw: quotedOut.toString(),
            dstDecimals: preset.dst.decimals,
            txHash,
          }),
        });
        if (res.ok) {
          const j = (await res.json()) as { pointsAwarded?: number };
          pointsAwarded = j.pointsAwarded ?? null;
        }
      } catch {
        // swallow — logging failure is logged-only.
      }

      setStatus({
        kind: "ok",
        message:
          pointsAwarded != null
            ? `Swap submitted · +${pointsAwarded.toLocaleString()} pts logged to leaderboard`
            : `Swap submitted. Solver: ${JSON.stringify(solverExecutionResponse).slice(0, 80)}…`,
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

  const buttonLabel = !account.address
    ? "Connect wallet to swap"
    : isApproving
      ? "Approving…"
      : isSwapping
        ? "Swapping…"
        : isApproved === false
          ? `Approve ${preset.src.symbol} & Swap`
          : "Execute Swap";

  return (
    <div className="xp-window w-[420px] max-w-[95vw]">
      {/* Title bar */}
      <div className="xp-titlebar">
        <span className="xp-titlebar__icon" aria-hidden>
          {/* tiny pixel icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <rect x="1" y="1" width="12" height="12" fill="#cfdef3" stroke="#003c74" />
            <path d="M3 5h6l-2-2M11 9H5l2 2" stroke="#003c74" strokeWidth="1.2" fill="none" strokeLinecap="square" />
          </svg>
        </span>
        <span className="xp-titlebar__title">Swap.exe — Swaps without Borders</span>
        <div className="xp-titlebar__controls">
          <button className="xp-ctrl" aria-label="Minimize" tabIndex={-1}>
            <span style={{display:"inline-block",width:8,height:2,background:"#000",marginTop:8}} />
          </button>
          <button className="xp-ctrl" aria-label="Maximize" tabIndex={-1}>
            <span style={{display:"inline-block",width:10,height:9,border:"1px solid #000",borderTopWidth:2}} />
          </button>
          <button className="xp-ctrl xp-ctrl--close" aria-label="Close" tabIndex={-1}>
            <span style={{fontFamily:'"Marlett","Tahoma",sans-serif',fontWeight:"bold",lineHeight:1}}>×</span>
          </button>
        </div>
      </div>

      {/* Menu bar */}
      <div className="xp-menubar">
        <span className="xp-menubar__item"><u>F</u>ile</span>
        <span className="xp-menubar__item"><u>E</u>dit</span>
        <span className="xp-menubar__item"><u>V</u>iew</span>
        <span className="xp-menubar__item"><u>H</u>elp</span>
        <span className="ml-auto self-center pr-1">
          <span className="xp-pill">MAINNET · 0% fee (until Day 9)</span>
        </span>
      </div>

      {/* Window body */}
      <div className="bg-[var(--xp-face)] px-3 pb-3 pt-2">
        <fieldset className="xp-fieldset">
          <legend>Cross-chain pair</legend>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="xp-select"
          >
            {SWAP_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-[#3a3a3a]">
            <div className="xp-readout !min-h-[24px] !py-[2px] !text-[11px]">
              <span className="text-[#666]">From:</span>
              <span>{preset.src.symbol}</span>
            </div>
            <div className="xp-readout !min-h-[24px] !py-[2px] !text-[11px]">
              <span className="text-[#666]">To:</span>
              <span>{preset.dst.symbol}</span>
            </div>
          </div>
        </fieldset>

        <fieldset className="xp-fieldset mt-3">
          <legend>Amount</legend>
          <label className="xp-label">
            Send ({preset.src.symbol})
          </label>
          <input
            inputMode="decimal"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="xp-input xp-input--big"
          />

          <label className="xp-label mt-3">
            You receive ({preset.dst.symbol})
          </label>
          <div className="xp-readout">
            <span className="text-[#888]">≈</span>
            <span>
              {isQuoting && parsedAmount > 0n
                ? <span className="text-[#666] italic xp-cursor">fetching quote</span>
                : quotedOut > 0n
                  ? formatUnits(quotedOut, preset.dst.decimals)
                  : <span className="text-[#999]">—</span>}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-[#555]">
            <span>Slippage tolerance: <strong>0.50%</strong></span>
            <span>Solver: <strong>any</strong></span>
          </div>
        </fieldset>

        {/* Charity Rewards GroupBox — points preview + fee notice */}
        <fieldset className="xp-fieldset mt-3">
          <legend>Charity rewards</legend>
          <PointsPreview
            amountRaw={parsedAmount}
            decimals={preset.src.decimals}
            symbol={preset.src.symbol}
          />
          <p className="mt-2 text-[10px] leading-snug text-[#444]">
            <span className="xp-pill xp-pill--info">Today: 0% fee</span>{" "}
            From <strong>Day 9 (Tue 2026-05-26)</strong> a 0.3% charity fee
            (community-tunable) accrues to a public multisig on Sonic.{" "}
            <strong>100% of fees go to charity.</strong>
          </p>
        </fieldset>

        {/* Dialog buttons row */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="xp-button"
            type="button"
            onClick={() => setAmount("")}
            disabled={!amount}
          >
            Clear
          </button>
          <button
            className="xp-button xp-button--primary !min-w-[160px]"
            type="button"
            onClick={handleSwap}
            disabled={!canSwap}
          >
            {buttonLabel}
          </button>
        </div>

        {status.kind === "ok" && (
          <div className="mt-3 xp-readout !block !font-sans !text-[11px] !text-[#0a4a0a]">
            <strong>OK:</strong> {status.message}
          </div>
        )}
        {status.kind === "err" && (
          <div className="mt-3 xp-readout !block !font-sans !text-[11px] !text-[#7a0a0a]">
            <strong>Error:</strong> {status.message}
          </div>
        )}

      </div>

      {/* Status bar */}
      <div className="xp-statusbar">
        <span className="xp-statusbar__cell">
          {account.address
            ? <>Connected · <span className="font-mono">{account.address.slice(0,6)}…{account.address.slice(-4)}</span></>
            : "Wallet: disconnected"}
        </span>
        <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
          SODAX V2
        </span>
        <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
          {preset.src.chain.split(".").pop()} → {preset.dst.chain.split(".").pop()}
        </span>
      </div>
    </div>
  );
}

function PointsPreview({
  amountRaw,
  decimals,
  symbol,
}: {
  amountRaw: bigint;
  decimals: number;
  symbol: string;
}) {
  const preview =
    amountRaw > 0n ? previewPoints(amountRaw, decimals, symbol) : null;

  return (
    <div className="xp-readout !block">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[#666]">
          You would earn
        </span>
        <span className="font-mono text-[18px] font-bold text-[#0a2a6b]">
          {preview ? `+${formatPoints(preview.points)}` : "—"}{" "}
          <span className="text-[10px] font-normal text-[#666]">pts</span>
        </span>
      </div>
      <div className="mt-1 text-[10px] text-[#555] flex items-center justify-between">
        <span>
          {preview
            ? <>≈ <strong>${preview.usd.toFixed(2)}</strong> swapped</>
            : "Points unlock once a quote is in"}
        </span>
        <span>{DEFAULT_POINTS_PER_USD} pt / $1 (Day 11 vote)</span>
      </div>
      <p className="mt-2 text-[9px] leading-snug text-[#777] italic">
        Preview only — persistence + leaderboard activate Day 5. Schema is
        already committed in <code className="font-mono">prisma/schema.prisma</code>.
      </p>
    </div>
  );
}
