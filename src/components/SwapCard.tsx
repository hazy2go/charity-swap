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
import { useQuery } from "@tanstack/react-query";
import type { CreateIntentParams } from "@sodax/sdk";
import {
  CHAINS,
  tokensForChain,
  findToken,
  chainInfo,
  isNativeToken,
  xChainTypeOf,
  DEFAULT_SRC,
  DEFAULT_DST,
  type TokenInfo,
  type ChainKey,
} from "@/lib/swap-tokens";
import { formatPoints, DEFAULT_POINTS_PER_USD } from "@/lib/points";
import { Picker, type PickerGroup } from "@/components/Picker";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as const;

const EVM_CHAINS = CHAINS.filter((c) => c.type === "EVM");
const ALT_CHAINS = CHAINS.filter((c) => c.type !== "EVM");

const CHAIN_GROUPS: PickerGroup[] = [
  {
    label: "EVM networks",
    items: EVM_CHAINS.map((c) => ({
      id: c.key,
      label: c.label,
      search: `${c.label} EVM`,
      badge: "EVM",
    })),
  },
  {
    label: "Other ecosystems",
    items: ALT_CHAINS.map((c) => ({
      id: c.key,
      label: c.label,
      search: `${c.label} ${c.type}`,
      badge: c.type.toLowerCase(),
    })),
  },
];

type PreviewPrice = {
  symbol: string;
  usd: number | null;
  source: "coingecko" | "cached" | "fallback" | null;
};

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

  const srcType = xChainTypeOf(src.chain);
  const dstType = xChainTypeOf(dst.chain);
  const srcAccount = useXAccount({ xChainType: srcType });
  const dstAccount = useXAccount({ xChainType: dstType });
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

  const quoteFailed =
    parsedAmount > 0n && !samePair && !isQuoting && !!quoteResult && !quoteResult.ok;
  const quoteHint = (() => {
    if (!quoteFailed) return null;
    const raw = JSON.stringify((quoteResult as { error?: unknown }).error ?? "");
    if (/no path/i.test(raw)) return "No route for this pair right now.";
    if (/not compatible/i.test(raw)) return "This token isn't quotable yet.";
    return "Quote unavailable for this pair.";
  })();

  const intentParams: CreateIntentParams | undefined =
    srcAccount.address && dstAccount.address && quotedOut > 0n
      ? {
          inputToken: src.address,
          outputToken: dst.address,
          inputAmount: parsedAmount,
          minOutputAmount: (quotedOut * 995n) / 1000n,
          deadline: 0n,
          allowPartialFill: false,
          srcChainKey: src.chain,
          dstChainKey: dst.chain,
          srcAddress: srcAccount.address,
          dstAddress: dstAccount.address,
          solver: ADDRESS_ZERO,
          data: "0x",
        }
      : undefined;

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
        // swallow
      }

      setStatus({
        kind: "ok",
        message:
          pointsAwarded != null
            ? `Swap submitted · +${pointsAwarded.toLocaleString()} pts logged`
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

  const srcLabel = chainInfo(src.chain)?.label ?? srcType;
  const dstLabel = chainInfo(dst.chain)?.label ?? dstType;
  const buttonLabel = !srcAccount.address
    ? `Connect ${srcLabel} wallet`
    : !dstAccount.address
      ? `Connect ${dstLabel} wallet`
      : samePair
        ? "Pick two different tokens"
        : isApproving
          ? "Approving…"
          : isSwapping
            ? "Swapping…"
            : needsApprove
              ? `Approve & swap`
              : "Swap";

  return (
    <div className="ol-card w-full">
      <div
        className="ol-card__header"
        style={{ flexWrap: "wrap", rowGap: 8 }}
      >
        <span className="ol-eyebrow">Swap</span>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span className="ol-pill ol-pill--live">
            <span className="ol-pill__dot ol-pulse" />
            Mainnet
          </span>
          <span className="ol-pill ol-pill--giving">0.1% to charity</span>
        </span>
      </div>

      <div className="ol-card__body space-y-4">
        {/* FROM */}
        <div className="ol-field">
          <div className="ol-field__label">
            <span>From</span>
            <span className="ol-mono" style={{ color: "var(--ol-text-3)" }}>
              {srcLabel} · {src.symbol}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
            <ChainPicker value={src.chain} onChange={(k) => pickChain("src", k)} side="From" />
            <TokenPicker chain={src.chain} value={src.address} onChange={setSrcAddr} side="From" />
          </div>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="ol-input ol-input-amount ol-input-big"
          />
        </div>

        {/* Flip */}
        <div className="flex items-center gap-3">
          <hr className="ol-rule flex-1" />
          <button
            type="button"
            onClick={flip}
            aria-label="Flip"
            title="Flip From / To"
            className="ol-btn ol-btn--ghost ol-btn--sm"
            style={{ height: 32, padding: "0 12px", fontSize: 12 }}
          >
            ↑↓ Flip
          </button>
          <hr className="ol-rule flex-1" />
        </div>

        {/* TO */}
        <div className="ol-field">
          <div className="ol-field__label">
            <span>To</span>
            <span className="ol-mono" style={{ color: "var(--ol-text-3)" }}>
              {dstLabel} · {dst.symbol}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
            <ChainPicker value={dst.chain} onChange={(k) => pickChain("dst", k)} side="To" />
            <TokenPicker chain={dst.chain} value={dst.address} onChange={setDstAddr} side="To" />
          </div>
          <div
            className="ol-input"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 64,
              padding: "0 16px",
            }}
          >
            <span style={{ color: "var(--ol-text-3)" }}>≈</span>
            <span
              className="ol-serif"
              style={{
                fontSize: 26,
                color: "var(--ol-text)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.01em",
              }}
            >
              {isQuoting && parsedAmount > 0n ? (
                <span
                  className="ol-mono"
                  style={{ color: "var(--ol-text-3)", fontSize: 13 }}
                >
                  Pricing…
                </span>
              ) : quotedOut > 0n ? (
                Number(formatUnits(quotedOut, dst.decimals)).toLocaleString("en-US", {
                  maximumFractionDigits: 8,
                })
              ) : (
                <span style={{ color: "var(--ol-text-4)" }}>—</span>
              )}
            </span>
          </div>
          {quoteHint && (
            <div
              style={{
                fontSize: 13,
                color: "var(--ol-honey)",
                padding: "4px 2px",
              }}
            >
              {quoteHint}
            </div>
          )}
          <div
            className="ol-mono flex items-center justify-between"
            style={{
              fontSize: 12,
              color: "var(--ol-text-3)",
              paddingTop: 2,
            }}
          >
            <span>Slippage 0.50%</span>
            <span>Solver: any</span>
          </div>
        </div>

        {/* Charity rewards readout */}
        <div
          style={{
            background: "var(--ol-persimmon-soft)",
            border: "1px solid rgba(232, 100, 60, 0.22)",
            borderRadius: "var(--ol-r-lg)",
            padding: 14,
          }}
        >
          <div className="ol-eyebrow" style={{ color: "var(--ol-persimmon)" }}>
            Charity rewards
          </div>
          <PointsPreview
            amountRaw={parsedAmount}
            decimals={src.decimals}
            symbol={src.symbol}
          />
          <p
            className="ol-body"
            style={{
              fontSize: 12,
              marginTop: 8,
              color: "var(--ol-text-2)",
            }}
          >
            Every swap routes <strong style={{ color: "var(--ol-persimmon)" }}>0.1%</strong> to a
            public charity wallet on Sonic.{" "}
            <strong style={{ color: "var(--ol-text)" }}>100% of fees go to charity.</strong>
          </p>
        </div>

        {/* Action */}
        <button
          className="ol-btn ol-btn--primary ol-btn--block"
          type="button"
          onClick={handleSwap}
          disabled={!canSwap}
          style={{ height: 52, fontSize: 15 }}
        >
          {buttonLabel}
        </button>

        {status.kind === "ok" && (
          <div
            role="status"
            style={{
              padding: 12,
              border: "1px solid rgba(168, 201, 122, 0.4)",
              background: "var(--ol-sage-soft)",
              color: "var(--ol-sage)",
              borderRadius: "var(--ol-r)",
              fontSize: 13,
            }}
          >
            <strong>OK ·</strong> {status.message}
          </div>
        )}
        {status.kind === "err" && (
          <div
            role="status"
            style={{
              padding: 12,
              border: "1px solid rgba(232, 100, 60, 0.4)",
              background: "var(--ol-persimmon-soft)",
              color: "var(--ol-persimmon)",
              borderRadius: "var(--ol-r)",
              fontSize: 13,
            }}
          >
            <strong>Error ·</strong> {status.message}
          </div>
        )}
      </div>

      <div className="ol-card__footer">
        <span>
          {srcAccount.address ? (
            <>
              <span style={{ color: "var(--ol-sage)" }}>●</span>{" "}
              {srcLabel} · {srcAccount.address.slice(0, 6)}…{srcAccount.address.slice(-4)}
            </>
          ) : (
            <>
              <span style={{ color: "var(--ol-text-4)" }}>○</span> {srcLabel} disconnected
            </>
          )}
        </span>
        <span style={{ marginLeft: "auto", color: "var(--ol-jade)" }}>
          {srcLabel} → {dstLabel}
        </span>
      </div>
    </div>
  );
}

function ChainPicker({
  value,
  onChange,
  side,
}: {
  value: ChainKey;
  onChange: (k: ChainKey) => void;
  side: string;
}) {
  const label = chainInfo(value)?.label ?? value;
  return (
    <Picker
      value={value}
      groups={CHAIN_GROUPS}
      ariaLabel="Network"
      sheetTitle={`${side} · Network`}
      triggerLabel={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "var(--ol-jade)",
              flexShrink: 0,
            }}
          />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        </span>
      }
      onChange={(k) => onChange(k as ChainKey)}
    />
  );
}

function TokenPicker({
  chain,
  value,
  onChange,
  side,
}: {
  chain: ChainKey;
  value: string;
  onChange: (address: string) => void;
  side: string;
}) {
  const tokens = tokensForChain(chain);
  const selected = tokens.find((t) => t.address === value);
  return (
    <Picker
      value={value}
      items={tokens.map((t) => ({
        id: t.address,
        label: t.symbol,
        search: t.symbol,
      }))}
      ariaLabel="Token"
      sheetTitle={`${side} · Token`}
      triggerLabel={
        <span
          className="ol-serif"
          style={{
            fontSize: 16,
            color: "var(--ol-persimmon)",
            fontWeight: 600,
          }}
        >
          {selected?.symbol ?? "—"}
        </span>
      }
      onChange={onChange}
    />
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
  const { data: priceData, isFetching } = useQuery<PreviewPrice>({
    queryKey: ["preview-price", symbol.toUpperCase()],
    queryFn: async () => {
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      if (!r.ok) throw new Error("price fetch failed");
      return r.json() as Promise<PreviewPrice>;
    },
    staleTime: 30_000,
    enabled: amountRaw > 0n,
  });

  const preview = (() => {
    if (amountRaw <= 0n) return null;
    if (priceData?.usd == null) return null;
    const amount = Number(formatUnits(amountRaw, decimals));
    if (!Number.isFinite(amount)) return null;
    const usd = amount * priceData.usd;
    return { usd, points: Math.round(usd * DEFAULT_POINTS_PER_USD) };
  })();

  const noPrice =
    amountRaw > 0n && !isFetching && priceData && priceData.usd == null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 6,
      }}
    >
      <span
        className="ol-serif"
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: "var(--ol-persimmon)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {preview ? `+${formatPoints(preview.points)}` : "—"}
        <span
          className="ol-mono"
          style={{
            fontSize: 12,
            marginLeft: 8,
            color: "var(--ol-text-3)",
          }}
        >
          pts
        </span>
      </span>
      <span
        className="ol-mono"
        style={{
          fontSize: 12,
          color: "var(--ol-text-3)",
          textAlign: "right",
        }}
      >
        {preview ? (
          <>≈ <strong style={{ color: "var(--ol-text)" }}>${preview.usd.toFixed(2)}</strong></>
        ) : isFetching && amountRaw > 0n ? (
          "Pricing…"
        ) : noPrice ? (
          `${symbol} not priced`
        ) : (
          "—"
        )}
      </span>
    </div>
  );
}
