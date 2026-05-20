import { ConnectButton } from "@/components/ConnectButton";
import { SwapCard } from "@/components/SwapCard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Charity Swap{" "}
            <span className="ml-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              wip · day 3
            </span>
          </h1>
          <p className="text-xs text-neutral-500">
            Cross-chain swap → fees go to charity → community votes payouts
          </p>
        </div>
        <ConnectButton />
      </header>

      <main className="flex flex-1 flex-col items-center gap-8 px-6 py-12">
        <SwapCard />

        <section className="w-full max-w-md space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            What you&apos;re looking at
          </h2>
          <p>
            Day 3 of a 2-week public build on the{" "}
            <a
              href="https://docs.sodax.com"
              className="underline decoration-dotted underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
              target="_blank"
              rel="noreferrer"
            >
              SODAX SDK V2
            </a>
            . SDK docs and live config came from the{" "}
            <a
              href="https://builders.sodax.com/mcp"
              className="underline decoration-dotted underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
              target="_blank"
              rel="noreferrer"
            >
              SODAX Builders MCP
            </a>
            — the whole thing scaffolded in an afternoon.
          </p>
          <p>
            Partner fee is <strong>off</strong> while we set up the charity
            multisig. From Day 9 every swap routes a small fee to a public
            wallet on Sonic.{" "}
            <strong>100% of fees go to charity.</strong>
          </p>
          <p>
            Repo:{" "}
            <a
              href="https://github.com/hazyatom/charity-swap"
              className="underline decoration-dotted underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
              target="_blank"
              rel="noreferrer"
            >
              github.com/hazyatom/charity-swap
            </a>{" "}
            · MIT · built in public.
          </p>
        </section>
      </main>

      <footer className="border-t border-neutral-200 px-6 py-4 text-xs text-neutral-500 dark:border-neutral-800">
        Built by{" "}
        <a
          href="https://sodaxpay.vercel.app"
          className="underline decoration-dotted underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          Hazy
        </a>{" "}
        with the{" "}
        <a
          href="https://builders.sodax.com/mcp"
          className="underline decoration-dotted underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          SODAX Builders MCP
        </a>
        .
      </footer>
    </div>
  );
}
