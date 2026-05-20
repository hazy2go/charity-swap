"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SodaxProvider, createSodaxQueryClient } from "@sodax/dapp-kit";
import { SodaxWalletProvider } from "@sodax/wallet-sdk-react";
import { useState } from "react";
import { sodaxConfig } from "@/lib/sodax";
import { walletConfig } from "@/lib/wallet-config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createSodaxQueryClient());

  return (
    <SodaxProvider config={sodaxConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider config={walletConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
