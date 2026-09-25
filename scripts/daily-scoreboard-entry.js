const fs = require("fs");
const path = require("path");

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function readNumber(name) {
  const raw = process.env[name];
  if (!raw || raw.trim() === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function pct(numerator, denominator) {
  if (!denominator || denominator <= 0) {
    return null;
  }
  return (numerator / denominator) * 100;
}

function main() {
  const date = process.env.DATE || isoDate();

  const traffic = readNumber("TRAFFIC");
  const newLeads = readNumber("NEW_LEADS");
  const checkoutStarts = readNumber("CHECKOUT_STARTS");
  const newPaidUsers = readNumber("NEW_PAID_USERS");
  const grossRevenue = readNumber("GROSS_REVENUE");
  const refunds = readNumber("REFUNDS");
  const newHolders = readNumber("NEW_CHIEF_HOLDERS");
  const activeHolders = readNumber("ACTIVE_CHIEF_HOLDERS");

  const netRevenue = grossRevenue !== null && refunds !== null ? grossRevenue - refunds : null;

  const entry = {
    date,
    inputs: {
      traffic,
      newLeads,
      checkoutStarts,
      newPaidUsers,
      grossRevenue,
      refunds,
      netRevenue,
      newCHIEFHolders: newHolders,
      activeCHIEFHolders: activeHolders
    },
    funnelMetrics: {
      landingConversionPercent: traffic !== null && newLeads !== null ? pct(newLeads, traffic) : null,
      checkoutCompletionPercent: checkoutStarts !== null && newPaidUsers !== null ? pct(newPaidUsers, checkoutStarts) : null,
      refundRatePercent: grossRevenue !== null && refunds !== null ? pct(refunds, grossRevenue) : null
    },
    utilityMetrics: {
      weeklyReportOpens: readNumber("WEEKLY_REPORT_OPENS"),
      officeHourAttendance: readNumber("OFFICE_HOUR_ATTENDANCE"),
      templateUsage: readNumber("TEMPLATE_TOOL_USAGE"),
      paidUsersWhoHoldChiefPercent: readNumber("PAID_USERS_HOLD_CHIEF_PERCENT")
    },
    liquidityMetrics: {
      poolTVL: readNumber("POOL_TVL"),
      slippage10kBuyPercent: readNumber("SLIPPAGE_10K_BUY_PERCENT"),
      slippage10kSellPercent: readNumber("SLIPPAGE_10K_SELL_PERCENT"),
      protocolOwnedLiquidityValue: readNumber("POL_VALUE")
    },
    decisionLog: {
      workedToday: process.env.WORKED_TODAY || null,
      biggestBottleneck: process.env.BIGGEST_BOTTLENECK || null,
      fixTomorrow: process.env.ONE_FIX_TOMORROW || null,
      growthActionTomorrow: process.env.ONE_GROWTH_ACTION_TOMORROW || null
    }
  };

  const outDir = path.resolve(__dirname, "..", "artifacts", "scoreboard");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `daily-scoreboard-${date}.json`);

  fs.writeFileSync(outPath, JSON.stringify(entry, null, 2));
  console.log("Daily scoreboard entry written:");
  console.log(outPath);

  if (entry.funnelMetrics.landingConversionPercent !== null) {
    console.log(`Landing conversion: ${entry.funnelMetrics.landingConversionPercent.toFixed(2)}%`);
  }
  if (entry.funnelMetrics.checkoutCompletionPercent !== null) {
    console.log(`Checkout completion: ${entry.funnelMetrics.checkoutCompletionPercent.toFixed(2)}%`);
  }
}

main();
