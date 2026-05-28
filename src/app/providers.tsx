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
      <header className="ol-topbar">
        <div className="ol-topbar__inner">
          <span className="ol-brand">
            <span className="ol-brand__mark">S</span>
            <span className="ol-brand__name">Swaps without Borders</span>
          </span>
          <span className="ol-pill ol-pill--live" style={{ marginLeft: "auto" }}>
            <span className="ol-pill__dot ol-pulse" />
            Loading
          </span>
        </div>
      </header>
      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: 32 }}>
        <div className="ol-card" style={{ maxWidth: 360, width: "100%" }}>
          <div className="ol-card__body">
            <p className="ol-eyebrow" style={{ marginBottom: 8 }}>System</p>
            <p className="ol-h3">Bootstrapping the SODAX SDK…</p>
            <p className="ol-body" style={{ marginTop: 10 }}>
              If this hangs, ensure JavaScript is enabled.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
