"use client";

import { useEffect, useState } from "react";
import {
  useXAccount,
  useXConnect,
  useXConnectors,
  useXDisconnect,
  sortConnectors,
  type IXConnector,
} from "@sodax/wallet-sdk-react";

const PREFERRED = ["hana", "metamask", "rabby"] as const;

/**
 * Disconnected → Windows XP green "start" button (silver themed here).
 * Connected   → tray pill showing the address with disconnect-on-click.
 * Open menu   → start menu panel with vertical wallet list.
 */
export function ConnectButton() {
  const [open, setOpen] = useState(false);
  const raw = useXConnectors({ xChainType: "EVM" });
  const connectors = sortConnectors(raw, { preferred: PREFERRED });
  const { mutateAsync: connect, isPending, error } = useXConnect();
  const account = useXAccount({ xChainType: "EVM" });
  const disconnect = useXDisconnect();

  // ---- Connected state (system tray) ----
  if (account.address) {
    const short = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`;
    return (
      <div className="xp-tray">
        <span className="xp-tray__icon" title="Wallet connected">●</span>
        <span className="font-mono">{short}</span>
        <button
          onClick={() => disconnect({ xChainType: "EVM" })}
          className="xp-button !min-w-0 !h-[18px] !px-2 !text-[10px]"
          title="Disconnect wallet"
        >
          ×
        </button>
        <span className="opacity-80">|</span>
        <span title="Network">EVM</span>
        <span className="opacity-80">|</span>
        <ClockBlock />
      </div>
    );
  }

  // ---- Disconnected state — Start button + Start menu ----
  return (
    <div className="relative h-full">
      <button
        className="xp-start h-full"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="xp-start__flag">⟁</span>
        <span>{isPending ? "connecting…" : "Connect"}</span>
      </button>

      {open && (
        <>
          {/* click-away */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <StartMenu
            connectors={connectors}
            onConnect={async (c) => {
              try {
                await connect(c);
              } catch {
                /* surfaced via error */
              } finally {
                setOpen(false);
              }
            }}
            error={error?.message}
            isPending={isPending}
          />
        </>
      )}
    </div>
  );
}

function StartMenu({
  connectors,
  onConnect,
  error,
  isPending,
}: {
  connectors: IXConnector[];
  onConnect: (c: IXConnector) => void;
  error?: string;
  isPending: boolean;
}) {
  return (
    <div
      className="absolute z-50 left-0 top-full mt-[2px] w-[320px] xp-window !p-[2px] !rounded-md"
      role="menu"
    >
      {/* Banner */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-md"
        style={{
          background:
            "linear-gradient(180deg,#8a99b8 0%,#5b6e92 40%,#41547a 100%)",
          color: "#fff",
          textShadow: "1px 1px 0 rgba(0,0,0,0.35)",
          borderBottom: "1px solid #1c2638",
        }}
      >
        <div className="xp-start__flag" aria-hidden>⟁</div>
        <div className="leading-tight">
          <div className="text-[12px] font-bold">Connect a Wallet</div>
          <div className="text-[10px] opacity-90">Pick a provider to begin</div>
        </div>
      </div>

      <div className="bg-white p-1 flex flex-col">
        {connectors.length === 0 ? (
          <div className="p-3 text-[11px] text-[#555]">
            No EVM connectors available.
          </div>
        ) : (
          connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => onConnect(c)}
              disabled={isPending}
              className="group flex items-center gap-3 px-2 py-2 text-left text-[12px] text-black hover:bg-[var(--xp-blue)] hover:text-white disabled:opacity-50"
              role="menuitem"
            >
              <span className="w-7 h-7 grid place-items-center bg-[#f1f0e8] border border-[#999] xp-bevel-out">
                {c.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.icon} alt="" width={18} height={18} />
                ) : (
                  <span className="text-base">🔌</span>
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
          ))
        )}
      </div>

      <div
        className="px-3 py-2 text-[10px] flex items-center justify-between"
        style={{
          background: "var(--xp-face)",
          borderTop: "1px solid var(--xp-shadow)",
          boxShadow: "inset 0 1px 0 0 var(--xp-hi)",
        }}
      >
        <span className="text-[#444]">
          🛡 {connectors.filter((c) => c.isInstalled).length} installed
        </span>
        <span className="text-[#444]">EVM mainnets · 6 chains</span>
      </div>

      {error && (
        <div className="px-3 py-1 text-[10px] text-[#7a0a0a] bg-[#ffe9e6] border-t border-[#7a0a0a]">
          {error}
        </div>
      )}
    </div>
  );
}

function ClockBlock() {
  // Pure decorative clock — keeps the tray feeling alive in screenshots.
  const [t, setT] = useState<string>("--:--");
  useEffect(() => {
    const tick = () =>
      setT(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono">{t}</span>;
}
