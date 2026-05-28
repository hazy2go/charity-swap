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

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <SsrBootSkeleton />;

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
      <header className="vh-topbar">
        <div className="vh-topbar__inner">
          <span className="vh-brand">
            <span className="vh-brand__mark">
              <svg width={24} height={24} viewBox="0 0 26 26" aria-hidden>
                <path d="M1 1H19L25 7V25H7L1 19Z" fill="var(--vh-cyan-500)" />
              </svg>
            </span>
            <span className="vh-brand__name">Swaps without Borders</span>
          </span>
          <span className="vh-pill vh-pill--live" style={{ marginLeft: "auto" }}>
            <span className="vh-pill__dot vh-pulse" />
            Boot
          </span>
        </div>
        <div className="vh-hazard" aria-hidden />
      </header>
      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: 32 }}>
        <div className="vh-card" style={{ maxWidth: 360 }}>
          <div className="vh-card__head">
            <span className="vh-eyebrow">System</span>
            <span className="vh-pill vh-pill--cyan" style={{ marginLeft: "auto" }}>Loading</span>
          </div>
          <div className="vh-card__body">
            <div className="vh-h3" style={{ marginBottom: 6 }}>Bootstrapping the SODAX SDK.</div>
            <p className="vh-body">If this hangs, ensure JavaScript is enabled.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
