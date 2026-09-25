const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const checks = [];
const warnings = [];

function addCheck(ok, name, detail) {
  checks.push({ ok, name, detail });
}

function addWarning(name, detail) {
  warnings.push({ name, detail });
}

function read(filePath) {
  return fs.readFileSync(path.join(rootDir, filePath), "utf8");
}

function exists(filePath) {
  return fs.existsSync(path.join(rootDir, filePath));
}

function run() {
  addCheck(exists("index.html"), "Landing page exists", "index.html");
  addCheck(exists("checkout.html"), "Checkout page exists", "checkout.html");
  addCheck(exists("robots.txt"), "Robots file exists", "robots.txt");
  addCheck(exists("sitemap.xml"), "Sitemap file exists", "sitemap.xml");

  const indexHtml = read("index.html");
  const checkoutHtml = read("checkout.html");
  const robotsTxt = read("robots.txt");
  const sitemapXml = read("sitemap.xml");
  const tokenProfile = read("listing/token-profile.json");

  const indexHasCanonical = indexHtml.includes('href="https://officialchieftoken.com/"');
  addCheck(indexHasCanonical, "Homepage canonical uses apex domain", "index.html canonical");

  const indexHasOgUrl = indexHtml.includes('property="og:url" content="https://officialchieftoken.com/"');
  addCheck(indexHasOgUrl, "Homepage OG URL uses apex domain", "index.html og:url");

  const checkoutCanonical = checkoutHtml.includes('href="https://officialchieftoken.com/checkout"');
  addCheck(checkoutCanonical, "Checkout canonical is set", "checkout.html canonical");

  const robotsHasSitemap = robotsTxt.includes("https://officialchieftoken.com/sitemap.xml");
  addCheck(robotsHasSitemap, "robots.txt references sitemap", "robots.txt sitemap entry");

  const sitemapHasHomepage = sitemapXml.includes("<loc>https://officialchieftoken.com/</loc>");
  addCheck(sitemapHasHomepage, "sitemap.xml contains homepage", "sitemap.xml homepage");

  const hasBlockingPlaceholders =
    tokenProfile.includes("YOUR-") ||
    tokenProfile.includes("YOUR_") ||
    tokenProfile.includes("REPLACE_WITH_") ||
    checkoutHtml.includes("REPLACE_WITH_");
  addCheck(!hasBlockingPlaceholders, "No blocking placeholders in launch files", "checkout/listing profile");

  if (indexHtml.includes("REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TOKEN")) {
    addWarning("Google Search Console token still placeholder", "Set this in index.html before search-console verification");
  }

  if (indexHtml.includes("REPLACE_WITH_BING_WEBMASTER_TOKEN")) {
    addWarning("Bing Webmaster token still placeholder", "Set this in index.html before bing verification");
  }

  const testStripeLinks = [...checkoutHtml.matchAll(/https:\/\/buy\.stripe\.com\/test_[^\"\s]+/g)].map((m) => m[0]);
  addCheck(
    testStripeLinks.length === 0,
    "Checkout links are not test-mode Stripe links",
    testStripeLinks.length ? `Found ${testStripeLinks.length} test link(s)` : "No test links found"
  );

  const requiredFiles = [
    "listing/coinbase-asset-hub-draft.md",
    "listing/coingecko-submission-draft.md",
    "listing/coinmarketcap-submission-draft.md",
    "docs/liquidity-growth-policy.md",
    "docs/next-72h-action-plan.md",
    "docs/social-launch-kit.md"
  ];

  for (const file of requiredFiles) {
    addCheck(exists(file), `File present: ${file}`, file);
  }

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.length - passed;

  console.log("\nCHIEF Launch Readiness Report\n");
  for (const check of checks) {
    const icon = check.ok ? "PASS" : "FAIL";
    console.log(`[${icon}] ${check.name} :: ${check.detail}`);
  }

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) {
      console.log(`[WARN] ${warning.name} :: ${warning.detail}`);
    }
  }

  console.log(`\nSummary: ${passed}/${checks.length} checks passed, ${failed} failed.\n`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
