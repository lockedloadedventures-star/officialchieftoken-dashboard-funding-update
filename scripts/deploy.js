async function main() {
  const { default: hre } = await import("hardhat");
  const { ethers } = await hre.network.create();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const ChiefToken = await ethers.getContractFactory("ChiefToken");
  const token = await ChiefToken.deploy(deployer.address);

  await token.waitForDeployment();
  const address = await token.getAddress();

  console.log("ChiefToken deployed to:", address);

  const totalSupply = await token.totalSupply();
  console.log("Initial total supply:", ethers.formatUnits(totalSupply, 18), "CHIEF");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
