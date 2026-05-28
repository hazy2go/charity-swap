import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Swaps without Borders — cross-chain swaps where 100% of fees go to charity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pure-CSS Vectorheart OG card. Edge-runtime safe.
// next/og requires every div with > 1 child to have an explicit `display`.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#08090B",
          backgroundImage:
            "radial-gradient(circle at 18% 8%, rgba(255,46,136,0.22) 0%, transparent 42%), radial-gradient(circle at 92% 98%, rgba(0,229,255,0.18) 0%, transparent 46%)",
          position: "relative",
          padding: 56,
          fontFamily: "system-ui, sans-serif",
          color: "#F2F4F7",
        }}
      >
        {/* Diagonal corner cut — magenta + cyan stripes */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 360,
            height: 360,
            display: "flex",
            background:
              "linear-gradient(135deg, transparent 0%, transparent 56%, #FF2E88 56%, #FF2E88 60%, transparent 60%, transparent 70%, #00E5FF 70%, #00E5FF 72%, transparent 72%)",
          }}
        />
        {/* Halftone dots — top right */}
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            width: 220,
            height: 220,
            display: "flex",
            opacity: 0.5,
            backgroundImage:
              "radial-gradient(circle, rgba(0,229,255,0.45) 1.2px, transparent 1.5px)",
            backgroundSize: "16px 16px",
          }}
        />

        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: "#FF2E88",
              color: "#fff",
              fontWeight: 900,
              fontSize: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
            }}
          >
            ◢
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: "0.22em",
              color: "#7A8294",
              textTransform: "uppercase",
            }}
          >
            <span>TYPE-WB.01</span>
            <span style={{ color: "#FFE600", margin: "0 8px" }}>//</span>
            <span>SODAX V2</span>
          </div>
        </div>

        {/* Massive headline */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            fontSize: 128,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: "-0.025em",
          }}
        >
          <div style={{ display: "flex" }}>
            <span>SWAPS</span>
            <span style={{ color: "#FF2E88", marginLeft: 12 }}>//</span>
          </div>
          <div style={{ display: "flex" }}>
            <span>WITHOUT</span>
            <span style={{ color: "#00E5FF" }}>.</span>
          </div>
          <div style={{ display: "flex", color: "#EFEAE0" }}>BORDERS</div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 24,
            paddingTop: 28,
            borderTop: "1px solid #2E3542",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "12px 20px",
              background: "#FFE600",
              color: "#08090B",
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              boxShadow: "0 0 0 2px #FFE600, 4px 4px 0 0 #FF2E88",
            }}
          >
            0.1% → CHARITY
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 22,
              color: "#7A8294",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>CROSS-CHAIN</span>
            <span style={{ margin: "0 12px" }}>·</span>
            <span>18 NETWORKS</span>
            <span style={{ margin: "0 12px" }}>·</span>
            <span>100% TO CHARITY</span>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontFamily: "monospace",
              fontSize: 18,
              color: "#00E5FF",
              letterSpacing: "0.12em",
            }}
          >
            swaps-without-borders
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
