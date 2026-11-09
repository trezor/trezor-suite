# Ubiquitous Language

See [ADR-002](./adr/002-ubiquitous-language.md).

| Name            | Identifier                       | Example         | Explanation                                                                                                                                                                           | Deprecated           |
| --------------- | -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `Network`       | `NetworkSymbol`                  | `btc`           | A specific blockchain network, such as Ethereum mainnet or Sepolia. Mainnet and testnet are separate networks.                                                                        | `coin`, `blockchain` |
| `NetworkFamily` | —                                | `bitcoin`       | A group of networks sharing a protocol model and common implementation, such as the Bitcoin family containing Bitcoin (`btc`) and Litecoin (`ltc`).                                   | `NetworkType`        |
| `NativeToken`   | `NetworkSymbol`                  | `btc`           | A network's base asset, such as BTC on Bitcoin, ETH on Ethereum or SOL on Solana. Each network has exactly one, identified by the network's NetworkSymbol; it belongs to the network but is a distinct concept.                                              | `coin`, `nativeCoin` |
| `Token`         | `<NetworkSymbol>-<TokenAddress>` | `eth-0x12...78` | Any asset on a network other than its NativeToken, such as USDC on Ethereum or on Solana, however the network implements it. Identify it by its network plus its asset identifier (contract address, mint, or equivalent); a ticker alone is insufficient. | `coin`, `ERC20`      |
