# Coinbase Asset Hub Submission Draft (CHIEF)

Use this as a copy/paste base inside Coinbase Asset Hub.

## Asset basics

- Asset name: ChiefToken
- Symbol: CHIEF
- Standard: ERC-20
- Decimals: 18
- Primary chain (current): Base mainnet
- Base contract: 0x3896c9bd802A56c28590EF1E03A7de645c703757

Mainnet deployment status: deployed on Base and ready for Asset Hub review submission.

## Project description

ChiefToken (CHIEF) is an ERC-20 token with owner-managed minting controls designed for ecosystem utility, community engagement, and tokenized application workflows.

## Token controls and governance

- Ownership model: Ownable (OpenZeppelin)
- Current owner wallet: 0x0271623f73D7c31694E013e9c59abcc046f4BB8f
- Minting permissions: Owner only
- Contract framework: OpenZeppelin ERC20 + Ownable

## Contract and security

- Source language: Solidity 0.8.24
- Build framework: Hardhat
- Contract source file: contracts/ChiefToken.sol
- Mainnet deployment completed on Base and validated on explorer

## Team / issuer contact

- Legal entity: Locked & Loaded Ventures, Inc.
- Support email: lockedloadedventures@gmail.com
- Website: https://officialchieftoken.com
- Documentation: https://officialchieftoken.com/#roadmap

## Links

- X/Twitter: https://x.com/OfficialCHIEF
- Telegram: https://officialchieftoken.com/#weekly-deliverables
- Discord: https://officialchieftoken.com/#weekly-deliverables
- Explorer (Base): https://basescan.org/address/0x3896c9bd802A56c28590EF1E03A7de645c703757

## Supply and distribution (fill before submit)

- Max supply: Uncapped. Owner holds mint(address,uint256) with no hard-coded ceiling; future issuance is possible and disclosed publicly.
- Circulating supply: 1,000,000 CHIEF (verified on-chain via totalSupply() on Base mainnet, unchanged since deployment)
- Treasury wallet(s): Company treasury Safe (Base, 2-of-3): 0xfD847b0393cfD66DC3329F4A9fd763694017BBeB (separate from token-owner EOA)
- Vesting or lockups: None. No liquidity lock or vesting schedule currently exists; this is disclosed on the transparency page.
- Active market pair: CHIEF/WETH (Uniswap V3, 0.3%)
- Pair address: 0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d
- Market status: Pool exists but usable liquidity/market price is not yet established (see transparency.html for live status).

## Compliance prep checklist

- Confirm legal entity details match your registration documents.
- Prepare beneficial owner / controller information.
- Prepare sanctions and jurisdiction disclosures.
- Prepare risk disclosures and token utility explanation.
