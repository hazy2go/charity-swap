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
import { Bracketed, Arrow } from "@/components/hud";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as const;

const EVM_CHAINS = CHAINS.filter((c) => c.type === "EVM");
const ALT_CHAINS = CHAINS.filter((c) => c.type !== "EVM");

const CHAIN_GROUPS: PickerGroup[] = [
  {
    label: "EVM",
    items: EVM_CHAINS.map((c) => ({
      id: c.key,
      label: c.label,
      search: `${c.label} EVM`,
      badge: "EVM",
    })),
  },
  {
    label: "Other",
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
    try { return parseUnits(amount, src.decimals); } catch { return 0n; }
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
      } catch { /* swallow */ }

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
    ? `Connect ${srcLabel}`
    : !dstAccount.address
      ? `Connect ${dstLabel}`
      : samePair
        ? "Pick two different tokens"
        : isApproving
          ? "Approving…"
          : isSwapping
            ? "Engaging…"
            : needsApprove
              ? "Approve & engage"
              : "Engage swap";

  return (
    <div className="vh-card vh-scan">
      <div className="vh-card__head">
        <span className="vh-eyebrow" style={{ color: "var(--vh-cyan-500)" }}>
          Swap // Core
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span className="vh-pill vh-pill--live">
            <span className="vh-pill__dot vh-pulse" />
            Mainnet
          </span>
          <span className="vh-pill vh-pill--mag">0.1% → charity</span>
        </span>
      </div>

      <div className="vh-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* FROM */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Bracketed color="cyan">From</Bracketed>
            <span className="vh-mono" style={{ fontSize: 10, color: "var(--vh-text-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Send · {src.symbol}
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
            className="vh-input vh-input-amount vh-input-big"
          />
        </div>

        {/* Flip */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <hr className="vh-rule" style={{ flex: 1 }} />
          <button
            type="button"
            onClick={flip}
            aria-label="Flip"
            title="Flip From / To"
            className="vh-btn vh-btn--ghost vh-btn--xs"
          >
            ⇅ Flip
          </button>
          <hr className="vh-rule" style={{ flex: 1 }} />
        </div>

        {/* TO */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Bracketed color="magenta">To</Bracketed>
            <span className="vh-mono" style={{ fontSize: 10, color: "var(--vh-text-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Receive · {dst.symbol}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
            <ChainPicker value={dst.chain} onChange={(k) => pickChain("dst", k)} side="To" />
            <TokenPicker chain={dst.chain} value={dst.address} onChange={setDstAddr} side="To" />
          </div>
          <div className="vh-readout">
            <span style={{ color: "var(--vh-text-3)" }}>≈</span>
            <span
              className="vh-display vh-num"
              style={{
                fontSize: 24,
                color: "var(--vh-magenta-500)",
                textShadow: "0 0 14px var(--vh-magenta-glow)",
              }}
            >
              {isQuoting && parsedAmount > 0n ? (
                <span className="vh-mono" style={{ color: "var(--vh-text-3)", fontSize: 13, textShadow: "none" }}>
                  Quoting…
                </span>
              ) : quotedOut > 0n ? (
                Number(formatUnits(quotedOut, dst.decimals)).toLocaleString("en-US", {
                  maximumFractionDigits: 8,
                })
              ) : (
                <span style={{ color: "var(--vh-text-4)", textShadow: "none" }}>—</span>
              )}
            </span>
          </div>
          {quoteHint && (
            <div
              className="vh-mono"
              style={{
                fontSize: 12,
                color: "var(--vh-amber-500)",
                padding: "2px 0",
              }}
            >
              ⚠ {quoteHint}
            </div>
          )}
          <div
            className="vh-mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--vh-text-3)",
            }}
          >
            <span>Slippage 0.50%</span>
            <span>Solver: any</span>
          </div>
        </div>

        {/* Charity */}
        <div
          style={{
            background: "var(--vh-magenta-soft)",
            border: "1px solid var(--vh-magenta-soft)",
            borderRadius: "var(--vh-r)",
            padding: 14,
          }}
        >
          <div className="vh-eyebrow" style={{ color: "var(--vh-magenta-500)", marginBottom: 8 }}>
            Charity rewards · live
          </div>
          <PointsPreview amountRaw={parsedAmount} decimals={src.decimals} symbol={src.symbol} />
          <p
            className="vh-body"
            style={{ marginTop: 8, fontSize: 12, color: "var(--vh-text-3)" }}
          >
            Every swap routes <strong style={{ color: "var(--vh-magenta-500)" }}>0.1%</strong> to a
            public charity wallet on Sonic.{" "}
            <strong style={{ color: "var(--vh-text)" }}>100% of fees go to charity.</strong>
          </p>
        </div>

        {/* Action */}
        <button
          className="vh-btn vh-btn--primary vh-btn--block"
          type="button"
          onClick={handleSwap}
          disabled={!canSwap}
          style={{ height: 52 }}
        >
          {buttonLabel} <Arrow size={12} />
        </button>

        {status.kind === "ok" && (
          <div
            role="status"
            style={{
              padding: 12,
              border: "1px solid var(--vh-acid-soft)",
              background: "var(--vh-acid-soft)",
              color: "var(--vh-acid-500)",
              fontFamily: "var(--font-mono)",
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
              border: "1px solid var(--vh-magenta-soft)",
              background: "var(--vh-magenta-soft)",
              color: "var(--vh-magenta-500)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            <strong>ERR ·</strong> {status.message}
          </div>
        )}
      </div>

      <div className="vh-card__foot">
        <span>
          {srcAccount.address ? (
            <>
              <span style={{ color: "var(--vh-acid-500)" }}>●</span>{" "}
              {srcLabel} · {srcAccount.address.slice(0, 6)}…{srcAccount.address.slice(-4)}
            </>
          ) : (
            <>
              <span style={{ color: "var(--vh-text-4)" }}>○</span> {srcLabel} disconnected
            </>
          )}
        </span>
        <span style={{ marginLeft: "auto", color: "var(--vh-cyan-500)" }}>
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
              background: "var(--vh-cyan-500)",
              boxShadow: "0 0 6px var(--vh-cyan-glow)",
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
      items={tokens.map((t) => ({ id: t.address, label: t.symbol, search: t.symbol }))}
      ariaLabel="Token"
      sheetTitle={`${side} · Token`}
      triggerLabel={
        <span
          className="vh-display"
          style={{
            fontSize: 14,
            color: "var(--vh-magenta-500)",
            letterSpacing: "0.02em",
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
      }}
    >
      <span
        className="vh-display vh-num"
        style={{
          fontSize: 26,
          color: "var(--vh-magenta-500)",
          textShadow: "0 0 14px var(--vh-magenta-glow)",
        }}
      >
        {preview ? `+${formatPoints(preview.points)}` : "—"}
        <span
          className="vh-mono"
          style={{
            fontSize: 11,
            marginLeft: 8,
            color: "var(--vh-text-3)",
            textShadow: "none",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          pts
        </span>
      </span>
      <span
        className="vh-mono"
        style={{
          fontSize: 11,
          color: "var(--vh-text-3)",
          letterSpacing: "0.06em",
          textAlign: "right",
        }}
      >
        {preview ? (
          <>≈ <strong style={{ color: "var(--vh-text)" }}>${preview.usd.toFixed(2)}</strong></>
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
