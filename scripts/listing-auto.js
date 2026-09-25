const { spawnSync } = require("child_process");

const steps = ["listing:validate", "listing:prepare"];
const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error("npm_execpath is unavailable; run this script through npm.");
  process.exit(1);
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

console.log("\nListing automation completed successfully.");
