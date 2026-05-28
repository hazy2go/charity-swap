"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const CHARITY_WALLET = "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";

// Community-set later; placeholder threshold for the next payout.
const NEXT_PAYOUT_THRESHOLD_USD = 1000;

type BalanceResponse = {
  wallet: string;
  chain?: string;
  balance?: { raw: string; symbol: string; formatted: number };
  usd?: { value: number | null; price: number | null; source: string | null };
  error?: string;
  ts?: number;
};

/**
 * Smoothly tween from `prev` to `target` over `duration` ms.
 * Returns the current display value; updates each animation frame.
 */
function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export function WalletBalancePanel({
  variant = "panel",
}: {
  variant?: "panel" | "tile";
}) {
  const { data, isFetching } = useQuery<BalanceResponse>({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      const r = await fetch("/api/wallet-balance");
      if (!r.ok) throw new Error("balance fetch failed");
      return r.json() as Promise<BalanceResponse>;
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const balanceS = data?.balance?.formatted ?? 0;
  const usd = data?.usd?.value ?? 0;
  const animS = useCountUp(balanceS);
  const animUsd = useCountUp(usd);
  const progress = Math.min(1, (usd || 0) / NEXT_PAYOUT_THRESHOLD_USD);
  const remaining = Math.max(0, NEXT_PAYOUT_THRESHOLD_USD - (usd || 0));

  const isTile = variant === "tile";

  return (
    <div className={`vc-panel ${isTile ? "" : "vc-scan"} vc-rise-2`}>
      <div className="vc-panel__strip vc-panel__strip--mag">
        <span
          className="vc-mono vc-caps"
          style={{ fontSize: 11, color: "var(--vc-magenta-500)" }}
        >
          CHARITY WALLET // LIVE
        </span>
        <span className="ml-auto vc-chip vc-chip--live">
          <span className="vc-chip__dot vc-blink" />
          {isFetching ? "SYNCING" : "ONLINE"}
        </span>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div>
            <div
              className="vc-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                color: "var(--vc-text-mute)",
                textTransform: "uppercase",
              }}
            >
              FEES ACCRUED
            </div>
            <div
              className="vc-numbig"
              style={{
                fontSize: "clamp(36px, 6vw, 56px)",
                color: "var(--vc-cyan-500)",
                textShadow: "0 0 24px var(--vc-cyan-glow)",
                lineHeight: 1,
              }}
            >
              ${animUsd.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div
              className="vc-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                color: "var(--vc-text-mute)",
                textTransform: "uppercase",
              }}
            >
              NATIVE S
            </div>
            <div
              className="vc-numbig"
              style={{
                fontSize: 22,
                color: "var(--vc-magenta-500)",
                lineHeight: 1,
              }}
            >
              {animS.toLocaleString("en-US", {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4,
              })}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div
            className="vc-mono flex justify-between mb-1.5"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--vc-text-mute)",
              textTransform: "uppercase",
            }}
          >
            <span>
              Progress to next payout
            </span>
            <span style={{ color: "var(--vc-cyan-500)" }}>
              {(progress * 100).toFixed(1)}%
            </span>
          </div>
          <div className="vc-progress">
            <div
              className="vc-progress__fill"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          <div
            className="vc-mono mt-2 flex justify-between"
            style={{
              fontSize: 10,
              color: "var(--vc-text-faint)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            <span>
              ${remaining.toLocaleString("en-US", { maximumFractionDigits: 0 })} to threshold
            </span>
            <span>
              Threshold ${NEXT_PAYOUT_THRESHOLD_USD.toLocaleString()} · provisional
            </span>
          </div>
        </div>

        {/* Address + source */}
        <div
          className="mt-5 flex flex-wrap items-center gap-2 vc-mono"
          style={{
            paddingTop: 14,
            borderTop: "1px solid var(--vc-line)",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--vc-text-mute)",
            textTransform: "uppercase",
          }}
        >
          <a
            href={`https://sonicscan.org/address/${CHARITY_WALLET}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--vc-cyan-500)" }}
          >
            {CHARITY_WALLET.slice(0, 8)}…{CHARITY_WALLET.slice(-6)} ↗
          </a>
          <span style={{ color: "var(--vc-text-faint)" }}>·</span>
          <span>SONIC // CHAIN 146</span>
          <span style={{ color: "var(--vc-text-faint)" }}>·</span>
          <span>
            S @ ${data?.usd?.price?.toFixed(4) ?? "—"}
            {data?.usd?.source && ` (${data.usd.source})`}
          </span>
          {data?.error && (
            <span
              className="ml-auto"
              style={{ color: "var(--vc-amber-500)" }}
            >
              ⚠ {data.error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
