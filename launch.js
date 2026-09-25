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
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

function shortAddr(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function loadLiveData() {
  try {
    const token = new ethers.Contract(TOKEN, tokenAbi, provider);
    const chief = new ethers.Contract(TOKEN, erc20Abi, provider);
    const weth = new ethers.Contract(WETH, erc20Abi, provider);

    const [owner, totalSupplyRaw, tokenDecimals, poolChiefRaw, poolWethRaw] = await Promise.all([
      token.owner(),
      token.totalSupply(),
      token.decimals(),
      chief.balanceOf(POOL),
      weth.balanceOf(POOL)
    ]);

    const totalSupply = ethers.formatUnits(totalSupplyRaw, tokenDecimals);
    const poolChief = ethers.formatUnits(poolChiefRaw, tokenDecimals);
    const poolWeth = ethers.formatEther(poolWethRaw);

    document.getElementById("ownerAddress").textContent = shortAddr(owner);
    document.getElementById("totalSupply").textContent = `${Number(totalSupply).toLocaleString()} CHIEF`;
    document.getElementById("poolLiquidity").textContent = `${Number(poolChief).toLocaleString()} CHIEF + ${Number(poolWeth).toFixed(4)} WETH`;
  } catch (err) {
    document.getElementById("ownerAddress").textContent = "Unavailable";
    document.getElementById("totalSupply").textContent = "Unavailable";
    document.getElementById("poolLiquidity").textContent = "Unavailable";
  }
}

loadLiveData();
