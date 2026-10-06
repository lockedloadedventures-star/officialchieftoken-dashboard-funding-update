# ChiefToken (CHIEF)

This is a starter ERC-20 cryptocurrency project using Hardhat + OpenZeppelin.

## Token details

- Name: `ChiefToken`
- Symbol: `CHIEF`
- Initial supply: `1,000,000 CHIEF`
- Minting: owner-only `mint()` function

## 1) Prerequisites

Install Node.js 22.13.0 or later (LTS recommended; required by Hardhat 3):

- <https://nodejs.org/>

## 2) Install dependencies

```bash
npm install
```

## 3) Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
PRIVATE_KEY=your_wallet_private_key
RPC_URL=your_rpc_url
```

## 4) Compile

```bash
npm run compile
```

## 5) Test

```bash
npm test
```

## 6) Deploy

### Local node

Start a local node:

```bash
npx hardhat node
```

Then deploy in a second terminal:

```bash
npm run deploy:local
```

### Sepolia testnet

```bash
npm run deploy:sepolia
```

## Security notes

- Never share your private key.
- Use a fresh deployer wallet.
- Use testnet first before mainnet.

## 7) Web control deck

A browser-based app is included for wallet connect, balance/supply view, transfers, and owner-only claim/mint.

Location:

- web/index.html

How to open:

1. Open the folder in VS Code.
2. Open `web/index.html` in a browser.
3. Connect MetaMask on Sepolia.
4. Use the transfer and claim panels.

The app is already wired to the deployed Sepolia contract:

- 0x3896c9bd802A56c28590EF1E03A7de645c703757

## CHIEF Signal Check

The read-only Base token checker is available at `/web/ai.html`. It reads token facts from Base RPC and listed pools from GeckoTerminal. Pool requests go through read-only Vercel functions (`/api/token-pools` and `/api/chief-market`) to avoid browser CORS restrictions; the token-pools function accepts only validated token addresses, and the market function is pinned to the CHIEF/WETH pool.

The checker is an early research aid, not an audit or financial advice. It does not infer all contract controls or calculate holder concentration.

Run the endpoint regression tests with `npm run test:signal-check`.

The liquidity button requests MetaMask account access, confirms or switches to Base, then opens the existing CHIEF/WETH pool on Uniswap. It does not sign or submit transactions. You must reconnect on Uniswap if prompted and independently review every liquidity amount, price range, approval, and transaction before signing.

## 8) Production deployment (for listings)

Important: exchange listings require a mainnet token. Sepolia/testnet contracts cannot be listed on Coinbase or major markets.

Set extra RPC values in `.env`:

```bash
ETH_MAINNET_RPC_URL=your_ethereum_mainnet_rpc
BASE_MAINNET_RPC_URL=your_base_mainnet_rpc
```

Then deploy:

```bash
npm run deploy:eth
npm run deploy:base
```

## 9) Exchange and market listing checklist

Use these files to prepare submissions:

- `listing/exchange-listing-checklist.md`
- `listing/token-profile.json`

Typical submission targets:

- Coinbase Asset Hub (application-based, no guaranteed approval)
- CoinGecko token form
- CoinMarketCap token form
- DEX launch (Uniswap/Base) with liquidity provision

## 10) Launch operations commands

Serve launch site locally from project root:

```bash
npm run site:serve
```

Run launch file readiness checks:

```bash
npm run launch:readiness
```

Liquidity provisioning is a Base mainnet transaction signed with `PRIVATE_KEY`. Before running `npm run liquidity:add`, review the pool and set `CONFIRM_LIQUIDITY_ACTION=I_UNDERSTAND`, `LIQUIDITY_CHIEF_AMOUNT`, `LIQUIDITY_WETH_AMOUNT`, `LIQUIDITY_MAX_SLIPPAGE_BPS`, and `LIQUIDITY_GAS_RESERVE_ETH` in your local `.env`. The script refuses missing settings, an uninitialized pool, or insufficient balances; never commit `.env`.

Verify production domain deployment responses:

```bash
npm run deploy:verify
```

Generate a weekly liquidity report artifact:

```bash
npm run report:weekly
```

Generate a daily scoreboard entry artifact:

```bash
npm run score:daily
```

Generate checkout link config from `.env` values:

```bash
npm run config:checkout
```

Apply SEO verification tokens to `index.html` from `.env` values:

```bash
npm run seo:apply
```

Run release prep sequence (checkout config + SEO apply + readiness):

```bash
npm run prep:release
```

Run strict release prep (fails unless checkout URLs and SEO tokens are fully configured):

```bash
npm run prep:release:strict
```

Strict mode also rejects temporary token strings (for example values containing `pending`, `replace_with`, `example`, or `placeholder`).

## 11) Listing automation commands

Validate required listing metadata:

```bash
npm run listing:validate
```

Generate submission-ready listing packets:

```bash
npm run listing:prepare
```

Run full listing automation sequence:

```bash
npm run listing:auto
```
