import assert from "node:assert/strict";
import { test } from "node:test";
import chiefMarket from "../web/api/chief-market.js";
import tokenPools from "../web/api/token-pools.js";

const POOL_ADDRESS = "0xd926f4c2b5ad4de45e31c875d33d5207e3df3a7d";
const TOKEN_ADDRESS = "0x3896c9bd802a56c28590ef1e03a7de645c703757";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function mockLogger(t) {
  t.mock.method(console, "error", () => {});
}

test("token pools only accepts GET with a valid single token address", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch");
  const postResponse = createResponse();
  await tokenPools({ method: "POST", query: { address: TOKEN_ADDRESS } }, postResponse);
  assert.equal(postResponse.statusCode, 405);
  assert.equal(postResponse.headers.Allow, "GET");

  for (const address of [undefined, ["0x123"], "not-an-address", `0x${"a".repeat(39)}`]) {
    const response = createResponse();
    await tokenPools({ method: "GET", query: { address } }, response);
    assert.equal(response.statusCode, 400);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("token pools fetches a bounded GeckoTerminal response and keeps only displayed fields", async (t) => {
  const upstream = {
    data: Array.from({ length: 22 }, (_, index) => ({
      attributes: {
        address: `0x${index.toString(16).padStart(40, "0")}`,
        name: "CHIEF / WETH 0.3%",
        reserve_in_usd: "22.09",
        volume_usd: { h24: "0" },
        transactions: { h24: { buys: 0, sells: 0 } },
        internal_note: "must not be returned"
      },
      relationships: {
        base_token: { data: { id: `base_${TOKEN_ADDRESS}` } },
        quote_token: { data: { id: "base_0x4200000000000000000000000000000000000006" } }
      }
    }))
  };
  let requestedUrl;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requestedUrl = url;
    assert.equal(options.headers.Accept, "application/json");
    return { ok: true, json: async () => upstream };
  });

  const response = createResponse();
  await tokenPools({ method: "GET", query: { address: TOKEN_ADDRESS.toUpperCase().replace("0X", "0x") } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.length, 20);
  assert.equal(response.body.data[0].attributes.name, "CHIEF / WETH 0.3%");
  assert.equal(response.body.data[0].attributes.internal_note, undefined);
  assert.equal(response.headers["Cache-Control"], "s-maxage=30, stale-while-revalidate=60");
  assert.equal(requestedUrl, `https://api.geckoterminal.com/api/v2/networks/base/tokens/${TOKEN_ADDRESS}/pools?page=1`);
});

test("token pools returns a provider error for unsuccessful or malformed responses", async (t) => {
  mockLogger(t);
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 429 }));
  const failed = createResponse();
  await tokenPools({ method: "GET", query: { address: TOKEN_ADDRESS } }, failed);
  assert.equal(failed.statusCode, 502);

  t.mock.restoreAll();
  mockLogger(t);
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ data: {} }) }));
  const malformed = createResponse();
  await tokenPools({ method: "GET", query: { address: TOKEN_ADDRESS } }, malformed);
  assert.equal(malformed.statusCode, 502);
});

test("CHIEF market endpoint is read-only, pinned to the configured pool, and filters the provider response", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `https://api.geckoterminal.com/api/v2/networks/base/pools/${"0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d"}`);
    assert.equal(options.headers.Accept, "application/json");
    return {
      ok: true,
      json: async () => ({
        data: {
          attributes: {
            address: POOL_ADDRESS,
            base_token_price_usd: "0.0027",
            reserve_in_usd: "22.09",
            volume_usd: { h24: "0" },
            transactions: { h24: { buys: 0, sells: 0 } },
            internal_note: "must not be returned"
          }
        }
      })
    };
  });

  const response = createResponse();
  await chiefMarket({ method: "GET" }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.attributes.address, POOL_ADDRESS);
  assert.equal(response.body.data.attributes.internal_note, undefined);
  assert.equal(response.headers["Cache-Control"], "s-maxage=15, stale-while-revalidate=30");
  assert.equal(fetch.mock.callCount(), 1);

  const postResponse = createResponse();
  await chiefMarket({ method: "POST" }, postResponse);
  assert.equal(postResponse.statusCode, 405);
  assert.equal(fetch.mock.callCount(), 1);
});

test("CHIEF market endpoint rejects unexpected pools and provider errors", async (t) => {
  mockLogger(t);
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => ({ data: { attributes: { address: "0x0000000000000000000000000000000000000001" } } })
  }));
  const unexpectedPool = createResponse();
  await chiefMarket({ method: "GET" }, unexpectedPool);
  assert.equal(unexpectedPool.statusCode, 502);

  t.mock.restoreAll();
  mockLogger(t);
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 503 }));
  const unavailable = createResponse();
  await chiefMarket({ method: "GET" }, unavailable);
  assert.equal(unavailable.statusCode, 502);
});
