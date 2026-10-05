const TOKEN_POOLS_URL = "https://api.geckoterminal.com/api/v2/networks/base/tokens";
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const REQUEST_TIMEOUT_MS = 10_000;

function poolSummary(pool) {
  const attributes = pool?.attributes || {};
  const relationships = pool?.relationships || {};
  const baseTokenId = relationships.base_token?.data?.id;
  const quoteTokenId = relationships.quote_token?.data?.id;
  const transactions = attributes.transactions?.h24 || {};

  return {
    attributes: {
      address: attributes.address,
      name: attributes.name,
      reserve_in_usd: attributes.reserve_in_usd,
      volume_usd: { h24: attributes.volume_usd?.h24 },
      transactions: {
        h24: {
          buys: transactions.buys,
          sells: transactions.sells
        }
      }
    },
    relationships: {
      base_token: { data: { id: baseTokenId } },
      quote_token: { data: { id: quoteTokenId } }
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Only GET requests are supported." });
  }

  const address = req.query?.address;
  if (typeof address !== "string" || !ADDRESS_PATTERN.test(address)) {
    return res.status(400).json({ error: "A valid EVM token address is required." });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${TOKEN_POOLS_URL}/${address.toLowerCase()}/pools?page=1`, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      console.error(`GeckoTerminal pool lookup returned HTTP ${response.status}.`);
      return res.status(502).json({ error: "GeckoTerminal could not return pool data." });
    }

    const payload = await response.json();
    if (!Array.isArray(payload?.data)) {
      console.error("GeckoTerminal returned an invalid pool list.");
      return res.status(502).json({ error: "GeckoTerminal returned an invalid pool list." });
    }

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ data: payload.data.slice(0, 20).map(poolSummary) });
  } catch (error) {
    console.error("GeckoTerminal pool lookup failed.", error);
    const message = controller.signal.aborted
      ? "GeckoTerminal pool lookup timed out."
      : "GeckoTerminal is unavailable.";
    return res.status(502).json({ error: message });
  } finally {
    clearTimeout(timeoutId);
  }
}
