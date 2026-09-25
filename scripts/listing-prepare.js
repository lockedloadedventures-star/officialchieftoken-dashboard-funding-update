const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(relPath) {
  const full = path.join(root, relPath);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function writeJson(relPath, value) {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(value, null, 2), "utf8");
}

function writeText(relPath, value) {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, value, "utf8");
}

function main() {
  const profile = readJson("listing/token-profile.json");
  const pair = profile.market_pairs[0] || {};

  const coinbase = {
    platform: "coinbase_asset_hub",
    assetName: profile.project_name,
    symbol: profile.symbol,
    decimals: profile.decimals,
    contractAddress: profile.contracts.base_mainnet,
    chain: "base",
    explorer: profile.explorers.base_mainnet,
    website: profile.official_website,
    documentation: profile.whitepaper_url,
    email: profile.email,
    socials: {
      twitter: profile.twitter,
      telegram: profile.telegram,
      discord: profile.discord
    },
    ownership: profile.ownership,
    marketPair: {
      dex: pair.dex,
      pairAddress: pair.pair_address,
      quoteAsset: pair.quote_asset,
      pairExplorer: pair.explorer,
      pairUrl: pair.uniswap_url
    }
  };

  const coingecko = {
    platform: "coingecko",
    tokenName: profile.project_name,
    symbol: profile.symbol,
    contractAddress: profile.contracts.base_mainnet,
    chain: "base",
    website: profile.official_website,
    whitepaper: profile.whitepaper_url,
    explorer: profile.explorers.base_mainnet,
    marketPairAddress: pair.pair_address,
    marketPairUrl: pair.uniswap_url,
    socials: {
      twitter: profile.twitter,
      telegram: profile.telegram,
      discord: profile.discord
    },
    description: profile.description
  };

  const cmc = {
    platform: "coinmarketcap",
    tokenName: profile.project_name,
    ticker: profile.symbol,
    tokenType: "ERC-20",
    decimals: profile.decimals,
    contractAddress: profile.contracts.base_mainnet,
    chain: "base",
    website: profile.official_website,
    docs: profile.whitepaper_url,
    supportEmail: profile.email,
    explorer: profile.explorers.base_mainnet,
    socials: {
      twitter: profile.twitter,
      telegram: profile.telegram,
      discord: profile.discord
    },
    marketPair: {
      exchange: pair.dex,
      pair: `${profile.symbol}/${pair.quote_asset || "WETH"}`,
      pairAddress: pair.pair_address,
      pairUrl: pair.uniswap_url
    }
  };

  writeJson("artifacts/listing-submissions/coinbase-asset-hub.json", coinbase);
  writeJson("artifacts/listing-submissions/coingecko.json", coingecko);
  writeJson("artifacts/listing-submissions/coinmarketcap.json", cmc);

  const summary = [
    "# CHIEF Listing Submission Pack",
    "",
    "Generated files:",
    "- artifacts/listing-submissions/coinbase-asset-hub.json",
    "- artifacts/listing-submissions/coingecko.json",
    "- artifacts/listing-submissions/coinmarketcap.json",
    "",
    "Submission portals:",
    "- Coinbase Asset Hub: https://www.coinbase.com/asset-hub",
    "- CoinGecko: https://www.coingecko.com/en/request",
    "- CoinMarketCap: https://support.coinmarketcap.com/hc/en-us/requests/new?ticket_form_id=360000493112",
    "",
    "Token + pair:",
    `- Token contract: ${profile.contracts.base_mainnet}`,
    `- Pair address: ${pair.pair_address || ""}`,
    `- Pair URL: ${pair.uniswap_url || ""}`
  ].join("\n");

  writeText("artifacts/listing-submissions/README.md", summary);

  console.log("Listing submission pack generated:");
  console.log("- artifacts/listing-submissions/coinbase-asset-hub.json");
  console.log("- artifacts/listing-submissions/coingecko.json");
  console.log("- artifacts/listing-submissions/coinmarketcap.json");
  console.log("- artifacts/listing-submissions/README.md");
}

main();
