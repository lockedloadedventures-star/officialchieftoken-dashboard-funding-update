require("dotenv").config();
const hre = require("hardhat");
const { ethers } = hre;

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const INITIAL_OWNER = process.env.INITIAL_OWNER || "0xDE8D41402DAf69C5AfCA62C4e7D279d01B6a24ab";

async function main() {
  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Invalid CONTRACT_ADDRESS. Set CONTRACT_ADDRESS in .env.");
  }

  if (!ethers.isAddress(INITIAL_OWNER)) {
    throw new Error("Invalid INITIAL_OWNER. Set INITIAL_OWNER in .env.");
  }

  if (!process.env.BASE_MAINNET_RPC_URL) {
    throw new Error("Missing BASE_MAINNET_RPC_URL in .env.");
  }

  if (!process.env.BASESCAN_API_KEY && !process.env.ETHERSCAN_API_KEY) {
    throw new Error("Missing BASESCAN_API_KEY (or ETHERSCAN_API_KEY) in .env.");
  }

  console.log("Verifying ChiefToken on Base...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Constructor initialOwner:", INITIAL_OWNER);

  await hre.run("verify:verify", {
    address: CONTRACT_ADDRESS,
    contract: "contracts/ChiefToken.sol:ChiefToken",
    constructorArguments: [INITIAL_OWNER]
  });

  console.log("Verification submitted successfully.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
