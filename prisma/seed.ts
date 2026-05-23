// Charity shortlist seed — Day 8 lands the real 5 candidates here once
// the community suggestion thread closes. Re-run `pnpm db:seed` after
// editing; the script is idempotent (upserts by name).
//
// To add a charity:
//   1. Append an object to CHARITIES below
//   2. Run `pnpm db:seed`
//
// To remove one (post-vote, archived):
//   Set `active: false` on its entry, re-run seed. Row stays for audit.

import { PrismaClient, PayoutKind } from "@prisma/client";

const prisma = new PrismaClient();

type CharityInput = {
  name: string;
  blurb: string;
  website: string | null;
  payoutKind: PayoutKind;
  payoutTarget: string;
  active?: boolean;
};

// 🚨 Empty until the Day 8 community thread closes.
// Sample shape (commented out):
//   {
//     name: "GiveDirectly",
//     blurb: "Unconditional cash transfers to people living in extreme poverty.",
//     website: "https://www.givedirectly.org",
//     payoutKind: PayoutKind.offramp,
//     payoutTarget: "givedirectly-usdc-offramp",
//     active: true,
//   },
const CHARITIES: CharityInput[] = [];

async function main() {
  if (CHARITIES.length === 0) {
    console.log("ℹ️  CHARITIES list is empty — nothing to seed.");
    console.log("   Edit prisma/seed.ts and add entries, then re-run `pnpm db:seed`.");
    return;
  }

  for (const c of CHARITIES) {
    // Idempotent without a unique constraint on name: find first match,
    // update if present, create otherwise.
    const existing = await prisma.charity.findFirst({ where: { name: c.name } });
    if (existing) {
      const row = await prisma.charity.update({
        where: { id: existing.id },
        data: {
          blurb: c.blurb,
          website: c.website,
          payoutKind: c.payoutKind,
          payoutTarget: c.payoutTarget,
          active: c.active ?? true,
        },
      });
      console.log(`↻ updated ${row.name} (${row.id})`);
    } else {
      const row = await prisma.charity.create({
        data: {
          name: c.name,
          blurb: c.blurb,
          website: c.website,
          payoutKind: c.payoutKind,
          payoutTarget: c.payoutTarget,
          active: c.active ?? true,
        },
      });
      console.log(`✓ created ${row.name} (${row.id})`);
    }
  }

  const active = await prisma.charity.count({ where: { active: true } });
  console.log(`\nDone — ${active} active charit${active === 1 ? "y" : "ies"} in DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
