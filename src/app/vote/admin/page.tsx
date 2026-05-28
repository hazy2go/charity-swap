"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useXAccount, useWalletProvider } from "@sodax/wallet-sdk-react";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { RegMark, Slash } from "@/components/hud";

const ADMIN_WALLET =
  (process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "0x9aA8f40bFf01E953fE278179C3888AE8195b839B").toLowerCase();

type Charity = {
  id: string;
  name: string;
  blurb: string;
  payoutKind: "wallet" | "offramp";
};

type CurrentResp = {
  round: null | {
    id: string;
    status: "open" | "closed";
    candidates: Array<{ id: string; name: string }>;
  };
};

export default function AdminVotePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="vote" />
      <main style={{ flex: 1 }} className="vh-section">
        <div className="vh-container">
          <div className="vh-rise" style={{ maxWidth: 760, marginInline: "auto" }}>
            <div className="vh-eyebrow" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ color: "var(--vh-magenta-500)" }}>
                <RegMark size={12} />
              </span>
              Vote control <Slash color="yellow" /> Admin only
            </div>
            <h1 className="vh-h1" style={{ marginBottom: 14 }}>
              Round<span style={{ color: "var(--vh-cyan-500)" }}>.</span>{" "}
              <span style={{ color: "var(--vh-magenta-500)" }}>ctrl</span>
            </h1>
            <p className="vh-lede" style={{ maxWidth: 580 }}>
              Open a new payout round with three candidate charities, or close
              the current round and declare the winner. Every action is signed
              with the admin wallet — server verifies before writing.
            </p>

            <AdminBody />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function AdminBody() {
  const evm = useXAccount({ xChainType: "EVM" });
  const isAdmin =
    !!evm.address && evm.address.toLowerCase() === ADMIN_WALLET;

  if (!evm.address) {
    return (
      <Box>
        Connect the admin wallet (top right) to access controls.
      </Box>
    );
  }
  if (!isAdmin) {
    return (
      <Box tone="warn">
        Connected wallet is <code style={{ color: "var(--vh-cyan-500)" }}>{evm.address}</code> —
        not the admin. Expected{" "}
        <code style={{ color: "var(--vh-magenta-500)" }}>{ADMIN_WALLET}</code>.
      </Box>
    );
  }
  return <AdminControls />;
}

function AdminControls() {
  const qc = useQueryClient();
  const evm = useXAccount({ xChainType: "EVM" });
  const provider = useWalletProvider({ xChainId: "0xa4b1.arbitrum" });
  // we sign on any EVM chain; arbitrum is just a non-Sonic default
  // (signMessage doesn't transact, so the chain doesn't matter for the user)

  const { data: charities, isLoading: charitiesLoading } = useQuery<Charity[]>({
    queryKey: ["admin-charities"],
    queryFn: async () => {
      const r = await fetch("/api/charities");
      if (r.ok) return r.json();
      // Fallback: derive from /api/rounds/current's resolved candidates… nope.
      // Build a quick endpoint inline: just request all from a small endpoint.
      throw new Error("charities fetch failed");
    },
    retry: false,
  });

  const { data: current } = useQuery<CurrentResp>({
    queryKey: ["round-current-admin"],
    queryFn: async () => {
      const r = await fetch("/api/rounds/current");
      if (!r.ok) throw new Error("current fetch failed");
      return r.json();
    },
    refetchInterval: 8_000,
  });

  // Open-round form state
  const [picked, setPicked] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<string>("1000");
  const [status, setStatus] = useState<{ kind: "idle" | "err" | "ok"; msg?: string }>({ kind: "idle" });

  const togglePick = (id: string) => {
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id],
    );
  };

  const sign = async (message: string): Promise<`0x${string}`> => {
    // Use viem walletClient (the SODAX wallet provider returns one)
    type SignableProvider = {
      walletClient?: {
        signMessage: (args: { account: `0x${string}`; message: string }) => Promise<`0x${string}`>;
      };
    };
    const p = provider as unknown as SignableProvider;
    if (!p?.walletClient?.signMessage) {
      throw new Error("wallet provider missing signMessage");
    }
    if (!evm.address) throw new Error("no account");
    return p.walletClient.signMessage({
      account: evm.address as `0x${string}`,
      message,
    });
  };

  const openRound = useMutation({
    mutationFn: async () => {
      if (picked.length !== 3) throw new Error("Pick exactly 3 charities");
      const thr = Number(threshold);
      if (!Number.isFinite(thr) || thr <= 0) throw new Error("Bad threshold");
      const nonce = Math.random().toString(36).slice(2, 12);
      const message = `OPEN_ROUND::${nonce}::${picked.join(",")}::${thr}`;
      const signature = await sign(message);
      const r = await fetch("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          candidateIds: picked,
          thresholdUsd: thr,
          nonce,
          signature,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string; roundId?: string };
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      return j;
    },
    onSuccess: (j) => {
      setStatus({ kind: "ok", msg: `Round opened · ${j.roundId}` });
      setPicked([]);
      qc.invalidateQueries({ queryKey: ["round-current"] });
      qc.invalidateQueries({ queryKey: ["round-current-admin"] });
    },
    onError: (e) => setStatus({ kind: "err", msg: (e as Error).message }),
  });

  const closeRound = useMutation({
    mutationFn: async (winnerId: string) => {
      const round = current?.round;
      if (!round || round.status !== "open") throw new Error("no open round");
      const nonce = Math.random().toString(36).slice(2, 12);
      const message = `CLOSE_ROUND::${nonce}::${round.id}::${winnerId}`;
      const signature = await sign(message);
      const r = await fetch("/api/rounds/close", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roundId: round.id,
          winnerId,
          nonce,
          signature,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      return j;
    },
    onSuccess: () => {
      setStatus({ kind: "ok", msg: "Round closed" });
      qc.invalidateQueries({ queryKey: ["round-current"] });
      qc.invalidateQueries({ queryKey: ["round-current-admin"] });
    },
    onError: (e) => setStatus({ kind: "err", msg: (e as Error).message }),
  });

  return (
    <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Current round */}
      <div className="vh-card">
        <div className="vh-card__head">
          <span className="vh-eyebrow">Current round</span>
          <span style={{ marginLeft: "auto" }}>
            <span className={`vh-pill ${current?.round?.status === "open" ? "vh-pill--live" : ""}`}>
              {current?.round?.status === "open" ? (
                <>
                  <span className="vh-pill__dot vh-pulse" /> Open
                </>
              ) : (
                <>None</>
              )}
            </span>
          </span>
        </div>
        <div className="vh-card__body">
          {current?.round ? (
            <>
              <div className="vh-mono" style={{ fontSize: 12, color: "var(--vh-text-2)", marginBottom: 10 }}>
                {current.round.id}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {current.round.candidates.map((c) => (
                  <div
                    key={c.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                  >
                    <span className="vh-body">{c.name}</span>
                    <button
                      type="button"
                      className="vh-btn vh-btn--magenta vh-btn--xs"
                      disabled={closeRound.isPending}
                      onClick={() => {
                        if (confirm(`Close round and declare ${c.name} the winner?`)) {
                          closeRound.mutate(c.id);
                        }
                      }}
                    >
                      Declare winner & close
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <span className="vh-body" style={{ color: "var(--vh-text-3)" }}>
              No round is currently open.
            </span>
          )}
        </div>
      </div>

      {/* Open new round */}
      <div className="vh-card">
        <div className="vh-card__head">
          <span className="vh-eyebrow">Open new round</span>
        </div>
        <div className="vh-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div
              className="vh-mono"
              style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--vh-text-3)", marginBottom: 8 }}
            >
              Pick 3 charities ({picked.length}/3)
            </div>
            {charitiesLoading ? (
              <div className="vh-body" style={{ color: "var(--vh-text-3)" }}>Loading charities…</div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {(charities ?? []).map((c) => {
                  const isPicked = picked.includes(c.id);
                  const disabled = !isPicked && picked.length >= 3;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => togglePick(c.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: isPicked ? "var(--vh-cyan-soft)" : "var(--vh-s2)",
                        border: `1px solid ${isPicked ? "var(--vh-cyan-500)" : "var(--vh-line)"}`,
                        color: isPicked ? "var(--vh-cyan-500)" : "var(--vh-text)",
                        borderRadius: "var(--vh-r)",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.4 : 1,
                        textAlign: "left",
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: `1px solid ${isPicked ? "var(--vh-cyan-500)" : "var(--vh-line-hi)"}`,
                          background: isPicked ? "var(--vh-cyan-500)" : "transparent",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          color: "var(--vh-bg)",
                          fontSize: 10,
                        }}
                      >
                        {isPicked ? "✓" : ""}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>{c.name}</span>
                      <span
                        className="vh-mono"
                        style={{ fontSize: 10, color: "var(--vh-text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}
                      >
                        {c.payoutKind}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label
              className="vh-mono"
              style={{ display: "block", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--vh-text-3)", marginBottom: 6 }}
            >
              Threshold (USD)
            </label>
            <input
              className="vh-input"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="1000"
              min={1}
            />
          </div>

          <button
            type="button"
            className="vh-btn vh-btn--primary"
            disabled={openRound.isPending || picked.length !== 3 || !!current?.round}
            onClick={() => openRound.mutate()}
          >
            {openRound.isPending ? "Signing & opening…" : "Sign & open round"}
          </button>
          {current?.round && (
            <div className="vh-mono" style={{ fontSize: 11, color: "var(--vh-text-3)" }}>
              Close the current round first.
            </div>
          )}
        </div>
      </div>

      {status.kind !== "idle" && (
        <div
          style={{
            padding: 12,
            border: `1px solid ${status.kind === "ok" ? "var(--vh-acid-soft)" : "var(--vh-magenta-soft)"}`,
            background: status.kind === "ok" ? "var(--vh-acid-soft)" : "var(--vh-magenta-soft)",
            color: status.kind === "ok" ? "var(--vh-acid-500)" : "var(--vh-magenta-500)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          <strong>{status.kind === "ok" ? "OK · " : "ERR · "}</strong>
          {status.msg}
        </div>
      )}

      <Link href="/vote" className="vh-btn vh-btn--ghost vh-btn--sm" style={{ alignSelf: "flex-end" }}>
        ← Public vote page
      </Link>
    </div>
  );
}

function Box({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return (
    <div
      style={{
        marginTop: 32,
        padding: 16,
        border: `1px solid ${tone === "warn" ? "var(--vh-magenta-soft)" : "var(--vh-cyan-soft)"}`,
        background: tone === "warn" ? "var(--vh-magenta-soft)" : "var(--vh-cyan-soft)",
        color: tone === "warn" ? "var(--vh-magenta-500)" : "var(--vh-cyan-500)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
