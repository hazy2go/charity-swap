import Link from "next/link";
import { BrandMark } from "@/components/hud";
import { ConnectButton } from "@/components/ConnectButton";

export function TopBar({
  active,
}: {
  active: "swap" | "leaderboard" | "charities" | "about";
}) {
  return (
    <header className="vh-topbar">
      <div className="vh-topbar__inner">
        <Link href="/" className="vh-brand">
          <span className="vh-brand__mark">
            <BrandMark size={24} />
          </span>
          <span className="vh-brand__name">Swaps without Borders</span>
        </Link>
        <nav className="vh-nav" aria-label="Primary">
          <Link href="/" className={active === "swap" ? "is-active" : ""}>
            Swap
          </Link>
          <Link
            href="/charities"
            className={active === "charities" ? "is-active" : ""}
          >
            Charities
          </Link>
          <Link
            href="/leaderboard"
            className={active === "leaderboard" ? "is-active" : ""}
          >
            Leaderboard
          </Link>
          <Link
            href="/about"
            className={active === "about" ? "is-active" : ""}
          >
            About
          </Link>
        </nav>
        <div className="vh-topbar__tail">
          <ConnectButton />
        </div>
      </div>
      <div className="vh-hazard" aria-hidden />
    </header>
  );
}
