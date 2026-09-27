require("dotenv").config();
const { ethers } = require("ethers");

// Base mainnet addresses
const CHIEF_ADDRESS     = "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const WETH_ADDRESS      = "0x4200000000000000000000000000000000000006";
const FACTORY_ADDRESS   = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 factory on Base
const POS_MGR_ADDRESS   = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"; // NonfungiblePositionManager on Base

const FEE = 3000;        // 0.3% fee tier

function parseLiquidityAmount(name) {
  const value = process.env[name] || "";
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Set ${name} to an explicit positive amount.`);
  }

  const amount = ethers.parseUnits(value, 18);
  if (amount <= 0n) {
    throw new Error(`${name} must be greater than zero.`);
  }
  return amount;
}

// 1 ETH = 1,000,000 CHIEF  →  price CHIEF/WETH = 0.000001
// token0 = CHIEF (lower address), token1 = WETH
// sqrtPriceX96 = sqrt(0.000001) * 2^96
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
  if (process.env.CONFIRM_LIQUIDITY_ACTION !== "I_UNDERSTAND") {
    throw new Error("Set CONFIRM_LIQUIDITY_ACTION=I_UNDERSTAND only after reviewing the proposed amounts.");
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Set PRIVATE_KEY in .env for the wallet that will supply liquidity.");
  }
  if (!process.env.BASE_MAINNET_RPC_URL) {
    throw new Error("Set BASE_MAINNET_RPC_URL in .env.");
  }

  const chiefDesired = parseLiquidityAmount("LIQUIDITY_CHIEF_AMOUNT");
  const wethDesired = parseLiquidityAmount("LIQUIDITY_WETH_AMOUNT");
  const gasReserve = parseLiquidityAmount("LIQUIDITY_GAS_RESERVE_ETH");
  const slippageText = process.env.LIQUIDITY_MAX_SLIPPAGE_BPS || "";
  if (!/^\d+$/.test(slippageText)) {
    throw new Error("Set LIQUIDITY_MAX_SLIPPAGE_BPS to an integer from 1 to 500.");
  }
  const slippageBps = Number(slippageText);
  if (slippageBps < 1 || slippageBps > 500) {
    throw new Error("LIQUIDITY_MAX_SLIPPAGE_BPS must be from 1 to 500.");
  }

  const rpc = process.env.BASE_MAINNET_RPC_URL;
  // Use a network object without ENS to prevent ENS resolution on Base
  const network = ethers.Network.from({ chainId: 8453, name: "base" });
  const provider = new ethers.JsonRpcProvider(rpc, network, { staticNetwork: network });
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const signerAddr = signer.address;

  const chainId = BigInt(await provider.send("eth_chainId", []));
  if (chainId !== 8453n) {
    throw new Error(`Wrong network: expected Base chain 8453, got ${chainId}.`);
  }

  const rawBal = await provider.send("eth_getBalance", [signerAddr, "latest"]);
  const ethBalance = BigInt(rawBal);
  console.log("Signer:", signerAddr);
  console.log("ETH balance:", ethers.formatEther(ethBalance));

  // Determine token order
  const token0 = CHIEF_ADDRESS.toLowerCase() < WETH_ADDRESS.toLowerCase() ? CHIEF_ADDRESS : WETH_ADDRESS;
  const token1 = token0 === CHIEF_ADDRESS ? WETH_ADDRESS : CHIEF_ADDRESS;
  console.log("token0:", token0);
  console.log("token1:", token1);

  // --- Interfaces ---
  const factoryIface = new ethers.Interface([
    "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)"
  ]);
  const poolIface = new ethers.Interface([
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ]);
  const erc20Iface = new ethers.Interface([
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
  ]);
  const posMgrIface = new ethers.Interface([
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ]);

  // Step 1: Require the existing pool; creation and initial price need separate review.
  let [poolAddr] = await ethCall(provider, FACTORY_ADDRESS, factoryIface, "getPool", [token0, token1, FEE]);
  if (poolAddr === ethers.ZeroAddress) {
    throw new Error("CHIEF/WETH pool does not exist. Review pool creation and initial price separately.");
  }
  console.log("Pool:", poolAddr);

  // Step 2: Require an initialized pool before any transaction.
  const slot0Result = await ethCall(provider, poolAddr, poolIface, "slot0", []);
  const currentSqrtPrice = slot0Result[0];
  if (currentSqrtPrice === 0n) {
    throw new Error("Pool is not initialized. Review and set an initial price separately.");
  }
  console.log("Current sqrtPriceX96:", currentSqrtPrice.toString());

  // Step 3: Wrap ETH → WETH and approve both tokens for position manager
  const wethIface = new ethers.Interface([
    "function deposit() payable",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ]);

  const [chiefBalance] = await ethCall(provider, CHIEF_ADDRESS, erc20Iface, "balanceOf", [signerAddr]);
  const [wethBalance] = await ethCall(provider, WETH_ADDRESS, wethIface, "balanceOf", [signerAddr]);
  const wethToWrap = wethDesired > wethBalance ? wethDesired - wethBalance : 0n;
  if (chiefBalance < chiefDesired) {
    throw new Error(`Insufficient CHIEF: wallet has ${ethers.formatUnits(chiefBalance, 18)}, requested ${ethers.formatUnits(chiefDesired, 18)}.`);
  }
  if (ethBalance < wethToWrap + gasReserve) {
    throw new Error(`Insufficient Base ETH for WETH and gas reserve: need at least ${ethers.formatEther(wethToWrap + gasReserve)} ETH.`);
  }

  console.log("CHIEF amount:", ethers.formatUnits(chiefDesired, 18));
  console.log("WETH amount:", ethers.formatUnits(wethDesired, 18));
  console.log("Maximum slippage:", `${slippageBps} bps`);
  console.log("Gas reserve:", ethers.formatEther(gasReserve), "ETH");

  if (wethToWrap > 0n) {
    console.log("Wrapping ETH to cover WETH shortfall:", ethers.formatEther(wethToWrap));
    await sendTx(signer, provider, WETH_ADDRESS, wethIface, "deposit", [], wethToWrap);
  } else {
    console.log("Existing WETH balance covers the requested amount.");
  }

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

  const [wethAllowance] = await ethCall(provider, WETH_ADDRESS, wethIface, "allowance", [signerAddr, POS_MGR_ADDRESS]);
  if (wethAllowance < wethDesired) {
    console.log("Approving WETH for NonfungiblePositionManager...");
    await sendTx(signer, provider, WETH_ADDRESS, wethIface, "approve", [POS_MGR_ADDRESS, wethDesired]);
  }

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
    amount0Min: amount0Desired * BigInt(10000 - slippageBps) / 10000n,
    amount1Min: amount1Desired * BigInt(10000 - slippageBps) / 10000n,
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
