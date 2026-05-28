"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  useXAccount,
  useXConnect,
  useXConnectors,
  useXDisconnect,
  sortConnectors,
  type IXConnector,
} from "@sodax/wallet-sdk-react";
import { useBitcoinXConnectors } from "@sodax/wallet-sdk-react/xchains/bitcoin";
import type { ChainType } from "@sodax/types";

const PREFERRED = ["hana", "metamask", "rabby"] as const;

const ECOSYSTEMS: { type: ChainType; label: string }[] = [
  { type: "EVM",       label: "EVM" },
  { type: "SOLANA",    label: "Solana" },
  { type: "SUI",       label: "Sui" },
  { type: "INJECTIVE", label: "Injective" },
  { type: "ICON",      label: "ICON" },
  { type: "STELLAR",   label: "Stellar" },
  { type: "NEAR",      label: "NEAR" },
  { type: "BITCOIN",   label: "Bitcoin" },
];

export function ConnectButton({ block = false }: { block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const accounts = [
    useXAccount({ xChainType: "EVM" }).address,
    useXAccount({ xChainType: "SOLANA" }).address,
    useXAccount({ xChainType: "SUI" }).address,
    useXAccount({ xChainType: "INJECTIVE" }).address,
    useXAccount({ xChainType: "ICON" }).address,
    useXAccount({ xChainType: "STELLAR" }).address,
    useXAccount({ xChainType: "NEAR" }).address,
    useXAccount({ xChainType: "BITCOIN" }).address,
  ];
  const connectedCount = accounts.filter(Boolean).length;
  const firstAddr = accounts.find(Boolean);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    let armed = false;
    const arm = setTimeout(() => { armed = true; }, 0);
    const onDown = (e: MouseEvent) => {
      if (!armed) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(arm);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!(open && isMobile)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile]);

  const triggerLabel =
    connectedCount === 0
      ? "Connect wallet"
      : firstAddr
        ? `${firstAddr.slice(0, 6)}…${firstAddr.slice(-4)}`
        : `${connectedCount} connected`;

  const Sheet = (
    <>
      {isMobile && (
        <div
          className="vh-picker-pop__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div className="vh-picker-pop" role="dialog" aria-modal="true">
        <div className="vh-picker-pop__handle" aria-hidden />
        <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid var(--vh-line)" }}>
          <div className="vh-eyebrow" style={{ marginBottom: 4 }}>
            Wallets · {connectedCount}/{ECOSYSTEMS.length} online
          </div>
          <div className="vh-h3" style={{ fontSize: 18, color: "var(--vh-text)" }}>
            Connect a wallet
          </div>
          <p className="vh-body" style={{ marginTop: 6, fontSize: 13, color: "var(--vh-text-3)" }}>
            One per ecosystem. Cross-chain swaps need both sides.
          </p>
        </div>
        <div className="vh-picker-pop__list">
          {ECOSYSTEMS.map((e) => (
            <WalletGroup
              key={e.type}
              xChainType={e.type}
              label={e.label}
              onDone={() => setOpen(false)}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div
      ref={wrapperRef}
      className={`relative ${block ? "w-full" : "inline-block"}`}
    >
      <button
        type="button"
        className={`vh-btn ${connectedCount > 0 ? "vh-btn--ghost" : "vh-btn--primary"} ${block ? "vh-btn--block" : "vh-btn--sm"}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {connectedCount > 0 ? (
          <>
            <span
              style={{
                width: 7,
                height: 7,
                background: "var(--vh-acid-500)",
                boxShadow: "0 0 8px var(--vh-acid-glow)",
              }}
            />
            {triggerLabel}
          </>
        ) : (
          <>▸ Connect</>
        )}
      </button>

      {open && !isMobile && (
        <div
          className="vh-picker-pop"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            left: "auto",
            width: 360,
            maxHeight: 480,
          }}
          role="dialog"
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vh-line)" }}>
            <div className="vh-eyebrow" style={{ marginBottom: 4 }}>
              Wallets · {connectedCount}/{ECOSYSTEMS.length}
            </div>
            <div className="vh-h3" style={{ fontSize: 18 }}>Connect a wallet</div>
          </div>
          <div className="vh-picker-pop__list">
            {ECOSYSTEMS.map((e) => (
              <WalletGroup
                key={e.type}
                xChainType={e.type}
                label={e.label}
                onDone={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      )}
      {open && isMobile && typeof document !== "undefined" &&
        createPortal(Sheet, document.body)}
    </div>
  );
}

function WalletGroup({
  xChainType,
  label,
  onDone,
}: {
  xChainType: ChainType;
  label: string;
  onDone: () => void;
}) {
  // Bitcoin connectors live in a separate subpath; the generic
  // useXConnectors returns no Bitcoin wallets. Per the docs, use
  // useBitcoinXConnectors and merge with the generic flow.
  const generic = useXConnectors({ xChainType });
  const btc = useBitcoinXConnectors();
  const raw: IXConnector[] =
    xChainType === "BITCOIN" ? (btc as unknown as IXConnector[]) : generic;
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
    <div style={{ borderTop: "1px solid var(--vh-line)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 4px",
          gap: 8,
        }}
      >
        <span className="vh-eyebrow" style={{ color: "var(--vh-cyan-500)" }}>
          {label}
        </span>
        {short && (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              className="vh-mono"
              style={{ fontSize: 12, color: "var(--vh-acid-500)" }}
            >
              ● {short}
            </span>
            <button
              onClick={() => disconnect({ xChainType })}
              type="button"
              className="vh-btn vh-btn--ghost vh-btn--xs"
            >
              ✕
            </button>
          </span>
        )}
      </div>
      <div style={{ paddingBottom: 6 }}>
        {connectors.map((c: IXConnector) => (
          <button
            key={c.id}
            type="button"
            onClick={() => connect(c).then(onDone).catch(() => {})}
            disabled={isPending}
            className="vh-picker-pop__item"
            style={{ height: 52 }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                display: "grid",
                placeItems: "center",
                background: "var(--vh-s3)",
                border: "1px solid var(--vh-line)",
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              {c.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon} alt="" width={18} height={18} />
              ) : (
                <span style={{ color: "var(--vh-cyan-500)" }}>◇</span>
              )}
            </span>
            <span
              className="vh-picker-pop__item__label"
              style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
            >
              {c.name}
              {!c.isInstalled && (
                <span
                  className="vh-mono"
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: "var(--vh-text-3)",
                    fontWeight: 400,
                  }}
                >
                  · not installed
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
