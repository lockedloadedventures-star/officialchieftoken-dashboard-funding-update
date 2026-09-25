const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const ChiefToken = await hre.ethers.getContractFactory("ChiefToken");
  const token = await ChiefToken.deploy(deployer.address);

  await token.waitForDeployment();
  const address = await token.getAddress();

  console.log("ChiefToken deployed to:", address);

  const totalSupply = await token.totalSupply();
  console.log("Initial total supply:", hre.ethers.formatUnits(totalSupply, 18), "CHIEF");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
