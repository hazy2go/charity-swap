import Link from "next/link";
import { prisma } from "@/lib/db";
import { VoteBoard, type VoteCharity } from "@/components/VoteBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadCharities(): Promise<{ rows: VoteCharity[]; error: string | null }> {
  try {
    const rows = await prisma.charity.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, blurb: true },
    });
    return { rows, error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function VotePage() {
  const { rows, error } = await loadCharities();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="xp-taskbar">
        <Link href="/" className="xp-start h-full" aria-label="Back to desktop">
          <span className="xp-start__flag">⟁</span>
          <span>Back</span>
        </Link>
        <span className="xp-taskbar__task xp-taskbar__task--active">
          <span aria-hidden>🗳</span>
          <span>Vote.exe</span>
        </span>
        <div className="xp-tray text-[10px] sm:text-[11px]">
          <a
            href="https://builders.sodax.com/mcp"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            <span className="xp-tray__icon" aria-hidden>🔌</span>
            <span className="hidden sm:inline">builders.sodax.com/mcp</span>
            <span className="sm:hidden">MCP</span>
          </a>
        </div>
      </header>

      <main
        className="flex-1 p-3 sm:p-6 md:p-8 grid place-items-center"
        style={{
          backgroundImage:
            "radial-gradient(circle at 8% 12%, rgba(255,255,255,0.06) 0%, transparent 22%), radial-gradient(circle at 92% 88%, rgba(0,0,0,0.18) 0%, transparent 28%)",
        }}
      >
        {error ? (
          <div className="xp-window w-[640px] max-w-[95vw]">
            <div className="xp-titlebar xp-titlebar--inactive">
              <span className="xp-titlebar__icon" aria-hidden>🗳</span>
              <span className="xp-titlebar__title">Vote.exe</span>
            </div>
            <div className="bg-[var(--xp-face)] px-4 py-6">
              <div className="xp-readout !block !text-[11px] !text-[#7a0a0a]">
                <strong>Error reading charities:</strong> {error}
              </div>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="xp-window w-[640px] max-w-[95vw]">
            <div className="xp-titlebar">
              <span className="xp-titlebar__icon" aria-hidden>🗳</span>
              <span className="xp-titlebar__title">Vote.exe</span>
            </div>
            <div className="bg-[var(--xp-face)] px-4 py-8 text-center text-[#666]">
              <div className="text-[24px] mb-2" aria-hidden>🗳</div>
              <div className="font-bold text-[13px] text-[#111]">
                No charities to vote on yet
              </div>
              <div className="mt-1 text-[11px]">
                The shortlist seeds on Day 8. Check{" "}
                <Link href="/charities" className="underline">/charities</Link>.
              </div>
            </div>
          </div>
        ) : (
          <VoteBoard charities={rows} />
        )}
      </main>
    </div>
  );
}
