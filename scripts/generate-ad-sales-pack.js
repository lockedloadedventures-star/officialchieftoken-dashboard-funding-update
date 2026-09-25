#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const productName = getArg('--product', 'Launch Your AI Avatar Business in 7 Days');
const offerLink = getArg('--link', 'https://venturelock.gumroad.com/l/didmlb');
const supportEmail = getArg('--support', 'support@officialchieftoken.com');

const tiers = {
  starter: '$40 Starter',
  growth: '$100 Growth',
  pro: '$200 Pro'
};

const outputDir = path.join(process.cwd(), 'docs', 'marketing');
fs.mkdirSync(outputDir, { recursive: true });

const calendar = `# 7-Day Organic Promotion Calendar

Product: ${productName}
Primary CTA Link: ${offerLink}

## Posting Rules
- Keep one CTA in each post: Enroll now.
- Put the same link in bio and in pinned comment where platform allows.
- Use one outcome + one proof + one CTA structure.

## Day 1 - Authority Hook
- Short video hook: Most creators waste months testing random AI workflows.
- Core value: Show the 7-day launch map in 3 bullets.
- CTA: Start with ${tiers.starter}.

## Day 2 - Problem/Solution
- Hook: Posting without a system kills momentum.
- Core value: Explain niche -> content -> monetization workflow.
- CTA: Link in bio for instant access.

## Day 3 - Objection Handling
- Hook: Do I need coding to launch?
- Core value: No coding, template-driven setup.
- CTA: Choose ${tiers.starter} or ${tiers.growth}.

## Day 4 - Proof Snapshot
- Hook: This is the exact weekly workflow.
- Core value: Share checklist, prompt process, posting cadence.
- CTA: Enroll today, execute tonight.

## Day 5 - Offer Breakdown
- Hook: Pick your launch speed.
- Core value: ${tiers.starter} / ${tiers.growth} / ${tiers.pro} differences.
- CTA: Growth tier is best for speed.

## Day 6 - FAQ Reel
- Hook: 4 fast answers before you buy.
- Core value: Time needed, tools, beginner fit, monetization path.
- CTA: Start now and follow the 7-day plan.

## Day 7 - Direct Pitch
- Hook: If you want a real AI roadmap, this is it.
- Core value: Summarize outcomes and included assets.
- CTA: Enroll via ${offerLink}
`;

const captions = `# 10 Caption Pack

Product: ${productName}
CTA Link: ${offerLink}

1. Stop guessing with AI content. This crash course gives you a 7-day system to build, post, and monetize with clarity. ${tiers.starter} to start. Enroll now: ${offerLink}
2. Most people consume AI content. Winners ship AI systems. Learn the exact roadmap inside ${productName}. ${tiers.starter} | ${tiers.growth} | ${tiers.pro}. ${offerLink}
3. No coding. No fluff. Just execution. Build your AI avatar brand and launch your first offer in 7 days. Start here: ${offerLink}
4. If you need structure, this is your shortcut. Niche, prompts, posting plan, monetization path. Instant access: ${offerLink}
5. Pick your speed: ${tiers.starter} for fundamentals, ${tiers.growth} for done-for-you assets, ${tiers.pro} for monetization + funnel depth. ${offerLink}
6. You do not need more motivation. You need a workflow. Get the full crash course and execute this week: ${offerLink}
7. Beginner-friendly and action-focused. Learn once, apply weekly. ${tiers.starter} gets you moving today: ${offerLink}
8. Tired of random content ideas? Use a repeatable system with prompts and a posting rhythm that compounds. Enroll: ${offerLink}
9. Build faster. Post smarter. Monetize with clarity. ${productName} is live now. ${offerLink}
10. If your goal is consistent output and cleaner offers, this is built for you. Start now: ${offerLink}
`;

const dms = `# DM Conversion Scripts

Product: ${productName}
Link: ${offerLink}

## Inbound Reply Script
Message 1:
- Appreciate you reaching out. If you want the exact 7-day launch workflow, this is the full course: ${offerLink}

Message 2:
- Quick tier guide:
- ${tiers.starter}: full core system
- ${tiers.growth}: adds prompt vault + calendar
- ${tiers.pro}: adds monetization playbook + funnel resources

Message 3:
- If you want fastest implementation, go ${tiers.growth}. If you want depth and monetization assets, go ${tiers.pro}.

## Comment to DM Script
- Love that. Want me to send the exact roadmap and tier breakdown?
- If yes, send this link: ${offerLink}

## Follow-up (24h)
- Checking in. If you are still deciding, start with ${tiers.starter} and upgrade later after first execution sprint.

## Follow-up (72h)
- Last nudge: if speed matters, ${tiers.growth} gives you the prompt vault + content calendar so you can ship immediately.

## Support Close
- If you need purchase or access help after enrolling, contact ${supportEmail}.
`;

const ops = `# Paid + Organic Ops Checklist

## Profile + Funnel
- Brand profile image and bio aligned with product promise.
- One link only in bio: ${offerLink}
- Pinned post includes clear tier callout.

## Content Execution
- Publish 1 reel/short per day for 7 days.
- Publish 3 authority clips, 2 proof clips, 1 offer clip, 1 objection clip.
- Reply to comments within 30 minutes when possible.

## Paid Traffic Basics (Meta)
- Use a business page and business payment profile.
- Run conversion objective to landing page.
- Start with 2-3 creatives and one CTA.
- Turn off creatives with weak CTR after 48-72h.

## Weekly Metrics
- Reach
- Profile visits
- Link clicks
- Checkout starts
- Purchases
- Cost per purchase (for paid)

## Compliance Note
- Educational product only.
- Avoid guaranteed earnings claims.
- Keep disclaimers consistent across landing page and ads.
`;

const files = [
  ['meta-7-day-calendar.md', calendar],
  ['captions-10-pack.md', captions],
  ['dm-conversion-scripts.md', dms],
  ['ad-ops-checklist.md', ops]
];

for (const [name, content] of files) {
  fs.writeFileSync(path.join(outputDir, name), content, 'utf8');
}

console.log('Generated marketing pack:');
for (const [name] of files) {
  console.log(`- docs/marketing/${name}`);
}
