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
  // tree only after client mount; fall back to a static Vectorheart skeleton
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

function SsrBootSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="vc-topbar">
        <div className="vc-topbar__brand">
          <span className="vc-topbar__brand-mark">◢</span>
          <span className="vc-topbar__title">
            Swaps <span style={{ color: "var(--vc-yellow)" }}>{"//"}</span> Without Borders
          </span>
        </div>
        <div className="vc-topbar__tail">
          <span className="vc-chip vc-chip--cyan vc-blink">
            <span className="vc-chip__dot" />
            BOOT // INIT
          </span>
        </div>
      </div>
      <main
        style={{
          flex: 1,
          padding: 32,
          display: "grid",
          placeItems: "center",
          background: "var(--vc-ink)",
        }}
      >
        <div className="vc-panel vc-panel--cut vc-scan" style={{ width: 360 }}>
          <div className="vc-panel__strip">
            <span className="vc-mono vc-caps" style={{ fontSize: 11, color: "var(--vc-cyan)" }}>
              SYS // LOADING
            </span>
          </div>
          <div style={{ padding: "24px 18px" }}>
            <p
              className="vc-display vc-caps-tight"
              style={{ margin: 0, fontSize: 16, color: "var(--vc-text)" }}
            >
              Bootstrapping SODAX SDK V2
            </p>
            <p
              className="vc-mono"
              style={{ marginTop: 10, fontSize: 12, color: "var(--vc-text-mute)" }}
            >
              If this hangs, ensure JavaScript is enabled.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
