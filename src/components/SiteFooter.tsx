import Link from "next/link";

/**
 * Site-wide small footer — privacy/links style. Lives on every page.
 * Only SODAX + MCP credit links live here. Project navigation
 * (source, changelog, build log) sits on the /about page.
 */
export function SiteFooter() {
  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--vh-line)",
        background: "var(--vh-bg)",
      }}
    >
      <div className="vh-container">
        <div
          style={{
            padding: "16px 0",
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--vh-text-3)",
          }}
        >
          <span>Swaps without Borders</span>
          <span style={{ color: "var(--vh-text-4)" }}>·</span>
          <a
            href="https://sodax.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--vh-text-2)" }}
          >
            Built on SODAX V2
          </a>
          <span style={{ color: "var(--vh-text-4)" }}>·</span>
          <a
            href="https://builders.sodax.com/mcp"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--vh-cyan-500)" }}
          >
            SODAX Builders MCP
          </a>
          <Link href="/about" style={{ marginLeft: "auto", color: "var(--vh-text-2)" }}>
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
