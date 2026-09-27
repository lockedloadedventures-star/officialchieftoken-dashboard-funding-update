import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "";
const ETH_MAINNET_RPC_URL = process.env.ETH_MAINNET_RPC_URL || "";
const BASE_MAINNET_RPC_URL = process.env.BASE_MAINNET_RPC_URL || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

const networks = {
  localhost: {
    type: "http",
    chainType: "l1",
    url: "http://127.0.0.1:8545",
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : "remote"
  }
};

if (RPC_URL) {
  networks.sepolia = {
    type: "http",
    chainType: "l1",
    url: RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
  };
}

if (ETH_MAINNET_RPC_URL) {
  networks.mainnet = {
    type: "http",
    chainType: "l1",
    url: ETH_MAINNET_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
  };
}

if (BASE_MAINNET_RPC_URL) {
  networks.base = {
    type: "http",
    chainType: "op",
    url: BASE_MAINNET_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
  };
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: "0.8.24",
  networks,
  verify: {
    etherscan: {
      apiKey: BASESCAN_API_KEY || ETHERSCAN_API_KEY
    }
  }
});
