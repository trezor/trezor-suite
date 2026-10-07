# @suite-common/chain-data

Chain data (balances, rates, and later tokens, transactions and sends) read through **chain
networks** and owned by **TanStack Query**, instead of being copied into Redux by thunks.

## Shape

```
selection (Redux)          composition (app)                 generic code (this package, UI)
enabled networks    ──▶   createDesktopChainNetworks   ──▶   networks.map(n => n.getAccountBalance(…))
+ chosen backend           the only network-type switch       useQueries + combine, no network branching
```

- **`ChainNetwork`** (`@trezor/network-module-suite-common-types`): one selected network bound to
  the backend the user chose. Plain-promise capabilities, a network-owned fiat rule and its own
  refresh policy. Implementations live in each network's `-suite-common` package, one per backend
  variant (Bitcoin on Blockbook or Electrum, EVM on Blockbook or custom RPC, Solana).
- **Composition**: each app builds networks for the selection
  (`selectChainNetworkSelection`) and exposes them as the `getSelectedChainNetworks` getter. A
  network is rebuilt only when its backend settings change, so queries and consumers are not
  churned by unrelated store updates.
- **Queries**: one cache entry per chain account (`['chain', symbol, backendType, 'account',
descriptor, 'balance']`) and per network rate. Keys hold plain strings only; the backend type
  scopes them so data from one backend is never served after switching to another.
- **Multi-chain accounts**: aggregation runs over `PortfolioAccount.chainAccounts`, never over a
  single symbol, so one EVM address on Ethereum and its L2s is one account with several entries.

- **Assets**: each network answers its native asset (`nativeAsset` + balance) and, where it has
  them, its tokens (`getTokens`, absent on Bitcoin). `useChainAssets` returns one flat,
  unmerged list of `ChainAsset`s across networks. Grouping is the UI's decision: the desktop groups
  per network as the dashboard does today (`groupChainAssetsByNetwork`); an asset-first view
  (WETH and ETH as one row) would be another grouping over the same list.

Account descriptors are confidential: balance queries carry `CONFIDENTIAL_QUERY_META`, so a failure
logs only the error name, and `ChainNetworkError` carries a code and symbol, never a backend
message. Keys are never logged and the cache is not persisted.

## Status

Desktop reads native balances and their fiat value through this package behind the debug flag
`queryChainData` (Settings → Debug → Flags): the sidebar coin rows, the account header and the
dashboard total. Under the flag the dashboard also lists every asset read through chain networks
(native coins and EVM tokens, filtered by the token definitions as today). With the flag off nothing is fetched and the Redux path is unchanged. Under the
flag the dashboard total values native balances only.

## Roadmap

| #   | Phase                                                                                                                   | Exit criterion                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Tokens and staking: EVM tokens done; Solana SPL tokens, staking, the Cardano staking rule moves into its network        | Flagged total equals the legacy total                    |
| 2   | Sync: invalidator wired to Connect block and notification events; `network.subscribe`; legacy refresh off when flagged  | No double fetching; `NETWORK_SYNC_INTERVALS` removed     |
| 3   | Discovery: `network.discoverAccounts` returns chain accounts; Redux persists identities only (`PortfolioAccount` slice) | Redux accounts hold no balances or tokens                |
| 4   | Transactions: `useInfiniteQuery` over `network.getTransactions(ref, cursor)`                                            | Redux transactions slice is legacy only                  |
| 5   | Send: compose and sign/push as mutations, invalidating the account on success                                           | No network-type switches in `sendFormThunks`             |
| 6   | Cardano, Ripple, Stellar and Tron variants                                                                              | The composition switch covers every network family       |
| 7   | Remove network-type switches from `wallet-utils` and the other hotspots                                                 | Lint bans network-type branching outside composition     |
| 8   | Persistence for remembered wallets, with the same consent as Redux storage                                              | A remembered wallet works offline without Redux balances |
| 9   | Native: `createNativeChainNetworks` from the same factories                                                             | The mobile account list reads chain data                 |
| 10  | Remove the flag, Redux balance fields, fiat-rate thunks and `useTotalFiatBalance`                                       | The legacy path is gone                                  |

Known gap carried into phase 2: changing only a backend URL keeps the cache scope, so the
composition must call `createChainQueryInvalidator(...).onBackendChanged(symbol)` when it rebuilds
a network.
