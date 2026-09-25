require("dotenv").config();
const fs = require("fs");
const path = require("path");

const indexPath = path.resolve(__dirname, "..", "index.html");
let html = fs.readFileSync(indexPath, "utf8");

const googleToken = (process.env.GOOGLE_SITE_VERIFICATION || "").trim();
const bingToken = (process.env.BING_SITE_VERIFICATION || "").trim();

function replaceMetaContent(source, name, value) {
  const expression = new RegExp(`(<meta\\s+name=\\"${name}\\"\\s+content=\\")(.*?)(\\"\\s*\\/?>)`, "i");
  if (!expression.test(source)) {
    return source;
  }
  return source.replace(expression, `$1${value}$3`);
}

if (googleToken) {
  html = replaceMetaContent(html, "google-site-verification", googleToken);
}

if (bingToken) {
  html = replaceMetaContent(html, "msvalidate.01", bingToken);
}

fs.writeFileSync(indexPath, html, "utf8");

console.log("SEO verification update complete:");
console.log(indexPath);
console.log(`Google token applied: ${googleToken ? "yes" : "no"}`);
console.log(`Bing token applied: ${bingToken ? "yes" : "no"}`);
