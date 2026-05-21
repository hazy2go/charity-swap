"use client";

import { useState, useEffect } from "react";

type IconAction =
  | { kind: "link"; href: string; target?: "_blank" }
  | { kind: "scroll"; to: string }
  | { kind: "recycle" };

type IconDef = {
  id: string;
  glyph: string;
  label: string;
  action: IconAction;
};

const ICONS: IconDef[] = [
  {
    id: "swap",
    glyph: "💾",
    label: "Swaps&nbsp;without&nbsp;Borders",
    action: { kind: "scroll", to: "swap-window" },
  },
  {
    id: "leaderboard",
    glyph: "🏆",
    label: "Leaderboard",
    action: { kind: "link", href: "/leaderboard" },
  },
  {
    id: "buildlog",
    glyph: "🧾",
    label: "BUILD-LOG.md",
    action: {
      kind: "link",
      href: "https://github.com/hazy2go/swaps-without-borders/blob/main/BUILD-LOG.md",
      target: "_blank",
    },
  },
  {
    id: "repo",
    glyph: "🔗",
    label: "Repo on&nbsp;GitHub",
    action: {
      kind: "link",
      href: "https://github.com/hazy2go/swaps-without-borders",
      target: "_blank",
    },
  },
  {
    id: "mcp",
    glyph: "🛠",
    label: "SODAX MCP",
    action: {
      kind: "link",
      href: "https://builders.sodax.com/mcp",
      target: "_blank",
    },
  },
  {
    id: "recycle",
    glyph: "🗑",
    label: "Recycle Bin",
    action: { kind: "recycle" },
  },
];

function runAction(action: IconAction, onRecycle: () => void) {
  if (action.kind === "link") {
    if (action.href.startsWith("/")) {
      // Internal route — same tab, real navigation
      window.location.href = action.href;
    } else {
      window.open(action.href, action.target ?? "_self", "noreferrer");
    }
  } else if (action.kind === "scroll") {
    document
      .getElementById(action.to)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (action.kind === "recycle") {
    onRecycle();
  }
}

export function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null);
  const [recycleOpen, setRecycleOpen] = useState(false);

  // Click-away deselects
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-desktop-icon]")) {
        setSelected(null);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  // Esc closes recycle bin
  useEffect(() => {
    if (!recycleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRecycleOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recycleOpen]);

  return (
    <>
      <div
        className="hidden md:flex flex-col gap-5 absolute left-6 top-6"
        role="grid"
        aria-label="Desktop"
      >
        {ICONS.map((icon) => {
          const isSelected = selected === icon.id;
          return (
            <button
              key={icon.id}
              type="button"
              data-desktop-icon
              onClick={(e) => {
                e.stopPropagation();
                setSelected(icon.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                runAction(icon.action, () => setRecycleOpen(true));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  runAction(icon.action, () => setRecycleOpen(true));
                }
              }}
              title={`${icon.label.replace("&nbsp;", " ")} — double-click to open`}
              className="xp-desktop-icon"
              style={
                isSelected
                  ? {
                      filter:
                        "brightness(1.05) drop-shadow(0 0 0 rgba(0,0,0,0))",
                    }
                  : undefined
              }
            >
              <div
                className="xp-desktop-icon__glyph"
                style={
                  isSelected
                    ? {
                        background: "rgba(49, 106, 197, 0.45)",
                        outline: "1px dotted rgba(255,255,255,0.9)",
                      }
                    : undefined
                }
              >
                {icon.glyph}
              </div>
              <div
                className="xp-desktop-icon__label"
                style={
                  isSelected
                    ? {
                        background: "var(--xp-blue)",
                        outline: "1px dotted rgba(255,255,255,0.9)",
                      }
                    : undefined
                }
                dangerouslySetInnerHTML={{ __html: icon.label }}
              />
            </button>
          );
        })}
      </div>

      {recycleOpen && <RecycleBinDialog onClose={() => setRecycleOpen(false)} />}
    </>
  );
}

function RecycleBinDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recycle-title"
    >
      <div
        className="xp-window w-[340px] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="xp-titlebar">
          <span className="xp-titlebar__icon" aria-hidden>🗑</span>
          <span id="recycle-title" className="xp-titlebar__title">
            Recycle Bin
          </span>
          <div className="xp-titlebar__controls">
            <button
              className="xp-ctrl xp-ctrl--close"
              aria-label="Close"
              onClick={onClose}
            >
              <span style={{ fontWeight: "bold", lineHeight: 1 }}>×</span>
            </button>
          </div>
        </div>

        <div className="bg-[var(--xp-face)] px-5 py-4 flex gap-3 items-start">
          <div className="text-[36px] leading-none" aria-hidden>
            ℹ️
          </div>
          <div className="flex-1 pt-1">
            <p className="text-[12px] leading-snug">
              The Recycle Bin is empty.
            </p>
            <p className="text-[11px] text-[#444] mt-2 leading-snug">
              No deleted donations. All fees on this dapp are routed to a
              public charity wallet — nothing is recoverable here, by design.
              <br />
              <em>
                (Charity wallet goes live on Day 9 — Tue 2026-05-26.)
              </em>
            </p>
          </div>
        </div>

        <div className="bg-[var(--xp-face)] px-3 pb-3 flex justify-end gap-2">
          <button className="xp-button xp-button--primary" onClick={onClose}>
            OK
          </button>
        </div>

        <div className="xp-statusbar">
          <span className="xp-statusbar__cell">0 object(s)</span>
          <span className="xp-statusbar__cell xp-statusbar__cell--fixed">
            0 bytes
          </span>
        </div>
      </div>
    </div>
  );
}
