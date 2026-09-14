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

### Interim allow-list

`STELLAR_CONTRACT_TOKENS` in `networks/stellar/network-stellar/src/constants/soroban.ts` is a
hardcoded allow-list of native SEP-41 tokens that the worker reads balances for on every account.
It exists **only** because the hosted definitions did not carry contract tokens yet, and should be
deleted once they do — it is not a curation mechanism and does not scale.

### Not yet wired

These curated feeds are agreed but not integrated; the pipeline does not read them today:

- Soroswap's static token list
- `https://lobstr.co/api/v1/sep/assets/curated.json`
- `https://api.stellar.expert/explorer/public/asset-list/top50`

### Ownership

**Owner: TBD.** Who decides what enters the curated Stellar contract-token set — and who regenerates
and signs the definitions when a feed changes — is not assigned yet. This needs an owner before the
allow-list above can be retired.
