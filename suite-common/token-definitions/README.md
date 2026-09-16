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
- and file type
    - `jws` for signed data
    - `json` for unsigned data
- e.g. `yarn coins advanced solana json` and you get `json` in format:

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
  "4rUfhWTRpjD1ECGjw1UReVhA8G63CrATuoFLRVRkkqhs": {
    "symbol": "achi",
    "name": "achi"
  },
  ...
}
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

## Ranked definitions

`yarn ranked <chains...>` writes one `ranked.coin.definitions.v1.json` (and its `.jws`) covering
every chain of that run, ordered by market cap, highest first. It writes no per-chain files, and
leaves those to `yarn coins`:

```
[
  {
    "assetPlatformId": "ethereum",
    "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
    "symbol": "usdt",
    "name": "Tether",
    "marketCap": 139000000000
  },
  ...
]
```

Market caps come from the CoinGecko `coins/markets` endpoint, which the coin list itself carries no
market data for. The coins are asked for by id, in batches of 250, rather than by paging the whole
market list: a request that names what it wants cannot lose a coin that moves between pages while
the run is in progress. A request that fails is retried and then throws, so a missing market cap is
never the silent result of a failed fetch.

Every known token is listed. One CoinGecko reports no market cap for is kept with a market cap of
`0` and sorts last, rather than being dropped. Tokens sharing a market cap are ordered by platform
and address, and where several coins share one contract address — as Cardano assets minted under a
single policy id do — the address keeps the record of the largest of them, so the symbol and name
belong to the market cap they sit next to.

The file covers exactly the chains of the run that produced it, so it is only complete when the
whole platform list is passed to one `yarn ranked` invocation, as the release workflow does.

## Naming

- Token definitions: include both coin and nft definitions
- Coin definitions: contain just tokens ERC20, SPL and Stellar assets — classic assets in
  `code-issuer` format, and native SEP-41 contract tokens keyed by their own `C…` contract address
- NFT definitions: contain just nfts ERC1155 and ERC721

## Stellar: how an asset is keyed

Stellar has three kinds of asset and they are not keyed the same way:

| Kind                         | Key                               | Why                                                                                                                           |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Classic (G-class)            | `CODE-ISSUER`                     | What Horizon reports as a trustline.                                                                                          |
| Stellar Asset Contract (SAC) | the wrapped classic `CODE-ISSUER` | Horizon already reports the wrapped asset as a trustline; keying the contract separately would double-count the same balance. |
| Native SEP-41 (C-class)      | its own `C…` contract address     | It has no issuer, so it has no classic form. This is also the key CoinGecko indexes it under.                                 |

`getContractAddress` and `fetchSorobanContractAsset` in `scripts/utils/fetchCoins.ts` implement that
split: a contract that resolves to an underlying classic asset is collapsed onto it, while one that
resolves to no asset is a native SEP-41 token and is kept under its own address. A genuine lookup
failure is skipped rather than being treated as either.

### Sources

The list is CoinGecko-driven; the Stellar-specific enrichment comes from elsewhere:

- `COIN_LIST_URL` — CoinGecko's coin list, the set of candidates.
- `STELLAR_EXPERT_URL` + `/contract/{address}` — resolves a contract to its underlying classic
  asset, which is what distinguishes a SAC from a native SEP-41 token.
- `STELLAR_EXPERT_URL` + `/asset/{address}/rating` — the rating used to drop spam.
- `STELLAR_HORIZON_URL` + `stellar.toml` — SEP-1 home-domain verification for classic assets.

All four live in `scripts/constants/index.ts`. Output is a signed `.jws` plus an unsigned `.json`
per platform, written to `files/` by `scripts/index.ts` (`signData`, `validateStructure`).
