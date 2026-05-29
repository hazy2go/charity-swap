"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useSodaxContext } from "@sodax/dapp-kit";
import { useXAccount, useWalletProvider, useEvmSwitchChain } from "@sodax/wallet-sdk-react";
import { chainInfo, type ChainKey } from "@/lib/swap-tokens";
import { scanStranded, executeRecovery, type StrandedAsset } from "@/lib/recovery";
import { Bracketed } from "@/components/hud";

// One recoverable balance. Owns the chain-specific wallet hooks for its
// derivation chain (so each row can switch the wallet + sign independently).
function RecoverRow({
  item,
  user,
  onDone,
}: {
  item: StrandedAsset;
  user: `0x${string}`;
  onDone: () => void;
}) {
  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider({ xChainId: item.derivationChainKey });
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain({ xChainId: item.derivationChainKey });

  const [phase, setPhase] = useState<"idle" | "working" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");

  const fromLabel = chainInfo(item.derivationChainKey)?.label ?? item.derivationChainKey;
  const toLabel = chainInfo(item.homeChainKey as ChainKey)?.label ?? item.homeChainKey;
  const amount = Number(formatUnits(item.balance, item.decimals)).toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });

  const recover = async () => {
    if (!walletProvider) return;
    setPhase("working");
    setMsg("Simulating…");
    try {
      const res = await executeRecovery(sodax, item, user, walletProvider);
      if (res.ok) {
        setPhase("ok");
        setMsg(`Signed on ${fromLabel}. Your ${item.symbol} is being returned to ${toLabel} — usually 1–2 min.`);
        onDone();
      } else {
        setPhase("err");
        setMsg(res.error);
      }
    } catch (e) {
      setPhase("err");
      setMsg(e instanceof Error ? e.message : "Recovery failed");
    }
  };

  const busy = phase === "working";
  const label = busy
    ? "Recovering…"
    : isWrongChain
      ? `Switch wallet to ${fromLabel}`
      : `Recover to ${toLabel}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        border: "1px solid var(--vh-line)",
        background: "var(--vh-surface-2, rgba(255,255,255,0.02))",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span className="vh-mono" style={{ fontSize: 14, color: "var(--vh-text)" }}>
          {amount} {item.symbol}
        </span>
        <span
          className="vh-mono"
          style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--vh-text-3)" }}
        >
          stuck on {fromLabel} → {toLabel}
        </span>
      </div>

      {phase === "ok" ? (
        <span className="vh-mono" style={{ fontSize: 11, color: "var(--vh-cyan-500)" }}>
          ✓ {msg}
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={isWrongChain ? handleSwitchChain : recover}
            disabled={busy || !walletProvider}
            className="vh-btn vh-btn--mag"
            style={{ height: 34, fontSize: 12 }}
          >
            {label}
          </button>
          {phase === "err" && (
            <span className="vh-mono" style={{ fontSize: 11, color: "var(--vh-magenta-500)" }}>
              {msg}
            </span>
          )}
          {busy && (
            <span className="vh-mono" style={{ fontSize: 11, color: "var(--vh-text-3)" }}>
              {msg}
            </span>
          )}
        </>
      )}
    </div>
  );
}

// "Recover stuck funds" panel. Stays invisible for the common case (no parked
// balances); appears only when the connected EVM wallet has hub assets stranded
// by a failed cross-chain hook (e.g. the native-token swap bug, CHANGELOG v1.0.1).
export function RecoverCard() {
  const { sodax } = useSodaxContext();
  const evm = useXAccount({ xChainType: "EVM" });
  const [items, setItems] = useState<StrandedAsset[] | null>(null);
  const [nonce, setNonce] = useState(0); // bump to re-scan after a recovery

  useEffect(() => {
    let cancelled = false;
    const addr = evm.address;
    (async () => {
      if (!addr) {
        if (!cancelled) setItems(null);
        return;
      }
      try {
        const found = await scanStranded(sodax, addr);
        if (!cancelled) setItems(found);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [evm.address, sodax, nonce]);

  // Nothing connected, still scanning, or nothing stranded → render nothing.
  if (!evm.address || !items || items.length === 0) return null;

  return (
    <div className="vh-card vh-scan" style={{ marginTop: 14 }}>
      <div className="vh-card__head">
        <span className="vh-eyebrow" style={{ color: "var(--vh-magenta-500)" }}>
          Recover // Stuck funds
        </span>
        <span style={{ marginLeft: "auto" }}>
          <span className="vh-pill vh-pill--mag">{items.length} found</span>
        </span>
      </div>
      <div className="vh-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Bracketed color="magenta">Parked on the Sonic hub</Bracketed>
          <p className="vh-mono" style={{ fontSize: 11, lineHeight: 1.5, color: "var(--vh-text-3)", margin: 0 }}>
            These balances bridged to the hub but a swap step didn&apos;t complete. They&apos;re safe — sign once on the
            origin chain to return them to your wallet. We simulate every withdrawal before you sign.
          </p>
        </div>
        {items.map((item) => (
          <RecoverRow
            key={`${item.derivationChainKey}:${item.hubAsset}`}
            item={item}
            user={evm.address as `0x${string}`}
            onDone={() => setNonce((n) => n + 1)}
          />
        ))}
      </div>
    </div>
  );
}
