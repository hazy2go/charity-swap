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
  xChainTypeOf,
  DEFAULT_SRC,
  DEFAULT_DST,
  type TokenInfo,
  type ChainKey,
} from "@/lib/swap-tokens";
import { previewPoints, formatPoints, DEFAULT_POINTS_PER_USD } from "@/lib/points";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as const;

const EVM_CHAINS = CHAINS.filter((c) => c.type === "EVM");
const ALT_CHAINS = CHAINS.filter((c) => c.type !== "EVM");

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
        // swallow — logging failure is logged-only.
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
      ? `Connect ${dstLabel} wallet (receive)`
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
    <div className="w-full max-w-[460px] vc-rise-3">
      <div className="vc-panel vc-scan">
        {/* Header strip */}
        <div className="vc-panel__strip">
          <span
            className="vc-mono vc-caps"
            style={{ fontSize: 11, color: "var(--vc-cyan)" }}
          >
            SWAP.CORE // SODAX-V2
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="vc-chip vc-chip--live">
              <span className="vc-chip__dot" />
              MAINNET
            </span>
            <span className="vc-chip vc-chip--mag">0.1% → CHARITY</span>
          </span>
        </div>

        <div className="px-4 sm:px-5 py-5 space-y-4">
          {/* FROM */}
          <div className="vc-field">
            <div className="flex items-center justify-between">
              <span className="vc-bracket">FROM</span>
              <span
                className="vc-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: "var(--vc-text-mute)",
                }}
              >
                SEND // {src.symbol}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ChainSelect
                value={src.chain}
                onChange={(k) => pickChain("src", k)}
              />
              <TokenSelect chain={src.chain} value={src.address} onChange={setSrcAddr} />
            </div>
            <input
              inputMode="decimal"
              placeholder="0.000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="vc-input vc-input-amount vc-input-big"
            />
          </div>

          {/* Flip */}
          <div className="flex items-center gap-3">
            <hr className="vc-rule flex-1" />
            <button
              type="button"
              onClick={flip}
              aria-label="Swap direction"
              title="Flip From / To"
              className="vc-btn vc-btn--ghost vc-btn--xs"
            >
              ⇅ Flip
            </button>
            <hr className="vc-rule flex-1" />
          </div>

          {/* TO */}
          <div className="vc-field">
            <div className="flex items-center justify-between">
              <span className="vc-bracket" style={{ color: "var(--vc-magenta)" }}>
                TO
              </span>
              <span
                className="vc-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: "var(--vc-text-mute)",
                }}
              >
                RECEIVE // {dst.symbol}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ChainSelect
                value={dst.chain}
                onChange={(k) => pickChain("dst", k)}
              />
              <TokenSelect chain={dst.chain} value={dst.address} onChange={setDstAddr} />
            </div>
            <div
              className="vc-readout"
              style={{ borderColor: "var(--vc-line-hi)" }}
            >
              <span style={{ color: "var(--vc-text-mute)" }}>≈</span>
              <span className="vc-readout-big">
                {isQuoting && parsedAmount > 0n ? (
                  <span
                    className="vc-mono vc-blink"
                    style={{ color: "var(--vc-cyan)", fontSize: 14 }}
                  >
                    QUOTING…
                  </span>
                ) : quotedOut > 0n ? (
                  formatUnits(quotedOut, dst.decimals)
                ) : (
                  <span style={{ color: "var(--vc-text-faint)" }}>—</span>
                )}
              </span>
            </div>
            {quoteHint && (
              <div
                className="vc-mono"
                style={{
                  fontSize: 11,
                  color: "var(--vc-amber)",
                  letterSpacing: "0.04em",
                }}
              >
                ⚠ {quoteHint}
              </div>
            )}
            <div
              className="vc-mono flex items-center justify-between"
              style={{
                fontSize: 10,
                color: "var(--vc-text-mute)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <span>SLIPPAGE: <b style={{ color: "var(--vc-text)" }}>0.50%</b></span>
              <span>SOLVER: <b style={{ color: "var(--vc-text)" }}>ANY</b></span>
            </div>
          </div>

          {/* Charity rewards */}
          <div className="vc-panel" style={{ background: "var(--vc-ink)" }}>
            <div
              className="px-3 py-2 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--vc-line-hi)" }}
            >
              <span
                className="vc-mono vc-caps"
                style={{ fontSize: 10, color: "var(--vc-magenta)", letterSpacing: "0.22em" }}
              >
                CHARITY // REWARDS
              </span>
              <span className="vc-chip vc-chip--live">
                <span className="vc-chip__dot" />
                FEE LIVE
              </span>
            </div>
            <div className="px-3 py-3">
              <PointsPreview
                amountRaw={parsedAmount}
                decimals={src.decimals}
                symbol={src.symbol}
              />
              <p
                className="vc-mono mt-3"
                style={{
                  fontSize: 10,
                  color: "var(--vc-text-mute)",
                  letterSpacing: "0.08em",
                  lineHeight: 1.5,
                }}
              >
                Every swap routes a <b style={{ color: "var(--vc-text)" }}>0.1%</b> fee to a public charity wallet on Sonic.{" "}
                <b style={{ color: "var(--vc-yellow)" }}>100%</b> of fees go to charity.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch gap-2">
            <button
              className="vc-btn vc-btn--ghost"
              type="button"
              onClick={() => setAmount("")}
              disabled={!amount}
            >
              ✕ Clear
            </button>
            <button
              className="vc-btn vc-btn--primary flex-1 justify-center"
              type="button"
              onClick={handleSwap}
              disabled={!canSwap}
            >
              ▶ {buttonLabel}
            </button>
          </div>

          {status.kind === "ok" && (
            <div
              className="vc-readout"
              style={{
                borderColor: "var(--vc-green)",
                color: "var(--vc-green)",
                fontSize: 13,
                display: "block",
              }}
            >
              <b className="vc-mono">OK //</b> {status.message}
            </div>
          )}
          {status.kind === "err" && (
            <div
              className="vc-readout"
              style={{
                borderColor: "var(--vc-magenta)",
                color: "var(--vc-magenta)",
                fontSize: 13,
                display: "block",
              }}
            >
              <b className="vc-mono">ERR //</b> {status.message}
            </div>
          )}
        </div>

        {/* Footer status strip */}
        <div
          className="flex items-center gap-3 px-4 py-2 vc-mono"
          style={{
            borderTop: "1px solid var(--vc-line-hi)",
            background: "var(--vc-ink)",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--vc-text-mute)",
            textTransform: "uppercase",
          }}
        >
          <span>
            {srcAccount.address ? (
              <>
                {srcLabel} <span style={{ color: "var(--vc-green)" }}>●</span>{" "}
                {srcAccount.address.slice(0, 6)}…{srcAccount.address.slice(-4)}
              </>
            ) : (
              <>{srcLabel} <span style={{ color: "var(--vc-text-faint)" }}>○ DISCONNECTED</span></>
            )}
          </span>
          <span className="ml-auto" style={{ color: "var(--vc-cyan)" }}>
            {chainInfo(src.chain)?.label} → {chainInfo(dst.chain)?.label}
          </span>
        </div>
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
      className="vc-select"
      value={value}
      onChange={(e) => onChange(e.target.value as ChainKey)}
    >
      <optgroup label="EVM">
        {EVM_CHAINS.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </optgroup>
      <optgroup label="OTHER ECOSYSTEMS">
        {ALT_CHAINS.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
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
      className="vc-select"
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
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="vc-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--vc-text-mute)",
            textTransform: "uppercase",
          }}
        >
          YOU WOULD EARN
        </span>
        <span
          className="vc-display"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--vc-cyan)",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          {preview ? `+${formatPoints(preview.points)}` : "—"}
          <span
            className="vc-mono"
            style={{
              fontSize: 11,
              marginLeft: 6,
              color: "var(--vc-text-mute)",
              letterSpacing: "0.2em",
            }}
          >
            PTS
          </span>
        </span>
      </div>
      <div
        className="vc-mono mt-2 flex items-center justify-between gap-3"
        style={{
          fontSize: 10,
          color: "var(--vc-text-mute)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <span>
          {preview ? (
            <>≈ <b style={{ color: "var(--vc-text)" }}>${preview.usd.toFixed(2)}</b> swapped</>
          ) : (
            "Points unlock once a quote is in"
          )}
        </span>
        <span>{DEFAULT_POINTS_PER_USD} PT / $1</span>
      </div>
    </div>
  );
}
