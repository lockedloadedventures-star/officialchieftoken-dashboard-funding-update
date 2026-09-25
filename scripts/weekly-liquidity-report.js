require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const TOKEN = process.env.CONTRACT_ADDRESS || "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const POOL = process.env.POOL_ADDRESS || "0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d";
const WETH = process.env.WETH_ADDRESS || "0x4200000000000000000000000000000000000006";
const RPC_URL = process.env.BASE_MAINNET_RPC_URL || "https://base-rpc.publicnode.com";

const CHIEF_DECIMALS = Number(process.env.CHIEF_DECIMALS || 18);
const RUNWAY_WEEKS = Number(process.env.TREASURY_RUNWAY_WEEKS || 8);
const WEEKLY_DEPLOYMENT_CAP_PERCENT = Number(process.env.WEEKLY_TREASURY_DEPLOYMENT_CAP_PERCENT || 5);

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

function getWeekStartISO(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const chief = new ethers.Contract(TOKEN, erc20Abi, provider);
  const weth = new ethers.Contract(WETH, erc20Abi, provider);

  const [chiefInPoolRaw, wethInPoolRaw, totalSupplyRaw, wethDecimals] = await Promise.all([
    chief.balanceOf(POOL),
    weth.balanceOf(POOL),
    chief.totalSupply(),
    weth.decimals()
  ]);

  const chiefInPool = Number(ethers.formatUnits(chiefInPoolRaw, CHIEF_DECIMALS));
  const wethInPool = Number(ethers.formatUnits(wethInPoolRaw, Number(wethDecimals)));
  const totalSupply = Number(ethers.formatUnits(totalSupplyRaw, CHIEF_DECIMALS));

  const now = new Date();
  const weekOf = getWeekStartISO(now);
  const outDir = path.resolve(__dirname, "..", "artifacts", "weekly-reports");
  fs.mkdirSync(outDir, { recursive: true });

  const report = {
    weekOf,
    generatedAtUTC: now.toISOString(),
    network: "base",
    contractAddress: TOKEN,
    poolAddress: POOL,
    metrics: {
      chiefInPool,
      wethInPool,
      totalSupply,
      polShareOfSupplyPercent: totalSupply > 0 ? (chiefInPool / totalSupply) * 100 : 0
    },
    policy: {
      runwayWeeksBufferTarget: RUNWAY_WEEKS,
      weeklyTreasuryDeploymentCapPercent: WEEKLY_DEPLOYMENT_CAP_PERCENT
    },
    manualInputs: {
      netProductRevenueUSD: null,
      liquidityAllocationUSD: null,
      estimatedSlippage10kBuyBefore: null,
      estimatedSlippage10kBuyAfter: null,
      feesEarnedThisWeekUSD: null,
      notes: "Fill manual fields before publishing."
    }
  };

  const outPath = path.join(outDir, `weekly-liquidity-report-${weekOf}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("Weekly liquidity report generated:");
  console.log(outPath);
  console.log("Pool snapshot:", `${chiefInPool.toLocaleString()} CHIEF + ${wethInPool.toFixed(6)} WETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
