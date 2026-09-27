require("dotenv").config();
const { spawnSync } = require("node:child_process");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const INITIAL_OWNER = process.env.INITIAL_OWNER || "0xDE8D41402DAf69C5AfCA62C4e7D279d01B6a24ab";

function main() {
  const addressPattern = /^0x[a-fA-F0-9]{40}$/;
  if (!addressPattern.test(CONTRACT_ADDRESS)) {
    throw new Error("Invalid CONTRACT_ADDRESS. Set CONTRACT_ADDRESS in .env.");
  }

  if (!addressPattern.test(INITIAL_OWNER)) {
    throw new Error("Invalid INITIAL_OWNER. Set INITIAL_OWNER in .env.");
  }

  if (!process.env.BASE_MAINNET_RPC_URL) {
    throw new Error("Missing BASE_MAINNET_RPC_URL in .env.");
  }

  if (!process.env.BASESCAN_API_KEY && !process.env.ETHERSCAN_API_KEY) {
    throw new Error("Missing BASESCAN_API_KEY (or ETHERSCAN_API_KEY) in .env.");
  }

  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["hardhat", "verify", "--network", "base", CONTRACT_ADDRESS, INITIAL_OWNER],
    { stdio: "inherit", shell: process.platform === "win32" }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
  }
  if (result.status === 0) {
    console.log("Verification submitted successfully.");
  }
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
}
