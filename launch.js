const TOKEN = "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const POOL = "0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d";
const WETH = "0x4200000000000000000000000000000000000006";

const provider = new ethers.JsonRpcProvider("https://base-rpc.publicnode.com");

const tokenAbi = [
  "function owner() view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)"
];

const poolAbi = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function fee() view returns (uint24)"
];

function shortAddr(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(value, decimals, maximumFractionDigits) {
  return Number(ethers.formatUnits(value, decimals)).toLocaleString("en-US", {
    maximumFractionDigits
  });
}

async function loadLiveData() {
  const ownerElement = document.getElementById("ownerAddress");
  const supplyElement = document.getElementById("totalSupply");
  const poolElement = document.getElementById("poolLiquidity");
  const statusElement = document.getElementById("liveDataStatus");

  try {
    const token = new ethers.Contract(TOKEN, tokenAbi, provider);
    const chief = new ethers.Contract(TOKEN, erc20Abi, provider);
    const weth = new ethers.Contract(WETH, erc20Abi, provider);
    const pool = new ethers.Contract(POOL, poolAbi, provider);

    const [
      owner,
      totalSupplyRaw,
      tokenDecimals,
      poolChiefRaw,
      poolWethRaw,
      poolToken0,
      poolToken1,
      poolFee
    ] = await Promise.all([
      token.owner(),
      token.totalSupply(),
      token.decimals(),
      chief.balanceOf(POOL),
      weth.balanceOf(POOL),
      pool.token0(),
      pool.token1(),
      pool.fee()
    ]);

    const expectedTokens = new Set([TOKEN.toLowerCase(), WETH.toLowerCase()]);
    if (
      !expectedTokens.has(poolToken0.toLowerCase()) ||
      !expectedTokens.has(poolToken1.toLowerCase()) ||
      poolToken0.toLowerCase() === poolToken1.toLowerCase() ||
      poolFee !== 3000n
    ) {
      throw new Error("The published pool address did not match the expected CHIEF/WETH 0.3% pool.");
    }

    ownerElement.textContent = shortAddr(owner);
    supplyElement.textContent = `${formatAmount(totalSupplyRaw, tokenDecimals, 0)} CHIEF`;
    poolElement.textContent = `${formatAmount(poolChiefRaw, tokenDecimals, 2)} CHIEF + ${formatAmount(poolWethRaw, 18, 6)} WETH`;
    statusElement.textContent = `Live Base read: ${new Date().toLocaleString()}. These are pool token balances, not executable depth, a reliable price, or guaranteed swap output.`;
  } catch (err) {
    console.error("Unable to load current CHIEF/Base pool data.", err);
    ownerElement.textContent = "Unavailable";
    supplyElement.textContent = "Unavailable";
    poolElement.textContent = "Unavailable";
    statusElement.textContent = "Live Base data could not be loaded. No cached pool balance is shown; retry later and verify the pool directly.";
  }
}

loadLiveData();
