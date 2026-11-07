# Ubiquitous Language

See [ADR-002](./adr/002-ubiquitous-language.md).

| Name            | Identifier                       | Example         | Explanation                                                                                                                                                                           | Deprecated           |
| --------------- | -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `Network`       | `NetworkSymbol`                  | `btc`           | A specific blockchain network, such as Ethereum mainnet or Sepolia. Mainnet and testnet are separate networks.                                                                        | `coin`, `blockchain` |
| `NetworkFamily` | —                                | `bitcoin`       | A group of networks sharing a protocol model and common implementation, such as the Bitcoin family containing Bitcoin (`btc`) and Litecoin (`ltc`).                                   | `NetworkType`        |
| `NativeToken`   | `NetworkSymbol`                  | `btc`           | A network's built-in asset, such as BTC on Bitcoin or ETH on Ethereum. It belongs to a network and is distinct from the network itself.                                               | `coin`, `nativeCoin` |
| `Token`         | `<NetworkSymbol>-<TokenAddress>` | `eth-0x12...78` | A non-native asset issued on a network, such as USDC on Ethereum. Identify it by its network plus its contract, mint, or equivalent asset identifier; a ticker alone is insufficient. | `coin`, `ERC20`      |
