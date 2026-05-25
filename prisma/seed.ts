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

// Day 8 shortlist — five globally-recognized orgs that already accept
// crypto and fit the "without borders" theme (poverty, water, digital
// rights, health, education). The community poll picks the 3 winners
// (Day 10); editing this list + re-running the seed is the public process.
//
// ⚠️ payoutTarget is an `offramp` PLACEHOLDER SLUG, not a real address.
// Real on-chain payout addresses are money-routing — they get locked in
// only after winners are chosen, as a single reviewed change. Nothing
// here moves funds; it only populates the ballot.
const CHARITIES: CharityInput[] = [
  {
    name: "GiveDirectly",
    blurb: "Unconditional cash transfers straight to people living in extreme poverty.",
    website: "https://www.givedirectly.org",
    payoutKind: PayoutKind.offramp,
    payoutTarget: "givedirectly-offramp-tbd",
    active: true,
  },
  {
    name: "charity: water",
    blurb: "Funds clean and safe drinking water projects in communities that lack it.",
    website: "https://www.charitywater.org",
    payoutKind: PayoutKind.offramp,
    payoutTarget: "charitywater-offramp-tbd",
    active: true,
  },
  {
    name: "Electronic Frontier Foundation",
    blurb: "Defends civil liberties, privacy, and free expression in the digital world.",
    website: "https://www.eff.org",
    payoutKind: PayoutKind.offramp,
    payoutTarget: "eff-offramp-tbd",
    active: true,
  },
  {
    name: "Doctors Without Borders",
    blurb: "Independent emergency medical care delivered across borders, wherever the need is greatest.",
    website: "https://www.doctorswithoutborders.org",
    payoutKind: PayoutKind.offramp,
    payoutTarget: "msf-offramp-tbd",
    active: true,
  },
  {
    name: "Khan Academy",
    blurb: "Free, world-class education for anyone, anywhere.",
    website: "https://www.khanacademy.org",
    payoutKind: PayoutKind.offramp,
    payoutTarget: "khanacademy-offramp-tbd",
    active: true,
  },
];

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
