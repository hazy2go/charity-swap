import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/charities — public list of active charity candidates. */
export async function GET() {
  try {
    const rows = await prisma.charity.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        blurb: true,
        website: true,
        payoutKind: true,
      },
    });
    return NextResponse.json(rows, {
      status: 200,
      headers: { "cache-control": "public, max-age=60" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
