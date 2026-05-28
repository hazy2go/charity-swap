"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useXAccount } from "@sodax/wallet-sdk-react";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { RegMark, Slash, Reticle } from "@/components/hud";

type Candidate = {
  id: string;
  name: string;
  blurb: string;
  website: string | null;
  payoutKind: "wallet" | "offramp";
  tally: { voters: number; points: number };
};

type CurrentRound = {
  round: {
    id: string;
    status: "open" | "closed";
    openedAt: string;
    openedBy: string;
    thresholdUsd: number;
    candidates: Candidate[];
    totals: { voters: number; points: number };
  } | null;
};

export default function VotePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar active="vote" />
      <main style={{ flex: 1 }} className="vh-section">
        <div className="vh-container">
          <div className="vh-rise" style={{ maxWidth: 920, marginInline: "auto" }}>
            <Header />
            <RoundView />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Header() {
  return (
    <>
      <div
        className="vh-eyebrow"
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}
      >
        <span style={{ color: "var(--vh-magenta-500)" }}>
          <RegMark size={12} />
        </span>
        Payout vote <Slash color="yellow" /> Points-weighted <Slash color="yellow" /> 1 vote per wallet
      </div>
      <h1 className="vh-h1" style={{ marginBottom: 14 }}>
        Vote<span style={{ color: "var(--vh-magenta-500)" }}>.</span>
      </h1>
      <p className="vh-lede" style={{ maxWidth: 640 }}>
        When the charity wallet crosses the community-set threshold, an admin
        opens a round with three candidates. Connected wallets vote — the
        weight is your points balance at vote-cast time.{" "}
        <strong style={{ color: "var(--vh-text)" }}>
          Winner gets the full balance.
        </strong>
      </p>
    </>
  );
}

function RoundView() {
  const { data, isLoading, error } = useQuery<CurrentRound>({
    queryKey: ["round-current"],
    queryFn: async () => {
      const r = await fetch("/api/rounds/current");
      if (!r.ok) throw new Error("failed to fetch round");
      return r.json() as Promise<CurrentRound>;
    },
    refetchInterval: 12_000,
  });

  if (isLoading) {
    return (
      <div className="vh-card" style={{ marginTop: 32, padding: "32px 22px", textAlign: "center" }}>
        <div className="vh-mono" style={{ color: "var(--vh-text-3)" }}>Loading round…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        style={{
          marginTop: 32,
          padding: 14,
          border: "1px solid var(--vh-magenta-soft)",
          background: "var(--vh-magenta-soft)",
          color: "var(--vh-magenta-500)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <strong>Error · </strong>{(error as Error).message}
      </div>
    );
  }

  if (!data?.round) {
    return <NoRound />;
  }

  return <OpenRound round={data.round} />;
}

function NoRound() {
  return (
    <div className="vh-card" style={{ marginTop: 32, padding: "44px 22px", textAlign: "center" }}>
      <span style={{ display: "inline-flex", color: "var(--vh-text-3)", marginBottom: 12 }}>
        <Reticle size={28} />
      </span>
      <div className="vh-h3" style={{ marginBottom: 8 }}>
        No round open right now.
      </div>
      <p className="vh-body" style={{ fontSize: 14, color: "var(--vh-text-3)", maxWidth: 460, marginInline: "auto" }}>
        The next round opens when the charity wallet crosses the community-set
        threshold. Until then, keep swapping — your points compound for when
        the time comes.
      </p>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        <Link href="/" className="vh-btn vh-btn--ghost vh-btn--sm">Open swap</Link>
        <Link href="/charities" className="vh-btn vh-btn--ghost vh-btn--sm">See candidates</Link>
      </div>
    </div>
  );
}

function OpenRound({ round }: { round: NonNullable<CurrentRound["round"]> }) {
  const evmAccount = useXAccount({ xChainType: "EVM" });
  const qc = useQueryClient();

  // Has this wallet already voted? Detect via tallies (rough — we look up later for proper proof)
  const wallet = evmAccount.address;

  const totalPoints = Math.max(1, round.totals.points);

  const [pickedId, setPickedId] = useState<string | null>(null);

  const cast = useMutation({
    mutationFn: async (candidateId: string) => {
      if (!wallet) throw new Error("Connect an EVM wallet to vote");
      const r = await fetch("/api/ballots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roundId: round.id, wallet, candidateId }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string; pointsCast?: number };
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["round-current"] });
      setPickedId(null);
    },
  });

  return (
    <div style={{ marginTop: 28 }}>
      {/* Round meta strip */}
      <div
        className="vh-card"
        style={{
          marginBottom: 18,
          padding: "12px 16px",
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: 8,
        }}
      >
        <span className="vh-pill vh-pill--live">
          <span className="vh-pill__dot vh-pulse" />
          Open
        </span>
        <span
          className="vh-mono"
          style={{ fontSize: 12, color: "var(--vh-text-2)" }}
        >
          Threshold ${round.thresholdUsd.toLocaleString()}
        </span>
        <span style={{ color: "var(--vh-text-4)" }}>·</span>
        <span
          className="vh-mono"
          style={{ fontSize: 12, color: "var(--vh-text-2)" }}
        >
          {round.totals.voters} voter{round.totals.voters === 1 ? "" : "s"} ·{" "}
          {round.totals.points.toLocaleString()} pts cast
        </span>
        <span style={{ marginLeft: "auto", color: "var(--vh-text-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          opened {new Date(round.openedAt).toLocaleString()}
        </span>
      </div>

      {!wallet && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: "1px solid var(--vh-cyan-soft)",
            background: "var(--vh-cyan-soft)",
            color: "var(--vh-cyan-500)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          Connect an EVM wallet (top right) to cast a vote.
        </div>
      )}

      {cast.error && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: "1px solid var(--vh-magenta-soft)",
            background: "var(--vh-magenta-soft)",
            color: "var(--vh-magenta-500)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          <strong>Error · </strong>{(cast.error as Error).message}
        </div>
      )}

      {cast.data && cast.data.ok && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: "1px solid var(--vh-acid-soft)",
            background: "var(--vh-acid-soft)",
            color: "var(--vh-acid-500)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          <strong>OK · </strong>
          Vote cast with {cast.data.pointsCast?.toLocaleString()} points.
        </div>
      )}

      {/* Candidate cards */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: 14,
          gridTemplateColumns: "1fr",
        }}
        className="sm:grid-cols-3"
      >
        {round.candidates.map((c, idx) => {
          const pct = (c.tally.points / totalPoints) * 100;
          return (
            <li key={c.id} className="vh-card">
              <div className="vh-card__head">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--vh-cyan-500)",
                  }}
                >
                  <Reticle size={12} />
                  <span className="vh-eyebrow" style={{ color: "var(--vh-cyan-500)" }}>
                    Candidate {String(idx + 1).padStart(2, "0")}
                  </span>
                </span>
                <span style={{ marginLeft: "auto" }} className="vh-pill">
                  {c.payoutKind}
                </span>
              </div>
              <div className="vh-card__body">
                <h3 className="vh-h3" style={{ marginBottom: 8 }}>{c.name}</h3>
                <p className="vh-body" style={{ minHeight: 64 }}>
                  {c.blurb}
                </p>

                {/* Tally */}
                <div style={{ marginTop: 14, marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--vh-text-3)",
                      marginBottom: 6,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>{c.tally.voters} voter{c.tally.voters === 1 ? "" : "s"}</span>
                    <span style={{ color: "var(--vh-cyan-500)" }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "var(--vh-inset)",
                      border: "1px solid var(--vh-line)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, var(--vh-magenta-500) 0%, var(--vh-cyan-500) 100%)",
                        boxShadow: "0 0 10px var(--vh-cyan-glow)",
                        transition: "width 600ms cubic-bezier(0.22,0.72,0.18,1)",
                      }}
                    />
                  </div>
                  <div
                    className="vh-mono"
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "var(--vh-text-3)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {c.tally.points.toLocaleString()} pts
                  </div>
                </div>

                <button
                  type="button"
                  className={`vh-btn vh-btn--block ${pickedId === c.id ? "vh-btn--primary" : "vh-btn--ghost"}`}
                  disabled={!wallet || cast.isPending}
                  onClick={() => {
                    setPickedId(c.id);
                    cast.mutate(c.id);
                  }}
                >
                  {cast.isPending && pickedId === c.id
                    ? "Casting…"
                    : `Vote for ${c.name.split(" ")[0]}`}
                </button>

                {c.website && (
                  <div style={{ marginTop: 10 }}>
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--vh-cyan-500)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {c.website.replace(/^https?:\/\//, "")} ↗
                    </a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
