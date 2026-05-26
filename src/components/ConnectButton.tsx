"use client";

import { useEffect, useRef, useState } from "react";
import {
  useXAccount,
  useXConnect,
  useXConnectors,
  useXDisconnect,
  sortConnectors,
  type IXConnector,
} from "@sodax/wallet-sdk-react";
import type { ChainType } from "@sodax/types";

const PREFERRED = ["hana", "metamask", "rabby"] as const;

// Every ecosystem the dapp can swap across. Each gets its own connect
// group; a cross-ecosystem swap (e.g. Solana → Sonic) needs a wallet
// connected on both sides.
const ECOSYSTEMS: { type: ChainType; label: string }[] = [
  { type: "EVM", label: "EVM" },
  { type: "SOLANA", label: "Solana" },
  { type: "SUI", label: "Sui" },
  { type: "INJECTIVE", label: "Injective" },
  { type: "ICON", label: "ICON" },
  { type: "STELLAR", label: "Stellar" },
  { type: "NEAR", label: "NEAR" },
];

export function ConnectButton() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // One useXAccount per ecosystem (fixed order — hook-safe). Drives the
  // button label / connected count.
  const accounts: (string | undefined)[] = [
    useXAccount({ xChainType: "EVM" }).address,
    useXAccount({ xChainType: "SOLANA" }).address,
    useXAccount({ xChainType: "SUI" }).address,
    useXAccount({ xChainType: "INJECTIVE" }).address,
    useXAccount({ xChainType: "ICON" }).address,
    useXAccount({ xChainType: "STELLAR" }).address,
    useXAccount({ xChainType: "NEAR" }).address,
  ];
  const connectedCount = accounts.filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    let armed = false;
    const arm = setTimeout(() => {
      armed = true;
    }, 0);
    const onMouseDown = (e: MouseEvent) => {
      if (!armed) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(arm);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative h-full" ref={wrapperRef}>
      <button
        className="xp-start h-full"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="xp-start__flag">⟁</span>
        <span>
          {connectedCount > 0 ? `Wallets ✓ ${connectedCount}` : "Connect"}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 top-full mt-[2px] w-[340px] xp-window !p-[2px] !rounded-md"
          role="menu"
        >
          {/* Banner */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-t-md"
            style={{
              background: "linear-gradient(180deg,#8a99b8 0%,#5b6e92 40%,#41547a 100%)",
              color: "#fff",
              textShadow: "1px 1px 0 rgba(0,0,0,0.35)",
              borderBottom: "1px solid #1c2638",
            }}
          >
            <div className="xp-start__flag" aria-hidden>⟁</div>
            <div className="leading-tight">
              <div className="text-[12px] font-bold">Connect Wallets</div>
              <div className="text-[10px] opacity-90">
                One per ecosystem · both sides for cross-chain swaps
              </div>
            </div>
          </div>

          <div className="bg-white max-h-[60vh] overflow-y-auto">
            {ECOSYSTEMS.map((e) => (
              <WalletGroup key={e.type} xChainType={e.type} label={e.label} />
            ))}
          </div>

          <div
            className="px-3 py-2 text-[10px] flex items-center justify-between"
            style={{
              background: "var(--xp-face)",
              borderTop: "1px solid var(--xp-shadow)",
              boxShadow: "inset 0 1px 0 0 var(--xp-hi)",
            }}
          >
            <span className="text-[#444]">🛡 {connectedCount} connected</span>
            <span className="text-[#444]">SODAX · all networks</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletGroup({
  xChainType,
  label,
}: {
  xChainType: ChainType;
  label: string;
}) {
  const raw = useXConnectors({ xChainType });
  const connectors =
    xChainType === "EVM" ? sortConnectors(raw, { preferred: PREFERRED }) : raw;
  const { mutateAsync: connect, isPending } = useXConnect();
  const account = useXAccount({ xChainType });
  const disconnect = useXDisconnect();

  if (connectors.length === 0 && !account.address) return null;

  const short = account.address
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : null;

  return (
    <div className="border-b border-[#e2e2e2] last:border-b-0">
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <span className="text-[10px] uppercase tracking-wider text-[#666] font-bold">
          {label}
        </span>
        {short && (
          <span className="flex items-center gap-1 text-[10px]">
            <span className="text-[#0a7a0a]">●</span>
            <span className="font-mono text-[#333]">{short}</span>
            <button
              onClick={() => disconnect({ xChainType })}
              className="xp-button !min-w-0 !h-[16px] !px-1.5 !text-[9px]"
              title={`Disconnect ${label}`}
            >
              ×
            </button>
          </span>
        )}
      </div>
      <div className="flex flex-col pb-1">
        {connectors.map((c: IXConnector) => (
          <button
            key={c.id}
            onClick={() => connect(c).catch(() => {})}
            disabled={isPending}
            className="group flex items-center gap-3 px-2 py-1.5 text-left text-[12px] text-black hover:bg-[var(--xp-blue)] hover:text-white disabled:opacity-50"
            role="menuitem"
          >
            <span className="w-6 h-6 grid place-items-center bg-[#f1f0e8] border border-[#999] xp-bevel-out">
              {c.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon} alt="" width={16} height={16} />
              ) : (
                <span className="text-sm">🔌</span>
              )}
            </span>
            <span className="flex-1">
              <span className="font-semibold">{c.name}</span>
              {!c.isInstalled && (
                <span className="ml-2 text-[10px] opacity-70 group-hover:opacity-100">
                  (not installed)
                </span>
              )}
            </span>
            <span className="text-[10px] opacity-60 group-hover:opacity-100">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
