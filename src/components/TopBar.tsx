import Link from "next/link";

export function TopBar({
  active,
}: {
  active: "swap" | "leaderboard" | "charities";
}) {
  return (
    <header className="ol-topbar">
      <div className="ol-topbar__inner">
        <Link href="/" className="ol-brand">
          <span className="ol-brand__mark">S</span>
          <span className="ol-brand__name">Swaps without Borders</span>
        </Link>
        <nav className="ol-nav">
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
        </nav>
        <div className="ol-topbar__tail">
          <span className="ol-pill ol-pill--live">
            <span className="ol-pill__dot ol-pulse" />
            Mainnet
          </span>
        </div>
      </div>
    </header>
  );
}
