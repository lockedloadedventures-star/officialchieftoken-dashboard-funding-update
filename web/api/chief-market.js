const POOL_ADDRESS = "0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d";
const MARKET_URL = `https://api.geckoterminal.com/api/v2/networks/base/pools/${POOL_ADDRESS}`;
const REQUEST_TIMEOUT_MS = 10_000;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Only GET requests are supported." });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(MARKET_URL, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      console.error(`GeckoTerminal market lookup returned HTTP ${response.status}.`);
      return res.status(502).json({ error: "GeckoTerminal could not return market data." });
    }

    const payload = await response.json();
    const attributes = payload?.data?.attributes;
    if (attributes?.address?.toLowerCase() !== POOL_ADDRESS.toLowerCase()) {
      console.error("GeckoTerminal returned an unexpected pool.");
      return res.status(502).json({ error: "GeckoTerminal returned an unexpected pool." });
    }

    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
    return res.status(200).json({
      data: {
        attributes: {
          address: attributes.address,
          base_token_price_usd: attributes.base_token_price_usd,
          reserve_in_usd: attributes.reserve_in_usd,
          volume_usd: { h24: attributes.volume_usd?.h24 },
          transactions: {
            h24: {
              buys: attributes.transactions?.h24?.buys,
              sells: attributes.transactions?.h24?.sells
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("GeckoTerminal market lookup failed.", error);
    const message = controller.signal.aborted
      ? "GeckoTerminal market lookup timed out."
      : "GeckoTerminal is unavailable.";
    return res.status(502).json({ error: message });
  } finally {
    clearTimeout(timeoutId);
  }
}
