require("dotenv").config();
const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const TO_ADDRESS = process.env.TO_ADDRESS;
const AMOUNT = process.env.AMOUNT || "100";

async function main() {
  if (!TO_ADDRESS || !ethers.isAddress(TO_ADDRESS)) {
    throw new Error("Set TO_ADDRESS in .env or environment to a valid address.");
  }

  const [signer] = await ethers.getSigners();
  const token = await ethers.getContractAt("ChiefToken", CONTRACT_ADDRESS, signer);

  const decimals = Number(await token.decimals());
  const symbol = await token.symbol();
  const from = await signer.getAddress();
  const fromBal = await token.balanceOf(from);
  const amountWei = ethers.parseUnits(AMOUNT, decimals);

  if (fromBal < amountWei) {
    throw new Error(`Insufficient ${symbol} balance. Wallet has ${ethers.formatUnits(fromBal, decimals)} ${symbol}.`);
  }

  console.log("From:", from);
  console.log("To:", TO_ADDRESS);
  console.log("Amount:", `${AMOUNT} ${symbol}`);

  const tx = await token.transfer(TO_ADDRESS, amountWei);
  console.log("Submitted tx:", tx.hash);
  await tx.wait();

  const toBal = await token.balanceOf(TO_ADDRESS);
  console.log("Recipient balance:", `${ethers.formatUnits(toBal, decimals)} ${symbol}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
