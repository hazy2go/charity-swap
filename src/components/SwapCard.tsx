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
import {
  CHAINS,
  tokensForChain,
  findToken,
  chainInfo,
  isNativeToken,
  DEFAULT_SRC,
  DEFAULT_DST,
  type TokenInfo,
  type ChainKey,
} from "@/lib/swap-tokens";
import { previewPoints, formatPoints, DEFAULT_POINTS_PER_USD } from "@/lib/points";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as const;

const SWAPPABLE = CHAINS.filter((c) => c.swappable);
const NON_SWAPPABLE = CHAINS.filter((c) => !c.swappable);

export function SwapCard() {
  const [srcChain, setSrcChain] = useState<ChainKey>(DEFAULT_SRC.chain);
  const [srcAddr, setSrcAddr] = useState(DEFAULT_SRC.address);
  const [dstChain, setDstChain] = useState<ChainKey>(DEFAULT_DST.chain);
  const [dstAddr, setDstAddr] = useState(DEFAULT_DST.address);
  const [amount, setAmount] = useState("");

  const src: TokenInfo =
    findToken(srcChain, srcAddr) ?? tokensForChain(srcChain)[0];
  const dst: TokenInfo =
    findToken(dstChain, dstAddr) ?? tokensForChain(dstChain)[0];

  const account = useXAccount({ xChainType: "EVM" });
  const walletProvider = useWalletProvider({ xChainId: src.chain });

  function pickChain(side: "src" | "dst", key: ChainKey) {
    const first = tokensForChain(key)[0];
    if (side === "src") {
      setSrcChain(key);
      setSrcAddr(first?.address ?? "");
    } else {
      setDstChain(key);
      setDstAddr(first?.address ?? "");
    }
  }

  function flip() {
    setSrcChain(dst.chain);
    setSrcAddr(dst.address);
    setDstChain(src.chain);
    setDstAddr(src.address);
  }

  const samePair = src.chain === dst.chain && src.address === dst.address;

  const parsedAmount = useMemo(() => {
    if (!amount) return 0n;
    try {
      return parseUnits(amount, src.decimals);
    } catch {
      return 0n;
    }
  }, [amount, src.decimals]);

  const { data: quoteResult, isFetching: isQuoting } = useQuote({
    params: {
      payload:
        parsedAmount > 0n && !samePair
          ? {
              token_src: src.address,
              token_dst: dst.address,
              token_src_blockchain_id: src.chain,
              token_dst_blockchain_id: dst.chain,
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
          inputToken: src.address,
          outputToken: dst.address,
          inputAmount: parsedAmount,
          minOutputAmount: (quotedOut * 995n) / 1000n,
          deadline: 0n,
          allowPartialFill: false,
          srcChainKey: src.chain,
          dstChainKey: dst.chain,
          srcAddress: account.address,
          dstAddress: account.address,
          solver: ADDRESS_ZERO,
          data: "0x",
        }
      : undefined;

  // Native tokens (address(0)) need no ERC-20 approval.
  const srcIsNative = isNativeToken(src.address);

  const { data: isApproved } = useSwapAllowance({
    params:
      intentParams && !srcIsNative
        ? { payload: intentParams, srcChainKey: src.chain, walletProvider }
        : undefined,
  });

  const { mutateAsync: approve, isPending: isApproving } = useSwapApprove();
  const { mutateAsync: swap, isPending: isSwapping } = useSwap();

  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  const needsApprove = !srcIsNative && isApproved === false;

  const handleSwap = async () => {
    if (!intentParams || !walletProvider) return;
    setStatus({ kind: "idle" });
    try {
      if (needsApprove) {
        await approve({ params: intentParams, walletProvider });
      }
      const { solverExecutionResponse, intent } = await swap({
        params: intentParams,
        walletProvider,
      });

      const txHash =
        (intent && typeof intent === "object" && "txHash" in intent
          ? (intent as { txHash?: string }).txHash
          : undefined) ?? undefined;

      const routeId = `${src.chain}.${src.symbol}__${dst.chain}.${dst.symbol}`
        .replace(/[^A-Za-z0-9._-]/g, "-")
        .slice(0, 64);

      let pointsAwarded: number | null = null;
      try {
        const res = await fetch("/api/swap-events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            wallet: intentParams.srcAddress,
            presetId: routeId,
            srcChain: src.chain,
            dstChain: dst.chain,
            srcToken: src.address,
            dstToken: dst.address,
            srcSymbol: src.symbol,
            dstSymbol: dst.symbol,
            srcAmountRaw: parsedAmount.toString(),
            srcDecimals: src.decimals,
            dstQuotedRaw: quotedOut.toString(),
            dstDecimals: dst.decimals,
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
    !!intentParams && !!walletProvider && !isSwapping && !isApproving && !samePair;

  const buttonLabel = !account.address
    ? "Connect wallet to swap"
    : samePair
      ? "Pick two different tokens"
      : isApproving
        ? "Approving…"
        : isSwapping
          ? "Swapping…"
          : needsApprove
            ? `Approve ${src.symbol} & Swap`
            : "Execute Swap";

  return (
    <div className="xp-window w-[440px] max-w-[95vw]">
      {/* Title bar */}
      <div className="xp-titlebar">
        <span className="xp-titlebar__icon" aria-hidden>
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
          <span className="xp-pill xp-pill--ok">MAINNET · 0.1% → charity</span>
        </span>
      </div>

      {/* Window body */}
      <div className="bg-[var(--xp-face)] px-3 pb-3 pt-2">
        {/* FROM */}
        <fieldset className="xp-fieldset">
          <legend>From</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="xp-label">Network</label>
              <ChainSelect value={src.chain} onChange={(k) => pickChain("src", k)} />
            </div>
            <div>
              <label className="xp-label">Token</label>
              <TokenSelect chain={src.chain} value={src.address} onChange={setSrcAddr} />
            </div>
          </div>
          <label className="xp-label mt-2">Send ({src.symbol})</label>
          <input
            inputMode="decimal"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="xp-input xp-input--big"
          />
        </fieldset>

        {/* Flip */}
        <div className="flex justify-center -my-1.5 relative z-10">
          <button
            type="button"
            className="xp-button !px-2 !py-0.5 !min-w-0"
            onClick={flip}
            aria-label="Swap direction"
            title="Flip From / To"
          >
            ⇅
          </button>
        </div>

        {/* TO */}
        <fieldset className="xp-fieldset">
          <legend>To</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="xp-label">Network</label>
              <ChainSelect value={dst.chain} onChange={(k) => pickChain("dst", k)} />
            </div>
            <div>
              <label className="xp-label">Token</label>
              <TokenSelect chain={dst.chain} value={dst.address} onChange={setDstAddr} />
            </div>
          </div>
          <label className="xp-label mt-2">You receive ({dst.symbol})</label>
          <div className="xp-readout">
            <span className="text-[#888]">≈</span>
            <span>
              {isQuoting && parsedAmount > 0n
                ? <span className="text-[#666] italic xp-cursor">fetching quote</span>
                : quotedOut > 0n
                  ? formatUnits(quotedOut, dst.decimals)
                  : <span className="text-[#999]">—</span>}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#555]">
            <span>Slippage: <strong>0.50%</strong></span>
            <span>Solver: <strong>any</strong></span>
          </div>
        </fieldset>

        {/* Charity Rewards GroupBox */}
        <fieldset className="xp-fieldset mt-3">
          <legend>Charity rewards</legend>
          <PointsPreview amountRaw={parsedAmount} decimals={src.decimals} symbol={src.symbol} />
          <p className="mt-2 text-[10px] leading-snug text-[#444]">
            <span className="xp-pill xp-pill--ok">LIVE: 0.1% fee</span>{" "}
            Every swap routes a <strong>0.1%</strong> fee to a public charity
            wallet on Sonic. <strong>100% of fees go to charity.</strong>
          </p>
        </fieldset>

        {/* Buttons */}
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
        <span className="xp-statusbar__cell xp-statusbar__cell--fixed">SODAX V2</span>
        <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
          {chainInfo(src.chain)?.label} → {chainInfo(dst.chain)?.label}
        </span>
      </div>
    </div>
  );
}

function ChainSelect({
  value,
  onChange,
}: {
  value: ChainKey;
  onChange: (key: ChainKey) => void;
}) {
  return (
    <select
      className="xp-select w-full"
      value={value}
      onChange={(e) => onChange(e.target.value as ChainKey)}
    >
      <optgroup label="EVM — swappable">
        {SWAPPABLE.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </optgroup>
      <optgroup label="Other networks — wallet coming">
        {NON_SWAPPABLE.map((c) => (
          <option key={c.key} value={c.key} disabled>
            {c.label} (soon)
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function TokenSelect({
  chain,
  value,
  onChange,
}: {
  chain: ChainKey;
  value: string;
  onChange: (address: string) => void;
}) {
  const tokens = tokensForChain(chain);
  return (
    <select
      className="xp-select w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {tokens.map((t) => (
        <option key={t.address} value={t.address}>
          {t.symbol}
        </option>
      ))}
    </select>
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
        Estimate — actual points are logged on a confirmed swap and appear on the{" "}
        <a href="/leaderboard" className="underline">leaderboard</a>. USD value is
        snapshotted via CoinGecko at submit time.
      </p>
    </div>
  );
}
