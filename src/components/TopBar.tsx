"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/hud";
import { ConnectButton } from "@/components/ConnectButton";

type NavKey = "swap" | "leaderboard" | "charities" | "vote" | "about";

const LINKS: { href: string; key: NavKey; label: string }[] = [
  { href: "/", key: "swap", label: "Swap" },
  { href: "/vote", key: "vote", label: "Vote" },
  { href: "/charities", key: "charities", label: "Charities" },
  { href: "/leaderboard", key: "leaderboard", label: "Leaderboard" },
  { href: "/about", key: "about", label: "About" },
];

export function TopBar({ active }: { active: NavKey }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll + close on Escape while the mobile sheet is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="vh-topbar">
      <div className="vh-topbar__inner">
        <Link href="/" className="vh-brand" onClick={() => setMenuOpen(false)}>
          <span className="vh-brand__mark">
            <BrandMark size={24} />
          </span>
          <span className="vh-brand__name">Swaps without Borders</span>
        </Link>

        {/* Desktop: inline nav. Hidden < 768px (see globals.css). */}
        <nav className="vh-nav" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.key} href={l.href} className={active === l.key ? "is-active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="vh-topbar__tail">
          <ConnectButton />
          {/* Mobile: menu trigger. Hidden ≥ 768px. */}
          <button
            type="button"
            className="vh-nav-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="vh-navsheet"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="vh-nav-toggle__bars" data-open={menuOpen || undefined} />
          </button>
        </div>
      </div>
      <div className="vh-hazard" aria-hidden />

      {/* Mobile nav drop-sheet */}
      {menuOpen && (
        <>
          <button
            type="button"
            className="vh-navsheet__scrim"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
          <nav id="vh-navsheet" className="vh-navsheet" aria-label="Mobile">
            {LINKS.map((l, i) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`vh-navsheet__link ${active === l.key ? "is-active" : ""}`}
                style={{ animationDelay: `${40 + i * 36}ms` }}
              >
                <span className="vh-navsheet__idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="vh-navsheet__label">{l.label}</span>
                <span className="vh-navsheet__arrow" aria-hidden>
                  {active === l.key ? "●" : "→"}
                </span>
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
