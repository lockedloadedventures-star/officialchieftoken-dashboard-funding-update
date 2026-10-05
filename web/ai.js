const POOL_ADDRESS = "0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d";
const TOKEN_ADDRESS = "0x3896c9bd802A56c28590EF1E03A7de645c703757";
const BASE_RPC_URL = "https://base-rpc.publicnode.com";
const MARKET_API = "/api/chief-market";
const TOKEN_POOLS_API = "/api/token-pools";
const MARKET_REFRESH_MS = 60_000;
const REQUEST_TIMEOUT_MS = 12_000;
const SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  owner: "0x8da5cb5b",
  balanceOf: "0x70a08231"
};

const marketElements = {
  price: document.getElementById("liveChiefPrice"),
  reserve: document.getElementById("livePoolReserve"),
  activity: document.getElementById("livePoolActivity"),
  volume: document.getElementById("livePoolVolume"),
  updated: document.getElementById("marketUpdated"),
  statusDot: document.getElementById("marketStatusDot"),
  refreshButton: document.getElementById("refreshMarketBtn"),
  grid: document.querySelector(".market-grid")
};
const walletElements = {
  connectButton: document.getElementById("connectWalletBtn"),
  refreshButton: document.getElementById("refreshWalletBtn"),
  status: document.getElementById("walletStatus"),
  balances: document.getElementById("walletBalances"),
  address: document.getElementById("walletAddress"),
  explorerLink: document.getElementById("walletExplorerLink"),
  eth: document.getElementById("walletEthBalance"),
  chief: document.getElementById("walletChiefBalance")
};
const checkerElements = {
  form: document.getElementById("tokenCheckForm"),
  input: document.getElementById("tokenAddressInput"),
  checkButton: document.getElementById("tokenCheckButton"),
  chiefButton: document.getElementById("checkChiefButton"),
  shareButton: document.getElementById("copyReportLink"),
  status: document.getElementById("tokenCheckStatus"),
  results: document.getElementById("tokenCheckResults"),
  name: document.getElementById("resultTokenName"),
  symbol: document.getElementById("resultTokenSymbol"),
  contractLink: document.getElementById("resultContractLink"),
  supply: document.getElementById("resultSupply"),
  supplyLink: document.getElementById("supplySourceLink"),
  owner: document.getElementById("resultOwner"),
  ownerLink: document.getElementById("ownerSourceLink"),
  readStatus: document.getElementById("tokenReadStatus"),
  poolStatus: document.getElementById("poolLookupStatus"),
  pools: document.getElementById("tokenPools"),
  timestamp: document.getElementById("resultTimestamp")
};
let activeAccount = null;
let marketRequestController = null;

function usd(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits
  }).format(value);
}

function marketError(message) {
  marketElements.price.textContent = "Unavailable";
  marketElements.reserve.textContent = "Unavailable";
  marketElements.activity.textContent = "Unavailable";
  marketElements.volume.textContent = "Market data could not be loaded.";
  marketElements.updated.textContent = message;
  marketElements.statusDot.classList.add("feed-error");
  marketElements.grid.setAttribute("aria-busy", "false");
}

async function refreshMarketData() {
  if (marketRequestController) marketRequestController.abort();
  const controller = new AbortController();
  marketRequestController = controller;
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  marketElements.refreshButton.disabled = true;
  marketElements.grid.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(MARKET_API, { signal: controller.signal });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || `Market data returned HTTP ${response.status}.`);

    const attributes = payload?.data?.attributes;
    if (attributes?.address?.toLowerCase() !== POOL_ADDRESS.toLowerCase()) {
      throw new Error("GeckoTerminal returned an unexpected pool.");
    }

    const price = Number(attributes.base_token_price_usd);
    const reserve = Number(attributes.reserve_in_usd);
    const volume = Number(attributes.volume_usd?.h24);
    const transactions = attributes.transactions?.h24 || {};
    const buys = Number(transactions.buys || 0);
    const sells = Number(transactions.sells || 0);
    if (![price, reserve, volume, buys, sells].every(Number.isFinite) || price < 0 || reserve < 0 || volume < 0 || buys < 0 || sells < 0) {
      throw new Error("GeckoTerminal returned incomplete or invalid pool data.");
    }

    marketElements.price.textContent = usd(price, 8);
    marketElements.reserve.textContent = usd(reserve);
    marketElements.activity.textContent = `${(buys + sells).toLocaleString()} swaps`;
    marketElements.volume.textContent = `${usd(volume)} volume in the last 24 hours`;
    marketElements.updated.textContent = `Source: GeckoTerminal · Fetched ${new Date().toLocaleTimeString()}. Price is pool-implied; reserve and activity are provider-reported.`;
    marketElements.statusDot.classList.remove("feed-error");
  } catch (error) {
    if (controller.signal.aborted && marketRequestController !== controller) return;
    const message = controller.signal.aborted
      ? "Market feed timed out. Check your connection and retry."
      : `Market feed unavailable: ${error.message}`;
    marketError(message);
  } finally {
    clearTimeout(timeoutId);
    if (marketRequestController === controller) {
      marketRequestController = null;
      marketElements.refreshButton.disabled = false;
      marketElements.grid.setAttribute("aria-busy", "false");
    }
  }
}

function setWalletStatus(message, isError = false) {
  walletElements.status.textContent = message;
  walletElements.status.classList.toggle("wallet-error", isError);
}

function setWalletDisconnected(message) {
  activeAccount = null;
  walletElements.balances.hidden = true;
  walletElements.refreshButton.hidden = true;
  walletElements.connectButton.hidden = false;
  walletElements.connectButton.disabled = false;
  setWalletStatus(message);
}

function formatUnits(value, decimals, maximumFractionDigits) {
  const unit = 10n ** BigInt(decimals);
  const whole = value / unit;
  const fraction = (value % unit).toString().padStart(decimals, "0").slice(0, maximumFractionDigits).replace(/0+$/, "");
  const formattedWhole = whole.toLocaleString("en-US");
  return fraction ? `${formattedWhole}.${fraction}` : formattedWhole;
}

function encodeAddressCall(selector, address) {
  return `${selector}${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

async function rpcRequest(method, params, label = "Base RPC") {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(BASE_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}.`);
    const payload = await response.json();
    if (payload.error) throw new Error(payload.error.message || `${label} request failed.`);
    if (payload.result === undefined || payload.result === null) throw new Error(`${label} returned no result.`);
    return payload.result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`${label} request timed out.`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function baseRpc(method, params) {
  const result = await rpcRequest(method, params);
  if (typeof result !== "string" || !/^0x[0-9a-f]+$/i.test(result)) {
    throw new Error("Base RPC returned an invalid hexadecimal result.");
  }
  return BigInt(result);
}

function decodeAbiString(data) {
  if (typeof data !== "string" || !/^0x(?:[0-9a-f]{2})*$/i.test(data) || data.length < 66) {
    throw new Error("Contract returned invalid text data.");
  }
  const encoded = data.slice(2);
  const offset = Number(BigInt(`0x${encoded.slice(0, 64)}`)) * 2;
  if (!Number.isSafeInteger(offset) || offset < 64 || offset + 64 > encoded.length) {
    const bytes = encoded.slice(0, 64).match(/.{2}/g) || [];
    const text = new TextDecoder().decode(Uint8Array.from(bytes.map((byte) => Number.parseInt(byte, 16)))).replace(/\0+$/, "");
    if (!text) throw new Error("Contract returned invalid text data.");
    return text;
  }
  const length = Number(BigInt(`0x${encoded.slice(offset, offset + 64)}`));
  if (!Number.isSafeInteger(length) || length < 0 || offset + 64 + length * 2 > encoded.length) {
    throw new Error("Contract returned invalid text length.");
  }
  const bytes = encoded.slice(offset + 64, offset + 64 + length * 2).match(/.{2}/g) || [];
  return new TextDecoder().decode(Uint8Array.from(bytes.map((byte) => Number.parseInt(byte, 16))));
}

async function readOptionalContractValue(address, selector, decoder) {
  try {
    const result = await rpcRequest("eth_call", [{ to: address, data: selector }, "latest"]);
    if (typeof result !== "string") throw new Error("RPC returned an invalid result.");
    return { value: decoder(result), error: "" };
  } catch (error) {
    return { value: null, error: error.message };
  }
}

function decodeUint(data) {
  if (typeof data !== "string" || !/^0x[0-9a-f]{64,}$/i.test(data)) {
    throw new Error("Contract returned invalid integer data.");
  }
  return BigInt(data);
}

function decodeAddress(data) {
  if (typeof data !== "string" || !/^0x[0-9a-f]{64,}$/i.test(data)) {
    throw new Error("Contract returned invalid address data.");
  }
  return `0x${data.slice(-40)}`.toLowerCase();
}

function formatTokenSupply(value, decimals) {
  const unit = 10n ** BigInt(decimals);
  const whole = value / unit;
  const fraction = (value % unit).toString().padStart(decimals, "0").replace(/0+$/, "");
  const formattedWhole = whole.toLocaleString("en-US");
  return fraction ? `${formattedWhole}.${fraction}` : formattedWhole;
}

function setCheckerStatus(message, isError = false) {
  checkerElements.status.textContent = message;
  checkerElements.status.classList.toggle("checker-error", isError);
}

function setShareableAddress(address) {
  const url = new URL(window.location.href);
  url.searchParams.set("address", address);
  window.history.replaceState(null, "", url);
  checkerElements.shareButton.hidden = false;
}

async function copyReportLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setCheckerStatus("Shareable report link copied. Anyone opening it can run the same read-only Base check.");
  } catch {
    setCheckerStatus("Copy was blocked by this browser. The report address is in the address bar and can be copied manually.", true);
  }
}

function createPoolCard(pool) {
  const attributes = pool.attributes || {};
  const poolAddress = attributes.address;
  if (typeof poolAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(poolAddress)) return null;
  const reserve = Number(attributes.reserve_in_usd);
  const volume = Number(attributes.volume_usd?.h24);
  const transactions = attributes.transactions?.h24 || {};
  const buys = Number(transactions.buys || 0);
  const sells = Number(transactions.sells || 0);
  const poolUrl = `https://www.geckoterminal.com/base/pools/${poolAddress}`;

  const article = document.createElement("article");
  article.className = "token-pool-card";
  const header = document.createElement("div");
  header.className = "pool-card-header";
  const name = document.createElement("strong");
  name.textContent = attributes.name || "Pool name not reported";
  const source = document.createElement("a");
  source.className = "pool-source-link";
  source.href = poolUrl;
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.textContent = "Source ↗";
  header.append(name, source);

  const metrics = document.createElement("div");
  metrics.className = "pool-metrics";
  const reserveValue = document.createElement("span");
  reserveValue.textContent = Number.isFinite(reserve) && reserve >= 0 ? `${usd(reserve)} reserves` : "Reserves not reported";
  const activityValue = document.createElement("span");
  if (Number.isFinite(volume) && volume >= 0 && Number.isFinite(buys) && Number.isFinite(sells)) {
    activityValue.textContent = `${(buys + sells).toLocaleString()} swaps · ${usd(volume)} volume (24h)`;
  } else {
    activityValue.textContent = "24h activity not reported";
  }
  metrics.append(reserveValue, activityValue);
  article.append(header, metrics);
  return { article, reserve: Number.isFinite(reserve) && reserve >= 0 ? reserve : -1 };
}

async function loadTokenPools(address) {
  checkerElements.poolStatus.textContent = "Looking up pools listed by GeckoTerminal…";
  checkerElements.pools.replaceChildren();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${TOKEN_POOLS_API}?address=${encodeURIComponent(address)}`, { signal: controller.signal });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || `Pool lookup returned HTTP ${response.status}.`);
    if (!Array.isArray(payload?.data)) throw new Error("GeckoTerminal returned an unexpected pool list.");

    const expectedId = `base_${address.toLowerCase()}`;
    const matchingPools = payload.data.filter((pool) => {
      const relations = pool.relationships || {};
      return [relations.base_token?.data?.id, relations.quote_token?.data?.id]
        .some((tokenId) => typeof tokenId === "string" && tokenId.toLowerCase() === expectedId);
    });
    const cards = matchingPools.map(createPoolCard).filter(Boolean).sort((a, b) => b.reserve - a.reserve);
    for (const card of cards.slice(0, 3)) checkerElements.pools.append(card.article);
    checkerElements.poolStatus.textContent = cards.length
      ? `Showing up to 3 provider-listed pools, ordered by reported reserve. Source: GeckoTerminal.`
      : "No matching pools were returned by GeckoTerminal. This does not prove that no pools exist.";
  } catch (error) {
    checkerElements.poolStatus.textContent = `Pool lookup unavailable: ${error.message}`;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkToken(address) {
  checkerElements.checkButton.disabled = true;
  checkerElements.results.hidden = true;
  checkerElements.results.setAttribute("aria-busy", "true");
  checkerElements.pools.replaceChildren();
  setCheckerStatus("Checking the Base mainnet contract…");
  try {
    const chainId = await rpcRequest("eth_chainId", [], "Base RPC");
    if (String(chainId).toLowerCase() !== "0x2105") {
      throw new Error("The configured RPC did not identify itself as Base mainnet (chain ID 8453).");
    }
    const code = await rpcRequest("eth_getCode", [address, "latest"], "Base RPC");
    if (typeof code !== "string" || !/^0x[0-9a-f]*$/i.test(code)) throw new Error("Base RPC returned invalid contract code.");
    if (code === "0x") throw new Error("No contract code exists at this address on Base mainnet.");

    checkerElements.results.hidden = false;
    checkerElements.contractLink.href = `https://basescan.org/address/${address}`;
    checkerElements.supplyLink.href = `https://basescan.org/address/${address}#readContract`;
    checkerElements.ownerLink.hidden = true;
    checkerElements.name.textContent = "Reading token metadata…";
    checkerElements.symbol.textContent = address;
    checkerElements.supply.textContent = "Reading…";
    checkerElements.owner.textContent = "Reading…";
    setCheckerStatus("Contract code found. Reading public contract fields.");

    const reads = await Promise.all([
      readOptionalContractValue(address, SELECTORS.name, decodeAbiString),
      readOptionalContractValue(address, SELECTORS.symbol, decodeAbiString),
      readOptionalContractValue(address, SELECTORS.decimals, decodeUint),
      readOptionalContractValue(address, SELECTORS.totalSupply, decodeUint),
      readOptionalContractValue(address, SELECTORS.owner, decodeAddress)
    ]);
    const [name, symbol, decimals, supply, owner] = reads;
    checkerElements.name.textContent = name.value || "Name not returned";
    checkerElements.symbol.textContent = `${symbol.value || "Symbol not returned"} · ${address}`;
    if (supply.value !== null && decimals.value !== null && decimals.value >= 0n && decimals.value <= 36n) {
      checkerElements.supply.textContent = `${formatTokenSupply(supply.value, Number(decimals.value))} ${symbol.value || "tokens"}`;
    } else {
      checkerElements.supply.textContent = "Supply/decimals not returned";
    }

    if (owner.value) {
      checkerElements.owner.textContent = owner.value;
      checkerElements.ownerLink.href = `https://basescan.org/address/${owner.value}`;
      checkerElements.ownerLink.hidden = false;
    } else {
      checkerElements.owner.textContent = "Standard owner() field not returned";
    }

    const failedReads = reads
      .map((read, index) => read.error ? `${["name", "symbol", "decimals", "totalSupply", "owner()"][index]}: ${read.error}` : null)
      .filter(Boolean);
    checkerElements.readStatus.textContent = `Source: Base RPC · Contract bytecode present · ${failedReads.length ? `Some standard fields could not be read: ${failedReads.join("; ")}` : "Standard ERC-20 fields returned successfully."}`;
    checkerElements.timestamp.textContent = `On-chain fields fetched ${new Date().toLocaleString()}. Latest block data may change; verify on BaseScan. Pool information is provider-reported separately.`;
    setCheckerStatus("Contract found on Base. Review each source and the limits below; this is not a safety verdict.");
    await loadTokenPools(address);
  } catch (error) {
    checkerElements.results.hidden = true;
    setCheckerStatus(error.message, true);
  } finally {
    checkerElements.checkButton.disabled = false;
    checkerElements.results.setAttribute("aria-busy", "false");
  }
}

async function refreshWalletBalances() {
  if (!activeAccount) return;
  const accountBeingRead = activeAccount;
  walletElements.refreshButton.disabled = true;
  walletElements.connectButton.disabled = true;
  walletElements.balances.setAttribute("aria-busy", "true");
  setWalletStatus("Reading public Base balances…");

  try {
    const [ethBalance, chiefBalance, tokenDecimals] = await Promise.all([
      baseRpc("eth_getBalance", [accountBeingRead, "latest"]),
      baseRpc("eth_call", [{ to: TOKEN_ADDRESS, data: encodeAddressCall(SELECTORS.balanceOf, accountBeingRead) }, "latest"]),
      baseRpc("eth_call", [{ to: TOKEN_ADDRESS, data: SELECTORS.decimals }, "latest"])
    ]);
    if (activeAccount !== accountBeingRead) return;
    if (tokenDecimals < 0n || tokenDecimals > 36n) throw new Error("The token contract returned invalid decimals.");
    walletElements.address.textContent = accountBeingRead;
    walletElements.explorerLink.href = `https://basescan.org/address/${accountBeingRead}`;
    walletElements.eth.textContent = `${formatUnits(ethBalance, 18, 6)} ETH`;
    walletElements.chief.textContent = `${formatUnits(chiefBalance, Number(tokenDecimals), 4)} CHIEF`;
    walletElements.balances.hidden = false;
    setWalletStatus("Connected. Read-only Base balances updated just now.");
  } catch (error) {
    setWalletStatus(`Could not read Base balances: ${error.message}`, true);
  } finally {
    walletElements.refreshButton.disabled = false;
    walletElements.connectButton.disabled = false;
    walletElements.balances.setAttribute("aria-busy", "false");
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    setWalletStatus("MetaMask was not detected. Install or unlock MetaMask, then retry.", true);
    return;
  }
  walletElements.connectButton.disabled = true;
  setWalletStatus("Waiting for MetaMask account permission…");
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!Array.isArray(accounts) || !/^0x[a-fA-F0-9]{40}$/.test(accounts[0] || "")) {
      throw new Error("MetaMask did not provide a valid account.");
    }
    activeAccount = `0x${accounts[0].slice(2).toLowerCase()}`;
    walletElements.connectButton.hidden = true;
    walletElements.refreshButton.hidden = false;
    walletElements.balances.hidden = false;
    await refreshWalletBalances();
  } catch (error) {
    setWalletStatus(error.code === 4001
      ? "Wallet connection was declined. No account was accessed."
      : `Could not connect to MetaMask: ${error.message}`, true);
    walletElements.connectButton.disabled = false;
  }
}

checkerElements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const address = checkerElements.input.value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    checkerElements.results.hidden = true;
    checkerElements.shareButton.hidden = true;
    setCheckerStatus("Enter a valid 42-character EVM contract address beginning with 0x.", true);
    checkerElements.input.focus();
    return;
  }
  const normalizedAddress = address.toLowerCase();
  setShareableAddress(normalizedAddress);
  checkToken(normalizedAddress);
});
checkerElements.chiefButton.addEventListener("click", () => {
  checkerElements.input.value = TOKEN_ADDRESS;
  setShareableAddress(TOKEN_ADDRESS.toLowerCase());
  checkToken(TOKEN_ADDRESS);
});
checkerElements.shareButton.addEventListener("click", copyReportLink);

marketElements.refreshButton.addEventListener("click", refreshMarketData);
walletElements.connectButton.addEventListener("click", connectWallet);
walletElements.refreshButton.addEventListener("click", refreshWalletBalances);

if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (!accounts.length) {
      setWalletDisconnected("MetaMask disconnected this page. No wallet permission is currently active.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(accounts[0] || "")) {
      setWalletDisconnected("MetaMask returned an invalid account. Reconnect to retry.");
      return;
    }
    activeAccount = `0x${accounts[0].slice(2).toLowerCase()}`;
    refreshWalletBalances();
  });
}

refreshMarketData();
setInterval(refreshMarketData, MARKET_REFRESH_MS);

const sharedAddress = new URLSearchParams(window.location.search).get("address");
if (sharedAddress && /^0x[a-fA-F0-9]{40}$/.test(sharedAddress)) {
  const normalizedAddress = sharedAddress.toLowerCase();
  checkerElements.input.value = normalizedAddress;
  setShareableAddress(normalizedAddress);
  checkToken(normalizedAddress);
}
