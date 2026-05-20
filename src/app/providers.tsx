"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SodaxProvider, createSodaxQueryClient } from "@sodax/dapp-kit";
import { SodaxWalletProvider } from "@sodax/wallet-sdk-react";
import { useEffect, useState } from "react";
import { sodaxConfig } from "@/lib/sodax";
import { walletConfig } from "@/lib/wallet-config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createSodaxQueryClient());
  const [mounted, setMounted] = useState(false);

  // `@sodax/wallet-sdk-react` reads a persisted Zustand store at instantiation
  // time. In Next App Router every client component is also rendered on the
  // server, and on the server the store is not hydrated yet ⇒ "Cannot read
  // properties of undefined (reading 'hasHydrated')" 500s. Render the real
  // tree only after client mount; fall back to a static XP-themed skeleton
  // during SSR so the route still returns 200 with meaningful content.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <SsrBootSkeleton />;
  }

  return (
    <SodaxProvider config={sodaxConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider config={walletConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}

/**
 * SSR-only static shell. No state, no providers, no SDK calls.
 * Visible for a single render before client hydrates.
 */
function SsrBootSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="xp-taskbar">
        <span className="xp-start" style={{ pointerEvents: "none" }}>
          <span className="xp-start__flag" aria-hidden>⟁</span>
          <span>booting…</span>
        </span>
        <div className="xp-taskbar__task xp-taskbar__task--active hidden sm:flex">
          <span aria-hidden>🪟</span>
          <span>Swap.exe</span>
        </div>
        <div className="xp-tray">
          <span className="xp-tray__icon" aria-hidden>🔌</span>
          <span className="hidden sm:inline">builders.sodax.com/mcp</span>
          <span className="sm:hidden">MCP</span>
        </div>
      </div>
      <main
        style={{
          flex: 1,
          padding: 24,
          backgroundImage:
            "radial-gradient(circle at 8% 12%, rgba(255,255,255,0.06) 0%, transparent 22%), radial-gradient(circle at 92% 88%, rgba(0,0,0,0.18) 0%, transparent 28%)",
        }}
      >
        <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
          <div className="xp-window" style={{ width: 320 }}>
            <div className="xp-titlebar">
              <span className="xp-titlebar__icon" aria-hidden>⏳</span>
              <span className="xp-titlebar__title">Charity Swap — loading</span>
            </div>
            <div
              style={{
                background: "var(--xp-face)",
                padding: "18px 16px",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: 0 }}>Starting Windows…</p>
              <p style={{ margin: "8px 0 0", color: "#444" }}>
                Loading SODAX SDK. If this stays visible, check JavaScript is
                enabled.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
