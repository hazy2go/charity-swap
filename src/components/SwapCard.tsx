"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  useRenewUtxos,
  loadRadfiSession,
  useXBalances,
} from "@sodax/dapp-kit";
import { useWalletProvider, useXAccount, useXService, useEvmSwitchChain } from "@sodax/wallet-sdk-react";
import { ChainKeys } from "@sodax/sdk";
import { useQuery } from "@tanstack/react-query";
import type { CreateIntentParams, XToken } from "@sodax/sdk";
import {
  CHAINS,
  tokensForChain,
  findToken,
  chainInfo,
  isNativeToken,
  isHubChain,
  xChainTypeOf,
  DEFAULT_SRC,
  DEFAULT_DST,
  type TokenInfo,
  type ChainKey,
} from "@/lib/swap-tokens";
import { formatPoints, DEFAULT_POINTS_PER_USD } from "@/lib/points";
import { Picker, type PickerGroup } from "@/components/Picker";
import { Bracketed, Arrow } from "@/components/hud";

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

const SLIPPAGE_KEY = "swb_slippage_bps";
const SLIPPAGE_PRESETS = [10, 50, 100, 300] as const; // 0.10%, 0.50%, 1.00%, 3.00%

// Gas left behind when "Max" is used on a NATIVE token (human units), so the
// swap tx still has gas to spend. Ethereum mainnet gas is dear; the L2s /
// alt-L1s are cheap, hence the small default. ERC-20 sources reserve nothing.
const NATIVE_GAS_RESERVE: Partial<Record<ChainKey, number>> = {
  [ChainKeys.ETHEREUM_MAINNET]: 0.003,
};
const DEFAULT_NATIVE_RESERVE = 0.001;

// Live progress for the swap modal so "Engaging…" never looks stuck.
type SwapPhase = {
  step: "approve" | "submit" | "confirm" | "done" | "error";
  withApprove: boolean;
  route: string;
  message?: string;
};

export function SwapCard() {
  const [srcChain, setSrcChain] = useState<ChainKey>(DEFAULT_SRC.chain);
  const [srcAddr, setSrcAddr] = useState(DEFAULT_SRC.address);
  const [dstChain, setDstChain] = useState<ChainKey>(DEFAULT_DST.chain);
  const [dstAddr, setDstAddr] = useState(DEFAULT_DST.address);
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState<number>(50); // 0.50%
  const [showSlippage, setShowSlippage] = useState(false);

  // Restore the persisted slippage choice once, after mount. (Reading
  // localStorage during render — e.g. in useMemo — is a side effect and
  // breaks SSR hydration; do it in an effect instead.)
  useEffect(() => {
    const saved = window.localStorage.getItem(SLIPPAGE_KEY);
    if (saved) {
      const n = Number(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Number.isFinite(n) && n >= 1 && n <= 5000) setSlippageBps(n);
    }
  }, []);
  const setSlip = (bps: number) => {
    const clamped = Math.max(1, Math.min(5000, Math.round(bps)));
    setSlippageBps(clamped);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SLIPPAGE_KEY, String(clamped));
    }
  };

  const src: TokenInfo =
    findToken(srcChain, srcAddr) ?? tokensForChain(srcChain)[0];
  const dst: TokenInfo =
    findToken(dstChain, dstAddr) ?? tokensForChain(dstChain)[0];

  const srcType = xChainTypeOf(src.chain);
  const dstType = xChainTypeOf(dst.chain);
  const srcIsEvm = srcType === "EVM";
  const srcAccount = useXAccount({ xChainType: srcType });
  const dstAccount = useXAccount({ xChainType: dstType });
  const walletProvider = useWalletProvider({ xChainId: src.chain });

  // CRITICAL: an EVM wallet sitting on the wrong network will broadcast the
  // intent tx on whatever chain it's on — the calldata targets the source
  // chain's assetManager, so on the wrong chain it hits that address as a
  // no-op (succeeds, moves nothing, creates no intent) and the swap hangs.
  // Force the wallet onto the source chain before signing.
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain({ xChainId: src.chain });
  const needsChainSwitch = srcIsEvm && !!srcAccount.address && isWrongChain;

  // Source-token wallet balance + Max button. Bitcoin is skipped (its Radfi
  // trading wallet has a separate balance flow). getBalances keys off
  // symbol+address and never reads hubAsset/vault, so a minimal XToken cast
  // is safe — avoids threading the full SDK token config through the picker.
  const srcIsBitcoin = src.chain === ChainKeys.BITCOIN_MAINNET;
  const srcXService = useXService({ xChainType: srcType });
  // Plain object (not memoized): useXBalances keys its query by token
  // content (symbol+address), so a fresh ref each render is harmless.
  const srcXToken = {
    symbol: src.symbol,
    name: src.name,
    decimals: src.decimals,
    address: src.address,
    chainKey: src.chain,
  } as unknown as XToken;
  const { data: srcBalances } = useXBalances({
    params: {
      xService: srcXService,
      xChainId: src.chain,
      xTokens: srcAccount.address && !srcIsBitcoin ? [srcXToken] : [],
      address: srcAccount.address,
    },
  });
  // Exactly one token queried → the single value is its raw balance.
  const srcBalanceRaw =
    srcBalances && !srcIsBitcoin ? Object.values(srcBalances)[0] ?? 0n : 0n;
  const setMax = () => {
    let raw = srcBalanceRaw;
    // Native source pays gas in the same token — leave a reserve.
    if (isNativeToken(src.address)) {
      const reserveHuman = NATIVE_GAS_RESERVE[src.chain] ?? DEFAULT_NATIVE_RESERVE;
      let reserve = 0n;
      try { reserve = parseUnits(String(reserveHuman), src.decimals); } catch { /* keep 0 */ }
      raw = raw > reserve ? raw - reserve : 0n;
    }
    setAmount(formatUnits(raw, src.decimals));
  };

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
  const { mutateAsync: renewUtxos, isPending: isRenewing } = useRenewUtxos();

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
    if (/no path/i.test(raw)) {
      // Solver returns "no path" both for genuinely unsupported routes AND
      // for amount-too-big situations (insufficient destination-side
      // liquidity). Most user-facing cases are the latter.
      return "No route at this size — try a smaller amount, or pick a different token pair.";
    }
    if (/not compatible/i.test(raw)) return "This token isn't quotable yet.";
    return "Quote unavailable for this pair.";
  })();

  // Bitcoin-aware intent params (per Radfi guide):
  //   dstAddress = trading wallet when destination is BTC
  //   minOutputAmount clamped ≥ 546 sats when destination is BTC
  //   srcAddress stays as personal wallet (SDK derives trading internally)
  // minOutputAmount uses user-settable slippage (basis points, 10000 = 100%)
  const rawMinOut = (quotedOut * BigInt(10000 - slippageBps)) / 10000n;
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
          // solver is optional in rc.8 — omit to use the default ("any solver")
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
  const [phase, setPhase] = useState<SwapPhase | null>(null);

  const needsApprove = !srcIsNative && !srcIsBtc && isApproved === false;

  // Poll the server-side confirmation (the trust boundary: the server asks
  // the solver whether the intent actually executed). Points only count
  // once a swap is confirmed, so we surface that transition to the user.
  const pollConfirm = async (id: string, pendingPts: number | null) => {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 6000));
      try {
        const r = await fetch("/api/swap-events/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!r.ok) continue;
        const j = (await r.json()) as { status?: string; pointsAwarded?: number };
        if (j.status === "confirmed") {
          const pts = j.pointsAwarded ?? pendingPts ?? 0;
          setStatus({ kind: "ok", message: `Swap confirmed · +${pts.toLocaleString()} pts credited` });
          setPhase((p) => (p ? { ...p, step: "done", message: `+${pts.toLocaleString()} pts credited` } : p));
          return;
        }
        if (j.status === "failed") {
          setStatus({ kind: "err", message: "Swap failed on-chain — no points credited." });
          setPhase((p) => (p ? { ...p, step: "error", message: "Swap failed on-chain — no points credited." } : p));
          return;
        }
      } catch { /* keep polling */ }
    }
    // Still settling after the polling window — it'll credit automatically.
    setPhase((p) =>
      p ? { ...p, step: "done", message: "Submitted — still settling. Points credit once delivered." } : p,
    );
  };

  const handleSwap = async () => {
    if (!intentParams || !walletProvider) return;
    setStatus({ kind: "idle" });
    const route = `${src.symbol} → ${dst.symbol}`;
    const withApprove = needsApprove;
    setPhase({ step: withApprove ? "approve" : "submit", withApprove, route });
    try {
      if (needsApprove) {
        await approve({ params: intentParams, walletProvider });
      }
      setPhase((p) => (p ? { ...p, step: "submit" } : p));
      // Bound the cross-chain settlement wait so the UI can't hang forever.
      const swapRes = await swap({ params: intentParams, walletProvider, timeout: 120_000 });

      // SwapResponse: { solverExecutionResponse, intent, intentDeliveryInfo }.
      // Pull every hash the server might verify against — the solver keys off
      // the hub-chain tx, which for a Sonic-destination swap is dstTxHash.
      const delivery = swapRes.intentDeliveryInfo as
        | { srcTxHash?: string; dstTxHash?: string }
        | undefined;
      const intentHashRaw = swapRes.solverExecutionResponse?.intent_hash;
      const isHash64 = (h?: string) => typeof h === "string" && /^0x[0-9a-fA-F]{64}$/.test(h);
      const isHex = (h?: string) => typeof h === "string" && /^0x[0-9a-fA-F]+$/.test(h);
      const txHash = isHash64(delivery?.srcTxHash) ? delivery!.srcTxHash : undefined;
      const dstTxHash = isHex(delivery?.dstTxHash) ? delivery!.dstTxHash : undefined;
      const intentHash = isHex(intentHashRaw) ? intentHashRaw : undefined;

      const routeId = `${src.chain}.${src.symbol}__${dst.chain}.${dst.symbol}`
        .replace(/[^A-Za-z0-9._-]/g, "-")
        .slice(0, 64);

      let eventId: string | null = null;
      let pendingPts: number | null = null;
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
            dstTxHash,
            intentHash,
          }),
        });
        if (res.ok) {
          const j = (await res.json()) as { id?: string; pointsAwarded?: number };
          eventId = j.id ?? null;
          pendingPts = j.pointsAwarded ?? null;
        }
      } catch { /* swallow — logging is best-effort */ }

      setStatus({
        kind: "ok",
        message:
          pendingPts != null
            ? `Swap submitted · +${pendingPts.toLocaleString()} pts pending confirmation…`
            : "Swap submitted — confirming on-chain…",
      });

      // Reconcile against the solver in the background; credits points only
      // once the intent actually executes.
      setPhase((p) => (p ? { ...p, step: "confirm" } : p));
      if (eventId) void pollConfirm(eventId, pendingPts);
      else setPhase((p) => (p ? { ...p, step: "done", message: "Swap submitted." } : p));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Swap failed";
      const friendly = /timeout|relay/i.test(msg)
        ? "Signed on-chain, but cross-chain delivery is taking longer than usual. It may still complete — check your wallet/explorer before resending."
        : /exceeds balance|insufficient/i.test(msg)
          ? `Not enough ${src.symbol} in your wallet for this amount.`
          : msg;
      setStatus({ kind: "err", message: friendly });
      setPhase((p) => (p ? { ...p, step: "error", message: friendly } : p));
    }
  };

  // Block swaps that exceed the wallet balance before signing — otherwise the
  // ERC-20 deposit reverts ("transfer amount exceeds balance") and the SDK
  // hangs polling the relay for a packet that never gets created.
  const srcBalanceKnown =
    !srcIsBitcoin && srcBalances !== undefined && !!srcAccount.address;
  const insufficientBalance =
    srcBalanceKnown && parsedAmount > 0n && parsedAmount > srcBalanceRaw;

  // Native gas tokens are hub-only in SODAX — a native source/dest on a spoke
  // bridges the deposit but reverts at the hub swap hook (asset minted to one
  // hub wallet, hook runs in another → balance 0, HookFailed). tokensForChain
  // already hides these from the pickers; this is the defense-in-depth block in
  // case a native token reaches the intent another way (stale state, flip, a
  // pre-filter URL). See isSwappableToken in swap-tokens.ts.
  const nativeOnSpoke =
    (isNativeToken(src.address) && !isHubChain(src.chain)) ||
    (isNativeToken(dst.address) && !isHubChain(dst.chain));

  const canSwap =
    !!intentParams &&
    !!walletProvider &&
    !isSwapping &&
    !isApproving &&
    !samePair &&
    !needsChainSwitch &&
    !insufficientBalance &&
    !nativeOnSpoke &&
    btcReady;

  const srcLabel = chainInfo(src.chain)?.label ?? srcType;
  const dstLabel = chainInfo(dst.chain)?.label ?? dstType;
  const buttonLabel = !srcAccount.address
    ? `Connect ${srcLabel}`
    : !dstAccount.address
      ? `Connect ${dstLabel}`
      : needsChainSwitch
        ? `Switch wallet to ${srcLabel}`
        : nativeOnSpoke
        ? `Native ${isNativeToken(src.address) && !isHubChain(src.chain) ? `${src.symbol} on ${srcLabel}` : `${dst.symbol} on ${dstLabel}`} isn't cross-chain swappable`
        : insufficientBalance
        ? `Insufficient ${src.symbol} balance`
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
          {srcAccount.address && !srcIsBitcoin && (
            <div
              className="vh-mono"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 11,
                letterSpacing: "0.06em",
                color: "var(--vh-text-3)",
              }}
            >
              <span style={insufficientBalance ? { color: "var(--vh-magenta-500)" } : undefined}>
                Balance:{" "}
                <span style={{ color: insufficientBalance ? "var(--vh-magenta-500)" : "var(--vh-text)" }}>
                  {Number(formatUnits(srcBalanceRaw, src.decimals)).toLocaleString("en-US", {
                    maximumFractionDigits: 6,
                  })}
                </span>{" "}
                {src.symbol}
                {insufficientBalance ? " · too low" : ""}
              </span>
              <button
                type="button"
                onClick={setMax}
                disabled={srcBalanceRaw <= 0n}
                title={
                  isNativeToken(src.address)
                    ? "Use balance minus a small gas reserve"
                    : "Use full balance"
                }
                className="vh-btn vh-btn--ghost vh-btn--xs"
                style={{ height: 24, padding: "0 10px", fontSize: 10 }}
              >
                Max
              </button>
            </div>
          )}
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
              alignItems: "center",
              gap: 8,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--vh-text-3)",
            }}
          >
            <button
              type="button"
              onClick={() => setShowSlippage((v) => !v)}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                color: "var(--vh-cyan-500)",
                fontFamily: "inherit",
                fontSize: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                cursor: "pointer",
              }}
            >
              Slippage {(slippageBps / 100).toFixed(2)}% ▾
            </button>
            <span>Solver: any</span>
          </div>
          {showSlippage && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                background: "var(--vh-inset)",
                border: "1px solid var(--vh-line)",
                borderRadius: "var(--vh-r)",
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {SLIPPAGE_PRESETS.map((bps) => (
                <button
                  key={bps}
                  type="button"
                  onClick={() => setSlip(bps)}
                  className="vh-btn vh-btn--xs"
                  style={{
                    height: 26,
                    padding: "0 8px",
                    fontSize: 10,
                    background:
                      slippageBps === bps
                        ? "var(--vh-cyan-soft)"
                        : "var(--vh-s3)",
                    color:
                      slippageBps === bps
                        ? "var(--vh-cyan-500)"
                        : "var(--vh-text-2)",
                    borderColor:
                      slippageBps === bps
                        ? "var(--vh-cyan-500)"
                        : "var(--vh-line-hi)",
                  }}
                >
                  {(bps / 100).toFixed(bps < 100 ? 2 : 1)}%
                </button>
              ))}
              <span
                style={{
                  fontSize: 10,
                  color: "var(--vh-text-3)",
                  marginLeft: 4,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Custom
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="50"
                value={(slippageBps / 100).toFixed(2)}
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  if (Number.isFinite(pct)) setSlip(pct * 100);
                }}
                style={{
                  width: 70,
                  height: 26,
                  background: "var(--vh-s3)",
                  border: "1px solid var(--vh-line-hi)",
                  borderRadius: "var(--vh-r)",
                  color: "var(--vh-text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  padding: "0 6px",
                  textAlign: "right",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: "var(--vh-text-3)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                %
              </span>
            </div>
          )}
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
            // Wrong-network guard: an EVM wallet on the wrong chain would
            // broadcast the intent on the wrong network (no-op, funds stuck,
            // swap hangs). Switch to the source chain first.
            if (needsChainSwitch) {
              try { handleSwitchChain(); } catch { /* user rejected */ }
              return;
            }
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
            // Renew expired UTXOs before swapping (Radfi requirement)
            if (
              btcInvolved &&
              srcIsBtc &&
              expiredUtxos &&
              expiredUtxos.length > 0
            ) {
              if (!btcWalletProvider) return;
              try {
                await renewUtxos({
                  txIdVouts: expiredUtxos.map(
                    (u) => u.txidVout ?? `${u.txid}:${u.vout}`,
                  ),
                  walletProvider: btcWalletProvider,
                });
                setStatus({
                  kind: "ok",
                  message: `Renewed ${expiredUtxos.length} UTXO(s). Try swap again.`,
                });
              } catch (e) {
                setStatus({
                  kind: "err",
                  message: e instanceof Error ? e.message : "renew failed",
                });
              }
              return;
            }
            await handleSwap();
          }}
          disabled={
            isSwapping || isApproving || isFunding || isRenewing ||
            radfi.isLoginPending ||
            (!needsChainSwitch && !btcInvolved && !canSwap) ||
            (btcInvolved && radfi.isAuthed && btcReady && !canSwap)
          }
        >
          {radfi.isLoginPending
            ? "Signing in…"
            : isFunding
              ? "Funding…"
              : isRenewing
                ? "Renewing UTXOs…"
                : buttonLabel} <Arrow size={12} />
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

      {phase && typeof document !== "undefined" &&
        createPortal(
          <SwapProgress phase={phase} onClose={() => setPhase(null)} />,
          document.body,
        )}
    </div>
  );
}

function SwapProgress({ phase, onClose }: { phase: SwapPhase; onClose: () => void }) {
  const steps: ReadonlyArray<"approve" | "submit" | "confirm"> = phase.withApprove
    ? ["approve", "submit", "confirm"]
    : ["submit", "confirm"];
  const labels: Record<string, { title: string; note: string }> = {
    approve: { title: "Approve token", note: "Confirm the allowance in your wallet." },
    submit: { title: "Sign & settle", note: "Sign in your wallet, then it settles cross-chain — can take ~1–2 min." },
    confirm: { title: "Confirm & credit", note: "Verifying delivery with the solver and crediting points." },
  };
  const isError = phase.step === "error";
  const isDone = phase.step === "done";
  const activeIdx = isDone ? steps.length : isError ? -1 : steps.indexOf(phase.step as "approve" | "submit" | "confirm");

  const statusOf = (i: number): "done" | "active" | "pending" | "error" => {
    if (isDone) return "done";
    if (isError) return i === Math.max(0, steps.length - 1) ? "error" : i < steps.length - 1 ? "done" : "pending";
    if (i < activeIdx) return "done";
    if (i === activeIdx) return "active";
    return "pending";
  };

  return (
    <>
      <div
        onClick={isDone || isError ? onClose : undefined}
        aria-hidden
        style={{
          position: "fixed", inset: 0, zIndex: 80,
          background: "rgba(4,6,12,0.72)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
          animation: "vh-fade-in 160ms ease both",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Swap progress"
        className="vh-card"
        style={{
          position: "fixed", zIndex: 81, left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          width: "min(92vw, 420px)", maxHeight: "88vh", overflow: "auto",
          animation: "vh-sheet-drop 200ms ease both",
        }}
      >
        <div className="vh-card__head">
          <span className="vh-eyebrow" style={{ color: isError ? "var(--vh-magenta-500)" : "var(--vh-cyan-500)" }}>
            {isError ? "Swap failed" : isDone ? "Swap complete" : "Swap in progress"}
          </span>
          <span style={{ marginLeft: "auto" }} className="vh-pill">{phase.route}</span>
        </div>

        <div className="vh-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((s, i) => {
              const st = statusOf(i);
              const color =
                st === "done" ? "var(--vh-acid-500)" :
                st === "active" ? "var(--vh-cyan-500)" :
                st === "error" ? "var(--vh-magenta-500)" : "var(--vh-text-4)";
              return (
                <div key={s} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    aria-hidden
                    className={st === "active" ? "vh-pulse" : undefined}
                    style={{
                      marginTop: 2, width: 16, height: 16, flexShrink: 0,
                      display: "grid", placeItems: "center", borderRadius: 999,
                      border: `1.5px solid ${color}`, color,
                      boxShadow: st === "active" ? "0 0 8px var(--vh-cyan-glow)" : "none",
                      fontSize: 10, fontFamily: "var(--font-mono)",
                    }}
                  >
                    {st === "done" ? "✓" : st === "error" ? "✕" : st === "active" ? "" : ""}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="vh-mono" style={{ fontSize: 13, color: st === "pending" ? "var(--vh-text-4)" : "var(--vh-text)" }}>
                      {labels[s].title}
                    </div>
                    {st === "active" && (
                      <div className="vh-mono" style={{ fontSize: 11, color: "var(--vh-text-3)", marginTop: 2, lineHeight: 1.45 }}>
                        {labels[s].note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(isDone || isError) && phase.message && (
            <div
              role="status"
              style={{
                padding: 10,
                border: `1px solid ${isError ? "var(--vh-magenta-soft)" : "var(--vh-acid-soft)"}`,
                background: isError ? "var(--vh-magenta-soft)" : "var(--vh-acid-soft)",
                color: isError ? "var(--vh-magenta-500)" : "var(--vh-acid-500)",
                fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.5,
              }}
            >
              <strong>{isError ? "ERR · " : "OK · "}</strong>{phase.message}
            </div>
          )}

          {!isDone && !isError && (
            <div className="vh-mono" style={{ fontSize: 11, color: "var(--vh-text-3)", lineHeight: 1.5 }}>
              Keep this open. Cross-chain delivery can take a minute or two — it isn&apos;t stuck.
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`vh-btn vh-btn--block ${isDone || isError ? "vh-btn--primary" : "vh-btn--ghost"}`}
          >
            {isDone || isError ? "Close" : "Hide (keeps running)"}
          </button>
        </div>
      </div>
    </>
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
