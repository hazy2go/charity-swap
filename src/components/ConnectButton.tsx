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
];

export function ConnectButton({
  block = false,
}: {
  /** Force full-width button (used in mobile hero) */
  block?: boolean;
}) {
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
          className="ol-picker-pop__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div className="ol-picker-pop" role="dialog" aria-modal="true">
        <div className="ol-picker-pop__handle" aria-hidden />
        <div
          style={{
            padding: "8px 18px 14px",
            borderBottom: "1px solid var(--ol-line)",
          }}
        >
          <div className="ol-eyebrow" style={{ marginBottom: 4 }}>
            Wallets
          </div>
          <div
            className="ol-serif"
            style={{ fontSize: 20, color: "var(--ol-text)" }}
          >
            Connect a wallet
          </div>
          <p className="ol-body" style={{ marginTop: 4, fontSize: 13 }}>
            One per ecosystem. Cross-chain swaps need both sides.
          </p>
        </div>
        <div className="ol-picker-pop__list">
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
        className={`ol-btn ${connectedCount > 0 ? "ol-btn--ghost" : "ol-btn--primary"} ${block ? "ol-btn--block" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {connectedCount > 0 ? (
          <>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--ol-sage)",
                boxShadow: "0 0 8px var(--ol-sage)",
              }}
            />
            {triggerLabel}
            <span
              className="ol-mono"
              style={{ fontSize: 12, color: "var(--ol-text-3)", marginLeft: 4 }}
            >
              · {connectedCount}/{ECOSYSTEMS.length}
            </span>
          </>
        ) : (
          <>{triggerLabel}</>
        )}
      </button>

      {open && !isMobile && (
        <div
          className="ol-picker-pop"
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
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--ol-line)",
            }}
          >
            <div className="ol-eyebrow" style={{ marginBottom: 4 }}>
              Wallets · {connectedCount}/{ECOSYSTEMS.length}
            </div>
            <div className="ol-serif" style={{ fontSize: 18, color: "var(--ol-text)" }}>
              Connect a wallet
            </div>
          </div>
          <div className="ol-picker-pop__list">
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
    <div style={{ borderTop: "1px solid var(--ol-line)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px 6px",
        }}
      >
        <span
          className="ol-eyebrow"
          style={{ color: "var(--ol-text-2)" }}
        >
          {label}
        </span>
        {short && (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className="ol-mono"
              style={{ fontSize: 12, color: "var(--ol-sage)" }}
            >
              ● {short}
            </span>
            <button
              onClick={() => disconnect({ xChainType })}
              type="button"
              className="ol-btn ol-btn--ghost ol-btn--sm"
              style={{ height: 28, padding: "0 10px", fontSize: 12 }}
              title={`Disconnect ${label}`}
            >
              Disconnect
            </button>
          </span>
        )}
      </div>
      <div style={{ paddingBottom: 8 }}>
        {connectors.map((c: IXConnector) => (
          <button
            key={c.id}
            type="button"
            onClick={() => connect(c).then(onDone).catch(() => {})}
            disabled={isPending}
            className="ol-picker-pop__item"
            style={{ height: 52 }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                background: "var(--ol-s3)",
                border: "1px solid var(--ol-line)",
                borderRadius: 6,
                flexShrink: 0,
              }}
            >
              {c.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon} alt="" width={18} height={18} />
              ) : (
                <span style={{ color: "var(--ol-jade)" }}>◇</span>
              )}
            </span>
            <span
              className="ol-picker-pop__item__label"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {c.name}
              {!c.isInstalled && (
                <span
                  className="ol-mono"
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: "var(--ol-text-3)",
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
