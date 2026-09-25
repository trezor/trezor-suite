### Token definitions

Prerequisites environments:

- `COINGECKO_API_KEY` Coingecko pro api key
- `JWS_PRIVATE_KEY_ENV` For production build, private key required
- `IS_CODESIGN_BUILD` For production build, set to true

Scripts:

- options `yarn nfts` and `yarn coins`
- has to be called with structure type
    - `simple` (array of contract addresses)
    - `advanced` (object with token symbols and names per contract address)
- and chain
    - `ethereum`, `polygon-pos`, `solana`, `stellar`...
- both `jws` (signed) and `json` (unsigned) files are written for every definition
- e.g. `yarn coins advanced solana` and you get `solana.advanced.coin.definitions.v1.json` in format:

```
{
  "GWgwUUrgai3BFeEJZp7bdsBSYiuDqNmHf9uRusWsf3Yi": {
    "symbol": "safu",
    "name": "1SAFU"
  },
  "Dwri1iuy5pDFf2u2GwwsH2MxjR6dATyDv9En9Jk8Fkof": {
    "symbol": "2080",
    "name": "2080"
  },
  "5MAYDfq5yxtudAhtfyuMBuHZjgAbaS9tbEyEQYAhDS5y": {
    "symbol": "acs",
    "name": "Access Protocol"
  },
  ...
}
```

- `yarn coins simple <chains...>` writes the per-chain address lists as before, and one
  `ranked.coin.definitions.v1.json` covering every chain of that run, ordered by market cap:

```
[
  { "assetPlatformId": "ethereum", "address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "marketCap": 139000000000 },
  { "assetPlatformId": "solana", "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "marketCap": 43210000000 },
  { "assetPlatformId": "ethereum", "address": "0x6b175474e89094c44da98b954eedeac495271d0f", "marketCap": 5300000000 },
  ...
]
```

- e.g. `yarn nfts simple polygon-pos jws` and you get `jws` in format:

```
[
  "0x8a1abd2e227db543f4228045dd0acf658601fede",
  "0x2b9bd413852401a7e09c77de1fab53915f8f9336",
  "0x27B37E4Befacc50B02102d1E2117c4EA8A54bEFf",
  "0x89a4875c190565505b7891b700c2c6dc91816a47",
  "0x7dec38e3874ecbc842cc61e66c1386aca0c0ea1f",
  "0x24f9b0837424c62d2247d8a11a6d6139e4ab5ed2",
  "0xaa8c6b9d67149439680b67ce395c4ac2d233b6de",
  ...
]
```

## Market cap

Market caps come from the CoinGecko `coins/markets` endpoint, joined onto the coin ids from
`coins/list` (that endpoint carries no market data). Its pages are requested in `id_asc` order,
because ordering by market cap reranks between requests and silently drops coins that move across
a page boundary. A page that is rate limited or fails is retried; a run that cannot fetch the whole
list fails rather than publishing a ranking built from partial data.

They are published as one cross-chain `ranked.coin.definitions.v1.json`, so a consumer can rank
tokens without fetching and merging every per-chain file. The per-chain definitions stay the
complete list of known tokens; the ranked file only holds those that have a market cap, since a
token without one carries no ranking information. Tokens sharing a market cap are ordered by
platform and address, so an unchanged data set produces an identical file. Where several coins
share one contract address, as Cardano assets minted under a single policy id do, the address
keeps the market cap of the largest of them.

The file covers exactly the chains of the run that produced it, so it is only complete when the
whole platform list is built in one `yarn coins simple` invocation, as the release workflow does.

## Naming

- Token definitions: include both coin and nft definitions
- Coin definitions: contain just tokens ERC20, SPL and Stellar classic assets (`code-issuer` format)
- NFT definitions: contain just nfts ERC1155 and ERC721
