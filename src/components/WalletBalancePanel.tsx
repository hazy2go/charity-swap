"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const CHARITY_WALLET = "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";
const NEXT_PAYOUT_THRESHOLD_USD = 1000;

type BalanceResponse = {
  wallet: string;
  chain?: string;
  balance?: { raw: string; symbol: string; formatted: number };
  usd?: { value: number | null; price: number | null; source: string | null };
  error?: string;
  ts?: number;
};

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

export function WalletBalancePanel() {
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
  const animUsd = useCountUp(usd);
  const progress = Math.min(1, (usd || 0) / NEXT_PAYOUT_THRESHOLD_USD);
  const remaining = Math.max(0, NEXT_PAYOUT_THRESHOLD_USD - (usd || 0));

  return (
    <div className="ol-card">
      <div className="ol-card__header">
        <span className="ol-eyebrow" style={{ color: "var(--ol-persimmon)" }}>
          Charity wallet · live
        </span>
        <span style={{ marginLeft: "auto" }}>
          <span className="ol-pill ol-pill--live">
            <span className={`ol-pill__dot ${isFetching ? "ol-pulse" : ""}`} />
            {isFetching ? "Syncing" : "Online"}
          </span>
        </span>
      </div>

      <div className="ol-card__body">
        <div className="ol-eyebrow" style={{ marginBottom: 4 }}>
          Fees accrued · this cycle
        </div>
        <div
          className="ol-serif ol-numbig"
          style={{
            fontSize: "clamp(40px, 9vw, 72px)",
            color: "var(--ol-text)",
            lineHeight: 0.95,
          }}
        >
          $
          {animUsd.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div
          className="ol-mono"
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--ol-text-3)",
          }}
        >
          {balanceS.toLocaleString("en-US", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          })}{" "}
          S native ·{" "}
          {data?.usd?.price != null
            ? `$${data.usd.price.toFixed(4)} / S`
            : "price unavailable"}
        </div>

        {/* Progress */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--ol-text-3)",
              marginBottom: 8,
            }}
          >
            <span>
              <strong style={{ color: "var(--ol-text-2)" }}>
                {(progress * 100).toFixed(1)}%
              </strong>{" "}
              to next community vote
            </span>
            <span className="ol-mono">
              ${remaining.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
              left
            </span>
          </div>
          <div className="ol-progress">
            <div
              className="ol-progress__fill"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          <div
            className="ol-mono"
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "var(--ol-text-4)",
            }}
          >
            Threshold ${NEXT_PAYOUT_THRESHOLD_USD.toLocaleString()} ·
            provisional, community will set the real number
          </div>
        </div>
      </div>

      <div className="ol-card__footer">
        <a
          href={`https://sonicscan.org/address/${CHARITY_WALLET}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--ol-jade)" }}
        >
          {CHARITY_WALLET.slice(0, 10)}…{CHARITY_WALLET.slice(-6)} ↗
        </a>
        <span style={{ color: "var(--ol-text-4)" }}>·</span>
        <span>Sonic · chain 146</span>
        {data?.usd?.source && (
          <>
            <span style={{ color: "var(--ol-text-4)" }}>·</span>
            <span>price {data.usd.source}</span>
          </>
        )}
        {data?.error && (
          <span style={{ marginLeft: "auto", color: "var(--ol-honey)" }}>
            ⚠ {data.error}
          </span>
        )}
      </div>
    </div>
  );
}
