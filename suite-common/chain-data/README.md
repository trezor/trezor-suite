# @suite-common/chain-data

Chain data (balances, tokens, rates, transaction history, and later sends) read through **chain
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

- **Transaction history**: one `useInfiniteQuery` per chain account
  (`[...account, 'transactions']`) over `network.getTransactions({ ref, cursor })`. Pages load in
  order; each network decides how the next page is asked for (page number, Ripple marker, Stellar
  cursor) and the cursor is plain data. A network without history on its backend (EVM on a custom
  RPC) has no `getTransactions`. History is refetched when the account's balance changes, and on
  the network's sync interval while a loaded transaction is pending.
- **Historic rates**: `useChainHistoricRates` asks `network.getHistoricFiatRates` once per loaded
  page, asset and currency, at the hours of its confirmed transactions, and returns them in the
  wallet's `RatesByTimestamps` shape, so the existing fiat helpers and the phishing detector work
  unchanged.

## Coverage

Every network family is a chain network; only failed and CoinJoin accounts stay on the Redux path.

| Family                    | Backends              | Displayed balance | Tokens                          | Rates                         | History paging            |
| ------------------------- | --------------------- | ----------------- | ------------------------------- | ----------------------------- | ------------------------- |
| Bitcoin-like              | Blockbook, Electrum   | available         | none                            | Blockbook (HTTP) or CoinGecko | page, 25                  |
| Ethereum and EVM networks | Blockbook, custom RPC | available         | ERC20, BEP20; custom tokens     | Blockbook or CoinGecko        | page, 25; none on RPC     |
| Solana                    | Solana RPC            | available         | SPL, SPL-2022                   | CoinGecko                     | page, 8                   |
| Cardano                   | Blockfrost            | available         | native assets                   | CoinGecko                     | page, 8                   |
| Ripple                    | Ripple                | full (reserve)    | none (backend lists none)       | CoinGecko                     | marker, 25; total unknown |
| Stellar                   | Stellar               | full (reserve)    | classic assets, watched Soroban | CoinGecko                     | cursor, 25; total unknown |
| Tron                      | Blockbook             | available         | TRC10, TRC20; custom tokens     | Blockbook or CoinGecko        | page, 25                  |

Tokens a backend may leave out are watched: the account's last known tokens and the Soroban
contracts the user added travel on `ChainAccountRef.watchedTokens`, and each network decides how
to ask for them.

Account descriptors are confidential: balance queries carry `CONFIDENTIAL_QUERY_META`, so a failure
logs only the error name, and `ChainNetworkError` carries a code and symbol, never a backend
message. Keys are never logged and the cache is not persisted.

## Status

Desktop reads native balances and their fiat value through this package behind the debug flag
`queryChainData` (Settings → Debug → Flags): the sidebar coin rows, the account header and the
dashboard total. Under the flag the dashboard also lists every asset read through chain networks
(native coins and tokens of every family, filtered by the token definitions as today). With the flag off nothing is fetched and the Redux path is unchanged. Under the
flag the dashboard total values native balances only.

Under the flag the account's transaction list, the transaction detail modal (including bump fee
and cancel) and the transaction notifications also read history and its historic rates from the
query cache. Transactions the wallet has just sent stay in Redux until the backend lists them and
are shown on top. Readers that took a txid and looked it up in Redux (confirmations, phishing
detection) now take the transaction object, so they work in both states; the txids a user marked
as "not a scam" stay persisted in Redux.

Still on the Redux transactions slice: export, the graph, staking views, the send form (coin
control, nonces, RBF), block height, and the phishing filter of notifications whose transaction is
not loaded in the query cache.

Under the flag the desktop send pipeline also runs through chain networks. That covers the send
form, RBF bump fee and cancel, token allowance, trading exchange and sell, and Send raw.

- **Compose.** Each family composes in its network package (`network.send.composeFeeLevels`),
  through the query cache (`getChainComposeFeeLevelsQueryOptions`, `useChainComposeFeeLevels`).
- **Sign and broadcast.** `useChainSignTransaction` and `useChainPushTransaction` are never
  retried and log nothing confidential.
- **Under review.** The transaction lives in the desktop's React send session, not in the send
  form state.
- **After the broadcast.** The network's pending transaction (`network.send.createPendingTransaction`)
  shows on top of the history until the backend lists it or 15 minutes pass. The transaction it
  replaces is hidden. The account is read again.
- **Legacy readers.** The wallet's own sync is still told about the sent transaction.
- **One implementation.** The Redux send thunks delegate to the same network functions, so the
  flag-off path and the flows still on Redux run the same code. Those flows are staking, yield,
  WalletConnect and the native app.

## Roadmap

| #   | Phase                                                                                                                   | Exit criterion                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Staking (Ethereum, Solana, Cardano, Tron) and token values in the totals                                                | Flagged total equals the legacy total                    |
| 2   | Sync: invalidator wired to Connect block and notification events; `network.subscribe`; legacy refresh off when flagged  | No double fetching; `NETWORK_SYNC_INTERVALS` removed     |
| 3   | Discovery: `network.discoverAccounts` returns chain accounts; Redux persists identities only (`PortfolioAccount` slice) | Redux accounts hold no balances or tokens                |
| 4   | Transactions: list, detail, notifications done; export, graph, staking and send readers remain                          | Redux transactions slice is legacy only                  |
| 5   | Send: desktop send pipeline done; staking, yield, WalletConnect and native remain                                       | No network-type switches in `sendFormThunks`             |
| 6   | Done: every network family is a chain network                                                                           | The composition switch is exhaustive                     |
| 7   | Remove network-type switches from `wallet-utils` and the other hotspots                                                 | Lint bans network-type branching outside composition     |
| 8   | Persistence for remembered wallets, with the same consent as Redux storage                                              | A remembered wallet works offline without Redux balances |
| 9   | Native: `createNativeChainNetworks` from the same factories                                                             | The mobile account list reads chain data                 |
| 10  | Remove the flag, Redux balance fields, fiat-rate thunks and `useTotalFiatBalance`                                       | The legacy path is gone                                  |

Known gap carried into phase 2: changing only a backend URL keeps the cache scope, so the
composition must call `createChainQueryInvalidator(...).onBackendChanged(symbol)` when it rebuilds
a network.
