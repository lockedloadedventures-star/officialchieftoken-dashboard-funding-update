const TOKEN = "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const POOL = "0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d";
const WETH = "0x4200000000000000000000000000000000000006";

const RPC_URL = "https://base-rpc.publicnode.com";
const SELECTORS = {
  owner: "0x8da5cb5b",
  totalSupply: "0x18160ddd",
  decimals: "0x313ce567",
  balanceOf: "0x70a08231",
  token0: "0x0dfe1681",
  token1: "0xd21220a7",
  fee: "0xddca3f43"
};

function shortAddr(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function ethCall(to, data) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"]
    })
  });
  if (!response.ok) {
    throw new Error(`Base RPC returned HTTP ${response.status}.`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`Base RPC error: ${result.error.message || "eth_call failed"}`);
  }
  if (typeof result.result !== "string" || !/^0x[0-9a-f]+$/i.test(result.result)) {
    throw new Error("Base RPC returned an invalid eth_call result.");
  }
  return result.result;
}

function decodeUint(value) {
  return BigInt(value);
}

function decodeAddress(value) {
  return `0x${value.slice(-40)}`;
}

function formatAmount(rawValue, decimals, maximumFractionDigits) {
  const value = BigInt(rawValue);
  const divisor = 10n ** BigInt(decimals);
  const whole = (value / divisor).toLocaleString("en-US");
  const fraction = (value % divisor)
    .toString()
    .padStart(decimals, "0")
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

async function loadLiveData() {
  const ownerElement = document.getElementById("ownerAddress");
  const supplyElement = document.getElementById("totalSupply");
  const poolElement = document.getElementById("poolLiquidity");
  const statusElement = document.getElementById("liveDataStatus");

  try {
    const [
      ownerResult,
      totalSupplyRaw,
      tokenDecimalsRaw,
      poolChiefRaw,
      poolWethRaw,
      poolToken0Raw,
      poolToken1Raw,
      poolFee
    ] = await Promise.all([
      ethCall(TOKEN, SELECTORS.owner),
      ethCall(TOKEN, SELECTORS.totalSupply),
      ethCall(TOKEN, SELECTORS.decimals),
      ethCall(TOKEN, `${SELECTORS.balanceOf}${POOL.slice(2).toLowerCase().padStart(64, "0")}`),
      ethCall(WETH, `${SELECTORS.balanceOf}${POOL.slice(2).toLowerCase().padStart(64, "0")}`),
      ethCall(POOL, SELECTORS.token0),
      ethCall(POOL, SELECTORS.token1),
      ethCall(POOL, SELECTORS.fee)
    ]);

    const owner = decodeAddress(ownerResult);
    const tokenDecimals = Number(decodeUint(tokenDecimalsRaw));
    const poolToken0 = decodeAddress(poolToken0Raw);
    const poolToken1 = decodeAddress(poolToken1Raw);
    const decodedPoolFee = decodeUint(poolFee);
    const expectedTokens = new Set([TOKEN.toLowerCase(), WETH.toLowerCase()]);
    if (
      !expectedTokens.has(poolToken0.toLowerCase()) ||
      !expectedTokens.has(poolToken1.toLowerCase()) ||
      poolToken0.toLowerCase() === poolToken1.toLowerCase() ||
      decodedPoolFee !== 3000n
    ) {
      throw new Error("The published pool address did not match the expected CHIEF/WETH 0.3% pool.");
    }

    ownerElement.textContent = shortAddr(owner);
    supplyElement.textContent = `${formatAmount(decodeUint(totalSupplyRaw), tokenDecimals, 0)} CHIEF`;
    poolElement.textContent = `${formatAmount(decodeUint(poolChiefRaw), tokenDecimals, 2)} CHIEF + ${formatAmount(decodeUint(poolWethRaw), 18, 6)} WETH`;
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
