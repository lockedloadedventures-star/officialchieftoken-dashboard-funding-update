const { spawnSync } = require("child_process");
require("dotenv").config();

const steps = ["config:checkout", "seo:apply", "launch:readiness"];
const npmExecPath = process.env.npm_execpath;
const strictMode = process.argv.includes("--strict");

function isValidUrl(url) {
  return /^https?:\/\//i.test((url || "").trim());
}

function hasValue(name) {
  return Boolean((process.env[name] || "").trim());
}

function looksLikePlaceholder(value) {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return true;

  const blockedPatterns = [
    "replace_with",
    "replace-",
    "pending",
    "example",
    "your_",
    "your-",
    "changeme",
    "test_",
    "dummy",
    "placeholder"
  ];

  return blockedPatterns.some((p) => normalized.includes(p));
}

function validateStrictConfig() {
  const failures = [];

  const starter = (process.env.CHECKOUT_STARTER_URL || "").trim();
  const standard = (process.env.CHECKOUT_STANDARD_URL || "").trim();
  const pro = (process.env.CHECKOUT_PRO_URL || "").trim();
  const google = (process.env.GOOGLE_SITE_VERIFICATION || "").trim();
  const bing = (process.env.BING_SITE_VERIFICATION || "").trim();

  if (!isValidUrl(starter)) failures.push("CHECKOUT_STARTER_URL must be a valid http(s) URL");
  if (!isValidUrl(standard)) failures.push("CHECKOUT_STANDARD_URL must be a valid http(s) URL");
  if (!isValidUrl(pro)) failures.push("CHECKOUT_PRO_URL must be a valid http(s) URL");
  if (!hasValue("GOOGLE_SITE_VERIFICATION")) failures.push("GOOGLE_SITE_VERIFICATION is required");
  if (!hasValue("BING_SITE_VERIFICATION")) failures.push("BING_SITE_VERIFICATION is required");

  if (google.includes("REPLACE_WITH") || bing.includes("REPLACE_WITH")) {
    failures.push("SEO verification tokens cannot contain placeholder values");
  }

  if (looksLikePlaceholder(google)) {
    failures.push("GOOGLE_SITE_VERIFICATION cannot be a temporary or placeholder token");
  }

  if (looksLikePlaceholder(bing)) {
    failures.push("BING_SITE_VERIFICATION cannot be a temporary or placeholder token");
  }

  if (failures.length > 0) {
    console.error("\nStrict release validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nStrict release validation passed.");
}

if (!npmExecPath) {
  console.error("npm_execpath is unavailable; run this script through npm.");
  process.exit(1);
}

if (strictMode) {
  validateStrictConfig();
}

for (const step of steps) {
  console.log(`\nRunning step: ${step}`);
  const result = spawnSync(process.execPath, [npmExecPath, "run", step], {
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    console.error(`\nStep failed: ${step}`);
    process.exit(result.status || 1);
  }
}

console.log(`\nRelease prep completed successfully${strictMode ? " (strict mode)" : ""}.`);
