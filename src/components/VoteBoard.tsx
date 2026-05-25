"use client";

import { useMemo, useState } from "react";

export type VoteCharity = {
  id: string;
  name: string;
  blurb: string;
};

// UI SHELL ONLY (Day 10 brought forward). No wallet points, no backend.
// A fixed demo budget lets visitors feel the points-weighted allocation
// UX; the real budget = a wallet's points from confirmed swaps, and the
// "Cast ballot" path lands with /api/ballots on Day 11. Nothing here
// writes anywhere or moves a cent.
const DEMO_BUDGET = 1000;
const STEP = 50;

export function VoteBoard({ charities }: { charities: VoteCharity[] }) {
  const [alloc, setAlloc] = useState<Record<string, number>>(() =>
    Object.fromEntries(charities.map((c) => [c.id, 0])),
  );

  const spent = useMemo(
    () => Object.values(alloc).reduce((a, b) => a + b, 0),
    [alloc],
  );
  const remaining = DEMO_BUDGET - spent;

  function bump(id: string, delta: number) {
    setAlloc((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      // Don't let the board exceed the demo budget.
      const others = spent - (prev[id] ?? 0);
      const capped = Math.min(next, DEMO_BUDGET - others);
      return { ...prev, [id]: capped };
    });
  }

  function reset() {
    setAlloc(Object.fromEntries(charities.map((c) => [c.id, 0])));
  }

  return (
    <div className="xp-window w-[640px] max-w-[95vw]">
      <div className="xp-titlebar">
        <span className="xp-titlebar__icon" aria-hidden>🗳</span>
        <span className="xp-titlebar__title">
          Vote.exe — Swaps without Borders
        </span>
        <div className="xp-titlebar__controls">
          <a href="/" className="xp-ctrl xp-ctrl--close" aria-label="Close" tabIndex={-1}>
            <span style={{ fontWeight: "bold", lineHeight: 1 }}>×</span>
          </a>
        </div>
      </div>

      <div className="xp-menubar">
        <span className="xp-menubar__item"><u>F</u>ile</span>
        <span className="xp-menubar__item"><u>V</u>iew</span>
        <span className="xp-menubar__item"><u>H</u>elp</span>
        <span className="ml-auto self-center pr-1">
          <span className="xp-pill xp-pill--info">PREVIEW · not live</span>
        </span>
      </div>

      <div className="bg-[var(--xp-face)] px-4 py-4">
        <div className="xp-readout !block !text-[11px] mb-3 leading-snug">
          <strong>How payout voting will work:</strong> when the charity wallet
          crosses the community-set threshold, a vote opens. You spend the points
          you earned from confirmed swaps to back the charities you want funded —
          points are weight, not currency, and nothing leaves your wallet.
          <br />
          <span className="text-[#7a0a0a]">
            This is a UI preview. Live voting needs the fee + multisig (Day 9) and
            the ballot backend (Day 11). The budget below is a fixed demo amount.
          </span>
        </div>

        {/* Budget meter */}
        <div className="xp-fieldset mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold">Your points (demo)</span>
            <span className="font-mono">
              {spent.toLocaleString()} / {DEMO_BUDGET.toLocaleString()} spent ·{" "}
              <strong>{remaining.toLocaleString()} left</strong>
            </span>
          </div>
          <div className="xp-bevel-in h-3 w-full overflow-hidden">
            <div
              className="h-full bg-[#316ac5] transition-all"
              style={{ width: `${(spent / DEMO_BUDGET) * 100}%` }}
            />
          </div>
        </div>

        <ul className="space-y-2">
          {charities.map((c) => {
            const pts = alloc[c.id] ?? 0;
            const share = spent > 0 ? (pts / spent) * 100 : 0;
            return (
              <li key={c.id} className="xp-readout !block !p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-[13px]">{c.name}</div>
                    <div className="text-[11px] text-[#444] mt-0.5 leading-snug">
                      {c.blurb}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="xp-button !px-2 !py-0.5"
                      onClick={() => bump(c.id, -STEP)}
                      disabled={pts === 0}
                      aria-label={`Remove ${STEP} points from ${c.name}`}
                    >
                      −
                    </button>
                    <span className="font-mono text-[12px] w-14 text-center tabular-nums">
                      {pts.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      className="xp-button !px-2 !py-0.5"
                      onClick={() => bump(c.id, STEP)}
                      disabled={remaining <= 0}
                      aria-label={`Add ${STEP} points to ${c.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                {pts > 0 && (
                  <div className="mt-2">
                    <div className="xp-bevel-in h-2 w-full overflow-hidden">
                      <div
                        className="h-full bg-[#4a8f3c] transition-all"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-[#666] mt-0.5 font-mono">
                      {share.toFixed(1)}% of your cast points
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" className="xp-button" onClick={reset} disabled={spent === 0}>
            Reset
          </button>
          <div className="flex gap-2">
            <a href="/charities" className="xp-button">Charities</a>
            <button
              type="button"
              className="xp-button xp-button--primary"
              disabled
              title="Voting opens after the Day 9 fee/multisig and the Day 11 ballot backend"
            >
              Cast ballot (Day 11)
            </button>
          </div>
        </div>
      </div>

      <div className="xp-statusbar">
        <span className="xp-statusbar__cell">
          {charities.length} candidate(s) · points-weighted
        </span>
        <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
          Day 10 · UI shell
        </span>
      </div>
    </div>
  );
}
