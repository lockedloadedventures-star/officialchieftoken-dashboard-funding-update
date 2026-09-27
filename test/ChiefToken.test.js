import assert from "node:assert/strict";
import { beforeEach, describe, it } from "mocha";
import { network } from "hardhat";

describe("ChiefToken", function () {
  let ethers;
  let owner;
  let recipient;
  let outsider;
  let token;

  beforeEach(async function () {
    ({ ethers } = await network.create());
    [owner, recipient, outsider] = await ethers.getSigners();
    token = await ethers.deployContract("ChiefToken", [owner.address]);
    await token.waitForDeployment();
  });

  it("mints the initial supply to the designated owner", async function () {
    const initialSupply = ethers.parseUnits("1000000", 18);

    assert.equal(await token.totalSupply(), initialSupply);
    assert.equal(await token.balanceOf(owner.address), initialSupply);
  });

  it("allows the owner to mint additional supply", async function () {
    const amount = ethers.parseUnits("50", 18);
    const transaction = await token.mint(recipient.address, amount);
    await transaction.wait();

    assert.equal(await token.balanceOf(recipient.address), amount);
    assert.equal(await token.totalSupply(), ethers.parseUnits("1000050", 18));
  });

  it("rejects minting by a non-owner", async function () {
    await assert.rejects(
      token.connect(outsider).mint(recipient.address, 1n),
      /OwnableUnauthorizedAccount/
    );
  });

  it("allows the owner to transfer ownership", async function () {
    const transaction = await token.transferOwnership(recipient.address);
    await transaction.wait();

    assert.equal(await token.owner(), recipient.address);
  });
});
