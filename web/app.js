
const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connectBtn");
const switchBtn = document.getElementById("switchBtn");
const walletAddressEl = document.getElementById("walletAddress");
const networkTagEl = document.getElementById("networkTag");
const roleTagEl = document.getElementById("roleTag");
const ownerOnlyButtons = [
  document.getElementById("claimBtn"),
  document.getElementById("mintToBtn"),
  document.getElementById("transferOwnerBtn")
];

const CONTRACT_ADDRESS = "0x3896c9bd802A56c28590EF1E03A7de645c703757";

const NETWORKS = {
  11155111: {
    name: "Sepolia",
    chainHex: "0xaa36a7",
    label: "Sepolia Testnet",
    explorer: "https://sepolia.etherscan.io",
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 }
  },
  8453: {
    name: "Base",
    chainHex: "0x2105",
    label: "Base Mainnet",
    explorer: "https://basescan.org",
    rpcUrls: ["https://mainnet.base.org"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  }
};

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function transferOwnership(address newOwner)"
];


let provider;
const readProvider = new ethers.JsonRpcProvider("https://base.publicnode.com");
let signer;
let contract;
let readContract;
let currentAccount = null;
let currentChainId = null;
let tokenDecimals = 18;
const MIN_GAS_ETH = "0.0002";
const AUTO_REFRESH_MS = 15000;
let refreshTimer = null;

function setStatus(text, type = "") {
  statusEl.textContent = text;
  statusEl.className = "status";
  if (type) statusEl.classList.add(type);
}

function setOwnerControls(isOwner, disabledReason = "Owner-only action") {
  ownerOnlyButtons.forEach((btn) => {
    if (!btn) return;
    btn.disabled = !isOwner;
    btn.title = isOwner ? "" : disabledReason;
  });
}

function currentNetwork() {
  return NETWORKS[currentChainId] || null;
}

function shortAddr(addr) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatEthersError(err) {
  if (!err) return "Action failed.";
  const msg = err.shortMessage || err.reason || err.message || "Action failed.";
  const lower = String(msg).toLowerCase();

  if (err.code === 4001 || err.code === "ACTION_REJECTED") {
    return "Request was rejected in wallet.";
  }
  if (lower.includes("insufficient funds")) {
    return "Not enough ETH for gas.";
  }
  if (lower.includes("execution reverted")) {
    return "Transaction reverted. Confirm owner account, contract network, and amount.";
  }
  if (lower.includes("missing revert data")) {
    return "Call failed on current network. Switch to the network where CHIEF is deployed.";
  }
  if (
    lower.includes("could not coalesce") ||
    lower.includes("failed to fetch") ||
    lower.includes("network error")
  ) {
    return "Wallet RPC request failed. Check MetaMask is connected to Base Mainnet, then retry.";
  }

  return msg;
}

async function assertContractDeployed() {
  const code = await readProvider.getCode(CONTRACT_ADDRESS);
  if (!code || code === "0x") {
    const net = currentNetwork();
    const netName = net ? net.label : `Chain ${currentChainId}`;
    throw new Error(`CHIEF contract not found on ${netName}. Switch network and retry.`);
  }
}

async function assertGasBalance() {
  const nativeBal = await readProvider.getBalance(currentAccount);
  if (nativeBal < ethers.parseEther(MIN_GAS_ETH)) {
    throw new Error(`Low ETH for gas (${ethers.formatEther(nativeBal)} ETH). Top up and retry.`);
  }
}

async function getChainId() {
  const hex = await window.ethereum.request({ method: "eth_chainId" });
  return Number.parseInt(hex, 16);
}

async function ensureSupportedNetwork() {
  const chainId = await getChainId();
  currentChainId = chainId;
  const net = NETWORKS[chainId];

  if (!net || chainId !== 8453) {
    networkTagEl.textContent = `Unsupported network (${chainId})`;
    setStatus("CHIEF is deployed on Base Mainnet. Switch MetaMask to Base Mainnet, then reconnect.", "error");
    switchBtn.style.display = "inline-block";
    throw new Error("CHIEF requires Base Mainnet");
  }

  switchBtn.style.display = "none";
  networkTagEl.textContent = `${net.label} ✓`;
  return net;
}

async function switchNetwork(chainId) {
  const net = NETWORKS[chainId];
  if (!net) throw new Error("Unknown network");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: net.chainHex }]
    });
  } catch (switchErr) {
    if (switchErr && switchErr.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: net.chainHex,
          chainName: net.label,
          nativeCurrency: net.nativeCurrency,
          rpcUrls: net.rpcUrls,
          blockExplorerUrls: [net.explorer]
        }]
      });
    } else {
      throw switchErr;
    }
  }
}

function hideTxLink() {
  const wrapEl = document.getElementById("txLinkWrap");
  const linkEl = document.getElementById("txLink");
  linkEl.href = "https://basescan.org/address/0x3896c9bd802A56c28590EF1E03A7de645c703757";
  linkEl.target = "_blank";
  linkEl.rel = "noopener noreferrer";
  linkEl.textContent = "View contract on BaseScan";
  wrapEl.style.display = "none";
}

function showTxLink(txHash, state = "confirmed") {
  const net = currentNetwork();
  const url = net ? `${net.explorer}/tx/${txHash}` : "#";
  const linkEl = document.getElementById("txLink");
  const wrapEl = document.getElementById("txLinkWrap");
  linkEl.href = url;
  const statePrefix = state === "pending" ? "Pending tx" : "Last transaction";
  linkEl.textContent = `${statePrefix}: ${net ? net.name + " Explorer" : "Explorer"}`;
  wrapEl.style.display = "block";
}

function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  refreshTimer = setInterval(async () => {
    if (!provider || !contract || !currentAccount) return;
    try {
      await refreshData();
    } catch {
      // Silent retry on next tick; avoids noisy UI while wallet/provider updates.
    }
  }, AUTO_REFRESH_MS);
}

async function refreshData() {
  const chainId = await getChainId();
  currentChainId = chainId;
  await assertContractDeployed();

  const [name, symbol, supply, owner] = await Promise.all([
    readContract.name(),
    readContract.symbol(),
    readContract.totalSupply(),
    readContract.owner()
  ]);

  tokenDecimals = Number(await readContract.decimals());
  const balance = await readContract.balanceOf(currentAccount);

  document.getElementById("tokenName").textContent = name;
  document.getElementById("tokenSymbol").textContent = symbol;
  document.getElementById("totalSupply").textContent = `${ethers.formatUnits(supply, tokenDecimals)} ${symbol}`;
  document.getElementById("walletBalance").textContent = `${ethers.formatUnits(balance, tokenDecimals)} ${symbol}`;
  document.getElementById("ownerAddress").textContent = owner;

  const isOwner = owner.toLowerCase() === currentAccount.toLowerCase();
  document.getElementById("roleTag").textContent = isOwner ? "Owner" : "Viewer";
  setOwnerControls(isOwner, `Only owner can run this action. Owner: ${owner}`);

  const nativeBal = await readProvider.getBalance(currentAccount);
  document.getElementById("nativeBalance").textContent = `${parseFloat(ethers.formatEther(nativeBal)).toFixed(5)} ETH`;

  const net = currentNetwork();
  document.getElementById("chainIdText").textContent = net ? net.label : `Chain ${currentChainId}`;
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      setStatus("No wallet detected. Open this page in Chrome with MetaMask enabled.", "error");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const net = await ensureSupportedNetwork();

    // Recreate provider after chain confirmation
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    currentAccount = await signer.getAddress();
    walletAddressEl.textContent = currentAccount;
    connectBtn.textContent = `Connected: ${shortAddr(currentAccount)}`;

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);
    hideTxLink();
    await refreshData();
    startAutoRefresh();

    const owner = document.getElementById("ownerAddress").textContent;
    if (owner && owner !== "-" && owner.toLowerCase() !== currentAccount.toLowerCase()) {
      roleTagEl.textContent = "Viewer";
      setStatus(`Connected as Viewer on ${net.label}. Owner: ${shortAddr(owner)}`, "error");
      return;
    }

    setStatus(`Wallet connected. Owner mode active on ${net.label}.`, "ok");
  } catch (err) {
    if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
      setStatus("Connection request was rejected in wallet.", "error");
      return;
    }
    if (err.message !== "CHIEF requires Base Mainnet") {
      setStatus(err.message || "Wallet connection failed.", "error");
    }
    setOwnerControls(false, "Connect owner wallet on correct network to enable this action.");
  }
}

async function autoConnectIfAuthorized() {
  if (!window.ethereum) return;

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      setOwnerControls(false, "Connect owner wallet to enable this action.");
      setStatus("Ready. Click Connect Wallet to continue.");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    currentAccount = await signer.getAddress();
    walletAddressEl.textContent = currentAccount;
    connectBtn.textContent = `Connected: ${shortAddr(currentAccount)}`;

    const net = await ensureSupportedNetwork();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);
    hideTxLink();
    await refreshData();
    startAutoRefresh();
    setStatus(`Auto-connected on ${net.label}.`, "ok");
  } catch (err) {
    roleTagEl.textContent = "Not connected";
    setOwnerControls(false, "Connect owner wallet to enable this action.");
    if (err.message !== "CHIEF requires Base Mainnet") {
      setStatus("Wallet detected. Connect wallet to continue.", "");
    }
  }
}

async function handleAccountsChanged(accounts) {
  if (!accounts || accounts.length === 0) {
    provider = undefined;
    signer = undefined;
    contract = undefined;
    readContract = undefined;
    currentAccount = null;
    walletAddressEl.textContent = "No wallet connected";
    connectBtn.textContent = "Connect Wallet";
    roleTagEl.textContent = "Not connected";
    setOwnerControls(false, "Connect owner wallet to enable this action.");
    setStatus("Wallet disconnected.");
    return;
  }
  await autoConnectIfAuthorized();
}

async function handleChainChanged() {
  if (!window.ethereum) return;
  await autoConnectIfAuthorized();
}

async function switchNetworkOnly() {
  try {
    if (!window.ethereum) {
      setStatus("No wallet detected. Open this page in Chrome with MetaMask enabled.", "error");
      return;
    }

    const chainId = await getChainId();
    const targetId = chainId === 8453 ? 11155111 : 8453;
    const targetNet = NETWORKS[targetId];
    setStatus(`Switching to ${targetNet.label}...`);
    await switchNetwork(targetId);
    setStatus(`${targetNet.label} selected. Reconnecting...`, "ok");
    await connectWallet();
  } catch (err) {
    if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
      setStatus("Network switch rejected.", "error");
      return;
    }
    setStatus(err.message || "Could not switch network.", "error");
  }
}

async function transferToken() {
  try {
    if (!contract) throw new Error("Connect wallet first.");
    await assertContractDeployed();

    const to = document.getElementById("transferTo").value.trim();
    const amount = document.getElementById("transferAmount").value.trim();

    if (!ethers.isAddress(to)) throw new Error("Recipient address is invalid.");
    if (!amount || Number(amount) <= 0) throw new Error("Enter a valid amount.");

    await assertGasBalance();
    const weiAmount = ethers.parseUnits(amount, tokenDecimals);
    const tokenBal = await contract.balanceOf(currentAccount);
    if (weiAmount > tokenBal) {
      throw new Error("Insufficient CHIEF balance for this transfer.");
    }

    setStatus("Sending transfer transaction...");
    const tx = await contract.transfer(to, weiAmount);
    showTxLink(tx.hash, "pending");
    await tx.wait();

    setStatus(`Transfer complete. Tx: ${tx.hash}`, "ok");
    showTxLink(tx.hash, "confirmed");
    await refreshData();
  } catch (err) {
    setStatus(formatEthersError(err), "error");
  }
}

async function claimToSelf() {
  try {
    if (!contract) throw new Error("Connect wallet first.");
    await assertContractDeployed();

    const amount = document.getElementById("claimAmount").value.trim();
    if (!amount || Number(amount) <= 0) throw new Error("Enter a valid claim amount.");

    await assertGasBalance();

    const owner = await contract.owner();
    if (owner.toLowerCase() !== currentAccount.toLowerCase()) {
      throw new Error(`Connected wallet is not owner on this network. Owner is ${owner}.`);
    }

    setStatus("Submitting claim (mint) transaction...");
    const tx = await contract.mint(currentAccount, ethers.parseUnits(amount, tokenDecimals));
    showTxLink(tx.hash, "pending");
    await tx.wait();

    setStatus(`Claim complete. Tx: ${tx.hash}`, "ok");
    showTxLink(tx.hash, "confirmed");
    await refreshData();
  } catch (err) {
    setStatus(formatEthersError(err), "error");
  }
}

async function mintToAddress() {
  try {
    if (!contract) throw new Error("Connect wallet first.");
    await assertContractDeployed();

    const to = document.getElementById("mintTo").value.trim();
    const amount = document.getElementById("mintAmount").value.trim();

    if (!ethers.isAddress(to)) throw new Error("Recipient address is invalid.");
    if (!amount || Number(amount) <= 0) throw new Error("Enter a valid amount.");

    await assertGasBalance();

    const owner = await contract.owner();
    if (owner.toLowerCase() !== currentAccount.toLowerCase()) {
      throw new Error(`Only the owner can mint. Owner is ${owner}.`);
    }

    setStatus("Submitting mint transaction...");
    const tx = await contract.mint(to, ethers.parseUnits(amount, tokenDecimals));
    showTxLink(tx.hash, "pending");
    await tx.wait();

    setStatus(`Minted ${amount} CHIEF to ${to}. Tx: ${tx.hash}`, "ok");
    showTxLink(tx.hash, "confirmed");
    await refreshData();
  } catch (err) {
    setStatus(formatEthersError(err), "error");
  }
}

async function transferOwnership() {
  try {
    if (!contract) throw new Error("Connect wallet first.");
    await assertContractDeployed();

    const newOwner = document.getElementById("newOwner").value.trim();
    if (!ethers.isAddress(newOwner)) throw new Error("New owner address is invalid.");

    await assertGasBalance();

    const owner = await contract.owner();
    if (owner.toLowerCase() !== currentAccount.toLowerCase()) {
      throw new Error(`Only the owner can transfer ownership. Owner is ${owner}.`);
    }

    setStatus("Submitting ownership transfer...");
    const tx = await contract.transferOwnership(newOwner);
    showTxLink(tx.hash, "pending");
    await tx.wait();

    setStatus(`Ownership transferred to ${newOwner}. Tx: ${tx.hash}`, "ok");
    showTxLink(tx.hash, "confirmed");
    await refreshData();
  } catch (err) {
    setStatus(formatEthersError(err), "error");
  }
}

async function addTokenToWallet() {
  try {
    if (!window.ethereum) throw new Error("No wallet detected.");
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: CONTRACT_ADDRESS,
          symbol: "CHIEF",
          decimals: 18
        }
      }
    });
    setStatus("CHIEF added to MetaMask token list.", "ok");
  } catch (err) {
    const message = String(err?.message || "").toLowerCase();
    if (message.includes("wallet_watchasset") || message.includes("not supported")) {
      setStatus("This wallet does not support automatic token import. In MetaMask, choose Import tokens and enter the CHIEF contract address.", "error");
      return;
    }
    setStatus(formatEthersError(err), "error");
  }
}

connectBtn.addEventListener("click", connectWallet);
switchBtn.addEventListener("click", switchNetworkOnly);
document.getElementById("transferBtn").addEventListener("click", transferToken);
document.getElementById("claimBtn").addEventListener("click", claimToSelf);
document.getElementById("mintToBtn").addEventListener("click", mintToAddress);
document.getElementById("transferOwnerBtn").addEventListener("click", transferOwnership);
document.getElementById("addTokenBtn").addEventListener("click", addTokenToWallet);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", handleAccountsChanged);
  window.ethereum.on("chainChanged", handleChainChanged);
}

setOwnerControls(false, "Connect owner wallet to enable this action.");
autoConnectIfAuthorized();
