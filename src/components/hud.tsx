import type { ReactNode } from "react";

/**
 * WipEout-3 / TDR HUD primitives. Tiny inline SVGs used as decoration
 * across the dapp. Each takes color via currentColor so they inherit
 * from the parent's `color` style.
 */

export function RegMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden
    >
      <circle cx="7" cy="7" r="3.5" />
      <line x1="7" y1="0.5" x2="7" y2="3" />
      <line x1="7" y1="11" x2="7" y2="13.5" />
      <line x1="0.5" y1="7" x2="3" y2="7" />
      <line x1="11" y1="7" x2="13.5" y2="7" />
    </svg>
  );
}

export function Reticle({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2.5" />
      <line x1="8" y1="0" x2="8" y2="4" />
      <line x1="8" y1="12" x2="8" y2="16" />
      <line x1="0" y1="8" x2="4" y2="8" />
      <line x1="12" y1="8" x2="16" y2="8" />
    </svg>
  );
}

export function Chevron({ size = 14, dir = "down" }: { size?: number; dir?: "down" | "up" | "right" }) {
  const path =
    dir === "down" ? "m3 6 5 4 5-4" : dir === "up" ? "m3 10 5-4 5 4" : "m6 3 4 5-4 5";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

export function Arrow({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 6h8" />
      <path d="m7 3 3 3-3 3" />
    </svg>
  );
}

/** Brand mark — a wedge with a notched corner, vector-shape, recognizable */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden>
      <path
        d="M1 1 H19 L25 7 V25 H7 L1 19 Z"
        fill="var(--vh-cyan-500)"
        stroke="var(--vh-cyan-500)"
        strokeWidth="0.5"
      />
      <path
        d="M7 7 H17 V17 H7 Z"
        fill="var(--vh-bg)"
      />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="9"
        fill="var(--vh-cyan-500)"
      >
        S
      </text>
    </svg>
  );
}

/** Arc gauge — used by the wallet balance panel for progress to threshold */
export function GaugeArc({
  size = 200,
  progress,
  label,
}: {
  size?: number;
  progress: number; // 0..1
  label?: ReactNode;
}) {
  const radius = (size - 22) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 240-degree arc, starting at -210deg (bottom-left), ending at +30deg (bottom-right)
  const startAngle = 150;
  const endAngle = 390;
  const sweep = endAngle - startAngle;
  const angleAt = (p: number) => startAngle + sweep * p;
  const polar = (a: number) => ({
    x: cx + radius * Math.cos((a * Math.PI) / 180),
    y: cy + radius * Math.sin((a * Math.PI) / 180),
  });
  const a0 = polar(startAngle);
  const a1 = polar(angleAt(Math.min(1, Math.max(0, progress))));
  const aEnd = polar(endAngle);
  const largeArc = (angleAt(progress) - startAngle) > 180 ? 1 : 0;

  // Tick marks every 10%
  const ticks = Array.from({ length: 11 }).map((_, i) => {
    const p = i / 10;
    const a = angleAt(p);
    const inner = {
      x: cx + (radius - 6) * Math.cos((a * Math.PI) / 180),
      y: cy + (radius - 6) * Math.sin((a * Math.PI) / 180),
    };
    const outer = {
      x: cx + (radius + 4) * Math.cos((a * Math.PI) / 180),
      y: cy + (radius + 4) * Math.sin((a * Math.PI) / 180),
    };
    const major = i % 5 === 0;
    return (
      <line
        key={i}
        x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
        stroke={major ? "var(--vh-cyan-500)" : "var(--vh-line-hi)"}
        strokeWidth={major ? 1.4 : 0.8}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* Track */}
      <path
        d={`M ${a0.x} ${a0.y} A ${radius} ${radius} 0 1 1 ${aEnd.x} ${aEnd.y}`}
        fill="none"
        stroke="var(--vh-line-hi)"
        strokeWidth="6"
        strokeLinecap="butt"
      />
      {/* Filled progress */}
      {progress > 0 && (
        <path
          d={`M ${a0.x} ${a0.y} A ${radius} ${radius} 0 ${largeArc} 1 ${a1.x} ${a1.y}`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="6"
          strokeLinecap="butt"
          style={{ filter: "drop-shadow(0 0 8px var(--vh-cyan-glow))" }}
        />
      )}
      <defs>
        <linearGradient id="gauge-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--vh-magenta-500)" />
          <stop offset="60%" stopColor="var(--vh-cyan-500)" />
          <stop offset="100%" stopColor="var(--vh-acid-500)" />
        </linearGradient>
      </defs>
      {ticks}
      {label && (
        <foreignObject x={0} y={cy - 30} width={size} height={60}>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "var(--vh-text)",
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}

/** Bracketed label  [ LIKE THIS ]  for HUD field captions */
export function Bracketed({ children, color = "cyan" }: { children: ReactNode; color?: "cyan" | "magenta" }) {
  const c =
    color === "cyan" ? "var(--vh-cyan-500)" : "var(--vh-magenta-500)";
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--vh-text-2)",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ color: c }}>[</span>
      {children}
      <span style={{ color: c }}>]</span>
    </span>
  );
}

/** Slash divider used in display copy */
export function Slash({ color = "magenta" }: { color?: "magenta" | "cyan" | "yellow" }) {
  const c = color === "magenta" ? "var(--vh-magenta-500)" : color === "cyan" ? "var(--vh-cyan-500)" : "var(--vh-yellow-500)";
  return <span style={{ color: c, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{"//"}</span>;
}
