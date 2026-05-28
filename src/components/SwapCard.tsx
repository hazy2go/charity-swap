"use client";

import { useMemo, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import {
  useQuote,
  useSwap,
  useSwapAllowance,
  useSwapApprove,
  useRadfiSession,
  useTradingWalletBalance,
  useExpiredUtxos,
  useFundTradingWallet,
  loadRadfiSession,
} from "@sodax/dapp-kit";
import { useWalletProvider, useXAccount } from "@sodax/wallet-sdk-react";
import { ChainKeys } from "@sodax/sdk";
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
const BTC_DUST_LIMIT_SATS = 546n; // minOutputAmount floor when dest is BTC

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

  // Bitcoin via Radfi — separate flow: 2-of-2 multisig trading wallet,
  // sign-in + fund + per-swap dust limit + trading address as dst. See
  // https://docs.sodax.com/developers/how-to/bitcoin-integration
  const srcIsBtc = src.chain === ChainKeys.BITCOIN_MAINNET;
  const dstIsBtc = dst.chain === ChainKeys.BITCOIN_MAINNET;
  const btcInvolved = srcIsBtc || dstIsBtc;
  const btcWalletProvider = useWalletProvider({
    xChainId: ChainKeys.BITCOIN_MAINNET,
  });
  const radfi = useRadfiSession(btcWalletProvider);
  const { data: tradingBalance } = useTradingWalletBalance({
    params: {
      walletProvider: btcWalletProvider,
      tradingAddress: radfi.tradingAddress,
    },
  });
  const { data: expiredUtxos } = useExpiredUtxos({
    params: {
      walletProvider: btcWalletProvider,
      tradingAddress: radfi.tradingAddress,
    },
  });
  const { mutateAsync: fundTrading, isPending: isFunding } =
    useFundTradingWallet();

  // Readiness gate per the docs:
  //   destination-only BTC = only needs auth + a trading address
  //   source BTC also needs trading-wallet balance and no expired UTXOs
  const btcReady = (() => {
    if (!btcInvolved) return true;
    if (!radfi.isAuthed || !radfi.tradingAddress) return false;
    if (!srcIsBtc) return true; // dest-only, no balance needed
    return (
      (tradingBalance?.btcSatoshi ?? 0n) > 0n &&
      (!expiredUtxos || expiredUtxos.length === 0)
    );
  })();

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

  // Bitcoin-aware intent params (per Radfi guide):
  //   dstAddress = trading wallet when destination is BTC
  //   minOutputAmount clamped ≥ 546 sats when destination is BTC
  //   srcAddress stays as personal wallet (SDK derives trading internally)
  const rawMinOut = (quotedOut * 995n) / 1000n;
  const dstAddressForIntent = dstIsBtc
    ? loadRadfiSession(dstAccount.address ?? "")?.tradingAddress
    : dstAccount.address;
  const minOutputForIntent =
    dstIsBtc && dst.symbol === "BTC"
      ? rawMinOut > BTC_DUST_LIMIT_SATS ? rawMinOut : BTC_DUST_LIMIT_SATS
      : rawMinOut;

  const intentParams: CreateIntentParams | undefined =
    srcAccount.address && dstAddressForIntent && quotedOut > 0n
      ? {
          inputToken: src.address,
          outputToken: dst.address,
          inputAmount: parsedAmount,
          minOutputAmount: minOutputForIntent,
          deadline: 0n,
          allowPartialFill: false,
          srcChainKey: src.chain,
          dstChainKey: dst.chain,
          srcAddress: srcAccount.address,
          dstAddress: dstAddressForIntent,
          solver: ADDRESS_ZERO,
          data: "0x",
        }
      : undefined;

  const srcIsNative = isNativeToken(src.address);

  // BTC uses UTXO model — no ERC-20-style approve step. Skip the allowance
  // query entirely when source is Bitcoin (the SDK short-circuits too,
  // but we avoid an unnecessary hook call).
  const { data: isApproved } = useSwapAllowance({
    params:
      intentParams && !srcIsNative && !srcIsBtc
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

  const needsApprove = !srcIsNative && !srcIsBtc && isApproved === false;

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
    !!intentParams &&
    !!walletProvider &&
    !isSwapping &&
    !isApproving &&
    !samePair &&
    btcReady;

  const srcLabel = chainInfo(src.chain)?.label ?? srcType;
  const dstLabel = chainInfo(dst.chain)?.label ?? dstType;
  const buttonLabel = !srcAccount.address
    ? `Connect ${srcLabel}`
    : !dstAccount.address
      ? `Connect ${dstLabel}`
      : samePair
        ? "Pick two different tokens"
        : btcInvolved && !radfi.isAuthed
          ? "Sign in to Bitcoin (Radfi)"
          : btcInvolved && !radfi.tradingAddress
            ? "Provisioning trading wallet…"
            : srcIsBtc && (tradingBalance?.btcSatoshi ?? 0n) === 0n
              ? "Fund Bitcoin trading wallet"
              : srcIsBtc && expiredUtxos && expiredUtxos.length > 0
                ? "Renew expired UTXOs"
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

      <div className="vh-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

        {/* Charity rewards strip — compact */}
        <div
          style={{
            background: "var(--vh-magenta-soft)",
            border: "1px solid var(--vh-magenta-soft)",
            borderRadius: "var(--vh-r)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            rowGap: 6,
          }}
        >
          <span className="vh-eyebrow" style={{ color: "var(--vh-magenta-500)" }}>
            Charity rewards
          </span>
          <PointsPreview amountRaw={parsedAmount} decimals={src.decimals} symbol={src.symbol} />
        </div>

        {/* Bitcoin readiness banner — only when BTC involved + not ready */}
        {btcInvolved && !btcReady && (
          <div
            style={{
              padding: "10px 12px",
              border: "1px solid var(--vh-yellow-soft)",
              background: "var(--vh-yellow-soft)",
              color: "var(--vh-yellow-500)",
              borderRadius: "var(--vh-r)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
              lineHeight: 1.5,
            }}
          >
            <strong>BTC // Radfi:</strong>{" "}
            {!radfi.isAuthed
              ? "sign in to your Bitcoin wallet to provision the 2-of-2 multisig trading wallet."
              : srcIsBtc && (tradingBalance?.btcSatoshi ?? 0n) === 0n
                ? "fund the trading wallet from your personal Bitcoin wallet (~10 min on-chain confirmation, one-time)."
                : srcIsBtc && expiredUtxos && expiredUtxos.length > 0
                  ? `renew ${expiredUtxos.length} expired UTXO(s) before swapping.`
                  : "preparing…"}
          </div>
        )}

        {/* Action — Bitcoin-aware dispatch */}
        <button
          className="vh-btn vh-btn--primary vh-btn--block"
          type="button"
          onClick={async () => {
            // Bitcoin readiness dispatch
            if (btcInvolved && !radfi.isAuthed) {
              try { await radfi.login(); } catch { /* user rejected */ }
              return;
            }
            if (btcInvolved && srcIsBtc && (tradingBalance?.btcSatoshi ?? 0n) === 0n) {
              if (!btcWalletProvider) return;
              const sats = window.prompt(
                "How many sats to send to your trading wallet? (e.g. 100000 = 0.001 BTC). One-time, ~10 min confirmation.",
                "100000",
              );
              const n = sats ? Number(sats) : NaN;
              if (!Number.isFinite(n) || n < 546) return;
              try {
                await fundTrading({
                  amount: BigInt(Math.floor(n)),
                  walletProvider: btcWalletProvider,
                });
                setStatus({
                  kind: "ok",
                  message: `Funding tx broadcast — wait ~10 min for confirmation, then swap.`,
                });
              } catch (e) {
                setStatus({
                  kind: "err",
                  message: e instanceof Error ? e.message : "fund failed",
                });
              }
              return;
            }
            await handleSwap();
          }}
          disabled={
            isSwapping || isApproving || isFunding ||
            radfi.isLoginPending ||
            (!btcInvolved && !canSwap) ||
            (btcInvolved && radfi.isAuthed && btcReady && !canSwap)
          }
        >
          {radfi.isLoginPending ? "Signing in…" : isFunding ? "Funding…" : buttonLabel} <Arrow size={12} />
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
          fontSize: 20,
          color: "var(--vh-magenta-500)",
          textShadow: "0 0 12px var(--vh-magenta-glow)",
        }}
      >
        {preview ? `+${formatPoints(preview.points)}` : "—"}
        <span
          className="vh-mono"
          style={{
            fontSize: 10,
            marginLeft: 6,
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
