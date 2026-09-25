require("dotenv").config();
const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const NEW_OWNER = process.env.NEW_OWNER;

async function main() {
  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Invalid CONTRACT_ADDRESS. Set a valid address in .env or script.");
  }

  if (!NEW_OWNER || !ethers.isAddress(NEW_OWNER)) {
    throw new Error("Invalid NEW_OWNER. Set NEW_OWNER in .env to a valid wallet address.");
  }

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("ChiefToken", CONTRACT_ADDRESS, signer);

  const currentOwner = await contract.owner();
  console.log("Current owner:", currentOwner);
  console.log("Signer:", await signer.getAddress());
  console.log("New owner:", NEW_OWNER);

  if (currentOwner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
    throw new Error("Signer is not current owner. Use the owner private key in .env.");
  }

  if (currentOwner.toLowerCase() === NEW_OWNER.toLowerCase()) {
    console.log("Ownership already set to this wallet. Nothing to do.");
    return;
  }

  const tx = await contract.transferOwnership(NEW_OWNER);
  console.log("Submitted tx:", tx.hash);
  await tx.wait();

  const updatedOwner = await contract.owner();
  console.log("Updated owner:", updatedOwner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
