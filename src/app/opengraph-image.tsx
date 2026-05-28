import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Swaps without Borders — a public ledger that quietly funds charity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#15110D";
const CREAM = "#F4ECDD";
const CREAM_MUTE = "#C2B59C";
const PERSIMMON = "#E8643C";
const JADE = "#5BA89A";
const LINE = "#3A332C";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          backgroundImage:
            "radial-gradient(900px 600px at 0% 0%, rgba(232,100,60,0.12), transparent 70%), radial-gradient(800px 600px at 100% 100%, rgba(91,168,154,0.10), transparent 70%)",
          padding: "64px 72px",
          color: CREAM,
          fontFamily: "ui-serif, Georgia, serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: PERSIMMON,
              color: "#fff",
              fontSize: 26,
              fontWeight: 700,
              borderRadius: 4,
            }}
          >
            S
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: 18,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: CREAM_MUTE,
            }}
          >
            <span>Swaps without Borders</span>
            <span style={{ margin: "0 12px", color: LINE }}>·</span>
            <span style={{ color: JADE }}>Mainnet</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 56,
            fontSize: 96,
            lineHeight: 0.98,
            letterSpacing: "-0.025em",
            fontWeight: 500,
            color: CREAM,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <span>Swaps that&nbsp;</span>
            <span
              style={{
                color: PERSIMMON,
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              quietly
            </span>
          </div>
          <div style={{ display: "flex" }}>fund charity.</div>
        </div>

        {/* Subhead */}
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: 26,
            lineHeight: 1.35,
            color: CREAM_MUTE,
            maxWidth: 880,
          }}
        >
          A public-ledger swap dapp built on SODAX V2. Every fee — a single
          tenth of a percent — routes to charity.
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 28,
            borderTop: `1px solid ${LINE}`,
            gap: 32,
          }}
        >
          <DataCell label="Fee per swap" value="0.1%" />
          <Sep />
          <DataCell label="Networks" value="18" />
          <Sep />
          <DataCell label="To charity" value="100%" accent={PERSIMMON} />
          <div style={{ marginLeft: "auto", display: "flex" }}>
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 14,
                color: CREAM_MUTE,
                letterSpacing: "0.04em",
              }}
            >
              swaps-without-borders
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function DataCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 13,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: CREAM_MUTE,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "ui-serif, Georgia, serif",
          fontSize: 36,
          letterSpacing: "-0.015em",
          color: accent ?? CREAM,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <div
      style={{ display: "flex", width: 1, height: 40, background: LINE }}
    />
  );
}
