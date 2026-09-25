const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(relPath) {
  const full = path.join(root, relPath);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function readText(relPath) {
  const full = path.join(root, relPath);
  return fs.readFileSync(full, "utf8");
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function main() {
  const profile = readJson("listing/token-profile.json");
  const failures = [];
  const warnings = [];

  if (!profile.project_name) failures.push("project_name is required");
  if (!profile.symbol) failures.push("symbol is required");
  if (typeof profile.decimals !== "number") failures.push("decimals must be a number");
  if (!isHttpUrl(profile.official_website)) failures.push("official_website must be a valid http(s) URL");
  if (!isHttpUrl(profile.whitepaper_url)) warnings.push("whitepaper_url is missing or not a URL");
  if (!isHttpUrl(profile.twitter)) warnings.push("twitter is missing or not a URL");
  if (!isHttpUrl(profile.telegram)) warnings.push("telegram is missing or not a URL");
  if (!isHttpUrl(profile.discord)) warnings.push("discord is missing or not a URL");
  if (!profile.contracts || !profile.contracts.base_mainnet) failures.push("contracts.base_mainnet is required");
  if (!profile.explorers || !isHttpUrl(profile.explorers.base_mainnet)) failures.push("explorers.base_mainnet must be a valid URL");

  const pair = profile.market_pairs && profile.market_pairs[0];
  if (!pair) {
    failures.push("At least one market_pairs entry is required");
  } else {
    if (!pair.pair_address) failures.push("market_pairs[0].pair_address is required");
    if (!isHttpUrl(pair.uniswap_url)) warnings.push("market_pairs[0].uniswap_url is missing or not a URL");
    if (!isHttpUrl(pair.explorer)) warnings.push("market_pairs[0].explorer is missing or not a URL");
  }

  const placeholderPattern = /(REPLACE_WITH|YOUR_|YOUR-|\+REPLACE_WITH|discord\.gg\/REPLACE|\[fill\])/i;
  const draftFiles = [
    "listing/coinbase-asset-hub-draft.md",
    "listing/coingecko-submission-draft.md",
    "listing/coinmarketcap-submission-draft.md"
  ];

  for (const file of draftFiles) {
    const text = readText(file);
    if (placeholderPattern.test(text)) {
      warnings.push(`${file} still contains manual placeholders`);
    }
  }

  console.log("\nCHIEF Listing Validation\n");

  if (failures.length === 0) {
    console.log("[PASS] Required listing metadata is valid.");
  } else {
    console.log("[FAIL] Required listing metadata has errors:");
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
  }

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
