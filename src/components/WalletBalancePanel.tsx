"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GaugeArc, Reticle } from "@/components/hud";

const CHARITY_WALLET = "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD";
const NEXT_PAYOUT_THRESHOLD_USD = 1000;

type BalanceResponse = {
  wallet: string;
  chain?: string;
  model?: "partner-accrual" | "native";
  balance?: { raw: string; symbol: string; formatted: number };
  usd?: { value: number | null; price: number | null; source: string | null };
  assets?: Array<{
    symbol: string;
    formatted: number;
    usd: number | null;
    originalChain: string;
  }>;
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
  // Sub-cent fees (e.g. 0.1% of a $1 swap) would render as $0.00 at two
  // decimals — show more precision when the pot is still tiny.
  const usdFrac = usd > 0 && usd < 1 ? 4 : 2;
  const accruedAssets = (data?.assets ?? []).filter((a) => a.formatted > 0);

  return (
    <div className="vh-card">
      <div className="vh-card__head">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--vh-magenta-500)" }}>
          <Reticle size={14} />
          <span className="vh-eyebrow" style={{ color: "var(--vh-magenta-500)" }}>
            Charity wallet · live telemetry
          </span>
        </span>
        <span style={{ marginLeft: "auto" }}>
          <span className="vh-pill vh-pill--live">
            <span className={`vh-pill__dot ${isFetching ? "vh-pulse" : ""}`} />
            {isFetching ? "Syncing" : "Online"}
          </span>
        </span>
      </div>

      <div
        className="vh-card__body"
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "1fr",
          alignItems: "center",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="vh-eyebrow" style={{ marginBottom: 4 }}>
            Fees accrued · this cycle
          </div>
          <div
            className="vh-display vh-num"
            style={{
              fontSize: "clamp(36px, 9vw, 64px)",
              color: "var(--vh-cyan-500)",
              textShadow: "0 0 22px var(--vh-cyan-glow)",
              wordBreak: "break-all",
            }}
          >
            ${animUsd.toLocaleString("en-US", {
              minimumFractionDigits: usdFrac,
              maximumFractionDigits: usdFrac,
            })}
          </div>
          <div
            className="vh-mono"
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "var(--vh-text-3)",
              letterSpacing: "0.06em",
            }}
          >
            {data?.model === "partner-accrual"
              ? `accrued across ${accruedAssets.length} token${accruedAssets.length === 1 ? "" : "s"} · partner registry on Sonic hub`
              : `${balanceS.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} S native`}
          </div>

          {/* Accrued token basket — itemizes even sub-cent fees */}
          {accruedAssets.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {accruedAssets.slice(0, 6).map((a, i) => (
                <div
                  key={`${a.symbol}-${a.originalChain}-${i}`}
                  className="vh-mono"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    fontSize: 11,
                    color: "var(--vh-text-3)",
                  }}
                >
                  <span>
                    <span style={{ color: "var(--vh-text-2)" }}>
                      {a.formatted.toLocaleString("en-US", { maximumFractionDigits: 6 })} {a.symbol}
                    </span>{" "}
                    <span style={{ color: "var(--vh-text-4)" }}>· {a.originalChain}</span>
                  </span>
                  {a.usd != null && (
                    <span style={{ color: "var(--vh-cyan-500)" }}>
                      ${a.usd.toLocaleString("en-US", { maximumFractionDigits: a.usd < 1 ? 4 : 2 })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 18,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--vh-text-3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              flexWrap: "wrap",
            }}
          >
            <span>
              <strong style={{ color: "var(--vh-text)" }}>{(progress * 100).toFixed(1)}%</strong> of provisional threshold
            </span>
            <span style={{ color: "var(--vh-text-4)" }}>·</span>
            <span>${NEXT_PAYOUT_THRESHOLD_USD.toLocaleString()} target</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", color: "var(--vh-cyan-500)" }}>
          <GaugeArc
            size={200}
            progress={progress}
            label={
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span
                  className="vh-display vh-num"
                  style={{
                    fontSize: 28,
                    color: "var(--vh-text)",
                    textShadow: "0 0 12px var(--vh-cyan-glow)",
                  }}
                >
                  {(progress * 100).toFixed(0)}%
                </span>
                <span
                  className="vh-eyebrow"
                  style={{ marginTop: 2, color: "var(--vh-text-3)" }}
                >
                  Gauge
                </span>
              </div>
            }
          />
        </div>
      </div>

      <div className="vh-card__foot">
        <a
          href={`https://sonicscan.org/address/${CHARITY_WALLET}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--vh-cyan-500)" }}
        >
          {CHARITY_WALLET.slice(0, 10)}…{CHARITY_WALLET.slice(-6)} ↗
        </a>
        <span style={{ color: "var(--vh-text-4)" }}>·</span>
        <span>Sonic · chain 146</span>
        {data?.usd?.source && (
          <>
            <span style={{ color: "var(--vh-text-4)" }}>·</span>
            <span>price {data.usd.source}</span>
          </>
        )}
        {data?.error && (
          <span style={{ marginLeft: "auto", color: "var(--vh-amber-500)" }}>
            ⚠ {data.error}
          </span>
        )}
      </div>
    </div>
  );
}
