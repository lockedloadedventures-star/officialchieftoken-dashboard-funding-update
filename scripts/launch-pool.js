require("dotenv").config();
const { ethers } = require("ethers");

// Base mainnet addresses
const CHIEF_ADDRESS     = "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const WETH_ADDRESS      = "0x4200000000000000000000000000000000000006";
const FACTORY_ADDRESS   = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 factory on Base
const POS_MGR_ADDRESS   = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"; // NonfungiblePositionManager on Base

const FEE = 3000;        // 0.3% fee tier
const TICK_SPACING = 60; // tick spacing for 0.3%

// 1 ETH = 1,000,000 CHIEF  →  price CHIEF/WETH = 0.000001
// token0 = CHIEF (lower address), token1 = WETH
// sqrtPriceX96 = sqrt(0.000001) * 2^96
function computeSqrtPriceX96() {
  const Q96 = 2n ** 96n;
  // sqrt(1e-6) = 1e-3; represent as rational: numerator=1, denominator=1000
  // sqrtPriceX96 = Q96 / 1000
  return Q96 / 1000n;
}

function nearestUsableTick(tick, spacing) {
  // Always round towards zero so we stay within valid range
  const rounded = Math.trunc(tick / spacing) * spacing;
  return rounded;
}

// Helper: send a raw call using eth_call
async function ethCall(provider, to, iface, fn, args) {
  const data = iface.encodeFunctionData(fn, args);
  const result = await provider.send("eth_call", [{ to, data }, "latest"]);
  return iface.decodeFunctionResult(fn, result);
}

// Helper: send a signed tx
async function sendTx(signer, provider, to, iface, fn, args, value = 0n) {
  const data = iface.encodeFunctionData(fn, args);
  const nonce = await provider.send("eth_getTransactionCount", [await signer.getAddress(), "pending"]);
  const feeData = await provider.getFeeData();
  const chainId = (await provider.getNetwork()).chainId;

  const tx = {
    to,
    data,
    value,
    nonce: parseInt(nonce, 16),
    gasLimit: 800000n,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    chainId
  };

  const signed = await signer.signTransaction(tx);
  const txHash = await provider.send("eth_sendRawTransaction", [signed]);
  console.log("  tx sent:", txHash);

  // poll for receipt
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const receipt = await provider.send("eth_getTransactionReceipt", [txHash]);
    if (receipt) {
      if (parseInt(receipt.status, 16) === 0) {
        // Try to get revert reason
        try {
          const simResult = await provider.send("eth_call", [{ to, data, value: '0x' + value.toString(16) }, 'latest']);
          console.error("eth_call result:", simResult);
        } catch (simErr) {
          console.error("Revert reason:", simErr.message);
        }
        throw new Error("Transaction reverted: " + txHash);
      }
      return { txHash, receipt };
    }
  }
  throw new Error("Timed out waiting for receipt: " + txHash);
}

async function main() {
  const rpc = process.env.BASE_MAINNET_RPC_URL || "https://base-rpc.publicnode.com";
  // Use a network object without ENS to prevent ENS resolution on Base
  const network = ethers.Network.from({ chainId: 8453, name: "base" });
  const provider = new ethers.JsonRpcProvider(rpc, network, { staticNetwork: network });
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const signerAddr = signer.address;

  const rawBal = await provider.send("eth_getBalance", [signerAddr, "latest"]);
  console.log("Signer:", signerAddr);
  console.log("ETH balance:", ethers.formatEther(BigInt(rawBal)));

  // Determine token order
  const token0 = CHIEF_ADDRESS.toLowerCase() < WETH_ADDRESS.toLowerCase() ? CHIEF_ADDRESS : WETH_ADDRESS;
  const token1 = token0 === CHIEF_ADDRESS ? WETH_ADDRESS : CHIEF_ADDRESS;
  console.log("token0:", token0);
  console.log("token1:", token1);

  const sqrtPriceX96 = computeSqrtPriceX96();
  console.log("sqrtPriceX96:", sqrtPriceX96.toString());

  // --- Interfaces ---
  const factoryIface = new ethers.Interface([
    "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)",
    "function createPool(address tokenA, address tokenB, uint24 fee) returns (address)"
  ]);
  const poolIface = new ethers.Interface([
    "function initialize(uint160 sqrtPriceX96)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ]);
  const erc20Iface = new ethers.Interface([
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
  ]);
  const posMgrIface = new ethers.Interface([
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ]);

  // Step 1: Get or create pool
  let [poolAddr] = await ethCall(provider, FACTORY_ADDRESS, factoryIface, "getPool", [token0, token1, FEE]);
  if (poolAddr === ethers.ZeroAddress) {
    console.log("Creating Uniswap V3 pool...");
    await sendTx(signer, provider, FACTORY_ADDRESS, factoryIface, "createPool", [token0, token1, FEE]);
    [poolAddr] = await ethCall(provider, FACTORY_ADDRESS, factoryIface, "getPool", [token0, token1, FEE]);
    console.log("Pool created:", poolAddr);
  } else {
    console.log("Pool already exists:", poolAddr);
  }

  // Step 2: Initialize pool price if needed
  const slot0Result = await ethCall(provider, poolAddr, poolIface, "slot0", []);
  const currentSqrtPrice = slot0Result[0];
  if (currentSqrtPrice === 0n) {
    console.log("Initializing pool price...");
    await sendTx(signer, provider, poolAddr, poolIface, "initialize", [sqrtPriceX96]);
    console.log("Pool initialized.");
  } else {
    console.log("Pool already initialized. sqrtPriceX96:", currentSqrtPrice.toString());
  }

  // Step 3: Wrap ETH → WETH and approve both tokens for position manager
  const wethDesired = ethers.parseEther("0.004");
  const chiefDesired = ethers.parseUnits("100000", 18); // 100,000 CHIEF

  const wethIface = new ethers.Interface([
    "function deposit() payable",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address) view returns (uint256)"
  ]);

  console.log("Wrapping 0.004 ETH → WETH...");
  await sendTx(signer, provider, WETH_ADDRESS, wethIface, "deposit", [], wethDesired);
  console.log("ETH wrapped to WETH.");

  // Check if CHIEF is already approved (skip if already approved from prev run)
  const [chiefAllowance] = await ethCall(provider, CHIEF_ADDRESS, new ethers.Interface([
    "function allowance(address owner, address spender) view returns (uint256)"
  ]), "allowance", [signerAddr, POS_MGR_ADDRESS]);
  if (chiefAllowance < chiefDesired) {
    console.log("Approving CHIEF for NonfungiblePositionManager...");
    await sendTx(signer, provider, CHIEF_ADDRESS, erc20Iface, "approve", [POS_MGR_ADDRESS, chiefDesired]);
    console.log("CHIEF approved.");
  } else {
    console.log("CHIEF already approved.");
  }

  console.log("Approving WETH for NonfungiblePositionManager...");
  await sendTx(signer, provider, WETH_ADDRESS, wethIface, "approve", [POS_MGR_ADDRESS, wethDesired]);
  console.log("WETH approved.");

  // Step 4: Add liquidity via NonfungiblePositionManager (using WETH, not raw ETH)
  // Use hardcoded full-range ticks aligned to tick spacing 60
  const tickLower = -887220; // Math.trunc(-887272/60)*60
  const tickUpper = 887220;  // Math.trunc(887272/60)*60
  console.log("tickLower:", tickLower, "tickUpper:", tickUpper);

  const amount0Desired = token0 === CHIEF_ADDRESS ? chiefDesired : wethDesired;
  const amount1Desired = token0 === CHIEF_ADDRESS ? wethDesired : chiefDesired;
  const deadline = Math.floor(Date.now() / 1000) + 600;


  const posMgrIfaceFinal = new ethers.Interface([
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ]);

  const mintStruct = {
    token0,
    token1,
    fee: FEE,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min: 0n,
    amount1Min: 0n,
    recipient: signerAddr,
    deadline
  };

  console.log("Adding liquidity to pool (WETH + CHIEF)...");
  const { txHash } = await sendTx(signer, provider, POS_MGR_ADDRESS, posMgrIfaceFinal, "mint", [mintStruct], 0n);
  console.log("Liquidity added! Tx:", txHash);
  console.log("\n=== CHIEF/WETH Pool is LIVE on Base ===");
  console.log("Pool address:     ", poolAddr);
  console.log("Uniswap pair URL: https://app.uniswap.org/explore/pools/base/" + poolAddr);
  console.log("Basescan pool:    https://basescan.org/address/" + poolAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
