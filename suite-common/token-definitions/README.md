### Token definitions

Prerequisites environments:

-   `COINGECKO_API_KEY` Coingecko pro api key
-   `JWS_PRIVATE_KEY_ENV` For production build, private key required
-   `IS_CODESIGN_BUILD` For production build, set to true

Scripts:

-   options `yarn nfts` and `yarn coins`
-   has to be called with structure type
    -   `simple` (used for Suite)
    -   `advanced` (planned to be used for Solana token symbols and names)
-   and chain
    -   `ethereum`, `polygon-pos`, `solana`,...
-   and file type
    -   `jws` for signed data
    -   `json` for unsigned data
-   e.g. `yarn coins advanced solana json` and you get `json` in format:

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

-   e.g. `yarn nfts simple polygon-pos jws` and you get `jws` in format:

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

## Naming

-   Token definitions: include both coin and nft definitions
-   Coin definitions: contain just tokens ERC20 and SPL
-   NFT definitions: contain just nfts ERC1155 and ERC721
