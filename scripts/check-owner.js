require("dotenv").config();
const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x3896c9bd802A56c28590EF1E03A7de645c703757";

async function main() {
  const contract = await ethers.getContractAt("ChiefToken", CONTRACT_ADDRESS);
  const owner = await contract.owner();
  console.log("Owner:", owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
