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

const ECOSYSTEMS: { type: ChainType; label: string; code: string }[] = [
  { type: "EVM",       label: "EVM",       code: "01" },
  { type: "SOLANA",    label: "Solana",    code: "02" },
  { type: "SUI",       label: "Sui",       code: "03" },
  { type: "INJECTIVE", label: "Injective", code: "04" },
  { type: "ICON",      label: "ICON",      code: "05" },
  { type: "STELLAR",   label: "Stellar",   code: "06" },
  { type: "NEAR",      label: "NEAR",      code: "07" },
];

export function ConnectButton() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        className={`vc-btn ${connectedCount > 0 ? "vc-btn--ghost" : "vc-btn--primary"} w-full justify-between`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background:
                connectedCount > 0 ? "var(--vc-green)" : "var(--vc-ink)",
              boxShadow:
                connectedCount > 0
                  ? "0 0 8px var(--vc-green)"
                  : "none",
            }}
          />
          {connectedCount > 0
            ? `WALLETS // ${connectedCount} ONLINE`
            : "▶ CONNECT WALLET"}
        </span>
        <span
          className="vc-mono"
          style={{ fontSize: 11, opacity: 0.8 }}
        >
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-2 vc-panel"
          role="menu"
        >
          <div className="vc-panel__strip">
            <span
              className="vc-mono vc-caps"
              style={{ fontSize: 11, color: "var(--vc-cyan)" }}
            >
              WALLETS // ECOSYSTEMS
            </span>
            <span
              className="ml-auto vc-mono"
              style={{
                fontSize: 10,
                color: "var(--vc-text-mute)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {connectedCount} / {ECOSYSTEMS.length} ONLINE
            </span>
          </div>

          <div
            className="px-4 py-2 vc-mono"
            style={{
              fontSize: 10,
              color: "var(--vc-text-mute)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--vc-line)",
            }}
          >
            One per ecosystem · both sides for cross-chain
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {ECOSYSTEMS.map((e) => (
              <WalletGroup
                key={e.type}
                xChainType={e.type}
                label={e.label}
                code={e.code}
              />
            ))}
          </div>

          <div
            className="px-4 py-2 vc-mono flex items-center justify-between"
            style={{
              fontSize: 10,
              color: "var(--vc-text-mute)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              borderTop: "1px solid var(--vc-line-hi)",
              background: "var(--vc-ink)",
            }}
          >
            <span>⊕ SODAX // all networks</span>
            <span>SECURE LOCAL CONNECT</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletGroup({
  xChainType,
  label,
  code,
}: {
  xChainType: ChainType;
  label: string;
  code: string;
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
    <div style={{ borderBottom: "1px solid var(--vc-line)" }}>
      <div
        className="flex items-center justify-between px-3 pt-2 pb-1"
        style={{ background: "var(--vc-ink-2)" }}
      >
        <span
          className="vc-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--vc-cyan)",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          [{code}] {label}
        </span>
        {short && (
          <span className="flex items-center gap-2">
            <span
              className="vc-chip vc-chip--live"
              style={{ fontSize: 9 }}
            >
              <span className="vc-chip__dot" /> {short}
            </span>
            <button
              onClick={() => disconnect({ xChainType })}
              className="vc-btn vc-btn--ghost vc-btn--xs"
              title={`Disconnect ${label}`}
              type="button"
            >
              ✕
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
            className="group flex items-center gap-3 px-3 py-2 text-left disabled:opacity-50 transition-colors"
            style={{
              color: "var(--vc-text)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
            role="menuitem"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--vc-ink-3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                display: "grid",
                placeItems: "center",
                background: "var(--vc-ink-3)",
                border: "1px solid var(--vc-line-hi)",
              }}
            >
              {c.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon} alt="" width={16} height={16} />
              ) : (
                <span
                  className="vc-mono"
                  style={{ color: "var(--vc-cyan)", fontSize: 14 }}
                >
                  ⌬
                </span>
              )}
            </span>
            <span className="flex-1">
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              {!c.isInstalled && (
                <span
                  className="vc-mono ml-2"
                  style={{
                    fontSize: 10,
                    color: "var(--vc-text-mute)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  · not installed
                </span>
              )}
            </span>
            <span
              className="vc-mono"
              style={{ color: "var(--vc-cyan)", fontSize: 12 }}
            >
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
