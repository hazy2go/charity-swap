import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Swaps without Borders — cross-chain swaps that fund charity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#06080F";
const TEXT = "#E8F1F7";
const TEXT_2 = "#A6B4C8";
const CYAN = "#21D4E5";
const MAGENTA = "#FF4FB8";
const YELLOW = "#F5D300";
const LINE = "#232A3D";

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
            "radial-gradient(900px 600px at 100% 100%, rgba(33,212,229,0.18), transparent 70%), radial-gradient(900px 600px at 0% 0%, rgba(255,79,184,0.14), transparent 70%)",
          color: TEXT,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "56px 64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: CYAN,
              color: BG,
              fontSize: 24,
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            S
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "ui-monospace, monospace",
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: TEXT_2,
            }}
          >
            <span>Swaps without Borders</span>
            <span style={{ margin: "0 12px", color: YELLOW }}>//</span>
            <span style={{ color: CYAN }}>Mainnet</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 56,
            fontSize: 104,
            lineHeight: 0.98,
            letterSpacing: "-0.012em",
            color: TEXT,
          }}
        >
          <div style={{ display: "flex" }}>Cross-chain swaps</div>
          <div style={{ display: "flex" }}>
            <span style={{ color: CYAN }}>that fund</span>
            <span style={{ marginLeft: 24, color: MAGENTA }}>charity.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: 24,
            lineHeight: 1.4,
            color: TEXT_2,
            maxWidth: 920,
          }}
        >
          Built on SODAX SDK V2. Every fee — a single tenth of a percent —
          routes to a public charity wallet on Sonic.
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 28,
            borderTop: `1px solid ${LINE}`,
            gap: 36,
          }}
        >
          <Stat label="Fee per swap" value="0.1%" />
          <Sep />
          <Stat label="Networks" value="18" />
          <Sep />
          <Stat label="To charity" value="100%" accent={MAGENTA} />
          <div style={{ marginLeft: "auto", display: "flex" }}>
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 14,
                color: TEXT_2,
                letterSpacing: "0.06em",
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: TEXT_2,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 38, letterSpacing: "-0.01em", color: accent ?? TEXT }}>
        {value}
      </span>
    </div>
  );
}

function Sep() {
  return <div style={{ display: "flex", width: 1, height: 44, background: LINE }} />;
}
