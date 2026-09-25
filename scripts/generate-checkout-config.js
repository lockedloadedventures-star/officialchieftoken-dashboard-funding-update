require("dotenv").config();
const fs = require("fs");
const path = require("path");

const outPath = path.resolve(__dirname, "..", "checkout-config.js");

function sanitizeUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return "";
  }
  return trimmed;
}

const starter = sanitizeUrl(process.env.CHECKOUT_STARTER_URL);
const standard = sanitizeUrl(process.env.CHECKOUT_STANDARD_URL);
const pro = sanitizeUrl(process.env.CHECKOUT_PRO_URL);

const content = `window.CHIEF_CHECKOUT_LINKS = {
  starter: ${JSON.stringify(starter)},
  standard: ${JSON.stringify(standard)},
  pro: ${JSON.stringify(pro)}
};
`;

fs.writeFileSync(outPath, content, "utf8");

console.log("Checkout config written:");
console.log(outPath);
if (!starter || !standard || !pro) {
  console.log("Note: one or more checkout URLs are empty; manual intake fallback remains active.");
}
