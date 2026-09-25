const https = require("https");
require("dotenv").config();

const APEX = process.env.SITE_URL || "https://officialchieftoken.com";
const WWW = process.env.SITE_WWW_URL || "https://www.officialchieftoken.com";
const GOOGLE_TOKEN = (process.env.GOOGLE_SITE_VERIFICATION || "").trim();
const BING_TOKEN = (process.env.BING_SITE_VERIFICATION || "").trim();

function request(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: "GET" }, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk.toString("utf8");
      });
      res.on("end", () => {
        resolve({
          url,
          status: res.statusCode || 0,
          headers: res.headers,
          body
        });
      });
    });

    req.on("error", (error) => {
      resolve({ url, status: 0, headers: {}, body: "", error: error.message });
    });

    req.end();
  });
}

function pass(ok, name, detail) {
  const label = ok ? "PASS" : "FAIL";
  console.log(`[${label}] ${name} :: ${detail}`);
  return ok;
}

async function main() {
  const checks = [];

  const [apexHome, apexRobots, apexSitemap, wwwHome] = await Promise.all([
    request(`${APEX}/`),
    request(`${APEX}/robots.txt`),
    request(`${APEX}/sitemap.xml`),
    request(`${WWW}/`)
  ]);

  checks.push(pass(apexHome.status === 200, "Apex homepage status", `status=${apexHome.status}`));
  checks.push(pass(apexRobots.status === 200, "robots.txt status", `status=${apexRobots.status}`));
  checks.push(pass(apexSitemap.status === 200, "sitemap.xml status", `status=${apexSitemap.status}`));

  const canonicalOk = apexHome.body.includes('rel="canonical" href="https://officialchieftoken.com/"');
  checks.push(pass(canonicalOk, "Canonical tag on homepage", canonicalOk ? "apex canonical present" : "apex canonical missing"));

  const ogOk = apexHome.body.includes('property="og:url" content="https://officialchieftoken.com/"');
  checks.push(pass(ogOk, "OG URL on homepage", ogOk ? "og:url set to apex" : "og:url not set to apex"));

  const isRedirect = [301, 302, 307, 308].includes(wwwHome.status);
  const location = (wwwHome.headers.location || "").toString();
  const redirectOk = isRedirect && location.startsWith("https://officialchieftoken.com");
  checks.push(pass(redirectOk, "www redirects to apex", `status=${wwwHome.status} location=${location || "<none>"}`));

  if (GOOGLE_TOKEN) {
    const googleTag = `name=\"google-site-verification\" content=\"${GOOGLE_TOKEN}\"`;
    const googleOk = apexHome.body.includes(googleTag);
    checks.push(pass(googleOk, "Google verification token matches env", googleOk ? "exact token found in live head" : "exact token not found in live head"));
  }

  if (BING_TOKEN) {
    const bingTag = `name=\"msvalidate.01\" content=\"${BING_TOKEN}\"`;
    const bingOk = apexHome.body.includes(bingTag);
    checks.push(pass(bingOk, "Bing verification token matches env", bingOk ? "exact token found in live head" : "exact token not found in live head"));
  }

  const passed = checks.filter(Boolean).length;
  const failed = checks.length - passed;

  console.log(`\nSummary: ${passed}/${checks.length} checks passed, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
